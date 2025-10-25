-- 添加 display_url 字段用于存储前端展示图（1080px WebP）
-- 2025-10-25
-- 
-- 用途：
--   image_url: 原图 URL (xxx-original.jpg)
--   display_url: 展示图 URL (xxx-display.webp, 1080px)
-- 
-- 向后兼容：
--   旧记录的 display_url 设置为 image_url
--   前端代码使用 display_url || image_url

-- 1. 添加新字段（允许为 NULL）
ALTER TABLE images ADD COLUMN display_url TEXT;

-- 2. 为所有现有记录设置 display_url = image_url（向后兼容）
UPDATE images SET display_url = image_url WHERE display_url IS NULL;

-- 3. 验证更新
SELECT 
  COUNT(*) as total_images, 
  COUNT(display_url) as has_display_url,
  COUNT(CASE WHEN display_url IS NOT NULL THEN 1 END) as valid_display_urls,
  COUNT(CASE WHEN display_url = image_url THEN 1 END) as using_original_as_display
FROM images;

-- 预期结果：
-- total_images = has_display_url = valid_display_urls
-- using_original_as_display = 所有旧记录的数量

