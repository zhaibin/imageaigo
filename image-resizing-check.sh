#!/bin/bash

# Cloudflare Image Resizing 验证脚本
# 用于检查 Image Resizing 的配置和使用情况

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：打印标题
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# 函数：打印成功消息
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# 函数：打印错误消息
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# 函数：打印警告消息
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 函数：打印信息消息
print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# 函数：检查配置文件
check_config() {
    print_header "1. 检查 wrangler.toml 配置"
    
    if [ ! -f "wrangler.toml" ]; then
        print_error "找不到 wrangler.toml 文件"
        return 1
    fi
    
    # 检查 Image Resizing 是否启用
    if grep -q "^\[image_resizing\]" wrangler.toml; then
        if grep -A 1 "^\[image_resizing\]" wrangler.toml | grep -q "enabled = true"; then
            print_success "Image Resizing 已在配置中启用"
            return 0
        else
            print_warning "Image Resizing 配置存在但未启用"
            return 1
        fi
    else
        print_warning "Image Resizing 配置被注释或不存在"
        print_info "在 wrangler.toml 中启用 Image Resizing："
        echo ""
        echo "[image_resizing]"
        echo "enabled = true"
        echo ""
        return 1
    fi
}

# 函数：检查代码实现
check_code() {
    print_header "2. 检查代码实现"
    
    if [ -f "src/services/image-transform.js" ]; then
        print_success "图片转换模块存在 (src/services/image-transform.js)"
        
        # 检查关键函数
        if grep -q "fetchWithResize" src/services/image-transform.js; then
            print_success "fetchWithResize 函数已实现"
        fi
        
        if grep -q "parseTransformOptions" src/services/image-transform.js; then
            print_success "parseTransformOptions 函数已实现"
        fi
        
        if grep -q "getTransformedImage" src/services/image-transform.js; then
            print_success "getTransformedImage 函数已实现"
        fi
    else
        print_error "找不到图片转换模块"
        return 1
    fi
}

# 函数：测试实际转换（需要部署的域名）
test_transformation() {
    print_header "3. 测试图片转换功能"
    
    echo -e "请输入您的域名（例如：imageaigo.cc 或 localhost:8787）："
    read -r DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        print_warning "未提供域名，跳过实时测试"
        return 0
    fi
    
    # 询问是否使用 HTTPS
    if [[ "$DOMAIN" == "localhost"* ]]; then
        PROTOCOL="http"
    else
        PROTOCOL="https"
    fi
    
    # 测试 URL
    echo ""
    print_info "测试 URL 构建示例："
    echo "  ${PROTOCOL}://${DOMAIN}/r2/images/example.jpg?format=webp&width=800"
    echo ""
    
    # 询问是否要测试具体图片
    echo "是否要测试具体的图片 URL？(y/n)"
    read -r TEST_IMAGE
    
    if [ "$TEST_IMAGE" = "y" ] || [ "$TEST_IMAGE" = "Y" ]; then
        echo "请输入图片的 R2 key（例如：images/123456-hash-original.jpg）："
        read -r IMAGE_KEY
        
        if [ -n "$IMAGE_KEY" ]; then
            TEST_URL="${PROTOCOL}://${DOMAIN}/r2/${IMAGE_KEY}?format=webp&width=800&quality=85"
            
            echo ""
            print_info "测试 URL: $TEST_URL"
            echo ""
            
            # 使用 curl 测试
            print_info "发送请求..."
            RESPONSE_HEADERS=$(curl -sI "$TEST_URL" 2>&1)
            
            if [ $? -eq 0 ]; then
                echo ""
                print_success "请求成功"
                echo ""
                echo "响应头信息："
                echo "----------------------------------------"
                echo "$RESPONSE_HEADERS"
                echo "----------------------------------------"
                echo ""
                
                # 检查关键响应头
                if echo "$RESPONSE_HEADERS" | grep -qi "X-Image-Resizing: enabled"; then
                    print_success "Image Resizing 已成功应用 ✓"
                elif echo "$RESPONSE_HEADERS" | grep -qi "X-Image-Resizing: fallback"; then
                    print_warning "Image Resizing 降级，返回原图"
                    print_info "可能原因：Image Resizing 未在 Cloudflare 启用或超出配额"
                elif echo "$RESPONSE_HEADERS" | grep -qi "X-Image-Resizing: error"; then
                    print_error "Image Resizing 转换失败"
                else
                    print_warning "未找到 X-Image-Resizing 响应头"
                    print_info "这可能表示功能未启用或代码未添加响应头"
                fi
                
                # 检查 Content-Type
                if echo "$RESPONSE_HEADERS" | grep -qi "Content-Type: image/webp"; then
                    print_success "图片格式已转换为 WebP"
                fi
                
                # 检查缓存头
                if echo "$RESPONSE_HEADERS" | grep -qi "Cache-Control"; then
                    print_success "CDN 缓存头已设置"
                fi
            else
                print_error "请求失败: $RESPONSE_HEADERS"
            fi
        fi
    fi
}

