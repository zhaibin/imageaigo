-- 添加 display_url 字段用于存储前端展示图（1080px WebP）
-- 2025-10-25

-- 添加新字段（允许为 NULL，旧记录可以逐步更新）
ALTER TABLE images ADD COLUMN display_url TEXT;

-- 为现有记录设置 display_url 等于 image_url（向后兼容）
UPDATE images SET display_url = image_url WHERE display_url IS NULL;

-- 查看更新结果
SELECT COUNT(*) as total_images, 
       COUNT(display_url) as has_display_url 
FROM images;

