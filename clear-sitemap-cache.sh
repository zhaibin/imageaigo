#!/bin/bash

# 清除 Sitemap 缓存脚本
# 用于立即刷新 sitemap.xml

echo "🔄 清除 Sitemap 缓存..."

# 使用 wrangler 执行清除操作
wrangler kv:key delete --binding=CACHE "sitemap:xml"

echo "✅ Sitemap 缓存已清除"
echo "🌐 现在可以重新访问 https://imageaigo.cc/sitemap.xml 获取最新版本"
echo ""
echo "验证命令："
echo "curl https://imageaigo.cc/sitemap.xml | head -50"