# 函数：查看日志
check_logs() {
    print_header "4. 查看 Worker 日志"
    
    print_info "使用以下命令查看实时日志："
    echo ""
    echo "  wrangler tail"
    echo ""
    print_info "过滤图片转换相关日志："
    echo ""
    echo "  wrangler tail | grep -i 'image'"
    echo "  wrangler tail | grep -i 'transform'"
    echo "  wrangler tail | grep -i 'resizing'"
    echo ""
    
    echo "是否现在查看实时日志？(y/n)"
    read -r VIEW_LOGS
    
    if [ "$VIEW_LOGS" = "y" ] || [ "$VIEW_LOGS" = "Y" ]; then
        print_info "启动实时日志监控（按 Ctrl+C 退出）..."
        sleep 1
        wrangler tail
    fi
}

# 函数：显示使用统计信息
show_stats() {
    print_header "5. 使用统计和监控"
    
    print_info "在 Cloudflare Dashboard 中查看统计："
    echo ""
    echo "1. 登录 Cloudflare Dashboard"
    echo "   https://dash.cloudflare.com"
    echo ""
    echo "2. 进入您的账户"
    echo ""
    echo "3. 查看统计数据："
    echo "   • Analytics → Workers - Worker 请求统计"
    echo "   • Analytics → Image Resizing - 图片转换使用量"
    echo "   • Speed → Optimization → Image Resizing - 功能配置"
    echo "   • Billing - 费用统计"
    echo ""
}

# 函数：显示配置建议
show_recommendations() {
    print_header "6. 配置建议"
    
    echo "📋 Image Resizing 最佳实践："
    echo ""
    echo "✓ 启用步骤："
    echo "  1. 在 Cloudflare Dashboard 中启用 Image Resizing"
    echo "     路径：Speed → Optimization → Image Resizing"
    echo ""
    echo "  2. 在 wrangler.toml 中添加配置："
    echo "     [image_resizing]"
    echo "     enabled = true"
    echo ""
    echo "  3. 重新部署 Worker："
    echo "     wrangler deploy"
    echo ""
    echo "✓ 性能优化："
    echo "  • 使用预定义尺寸提高缓存命中率"
    echo "  • 优先使用 WebP 格式（节省 40-60% 带宽）"
    echo "  • 启用 CDN 缓存（已自动配置）"
    echo "  • 使用响应式图片（srcset）"
    echo ""
    echo "✓ 成本控制："
    echo "  • 监控每月使用量"
    echo "  • 使用 CDN 缓存减少转换次数"
    echo "  • 避免使用过多自定义尺寸"
    echo ""
    echo "✓ 故障排查："
    echo "  • 检查响应头 X-Image-Resizing"
    echo "  • 查看 wrangler tail 日志"
    echo "  • 验证 Cloudflare Dashboard 配置"
    echo ""
}

# 函数：显示测试命令
show_test_commands() {
    print_header "7. 测试命令参考"
    
    echo "🧪 测试图片转换："
    echo ""
    echo "# 基础测试（替换为实际域名和图片路径）"
    echo 'curl -I "https://your-domain.com/r2/images/example.jpg?format=webp&width=800"'
    echo ""
    echo "# 测试不同参数"
    echo 'curl -I "https://your-domain.com/r2/images/example.jpg?format=webp&width=400"'
    echo 'curl -I "https://your-domain.com/r2/images/example.jpg?format=jpeg&width=800&quality=90"'
    echo 'curl -I "https://your-domain.com/r2/images/example.jpg?format=avif&width=1200"'
    echo ""
    echo "# 下载并检查文件"
    echo 'curl -o test-webp.webp "https://your-domain.com/r2/images/example.jpg?format=webp&width=800"'
    echo 'file test-webp.webp  # 验证文件类型'
    echo 'ls -lh test-webp.webp  # 查看文件大小'
    echo ""
    echo "# 比较原图和转换后的大小"
    echo 'curl -o original.jpg "https://your-domain.com/r2/images/example-original.jpg"'
    echo 'curl -o converted.webp "https://your-domain.com/r2/images/example-original.jpg?format=webp&width=800"'
    echo 'ls -lh original.jpg converted.webp'
    echo ""
}

# 主函数
main() {
    clear
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════╗"
    echo "║   Cloudflare Image Resizing 验证工具          ║"
    echo "║   ImageAI Go - 图片转换功能检查               ║"
    echo "╚════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo "此工具将帮助您验证 Cloudflare Image Resizing 的配置和使用情况"
    echo ""
    
    # 检查是否在项目根目录
    if [ ! -f "wrangler.toml" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 显示菜单
    while true; do
        echo ""
        echo "请选择要执行的检查："
        echo "  1) 检查所有配置（推荐）"
        echo "  2) 仅检查配置文件"
        echo "  3) 仅检查代码实现"
        echo "  4) 测试图片转换功能"
        echo "  5) 查看 Worker 日志"
        echo "  6) 显示使用统计信息"
        echo "  7) 显示配置建议"
        echo "  8) 显示测试命令"
        echo "  9) 退出"
        echo ""
        read -p "请输入选项 (1-9): " choice
        
        case $choice in
            1)
                check_config
                check_code
                test_transformation
                show_stats
                show_recommendations
                ;;
            2)
                check_config
                ;;
            3)
                check_code
                ;;
            4)
                test_transformation
                ;;
            5)
                check_logs
                ;;
            6)
                show_stats
                ;;
            7)
                show_recommendations
                ;;
            8)
                show_test_commands
                ;;
            9)
                echo ""
                print_info "退出检查工具"
                exit 0
                ;;
            *)
                print_error "无效选项，请输入 1-9"
                ;;
        esac
    done
}

# 运行主函数
main

