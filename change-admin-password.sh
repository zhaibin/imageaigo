#!/bin/bash

# ImageAI Go 管理后台密码修改脚本
# 使用方法: ./change-admin-password.sh

echo "🔐 ImageAI Go 管理后台密码修改"
echo "=================================="
echo ""

# 检查 wrangler 是否安装
if ! command -v wrangler &> /dev/null; then
    echo "❌ 错误: wrangler 未安装"
    echo "请先安装: npm install -g wrangler"
    exit 1
fi

echo "✅ wrangler 已安装"
echo ""

# 显示当前配置的密钥
echo "📋 当前已配置的密钥:"
wrangler secret list
echo ""

# 询问要修改什么
echo "请选择要修改的密钥:"
echo "1) ADMIN_PASSWORD (管理员登录密码)"
echo "2) ADMIN_SECRET (Token 签名密钥)"
echo "3) 同时修改两个"
echo "4) 退出"
echo ""
read -p "请输入选项 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📝 修改管理员密码"
        echo "建议: 至少12位，包含大小写字母、数字和特殊字符"
        echo "---"
        wrangler secret put ADMIN_PASSWORD
        ;;
    2)
        echo ""
        echo "📝 修改 Token 签名密钥"
        echo "建议: 使用随机生成的32位字符串"
        echo "生成随机密钥: openssl rand -base64 32"
        echo "---"
        wrangler secret put ADMIN_SECRET
        ;;
    3)
        echo ""
        echo "📝 修改管理员密码"
        wrangler secret put ADMIN_PASSWORD
        echo ""
        echo "📝 修改 Token 签名密钥"
        wrangler secret put ADMIN_SECRET
        ;;
    4)
        echo "已取消"
        exit 0
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "✅ 密钥已更新！"
echo ""

# 询问是否立即部署
read -p "是否立即部署以应用更改？(y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 正在部署..."
    wrangler deploy
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ 部署成功！"
        echo ""
        echo "⚠️  重要提示:"
        echo "   - 如果修改了 ADMIN_SECRET，所有已登录的会话将失效"
        echo "   - 请使用新密码重新登录管理后台"
        echo ""
        echo "📍 管理后台地址:"
        echo "   https://your-worker.workers.dev/admin/login"
    else
        echo ""
        echo "❌ 部署失败，请检查错误信息"
        exit 1
    fi
else
    echo ""
    echo "⏸️  已跳过部署"
    echo "稍后请手动运行: wrangler deploy"
fi

echo ""
echo "=================================="
echo "修改完成！"

