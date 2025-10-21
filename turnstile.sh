#!/bin/bash

# Cloudflare Turnstile 管理脚本
# 功能：检查配置、更新站点密钥、测试验证
# 使用：./turnstile.sh [check|update|test]

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查配置
check_config() {
    echo "🔍 检查 Turnstile 配置"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    local all_ok=true
    
    # 1. 检查前端 Site Key
    echo "1️⃣ 检查前端 Site Key..."
    if grep -q "sitekey:" src/user-pages.js; then
        CURRENT_KEY=$(grep "sitekey:" src/user-pages.js | head -1 | sed "s/.*sitekey: '\(.*\)'.*/\1/")
        echo -e "${GREEN}✅ Site Key: $CURRENT_KEY${NC}"
    else
        echo -e "${RED}❌ Site Key 未找到${NC}"
        all_ok=false
    fi
    echo ""
    
    # 2. 检查 Turnstile 脚本
    echo "2️⃣ 检查 Turnstile 脚本..."
    if grep -q "challenges.cloudflare.com/turnstile" src/user-pages.js; then
        echo -e "${GREEN}✅ Turnstile 脚本已加载${NC}"
    else
        echo -e "${RED}❌ Turnstile 脚本未找到${NC}"
        all_ok=false
    fi
    echo ""
    
    # 3. 检查 Secret Key
    echo "3️⃣ 检查 Secret Key..."
    if command -v wrangler &> /dev/null; then
        if wrangler secret list 2>/dev/null | grep -q "TURNSTILE_SECRET_KEY"; then
            echo -e "${GREEN}✅ TURNSTILE_SECRET_KEY 已配置${NC}"
        else
            echo -e "${YELLOW}⚠️  TURNSTILE_SECRET_KEY 未配置${NC}"
            echo "   运行: wrangler secret put TURNSTILE_SECRET_KEY"
            all_ok=false
        fi
    else
        echo -e "${RED}❌ Wrangler CLI 未安装${NC}"
        all_ok=false
    fi
    echo ""
    
    # 4. 检查后端验证代码
    echo "4️⃣ 检查后端验证代码..."
    if grep -q "verifyTurnstile" src/brute-force-protection.js; then
        echo -e "${GREEN}✅ 后端验证代码存在${NC}"
    else
        echo -e "${RED}❌ 后端验证代码未找到${NC}"
        all_ok=false
    fi
    echo ""
    
    # 5. 检查本地开发配置
    echo "5️⃣ 检查本地开发配置..."
    if [ -f .dev.vars ]; then
        if grep -q "TURNSTILE_SECRET_KEY" .dev.vars; then
            echo -e "${GREEN}✅ .dev.vars 已配置${NC}"
        else
            echo -e "${YELLOW}⚠️  .dev.vars 未配置 TURNSTILE_SECRET_KEY${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  .dev.vars 不存在（可选）${NC}"
    fi
    echo ""
    
    # 汇总
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ "$all_ok" = true ]; then
        echo -e "${GREEN}✅ Turnstile 完全配置${NC}"
        echo ""
        echo "下一步："
        echo "1. 部署: wrangler deploy"
        echo "2. 测试: 访问 https://imageaigo.cc/login"
        echo "3. 触发验证: 输入错误密码 2 次"
    else
        echo -e "${YELLOW}⚠️  Turnstile 部分配置${NC}"
        echo ""
        echo "完成设置："
        echo "1️⃣ 获取密钥: https://dash.cloudflare.com/?to=/:account/turnstile"
        echo "2️⃣ 配置 Secret: wrangler secret put TURNSTILE_SECRET_KEY"
        echo "3️⃣ 更新 Site Key: ./turnstile.sh update"
        echo "4️⃣ 部署: wrangler deploy"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 更新站点密钥
update_sitekey() {
    echo "🔑 更新 Turnstile Site Key"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # 获取当前密钥
    if grep -q "sitekey:" src/user-pages.js; then
        CURRENT_KEY=$(grep "sitekey:" src/user-pages.js | head -1 | sed "s/.*sitekey: '\(.*\)'.*/\1/")
        echo "当前站点密钥: $CURRENT_KEY"
    else
        echo -e "${RED}❌ 无法读取当前密钥${NC}"
        exit 1
    fi
    echo ""
    
    read -p "请输入新的站点密钥（留空保持不变）: " NEW_KEY
    
    if [ -z "$NEW_KEY" ]; then
        echo "✅ 保持当前站点密钥不变"
        exit 0
    fi
    
    echo ""
    echo "准备更新站点密钥:"
    echo "  旧: $CURRENT_KEY"
    echo "  新: $NEW_KEY"
    echo ""
    read -p "确认更新? (y/n): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 已取消"
        exit 0
    fi
    
    # 更新文件
    echo "📝 更新 src/user-pages.js..."
    sed -i.bak "s|sitekey: '$CURRENT_KEY'|sitekey: '$NEW_KEY'|g" src/user-pages.js
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 站点密钥已更新${NC}"
        rm -f src/user-pages.js.bak
        echo ""
        echo "下一步:"
        echo "1. 部署: wrangler deploy"
        echo "2. 测试: ./turnstile.sh test"
    else
        echo -e "${RED}❌ 更新失败${NC}"
        [ -f src/user-pages.js.bak ] && mv src/user-pages.js.bak src/user-pages.js
        exit 1
    fi
}

