#!/bin/bash

# 测试结构化数据脚本

echo "🔍 测试 ImageObject 结构化数据..."
echo ""

URL="${1:-https://imageaigo.cc/image/a-woman-with-long-hair-gazes-out-at-a-mountainous-}"

echo "📍 测试 URL: $URL"
echo ""

# 提取并格式化 JSON-LD
echo "📊 ImageObject 数据："
curl -s "$URL" | \
  grep -o '{"@context":"https://schema.org","@type":"ImageObject"[^}]*}' | \
  python3 -c "import sys, json; print(json.dumps(json.loads(sys.stdin.read()), indent=2, ensure_ascii=False))" 2>/dev/null || \
  echo "❌ 无法解析 JSON 数据"

echo ""
echo "---"
echo ""

# 检查关键字段
echo "✅ 关键字段验证："
CONTENT=$(curl -s "$URL")

echo -n "  - contentUrl (完整 URL): "
if echo "$CONTENT" | grep -q '"contentUrl":"https://'; then
  echo "✅ 通过"
else
  echo "❌ 失败"
fi

echo -n "  - datePublished (ISO 8601): "
if echo "$CONTENT" | grep -q '"datePublished":"[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}T'; then
  echo "✅ 通过"
else
  echo "❌ 失败"
fi

echo -n "  - name 字段: "
if echo "$CONTENT" | grep -q '"name":"[^"]\+","description"'; then
  echo "✅ 通过"
else
  echo "❌ 失败"
fi

echo -n "  - width (QuantitativeValue): "
if echo "$CONTENT" | grep -q '"width":{"@type":"QuantitativeValue"'; then
  echo "✅ 通过"
else
  echo "❌ 失败"
fi

echo ""
echo "---"
echo ""

echo "🌐 在线验证工具："
echo "  Google Rich Results: https://search.google.com/test/rich-results?url=$(echo $URL | sed 's/:/%3A/g' | sed 's/\//%2F/g')"
echo "  Schema Validator: https://validator.schema.org/#url=$(echo $URL | sed 's/:/%3A/g' | sed 's/\//%2F/g')"
echo ""

echo "💡 提示："
echo "  - ImageObject 主要用于图片搜索优化"
echo "  - 不一定会显示为 Rich Results 卡片"
echo "  - 但会帮助 Google 更好地理解和索引图片"

