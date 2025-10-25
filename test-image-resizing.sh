#!/bin/bash

# Image Resizing 快速测试脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Image Resizing 快速测试                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""

# 获取域名
echo "请输入域名（例如：imageaigo.cc 或 localhost:8787）："
read -r DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}错误：未提供域名${NC}"
    exit 1
fi

# 确定协议
if [[ "$DOMAIN" == "localhost"* ]]; then
    PROTOCOL="http"
else
    PROTOCOL="https"
fi

# 获取图片路径
echo ""
echo "请输入图片的 R2 key（例如：images/123-hash-original.jpg）："
read -r IMAGE_KEY

if [ -z "$IMAGE_KEY" ]; then
    echo -e "${RED}错误：未提供图片路径${NC}"
    exit 1
fi

BASE_URL="${PROTOCOL}://${DOMAIN}/r2/${IMAGE_KEY}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}开始测试...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 测试函数
test_url() {
    local url=$1
    local description=$2
    
    echo -e "${YELLOW}测试：${description}${NC}"
    echo "URL: $url"
    echo ""
    
    RESPONSE=$(curl -sI "$url" 2>&1)
    
    if [ $? -eq 0 ]; then
        echo "响应头："
        echo "----------------------------------------"
        echo "$RESPONSE" | grep -i "http\|x-image\|content-type\|cache-control"
        echo "----------------------------------------"
        
        # 检查关键响应头
        if echo "$RESPONSE" | grep -qi "X-Image-Resizing: enabled"; then
            echo -e "${GREEN}✅ Image Resizing 已成功应用${NC}"
        elif echo "$RESPONSE" | grep -qi "X-Image-Resizing: fallback"; then
            echo -e "${YELLOW}⚠️  Image Resizing 降级，返回原图${NC}"
        elif echo "$RESPONSE" | grep -qi "X-Image-Resizing: error"; then
            echo -e "${RED}❌ Image Resizing 转换失败${NC}"
        fi
    else
        echo -e "${RED}请求失败${NC}"
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# 执行测试
test_url "${BASE_URL}" "原图（无转换）"
test_url "${BASE_URL}?format=webp&width=800" "WebP 800px 宽"
test_url "${BASE_URL}?format=webp&width=400" "WebP 400px 宽"
test_url "${BASE_URL}?format=jpeg&width=800&quality=90" "JPEG 800px 高质量"
test_url "${BASE_URL}?format=webp&width=200&height=200&fit=cover" "WebP 缩略图 200x200 cover"

echo ""
echo -e "${GREEN}测试完成！${NC}"
echo ""
echo "💡 提示："
echo "  • 如果显示 'fallback'，请在 Cloudflare Dashboard 中启用 Image Resizing"
echo "  • 如果显示 'error'，请检查日志：wrangler tail | grep ImageTransform"
echo "  • 运行完整检查：./image-resizing-check.sh"
echo ""
