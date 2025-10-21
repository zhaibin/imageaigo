#!/bin/bash

# Sitemap 验证脚本
# 用于验证所有 sitemap 是否符合 Google Search Console 规范

echo "🔍 验证 Sitemap 结构..."
echo ""

BASE_URL="https://imageaigo.cc"

# 验证 sitemap index
echo "1. 验证 Sitemap Index: $BASE_URL/sitemap.xml"
curl -s "$BASE_URL/sitemap.xml" | head -30
echo ""

# 验证主要页面 sitemap
echo "2. 验证主要页面 Sitemap: $BASE_URL/sitemap-main.xml"
curl -s "$BASE_URL/sitemap-main.xml" | head -40
echo ""

# 验证图片 sitemap (第一页)
echo "3. 验证图片 Sitemap (第1页): $BASE_URL/sitemap-images-1.xml"
curl -s "$BASE_URL/sitemap-images-1.xml" | head -50
echo ""

# 验证分类 sitemap
echo "4. 验证分类 Sitemap: $BASE_URL/sitemap-categories.xml"
curl -s "$BASE_URL/sitemap-categories.xml" | head -40
echo ""

# 验证标签 sitemap
echo "5. 验证标签 Sitemap: $BASE_URL/sitemap-tags.xml"
curl -s "$BASE_URL/sitemap-tags.xml" | head -40
echo ""

echo "✅ Sitemap 验证完成"
echo ""
echo "📝 注意事项："
echo "   1. 确保所有 URL 以 https://imageaigo.cc 开头"
echo "   2. 日期格式为 YYYY-MM-DD"
echo "   3. 图片 URL 包含在 <image:image> 标签中"
echo "   4. XML 格式正确，无错误"
echo ""
echo "🌐 在 Google Search Console 中提交："
echo "   URL: https://imageaigo.cc/sitemap.xml"

