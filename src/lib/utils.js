/**
 * Utility functions for the ImageAI Go application
 */

/**
 * Handles CORS headers for API responses
 * @returns {Response} Response object with CORS headers
 */
export function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}

/**
 * Creates a JSON response with CORS headers
 * @param {Object} data - Data to send in response
 * @param {number} status - HTTP status code
 * @returns {Response} JSON response with CORS headers
 */
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

/**
 * Creates an error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Response} Error response
 */
export function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

/**
 * Validates image URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid image URL
 */
export function isValidImageUrl(url) {
  try {
    const parsed = new URL(url);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const path = parsed.pathname.toLowerCase();
    
    return validExtensions.some(ext => path.endsWith(ext)) ||
           parsed.hostname.includes('imgur') ||
           parsed.hostname.includes('cloudinary') ||
           parsed.hostname.includes('unsplash');
  } catch {
    return false;
  }
}

/**
 * Generates a SHA-256 hash from data
 * @param {ArrayBuffer|Uint8Array|string} data - Data to hash
 * @returns {Promise<string>} Hex string hash
 */
export async function generateHash(data) {
  // 确保数据是 ArrayBuffer 或 Uint8Array
  let buffer;
  
  if (data instanceof ArrayBuffer) {
    buffer = data;
  } else if (data instanceof Uint8Array) {
    buffer = data.buffer;
  } else if (typeof data === 'string') {
    // 如果是字符串，转换为 ArrayBuffer
    const encoder = new TextEncoder();
    buffer = encoder.encode(data).buffer;
  } else if (data && typeof data === 'object' && data.buffer instanceof ArrayBuffer) {
    // 处理 TypedArray 类型
    buffer = data.buffer;
  } else {
    console.error('[generateHash] Invalid data type:', typeof data, data);
    throw new TypeError(`generateHash expects ArrayBuffer, Uint8Array, or string, got ${typeof data}`);
  }
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Converts ArrayBuffer to base64 string
 * @param {ArrayBuffer} buffer - Buffer to convert
 * @returns {string} Base64 string
 */
export function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

/**
 * Sanitizes user input to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  
  return str
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Formats a timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Validates and normalizes weight value
 * @param {any} weight - Weight value to validate
 * @returns {number} Normalized weight between 0 and 1
 */
export function normalizeWeight(weight) {
  const w = parseFloat(weight);
  if (isNaN(w) || w < 0) return 0.5;
  if (w > 1) return 1.0;
  return w;
}

/**
 * Chunks an array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} Array of chunks
 */
export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Retries a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise} Result of function
 */
export async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}

/**
 * Calculates cosine similarity between two vectors
 * @param {Array<number>} a - First vector
 * @param {Array<number>} b - Second vector
 * @returns {number} Similarity score between 0 and 1
 */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

