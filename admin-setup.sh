#!/bin/bash

# ImageAI Go 管理员设置脚本
# 功能：初始设置、修改密码、查看配置
# 使用：./admin-setup.sh [setup|change|check]

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查 wrangler
check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        echo -e "${RED}❌ 错误: wrangler 未安装${NC}"
        echo "请先安装: npm install -g wrangler"
        exit 1
    fi
    echo -e "${GREEN}✅ wrangler 已安装${NC}"
}

# 初始设置
setup_admin() {
    echo "🎨 ImageAI Go 管理后台初始设置"
    echo "=================================="
    echo ""
    
    # 设置管理员密码
    echo "📝 步骤 1/4: 设置管理员密码"
    echo "建议: 至少12位，包含大小写字母、数字和特殊字符"
    echo "---"
    wrangler secret put ADMIN_PASSWORD
    echo ""
    
    # 设置密钥
    echo "📝 步骤 2/4: 设置 Token 签名密钥"
    echo "建议: 使用随机字符串（至少32位）"
    echo "生成随机密钥: openssl rand -base64 32"
    echo "---"
    wrangler secret put ADMIN_SECRET
    echo ""
    
    # 设置 Resend API Token
    echo "📝 步骤 3/4: 设置 Resend 邮件服务 API Token"
    echo "获取: https://resend.com/api-keys"
    echo "---"
    wrangler secret put RESEND_API_TOKEN
    echo ""
    
    # 设置 Turnstile Secret Key
    echo "📝 步骤 4/4: 设置 Turnstile Secret Key (可选)"
    echo "获取: https://dash.cloudflare.com/?to=/:account/turnstile"
    read -p "是否设置 Turnstile Secret Key? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        wrangler secret put TURNSTILE_SECRET_KEY
    else
        echo "跳过 Turnstile 配置"
    fi
    echo ""
    
    # 部署
    echo "🚀 步骤 5/5: 部署到 Cloudflare Workers"
    read -p "是否现在部署？(y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "正在部署..."
        wrangler deploy
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ 部署成功！${NC}"
            echo ""
            echo "📍 管理后台地址: https://imageaigo.cc/admin/login"
            echo "📖 查看 README.md 了解更多信息"
            echo ""
            echo "🎉 开始使用吧！"
        else
            echo ""
            echo -e "${RED}❌ 部署失败${NC}"
            exit 1
        fi
    else
        echo ""
        echo "⏸️  已跳过部署，稍后运行: wrangler deploy"
    fi
}

# 修改密码
change_password() {
    echo "🔐 ImageAI Go 管理员密码修改"
    echo "=================================="
    echo ""
    
    # 显示当前配置
    echo "📋 当前已配置的密钥:"
    wrangler secret list
    echo ""
    
    # 选择要修改的密钥
    echo "请选择要修改的密钥:"
    echo "1) ADMIN_PASSWORD (管理员登录密码)"
    echo "2) ADMIN_SECRET (Token 签名密钥)"
    echo "3) RESEND_API_TOKEN (邮件服务)"
    echo "4) TURNSTILE_SECRET_KEY (人机验证)"
    echo "5) 全部重新设置"
    echo "6) 退出"
    echo ""
    read -p "请输入选项 (1-6): " choice
    
    case $choice in
        1)
            echo ""
            echo "📝 修改管理员密码"
            wrangler secret put ADMIN_PASSWORD
            ;;
        2)
            echo ""
            echo "📝 修改 Token 签名密钥"
            echo "⚠️  修改后所有会话将失效"
            wrangler secret put ADMIN_SECRET
            ;;
        3)
            echo ""
            echo "📝 修改 Resend API Token"
            wrangler secret put RESEND_API_TOKEN
            ;;
        4)
            echo ""
            echo "📝 修改 Turnstile Secret Key"
            wrangler secret put TURNSTILE_SECRET_KEY
            ;;
        5)
            setup_admin
            return
            ;;
        6)
            echo "已取消"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ 无效选项${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}✅ 密钥已更新！${NC}"
    echo ""
    
    # 部署
    read -p "是否立即部署以应用更改？(y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 正在部署..."
        wrangler deploy
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ 部署成功！${NC}"
            echo ""
            echo "⚠️  重要提示:"
            echo "   - 如果修改了 ADMIN_SECRET，所有会话将失效"
            echo "   - 请使用新密码重新登录"
        else
            echo ""
            echo -e "${RED}❌ 部署失败${NC}"
            exit 1
        fi
    else
        echo ""
        echo "⏸️  已跳过部署"
        echo "稍后运行: wrangler deploy"
    fi
}

# 检查配置
check_config() {
    echo "🔍 检查管理员配置"
    echo "=================================="
    echo ""
    
    echo "📋 已配置的密钥:"
    wrangler secret list
    echo ""
    
    # 检查必需的密钥
    SECRETS=$(wrangler secret list 2>/dev/null || echo "")
    
    echo "📊 配置状态:"
    if echo "$SECRETS" | grep -q "ADMIN_PASSWORD"; then
        echo -e "  ${GREEN}✅ ADMIN_PASSWORD${NC}"
    else
        echo -e "  ${RED}❌ ADMIN_PASSWORD (未配置)${NC}"
    fi
    
    if echo "$SECRETS" | grep -q "ADMIN_SECRET"; then
        echo -e "  ${GREEN}✅ ADMIN_SECRET${NC}"
    else
        echo -e "  ${RED}❌ ADMIN_SECRET (未配置)${NC}"
    fi
    
    if echo "$SECRETS" | grep -q "RESEND_API_TOKEN"; then
        echo -e "  ${GREEN}✅ RESEND_API_TOKEN${NC}"
    else
        echo -e "  ${YELLOW}⚠️  RESEND_API_TOKEN (未配置)${NC}"
    fi
    
    if echo "$SECRETS" | grep -q "TURNSTILE_SECRET_KEY"; then
        echo -e "  ${GREEN}✅ TURNSTILE_SECRET_KEY${NC}"
    else
        echo -e "  ${YELLOW}⚠️  TURNSTILE_SECRET_KEY (可选)${NC}"
    fi
    
    echo ""
}

# 显示帮助
show_help() {
    echo "ImageAI Go 管理员设置脚本"
    echo ""
    echo "用法:"
    echo "  ./admin-setup.sh [命令]"
    echo ""
    echo "命令:"
    echo "  setup   - 初始设置（首次使用）"
    echo "  change  - 修改密码/密钥"
    echo "  check   - 检查配置状态"
    echo "  help    - 显示帮助"
    echo ""
    echo "示例:"
    echo "  ./admin-setup.sh setup   # 初始设置"
    echo "  ./admin-setup.sh change  # 修改密码"
    echo "  ./admin-setup.sh check   # 检查配置"
}

# 主函数
main() {
    check_wrangler
    echo ""
    
    case "${1:-}" in
        setup)
            setup_admin
            ;;
        change)
            change_password
            ;;
        check)
            check_config
            ;;
        help|--help|-h)
            show_help
            ;;
        "")
            # 无参数时显示菜单
            echo "🎨 ImageAI Go 管理员设置"
            echo "=================================="
            echo ""
            echo "请选择操作:"
            echo "1) 初始设置（首次使用）"
            echo "2) 修改密码/密钥"
            echo "3) 检查配置状态"
            echo "4) 退出"
            echo ""
            read -p "请输入选项 (1-4): " choice
            
            case $choice in
                1) setup_admin ;;
                2) change_password ;;
                3) check_config ;;
                4) echo "退出"; exit 0 ;;
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
    
    echo ""
    echo "=================================="
    echo "操作完成！"
}

main "$@"

