#!/bin/bash

# ImageAI Go SEO 测试脚本
# 功能：测试 Sitemap、结构化数据、元数据
# 使用：./test-seo.sh [sitemap|schema|meta|all]

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BASE_URL="https://imageaigo.cc"

# 测试 Sitemap
test_sitemap() {
    echo "🗺️  测试 Sitemap"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # 1. Sitemap Index
    echo "1️⃣ Sitemap Index: $BASE_URL/sitemap.xml"
    if curl -sf "$BASE_URL/sitemap.xml" | grep -q "<?xml version="; then
        echo -e "${GREEN}✅ 格式正确${NC}"
        echo "前 10 行:"
        curl -s "$BASE_URL/sitemap.xml" | head -10
    else
        echo -e "${RED}❌ 无法访问或格式错误${NC}"
    fi
    echo ""
    
    # 2. 主要页面
    echo "2️⃣ 主要页面 Sitemap: $BASE_URL/sitemap-main.xml"
    if curl -sf "$BASE_URL/sitemap-main.xml" | grep -q "<?xml version="; then
        echo -e "${GREEN}✅ 格式正确${NC}"
        url_count=$(curl -s "$BASE_URL/sitemap-main.xml" | grep -c "<loc>" || echo "0")
        echo "URL 数量: $url_count"
    else
        echo -e "${RED}❌ 无法访问或格式错误${NC}"
    fi
    echo ""
    
    # 3. 图片 Sitemap
    echo "3️⃣ 图片 Sitemap (第1页): $BASE_URL/sitemap-images-1.xml"
    if curl -sf "$BASE_URL/sitemap-images-1.xml" | grep -q "<?xml version="; then
        echo -e "${GREEN}✅ 格式正确${NC}"
        image_count=$(curl -s "$BASE_URL/sitemap-images-1.xml" | grep -c "<image:image>" || echo "0")
        echo "图片数量: $image_count"
        echo "示例 URL:"
        curl -s "$BASE_URL/sitemap-images-1.xml" | grep "<loc>" | head -2
    else
        echo -e "${RED}❌ 无法访问或格式错误${NC}"
    fi
    echo ""
    
    # 4. 分类 Sitemap
    echo "4️⃣ 分类 Sitemap: $BASE_URL/sitemap-categories.xml"
    if curl -sf "$BASE_URL/sitemap-categories.xml" | grep -q "<?xml version="; then
        echo -e "${GREEN}✅ 格式正确${NC}"
        cat_count=$(curl -s "$BASE_URL/sitemap-categories.xml" | grep -c "<loc>" || echo "0")
        echo "分类数量: $cat_count"
    else
        echo -e "${RED}❌ 无法访问或格式错误${NC}"
    fi
    echo ""
    
    # 5. 标签 Sitemap
    echo "5️⃣ 标签 Sitemap: $BASE_URL/sitemap-tags.xml"
    if curl -sf "$BASE_URL/sitemap-tags.xml" | grep -q "<?xml version="; then
        echo -e "${GREEN}✅ 格式正确${NC}"
        tag_count=$(curl -s "$BASE_URL/sitemap-tags.xml" | grep -c "<loc>" || echo "0")
        echo "标签数量: $tag_count"
    else
        echo -e "${RED}❌ 无法访问或格式错误${NC}"
    fi
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}✅ Sitemap 测试完成${NC}"
    echo ""
    echo "📝 提交到 Google Search Console:"
    echo "   URL: https://imageaigo.cc/sitemap.xml"
}

# 测试结构化数据
test_schema() {
    echo "📋 测试结构化数据"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # 获取测试 URL
    local test_url="${1:-$BASE_URL}"
    
    if [[ "$test_url" == "$BASE_URL" ]]; then
        # 获取一个图片页面URL
        echo "获取测试图片 URL..."
        test_url=$(curl -s "$BASE_URL/api/images?limit=1" | grep -o '"slug":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ ! -z "$test_url" ]; then
            test_url="$BASE_URL/image/$test_url"
        else
            echo -e "${YELLOW}⚠️  无法获取图片，使用首页测试${NC}"
            test_url="$BASE_URL"
        fi
    fi
    
    echo "📍 测试 URL: $test_url"
    echo ""
    
    # 获取页面内容
    content=$(curl -s "$test_url")
    
    # 检查 ImageObject
    echo "1️⃣ 检查 ImageObject 结构化数据..."
    if echo "$content" | grep -q '@type":"ImageObject'; then
        echo -e "${GREEN}✅ 找到 ImageObject${NC}"
        
        # 提取并格式化 JSON-LD
        echo ""
        echo "结构化数据："
        echo "$content" | \
            grep -o '{"@context":"https://schema.org","@type":"ImageObject"[^}]*}' | \
            python3 -c "import sys, json; print(json.dumps(json.loads(sys.stdin.read()), indent=2, ensure_ascii=False))" 2>/dev/null || \
            echo "  (格式化失败，但数据存在)"
        echo ""
        
        # 验证关键字段
        echo "2️⃣ 验证关键字段..."
        
        if echo "$content" | grep -q '"contentUrl":"https://'; then
            echo -e "  ${GREEN}✅ contentUrl (完整 URL)${NC}"
        else
            echo -e "  ${RED}❌ contentUrl 缺失或格式错误${NC}"
        fi
        
        if echo "$content" | grep -q '"datePublished":"[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}T'; then
            echo -e "  ${GREEN}✅ datePublished (ISO 8601)${NC}"
        else
            echo -e "  ${RED}❌ datePublished 缺失或格式错误${NC}"
        fi
        
        if echo "$content" | grep -q '"name":"[^"]\+","description"'; then
            echo -e "  ${GREEN}✅ name 和 description${NC}"
        else
            echo -e "  ${RED}❌ name 或 description 缺失${NC}"
        fi
        
        if echo "$content" | grep -q '"width":{"@type":"QuantitativeValue"'; then
            echo -e "  ${GREEN}✅ width (QuantitativeValue)${NC}"
        else
            echo -e "  ${RED}❌ width 缺失或格式错误${NC}"
        fi
        
        if echo "$content" | grep -q '"height":{"@type":"QuantitativeValue"'; then
            echo -e "  ${GREEN}✅ height (QuantitativeValue)${NC}"
        else
            echo -e "  ${RED}❌ height 缺失或格式错误${NC}"
        fi
        
    else
        echo -e "${RED}❌ 未找到 ImageObject 结构化数据${NC}"
    fi
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}✅ 结构化数据测试完成${NC}"
    echo ""
    echo "🌐 在线验证工具:"
    echo "  Google Rich Results: https://search.google.com/test/rich-results"
    echo "  Schema.org Validator: https://validator.schema.org/"
}

