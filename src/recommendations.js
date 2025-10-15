/**
 * Gets recommended images based on tag similarity
 * @param {D1Database} db - D1 database binding
 * @param {number} imageId - The image ID to find recommendations for
 * @param {number} limit - Maximum number of recommendations (default: 8)
 * @returns {Array} Array of recommended images with similarity scores
 */
export async function getRecommendations(db, imageId, limit = 8) {
  try {
    // Get tags for the source image
    const { results: sourceTags } = await db.prepare(`
      SELECT it.tag_id, it.weight, it.level, t.name
      FROM image_tags it
      JOIN tags t ON it.tag_id = t.id
      WHERE it.image_id = ?
    `).bind(imageId).all();

    if (sourceTags.length === 0) {
      return [];
    }

    // Calculate tag IDs and weights for similarity scoring
    const tagWeights = {};
    sourceTags.forEach(tag => {
      // Weight by level: primary (3x), subcategory (2x), attribute (1x)
      const levelMultiplier = tag.level === 1 ? 3 : tag.level === 2 ? 2 : 1;
      tagWeights[tag.tag_id] = tag.weight * levelMultiplier;
    });

    const tagIds = Object.keys(tagWeights).join(',');

    // Find images with similar tags using a similarity score
    // Similarity is calculated based on:
    // 1. Number of shared tags
    // 2. Weight of shared tags
    // 3. Level importance
    const { results: candidates } = await db.prepare(`
      SELECT 
        i.id,
        i.slug,
        i.image_url,
        i.description,
        GROUP_CONCAT(it.tag_id) as tag_ids,
        GROUP_CONCAT(it.weight) as weights,
        GROUP_CONCAT(it.level) as levels
      FROM images i
      JOIN image_tags it ON i.id = it.image_id
      WHERE it.tag_id IN (${tagIds})
        AND i.id != ?
      GROUP BY i.id
      HAVING COUNT(DISTINCT it.tag_id) >= 1
      ORDER BY COUNT(DISTINCT it.tag_id) DESC
      LIMIT 50
    `).bind(imageId).all();

    // Calculate similarity scores
    const recommendations = candidates.map(image => {
      const imageTags = image.tag_ids.split(',').map(Number);
      const imageWeights = image.weights.split(',').map(Number);
      const imageLevels = image.levels.split(',').map(Number);

      let similarityScore = 0;
      let matchedTags = 0;

      imageTags.forEach((tagId, idx) => {
        if (tagWeights[tagId]) {
          // Calculate contribution to similarity
          const sourceWeight = tagWeights[tagId];
          const targetWeight = imageWeights[idx];
          const level = imageLevels[idx];
          const levelMultiplier = level === 1 ? 3 : level === 2 ? 2 : 1;

          similarityScore += (sourceWeight + targetWeight) * levelMultiplier;
          matchedTags++;
        }
      });

      // Normalize score by number of matched tags and total source tags
      const normalizedScore = (similarityScore / (sourceTags.length * 3)) * (matchedTags / sourceTags.length);

      return {
        id: image.id,
        slug: image.slug,
        image_url: image.image_url,
        description: image.description,
        similarity: Math.min(normalizedScore, 1.0),
        matched_tags: matchedTags
      };
    });

    // Sort by similarity score and return top results
    recommendations.sort((a, b) => b.similarity - a.similarity);

    return recommendations.slice(0, limit);

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