# 测试验证
test_turnstile() {
    echo "🧪 测试 Turnstile 配置"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    echo "📋 测试步骤:"
    echo ""
    echo "1. 访问登录页面:"
    echo "   https://imageaigo.cc/login"
    echo ""
    echo "2. 触发 Turnstile:"
    echo "   - 输入任意邮箱/用户名"
    echo "   - 输入错误密码"
    echo "   - 点击 Login"
    echo "   - 重复一次（第 2 次失败）"
    echo ""
    echo "3. 验证结果:"
    echo "   应该看到: 🛡️ Human Verification Required"
    echo "   显示 Turnstile widget"
    echo ""
    echo "4. 完成验证:"
    echo "   - 完成 Turnstile 验证"
    echo "   - 输入正确凭证"
    echo "   - 成功登录 ✅"
    echo ""
    
    read -p "是否打开登录页面进行测试? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v open &> /dev/null; then
            open "https://imageaigo.cc/login"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "https://imageaigo.cc/login"
        else
            echo "请手动访问: https://imageaigo.cc/login"
        fi
    fi
    
    echo ""
    echo "💡 提示："
    echo "- 浏览器控制台查看错误"
    echo "- 运行 wrangler tail 查看后端日志"
    echo "- 成功时应看到: [Turnstile] Verification successful"
}

# 配置向导
setup_wizard() {
    echo "🎨 Turnstile 配置向导"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    echo "📖 Cloudflare Turnstile 是什么？"
    echo "  - 免费的人机验证服务"
    echo "  - 比 reCAPTCHA 更友好"
    echo "  - 保护登录免受暴力破解"
    echo ""
    
    echo "📝 步骤 1/3: 获取 Turnstile 密钥"
    echo "1. 访问: https://dash.cloudflare.com/?to=/:account/turnstile"
    echo "2. 点击 'Add Site'"
    echo "3. 域名: imageaigo.cc"
    echo "4. Widget Mode: Managed"
    echo "5. 获取 Site Key 和 Secret Key"
    echo ""
    read -p "已获取密钥? 按回车继续..."
    echo ""
    
    echo "📝 步骤 2/3: 配置站点密钥"
    read -p "请输入 Site Key: " SITE_KEY
    if [ ! -z "$SITE_KEY" ]; then
        CURRENT_KEY=$(grep "sitekey:" src/user-pages.js | head -1 | sed "s/.*sitekey: '\(.*\)'.*/\1/")
        sed -i.bak "s|sitekey: '$CURRENT_KEY'|sitekey: '$SITE_KEY'|g" src/user-pages.js
        rm -f src/user-pages.js.bak
        echo -e "${GREEN}✅ Site Key 已更新${NC}"
    fi
    echo ""
    
    echo "📝 步骤 3/3: 配置密钥"
    echo "请输入 Secret Key:"
    wrangler secret put TURNSTILE_SECRET_KEY
    echo ""
    
    echo -e "${GREEN}✅ 配置完成！${NC}"
    echo ""
    echo "下一步:"
    echo "1. 部署: wrangler deploy"
    echo "2. 测试: ./turnstile.sh test"
}

# 显示帮助
show_help() {
    echo "Cloudflare Turnstile 管理脚本"
    echo ""
    echo "用法:"
    echo "  ./turnstile.sh [命令]"
    echo ""
    echo "命令:"
    echo "  check   - 检查配置状态"
    echo "  update  - 更新站点密钥"
    echo "  test    - 测试验证功能"
    echo "  setup   - 配置向导（首次使用）"
    echo "  help    - 显示帮助"
    echo ""
    echo "示例:"
    echo "  ./turnstile.sh check   # 检查配置"
    echo "  ./turnstile.sh update  # 更新密钥"
    echo "  ./turnstile.sh test    # 测试功能"
}

# 主函数
main() {
    case "${1:-}" in
        check)
            check_config
            ;;
        update)
            update_sitekey
            ;;
        test)
            test_turnstile
            ;;
        setup)
            setup_wizard
            ;;
        help|--help|-h)
            show_help
            ;;
        "")
            # 无参数时显示菜单
            echo "🛡️ Cloudflare Turnstile 管理"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "请选择操作:"
            echo "1) 检查配置状态"
            echo "2) 更新站点密钥"
            echo "3) 测试验证功能"
            echo "4) 配置向导（首次使用）"
            echo "5) 退出"
            echo ""
            read -p "请输入选项 (1-5): " choice
            
            case $choice in
                1) check_config ;;
                2) update_sitekey ;;
                3) test_turnstile ;;
                4) setup_wizard ;;
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