# 测试元数据
test_meta() {
    echo "🏷️  测试元数据 (Meta Tags)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    local test_url="${1:-$BASE_URL}"
    echo "📍 测试 URL: $test_url"
    echo ""
    
    content=$(curl -s "$test_url")
    
    # 基础元数据
    echo "1️⃣ 基础元数据..."
    
    if echo "$content" | grep -q '<title>'; then
        title=$(echo "$content" | grep -o '<title>[^<]*</title>' | sed 's/<[^>]*>//g')
        echo -e "  ${GREEN}✅ Title: $title${NC}"
    else
        echo -e "  ${RED}❌ Title 缺失${NC}"
    fi
    
    if echo "$content" | grep -q 'name="description"'; then
        echo -e "  ${GREEN}✅ Description${NC}"
    else
        echo -e "  ${RED}❌ Description 缺失${NC}"
    fi
    echo ""
    
    # Open Graph
    echo "2️⃣ Open Graph 标签..."
    
    og_tags=("og:title" "og:description" "og:image" "og:url" "og:type")
    for tag in "${og_tags[@]}"; do
        if echo "$content" | grep -q "property=\"$tag\""; then
            echo -e "  ${GREEN}✅ $tag${NC}"
        else
            echo -e "  ${YELLOW}⚠️  $tag 缺失${NC}"
        fi
    done
    echo ""
    
    # Twitter Cards
    echo "3️⃣ Twitter Card 标签..."
    
    twitter_tags=("twitter:card" "twitter:title" "twitter:description" "twitter:image")
    for tag in "${twitter_tags[@]}"; do
        if echo "$content" | grep -q "name=\"$tag\""; then
            echo -e "  ${GREEN}✅ $tag${NC}"
        else
            echo -e "  ${YELLOW}⚠️  $tag 缺失${NC}"
        fi
    done
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}✅ 元数据测试完成${NC}"
}

# 运行所有测试
test_all() {
    echo "🧪 运行所有 SEO 测试"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    test_sitemap
    echo ""
    echo ""
    test_schema
    echo ""
    echo ""
    test_meta
    echo ""
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}✅ 所有 SEO 测试完成！${NC}"
}

# 显示帮助
show_help() {
    echo "ImageAI Go SEO 测试脚本"
    echo ""
    echo "用法:"
    echo "  ./test-seo.sh [命令] [URL]"
    echo ""
    echo "命令:"
    echo "  sitemap  - 测试 Sitemap"
    echo "  schema   - 测试结构化数据"
    echo "  meta     - 测试元数据"
    echo "  all      - 运行所有测试"
    echo "  help     - 显示帮助"
    echo ""
    echo "示例:"
    echo "  ./test-seo.sh sitemap              # 测试 Sitemap"
    echo "  ./test-seo.sh schema https://...   # 测试指定 URL 的结构化数据"
    echo "  ./test-seo.sh all                  # 运行所有测试"
}

# 主函数
main() {
    case "${1:-}" in
        sitemap)
            test_sitemap
            ;;
        schema)
            test_schema "${2:-}"
            ;;
        meta)
            test_meta "${2:-}"
            ;;
        all)
            test_all
            ;;
        help|--help|-h)
            show_help
            ;;
        "")
            # 无参数时显示菜单
            echo "🧪 ImageAI Go SEO 测试"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "请选择测试:"
            echo "1) 测试 Sitemap"
            echo "2) 测试结构化数据"
            echo "3) 测试元数据"
            echo "4) 运行所有测试"
            echo "5) 退出"
            echo ""
            read -p "请输入选项 (1-5): " choice
            
            case $choice in
                1) test_sitemap ;;
                2) test_schema ;;
                3) test_meta ;;
                4) test_all ;;
                5) echo "退出"; exit 0 ;;
                *) echo -e "${RED}❌ 无效选项${NC}"; exit 1 ;;
            esac
            ;;
        *)
            echo -e "${RED}❌ 未知命令: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"

