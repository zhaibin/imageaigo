#!/bin/bash

# 清除 Sitemap 缓存脚本
# 用于立即刷新所有 sitemap（符合 Google Search Console 规范）

echo "🔄 清除 Sitemap 缓存..."
echo ""

# 清除 sitemap index
echo "清除 sitemap index..."
wrangler kv:key delete --binding=CACHE "sitemap:index" 2>/dev/null || true

# 清除主要页面 sitemap
echo "清除主要页面 sitemap..."
wrangler kv:key delete --binding=CACHE "sitemap:main" 2>/dev/null || true

# 清除分类 sitemap
echo "清除分类 sitemap..."
wrangler kv:key delete --binding=CACHE "sitemap:categories" 2>/dev/null || true

# 清除标签 sitemap
echo "清除标签 sitemap..."
wrangler kv:key delete --binding=CACHE "sitemap:tags" 2>/dev/null || true

# 清除图片 sitemap（多个分页）
echo "清除图片 sitemap（分页 1-20）..."
for i in {1..20}; do
  wrangler kv:key delete --binding=CACHE "sitemap:images-$i" 2>/dev/null || true
done

echo ""
echo "✅ 所有 Sitemap 缓存已清除"
echo "🌐 现在可以重新访问以下 URL 获取最新版本："
echo "   - https://imageaigo.cc/sitemap.xml (sitemap index)"
echo "   - https://imageaigo.cc/sitemap-main.xml"
echo "   - https://imageaigo.cc/sitemap-images-1.xml"
echo "   - https://imageaigo.cc/sitemap-categories.xml"
echo "   - https://imageaigo.cc/sitemap-tags.xml"
echo ""
echo "验证命令："
echo "curl https://imageaigo.cc/sitemap.xml | head -50"

