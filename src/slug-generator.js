/**
 * Generate URL-safe slug from description
 */
export function generateSlug(description, imageHash) {
  // 清理描述文本
  let slug = description
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-')      // 空格转为连字符
    .replace(/--+/g, '-')      // 多个连字符合并为一个
    .substring(0, 50);         // 限制长度
  
  // 添加哈希值的前8位确保唯一性
  const hashSuffix = imageHash.substring(0, 8);
  slug = `${slug}-${hashSuffix}`;
  
  return slug;
}

/**
 * Generate slug from tag name
 */
export function generateTagSlug(tagName) {
  return tagName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');
}

