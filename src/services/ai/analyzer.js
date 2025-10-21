/**
 * Analyzes an image using Cloudflare's AI model with retry logic
 * @param {ArrayBuffer} imageData - The image data
 * @param {AI} ai - Cloudflare AI binding
 * @returns {Object} Analysis result with description and hierarchical tags
 */
export async function analyzeImage(imageData, ai) {
  const startTime = Date.now();
  
  try {
    // Validate input
    if (!imageData || imageData.byteLength === 0) {
      throw new Error('Invalid image data: empty or null');
    }
    
    // Check image size (max 10MB)
    const sizeMB = imageData.byteLength / (1024 * 1024);
    if (sizeMB > 10) {
      throw new Error(`Image too large: ${sizeMB.toFixed(2)}MB (max 10MB)`);
    }

    // Get image dimensions
    const dimensions = await getImageDimensions(imageData);
    console.log(`[Analyzer] Image dimensions: ${dimensions.width}x${dimensions.height}`);

    // Convert ArrayBuffer to Array for AI API
    const imageArray = Array.from(new Uint8Array(imageData));
    
    console.log(`[Analyzer] Processing image: ${(imageData.byteLength / 1024).toFixed(2)}KB, ${imageArray.length} pixels`);

    // First pass: Get general description with retry
    const descriptionPrompt = `Provide a concise, vivid description of what you see in 1 sentence (around 50 characters). Capture the essence, main subject, and key details.

IMPORTANT RULES:
- Do NOT use phrases like "this image", "the image", "this picture", "the photo" or similar meta-references
- Start directly with what you observe (e.g., "Sunlight filters through trees..." instead of "This image shows...")
- Use descriptive, precise language
- Be accurate about the main subject
- Keep it very concise: approximately 50 characters maximum

Example style: "Golden mountains bathed in sunset light."`;

    const descriptionResponse = await retryWithTimeout(
      () => ai.run('@cf/meta/llama-3.2-11b-vision-instruct', {
        image: imageArray,
        prompt: descriptionPrompt,
        max_tokens: 50
      }),
      3, // max retries
      30000 // 30s timeout
    );

    const description = descriptionResponse?.description || descriptionResponse?.response || 'No description available';
    console.log(`[Analyzer] Description generated (${Date.now() - startTime}ms)`);

    // Second pass: Get structured tags with enhanced precision for recommendations
    const taggingPrompt = `Analyze this image and provide a hierarchical categorization in JSON format optimized for content recommendations:

{
  "primary": [
    {
      "name": "Category name",
      "weight": 0.95,
      "subcategories": [
        {
          "name": "Subcategory",
          "weight": 0.85,
          "attributes": [
            {"name": "Attribute 1", "weight": 0.90},
            {"name": "Attribute 2", "weight": 0.75},
            {"name": "Attribute 3", "weight": 0.70}
          ]
        }
      ]
    }
  ]
}

CRITICAL REQUIREMENTS FOR ACCURATE RECOMMENDATIONS:

1. PRIMARY CATEGORIES (1-2 categories only):
   - Choose the MOST SPECIFIC applicable category
   - Available: Nature, Portrait, Architecture, Food, Abstract, Animals, Technology, Sports, Art, Urban, Interior, Travel, Fashion, Product, Event
   - Weight 0.90-1.0 for dominant category, 0.70-0.89 for secondary
   - If image is clearly one type, use ONLY ONE primary category

2. SUBCATEGORIES (2-3 per primary):
   - MUST be highly specific to enable precise matching
   - For Nature: Mountain, Beach, Forest, Desert, Lake, River, Sky, Flower, Wildlife Scene
   - For Portrait: Studio, Outdoor, Closeup, Group, Candid, Professional
   - For Architecture: Modern, Historic, Interior, Exterior, Minimalist, Ornate
   - For Food: Meal, Dessert, Beverage, Ingredient, Plated, Casual
   - Weight based on prominence: dominant=0.85-0.95, supporting=0.70-0.84

3. ATTRIBUTES (4-6 per subcategory - CRITICAL FOR RECOMMENDATIONS):
   - Include CONCRETE visual elements: specific colors, objects, compositions
   - Include MOOD/STYLE: vibrant, muted, dramatic, peaceful, minimalist, busy
   - Include LIGHTING: bright, dim, sunset, golden hour, studio, natural
   - Include TECHNICAL aspects: closeup, wide-angle, bokeh, sharp, motion
   - Include SPECIFIC OBJECTS visible in image
   - Use precise terms, avoid generic words like "beautiful", "nice", "good"
   - Weight: 0.90+ for dominant features, 0.70-0.89 for secondary, 0.60-0.69 for subtle

4. WEIGHT GUIDELINES (crucial for recommendation accuracy):
   - 0.95-1.0: Absolutely dominant, defines the image
   - 0.85-0.94: Very prominent, major characteristic
   - 0.75-0.84: Clearly present, important feature
   - 0.65-0.74: Visible, supporting element
   - 0.60-0.64: Subtle, minor detail

5. AVOID OVER-GENERALIZATION:
   - DON'T use vague terms: "outdoor", "colorful", "scene", "view"
   - DO use specific terms: "mountain peak", "azure blue", "street market", "aerial perspective"
   - Balance specificity with searchability

Return ONLY valid JSON, no explanation or commentary.`;

    const taggingResponse = await retryWithTimeout(
      () => ai.run('@cf/meta/llama-3.2-11b-vision-instruct', {
        image: imageArray,
        prompt: taggingPrompt,
        max_tokens: 512
      }),
      2, // fewer retries for tagging
      40000 // 40s timeout
    );

    console.log(`[Analyzer] Tags generated (${Date.now() - startTime}ms)`);

    let tags;
    try {
      // Extract JSON from response
      const responseText = taggingResponse?.description || taggingResponse?.response || '{}';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        tags = JSON.parse(jsonMatch[0]);
      } else {
        console.warn('[Analyzer] No JSON found in tagging response, using fallback');
        tags = generateFallbackTags(description);
      }

      // Validate and normalize tags structure
      tags = normalizeTags(tags);

    } catch (error) {
      console.warn('[Analyzer] Error parsing tags, using fallback:', error.message);
      tags = generateFallbackTags(description);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[Analyzer] Complete analysis in ${totalTime}ms`);

    return {
      description: description.trim(),
      tags: tags,
      dimensions: dimensions,
      metadata: {
        analysisTime: totalTime,
        imageSize: imageData.byteLength
      }
    };

  } catch (error) {
    console.error('[Analyzer] Critical error:', error);
    throw new Error('Failed to analyze image: ' + error.message);
  }
}

/**
 * Retry function with timeout and exponential backoff
 */
async function retryWithTimeout(fn, maxRetries = 3, timeout = 30000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI request timeout')), timeout)
        )
      ]);
      return result;
    } catch (error) {
      console.warn(`[Retry] Attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`[Retry] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Generates fallback tags when AI response is invalid
 */
function generateFallbackTags(description) {
  const keywords = extractKeywords(description);
  
  // Determine primary category based on keywords
  let primaryCategory = determinePrimaryCategory(keywords);
  
  return {
    primary: [
      {
        name: primaryCategory,
        weight: 0.85,
        subcategories: [
          {
            name: 'General',
            weight: 0.80,
            attributes: keywords.slice(0, 5).map((keyword, idx) => ({
              name: keyword,
              weight: Math.max(0.5, 0.9 - (idx * 0.1))
            }))
          }
        ]
      }
    ]
  };
}

/**
 * Extracts keywords from description
 */
function extractKeywords(description) {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
  ]);

  const words = description.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  // Get unique words with frequency
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}

/**
 * Determines primary category based on keywords
 */
function determinePrimaryCategory(keywords) {
  const categoryKeywords = {
    'Nature': ['nature', 'landscape', 'forest', 'mountain', 'ocean', 'sky', 'tree', 'plant', 'flower', 'sunset', 'sunrise', 'beach', 'lake', 'river'],
    'Portrait': ['person', 'people', 'face', 'portrait', 'human', 'woman', 'man', 'child', 'smile', 'expression'],
    'Architecture': ['building', 'architecture', 'structure', 'house', 'bridge', 'tower', 'modern', 'historic', 'interior', 'room'],
    'Food': ['food', 'meal', 'dish', 'cuisine', 'restaurant', 'dessert', 'fruit', 'vegetable', 'plate', 'cooking'],
    'Animals': ['animal', 'dog', 'cat', 'bird', 'wildlife', 'pet', 'horse', 'fish', 'insect', 'mammal'],
    'Technology': ['technology', 'computer', 'phone', 'device', 'digital', 'screen', 'electronic', 'gadget'],
    'Sports': ['sport', 'athlete', 'game', 'competition', 'fitness', 'exercise', 'running', 'ball', 'team'],
    'Art': ['art', 'painting', 'drawing', 'sculpture', 'creative', 'artistic', 'design', 'illustration'],
    'Urban': ['city', 'urban', 'street', 'downtown', 'metropolitan', 'traffic', 'road', 'skyline'],
    'Abstract': ['abstract', 'pattern', 'geometric', 'colorful', 'texture', 'artistic', 'creative']
  };

  const lowerKeywords = keywords.map(k => k.toLowerCase());

  let bestMatch = 'General';
  let bestScore = 0;

  for (const [category, categoryWords] of Object.entries(categoryKeywords)) {
    const score = lowerKeywords.filter(keyword => 
      categoryWords.some(catWord => keyword.includes(catWord) || catWord.includes(keyword))
    ).length;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  return bestMatch;
}

/**
 * Normalizes and validates tag structure
 */
function normalizeTags(tags) {
  if (!tags || !tags.primary || !Array.isArray(tags.primary)) {
    return {
      primary: [{
        name: 'General',
        weight: 0.8,
        subcategories: [{
          name: 'Uncategorized',
          weight: 0.7,
          attributes: [
            { name: 'Unknown', weight: 0.6 }
          ]
        }]
      }]
    };
  }

  // Ensure 1-2 primary categories
  tags.primary = tags.primary.slice(0, 2);

  tags.primary.forEach(primary => {
    // Ensure weight is valid
    primary.weight = ensureWeight(primary.weight);

    // Ensure subcategories exist and are valid
    if (!primary.subcategories || !Array.isArray(primary.subcategories)) {
      primary.subcategories = [{
        name: 'General',
        weight: 0.7,
        attributes: []
      }];
    }

    // Ensure 1-3 subcategories
    primary.subcategories = primary.subcategories.slice(0, 3);

    primary.subcategories.forEach(sub => {
      sub.weight = ensureWeight(sub.weight);

      // Ensure attributes exist
      if (!sub.attributes || !Array.isArray(sub.attributes)) {
        sub.attributes = [];
      }

      // Ensure 3-6 attributes
      if (sub.attributes.length < 3) {
        // Pad with generic attributes if needed
        while (sub.attributes.length < 3) {
          sub.attributes.push({
            name: `Attribute ${sub.attributes.length + 1}`,
            weight: 0.5
          });
        }
      }

      sub.attributes = sub.attributes.slice(0, 6);

      // Normalize attribute weights
      sub.attributes.forEach(attr => {
        attr.weight = ensureWeight(attr.weight);
      });

      // Sort attributes by weight
      sub.attributes.sort((a, b) => b.weight - a.weight);
    });
  });

  return tags;
}

/**
 * Ensures weight is a valid number between 0 and 1
 */
function ensureWeight(weight) {
  const w = parseFloat(weight);
  if (isNaN(w) || w < 0) return 0.5;
  if (w > 1) return 1.0;
  return w;
}

/**
 * Extract image dimensions from ArrayBuffer
 */
export async function getImageDimensions(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  
  // Check JPEG
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
    return getJPEGDimensions(bytes);
  }
  
  // Check PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return getPNGDimensions(bytes);
  }
  
  // Check GIF
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return getGIFDimensions(bytes);
  }
  
  // Check WebP
  if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return getWebPDimensions(bytes);
  }
  
  // Default fallback
  return { width: 800, height: 600 };
}

function getJPEGDimensions(bytes) {
  let i = 2; // Skip SOI marker
  while (i < bytes.length) {
    if (bytes[i] !== 0xFF) break;
    
    const marker = bytes[i + 1];
    if (marker === 0xC0 || marker === 0xC2) { // SOF0 or SOF2
      const height = (bytes[i + 5] << 8) | bytes[i + 6];
      const width = (bytes[i + 7] << 8) | bytes[i + 8];
      return { width, height };
    }
    
    // Skip to next marker
    const segmentLength = (bytes[i + 2] << 8) | bytes[i + 3];
    i += segmentLength + 2;
  }
  return { width: 800, height: 600 };
}

function getPNGDimensions(bytes) {
  const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  return { width, height };
}

function getGIFDimensions(bytes) {
  const width = bytes[6] | (bytes[7] << 8);
  const height = bytes[8] | (bytes[9] << 8);
  return { width, height };
}

function getWebPDimensions(bytes) {
  // VP8 lossy
  if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20) {
    const width = ((bytes[26] | (bytes[27] << 8)) & 0x3FFF) + 1;
    const height = ((bytes[28] | (bytes[29] << 8)) & 0x3FFF) + 1;
    return { width, height };
  }
  // VP8L lossless
  if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x4C) {
    const b = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    const width = (b & 0x3FFF) + 1;
    const height = ((b >> 14) & 0x3FFF) + 1;
    return { width, height };
  }
  return { width: 800, height: 600 };
}

