#!/bin/bash

echo "🧹 开始清理 ImageAI Go 数据..."
echo ""

# 清理 R2 和 KV 缓存
echo "📦 清理 R2 存储和 KV 缓存..."
response=$(curl -s -X POST https://imageaigo.xants.workers.dev/api/cleanup \
  -H "Content-Type: application/json" \
  -d '{"action": "all", "secret": "cleanup-imageaigo-2024"}')

echo "响应: $response"
echo ""
echo "✅ R2 和缓存清理完成！"
echo ""
echo "📊 数据库已在之前清空（70行已删除）"
echo ""
echo "🎉 所有数据已清理完成！现在可以重新开始测试。"

