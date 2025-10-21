#!/bin/bash

# ImageAI Go 系统清理脚本
# 功能：清理 R2 存储、KV 缓存、Sitemap 缓存
# 使用：./cleanup.sh [all|r2|kv|sitemap]

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 清理 R2 和 KV
cleanup_storage() {
    echo "📦 清理 R2 存储和 KV 缓存..."
    echo ""
    
    read -p "⚠️  这将清理所有 R2 图片和 KV 缓存，确认继续? (y/n): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消"
        return
    fi
    
    # 使用 API 清理
    response=$(curl -s -X POST https://imageaigo.cc/api/cleanup \
      -H "Content-Type: application/json" \
      -d '{"action": "all", "secret": "cleanup-imageaigo-2024"}')
    
    echo "响应: $response"
    echo ""
    echo -e "${GREEN}✅ R2 和 KV 清理完成！${NC}"
}

# 清理 Sitemap 缓存
cleanup_sitemap() {
    echo "🗺️  清理 Sitemap 缓存..."
    echo ""
    
    # 检查 wrangler
    if ! command -v wrangler &> /dev/null; then
        echo -e "${RED}❌ wrangler 未安装${NC}"
        return 1
    fi
    
    # 清除各类 sitemap
    echo "清除 sitemap index..."
    wrangler kv:key delete --binding=CACHE "sitemap:index" 2>/dev/null || true
    
    echo "清除主要页面 sitemap..."
    wrangler kv:key delete --binding=CACHE "sitemap:main" 2>/dev/null || true
    
    echo "清除分类 sitemap..."
    wrangler kv:key delete --binding=CACHE "sitemap:categories" 2>/dev/null || true
    
    echo "清除标签 sitemap..."
    wrangler kv:key delete --binding=CACHE "sitemap:tags" 2>/dev/null || true
    
    echo "清除图片 sitemap（分页 1-20）..."
    for i in {1..20}; do
        wrangler kv:key delete --binding=CACHE "sitemap:images-$i" 2>/dev/null || true
    done
    
    echo ""
    echo -e "${GREEN}✅ Sitemap 缓存已清除${NC}"
    echo ""
    echo "📍 验证更新："
    echo "   curl https://imageaigo.cc/sitemap.xml | head -50"
}

# 清理所有缓存
cleanup_cache() {
    echo "💾 清理 KV 缓存..."
    echo ""
    
    read -p "⚠️  这将清理所有 KV 缓存，确认继续? (y/n): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消"
        return
    fi
    
    if ! command -v wrangler &> /dev/null; then
        echo -e "${RED}❌ wrangler 未安装${NC}"
        return 1
    fi
    
    # 清除图片相关缓存
    echo "清除图片缓存..."
    wrangler kv:key delete --binding=CACHE "images:list:*" 2>/dev/null || true
    
    # 清除分类和标签缓存
    echo "清除分类和标签缓存..."
    wrangler kv:key delete --binding=CACHE "categories:*" 2>/dev/null || true
    wrangler kv:key delete --binding=CACHE "tags:*" 2>/dev/null || true
    
    # 清除 Sitemap
    cleanup_sitemap
    
    echo ""
    echo -e "${GREEN}✅ 所有缓存已清除${NC}"
}

# 清理所有数据
cleanup_all() {
    echo "🧹 清理所有数据"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⚠️  警告：这将清理："
    echo "   - R2 存储中的所有图片"
    echo "   - KV 缓存中的所有数据"
    echo "   - Sitemap 缓存"
    echo ""
    read -p "确认继续? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "已取消"
        return
    fi
    
    cleanup_storage
    echo ""
    cleanup_sitemap
    echo ""
    echo -e "${GREEN}✅ 所有数据已清理完成！${NC}"
}

# 显示当前状态
show_status() {
    echo "📊 系统状态检查"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # 获取图片数量（通过 API）
    echo "正在查询数据..."
    stats=$(curl -s https://imageaigo.cc/api/stats 2>/dev/null || echo '{}')
    
    if [ ! -z "$stats" ] && [ "$stats" != "{}" ]; then
        echo "📸 图片数量: $(echo $stats | grep -o '"images":[0-9]*' | cut -d: -f2)"
        echo "🏷️  标签数量: $(echo $stats | grep -o '"tags":[0-9]*' | cut -d: -f2)"
        echo "👥 用户数量: $(echo $stats | grep -o '"users":[0-9]*' | cut -d: -f2)"
    else
        echo "⚠️  无法获取统计数据"
    fi
    
    echo ""
    echo "💾 KV 缓存："
    if command -v wrangler &> /dev/null; then
        kv_count=$(wrangler kv:key list --binding=CACHE 2>/dev/null | grep -c "name" || echo "0")
        echo "   缓存项数: $kv_count"
    else
        echo "   ⚠️  需要 wrangler CLI"
    fi
}

# 显示帮助
show_help() {
    echo "ImageAI Go 系统清理脚本"
    echo ""
    echo "用法:"
    echo "  ./cleanup.sh [命令]"
    echo ""
    echo "命令:"
    echo "  all      - 清理所有数据（R2 + KV + Sitemap）"
    echo "  r2       - 清理 R2 存储"
    echo "  kv       - 清理 KV 缓存"
    echo "  sitemap  - 清理 Sitemap 缓存"
    echo "  status   - 显示系统状态"
    echo "  help     - 显示帮助"
    echo ""
    echo "示例:"
    echo "  ./cleanup.sh sitemap   # 仅清理 Sitemap 缓存"
    echo "  ./cleanup.sh kv        # 仅清理 KV 缓存"
    echo "  ./cleanup.sh all       # 清理所有数据"
}

# 主函数
main() {
    case "${1:-}" in
        all)
            cleanup_all
            ;;
        r2)
            cleanup_storage
            ;;
        kv)
            cleanup_cache
            ;;
        sitemap)
            cleanup_sitemap
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        "")
            # 无参数时显示菜单
            echo "🧹 ImageAI Go 系统清理"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "请选择操作:"
            echo "1) 清理所有数据"
            echo "2) 仅清理 R2 存储"
            echo "3) 仅清理 KV 缓存"
            echo "4) 仅清理 Sitemap 缓存"
            echo "5) 查看系统状态"
            echo "6) 退出"
            echo ""
            read -p "请输入选项 (1-6): " choice
            
            case $choice in
                1) cleanup_all ;;
                2) cleanup_storage ;;
                3) cleanup_cache ;;
                4) cleanup_sitemap ;;
                5) show_status ;;
                6) echo "退出"; exit 0 ;;
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
