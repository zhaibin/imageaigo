/**
 * Gets recommended images based on advanced multi-dimensional tag similarity
 * @param {D1Database} db - D1 database binding
 * @param {number} imageId - The image ID to find recommendations for
 * @param {number} limit - Maximum number of recommendations (default: 8)
 * @returns {Array} Array of recommended images with similarity scores
 */
export async function getRecommendations(db, imageId, limit = 8) {
  try {
    // Get tags for the source image with hierarchical structure
    const { results: sourceTags } = await db.prepare(`
      SELECT it.tag_id, it.weight, it.level, t.name, t.parent_id
      FROM image_tags it
      JOIN tags t ON it.tag_id = t.id
      WHERE it.image_id = ?
      ORDER BY it.level, it.weight DESC
    `).bind(imageId).all();

    if (sourceTags.length === 0) {
      return [];
    }

    // Organize tags by level for sophisticated matching
    const tagsByLevel = {
      primary: sourceTags.filter(t => t.level === 1),
      subcategory: sourceTags.filter(t => t.level === 2),
      attribute: sourceTags.filter(t => t.level === 3)
    };

    // Build weighted tag map with enhanced multipliers
    const tagWeights = {};
    sourceTags.forEach(tag => {
      // Enhanced level multipliers for better discrimination:
      // Primary (5x) - Most important for category matching
      // Subcategory (3x) - Key for style/type matching  
      // Attribute (1.5x) - Fine-grained details
      const levelMultiplier = tag.level === 1 ? 5.0 : tag.level === 2 ? 3.0 : 1.5;
      tagWeights[tag.tag_id] = tag.weight * levelMultiplier;
    });

    const tagIds = Object.keys(tagWeights).join(',');

    // Get candidate images with shared tags
    // Require at least 1 primary tag match for relevance
    const { results: candidates } = await db.prepare(`
      SELECT 
        i.id,
        i.slug,
        i.image_url,
        i.description,
        GROUP_CONCAT(it.tag_id) as tag_ids,
        GROUP_CONCAT(it.weight) as weights,
        GROUP_CONCAT(it.level) as levels,
        GROUP_CONCAT(t.name) as tag_names
      FROM images i
      JOIN image_tags it ON i.id = it.image_id
      JOIN tags t ON it.tag_id = t.id
      WHERE it.tag_id IN (${tagIds})
        AND i.id != ?
      GROUP BY i.id
      HAVING COUNT(DISTINCT it.tag_id) >= 2
      ORDER BY COUNT(DISTINCT it.tag_id) DESC
      LIMIT 100
    `).bind(imageId).all();

    // Calculate advanced similarity scores
    const recommendations = candidates.map(candidate => {
      const candidateTags = candidate.tag_ids.split(',').map(Number);
      const candidateWeights = candidate.weights.split(',').map(Number);
      const candidateLevels = candidate.levels.split(',').map(Number);

      // Multi-dimensional similarity components
      let primaryMatch = 0;      // Primary category overlap
      let subcategoryMatch = 0;   // Subcategory overlap
      let attributeMatch = 0;     // Attribute overlap
      let weightedMatch = 0;      // Overall weighted similarity
      
      let primaryCount = 0;
      let subcategoryCount = 0;
      let attributeCount = 0;

      // Calculate matches by level
      candidateTags.forEach((tagId, idx) => {
        if (tagWeights[tagId]) {
          const sourceWeight = tagWeights[tagId];
          const targetWeight = candidateWeights[idx];
          const level = candidateLevels[idx];

          // Calculate weighted similarity for this tag
          // Use geometric mean to balance source and target weights
          const tagSimilarity = Math.sqrt(sourceWeight * targetWeight);
          weightedMatch += tagSimilarity;

          // Track matches by level
          if (level === 1) {
            primaryMatch += tagSimilarity;
            primaryCount++;
          } else if (level === 2) {
            subcategoryMatch += tagSimilarity;
            subcategoryCount++;
          } else if (level === 3) {
            attributeMatch += tagSimilarity;
            attributeCount++;
          }
        }
      });

      // Calculate level-specific scores (0-1 range)
      const primaryScore = tagsByLevel.primary.length > 0 
        ? primaryMatch / (tagsByLevel.primary.length * 5.0) // Normalize by max possible
        : 0;
      
      const subcategoryScore = tagsByLevel.subcategory.length > 0
        ? subcategoryMatch / (tagsByLevel.subcategory.length * 3.0)
        : 0;
      
      const attributeScore = tagsByLevel.attribute.length > 0
        ? attributeMatch / (tagsByLevel.attribute.length * 1.5)
        : 0;

      // Calculate diversity penalty to avoid showing too similar images
      const totalSourceTags = sourceTags.length;
      const matchRatio = (primaryCount + subcategoryCount + attributeCount) / totalSourceTags;
      
      // Penalty for either too few or too many matches
      // Sweet spot is 40-80% match ratio
      let diversityFactor = 1.0;
      if (matchRatio < 0.3) {
        diversityFactor = 0.7; // Too different
      } else if (matchRatio > 0.9) {
        diversityFactor = 0.85; // Too similar (possibly duplicate)
      }

      // Composite similarity score with weighted components:
      // - Primary category match: 50% weight (most important)
      // - Subcategory match: 30% weight (important for style)
      // - Attribute match: 20% weight (fine details)
      const compositeSimilarity = (
        primaryScore * 0.50 +
        subcategoryScore * 0.30 +
        attributeScore * 0.20
      ) * diversityFactor;

      // Calculate confidence based on number of matches
      const matchQuality = (primaryCount * 3 + subcategoryCount * 2 + attributeCount) / 
                          (tagsByLevel.primary.length * 3 + tagsByLevel.subcategory.length * 2 + tagsByLevel.attribute.length);

      return {
        id: candidate.id,
        slug: candidate.slug,
        image_url: candidate.image_url,
        description: candidate.description,
        similarity: Math.min(compositeSimilarity, 1.0),
        confidence: Math.min(matchQuality, 1.0),
        matched_primary: primaryCount,
        matched_subcategory: subcategoryCount,
        matched_attribute: attributeCount,
        match_breakdown: {
          primary: Math.round(primaryScore * 100) / 100,
          subcategory: Math.round(subcategoryScore * 100) / 100,
          attribute: Math.round(attributeScore * 100) / 100
        }
      };
    });

    // Filter out low-quality recommendations
    // Require minimum primary match for relevance
    const qualityFiltered = recommendations.filter(rec => 
      rec.matched_primary >= 1 && rec.similarity >= 0.15
    );

    // Sort by composite similarity score
    qualityFiltered.sort((a, b) => {
      // Primary sort by similarity
      if (Math.abs(b.similarity - a.similarity) > 0.05) {
        return b.similarity - a.similarity;
      }
      // Secondary sort by confidence for similar scores
      return b.confidence - a.confidence;
    });

    return qualityFiltered.slice(0, limit);

  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

/**
 * Gets images by category with optional filtering
 * @param {D1Database} db - D1 database binding
 * @param {string} categoryName - Category name to filter by
 * @param {number} limit - Maximum number of results
 * @returns {Array} Array of images in the category
 */
export async function getImagesByCategory(db, categoryName, limit = 20) {
  try {
    const { results } = await db.prepare(`
      SELECT DISTINCT i.id, i.slug, i.image_url, i.description, i.width, i.height, i.created_at
      FROM images i
      JOIN image_tags it ON i.id = it.image_id
      JOIN tags t ON it.tag_id = t.id
      WHERE t.name = ? AND t.level = 1
      ORDER BY i.created_at DESC
      LIMIT ?
    `).bind(categoryName, limit).all();

    return results;

  } catch (error) {
    console.error('Error getting images by category:', error);
    return [];
  }
}

/**
 * Gets related tags for a given tag (for tag-based navigation)
 * @param {D1Database} db - D1 database binding
 * @param {string} tagName - Tag name to find related tags for
 * @param {number} limit - Maximum number of related tags
 * @returns {Array} Array of related tags with co-occurrence counts
 */
export async function getRelatedTags(db, tagName, limit = 10) {
  try {
    // Find images with this tag
    const { results: imageIds } = await db.prepare(`
      SELECT DISTINCT it.image_id
      FROM image_tags it
      JOIN tags t ON it.tag_id = t.id
      WHERE t.name = ?
    `).bind(tagName).all();

    if (imageIds.length === 0) {
      return [];
    }

    const ids = imageIds.map(row => row.image_id).join(',');

    // Find other tags that frequently co-occur
    const { results: relatedTags } = await db.prepare(`
      SELECT t.name, t.level, COUNT(DISTINCT it.image_id) as co_occurrence
      FROM image_tags it
      JOIN tags t ON it.tag_id = t.id
      WHERE it.image_id IN (${ids})
        AND t.name != ?
      GROUP BY t.id, t.name, t.level
      ORDER BY co_occurrence DESC, t.level ASC
      LIMIT ?
    `).bind(tagName, limit).all();

    return relatedTags;

  } catch (error) {
    console.error('Error getting related tags:', error);
    return [];
  }
}

