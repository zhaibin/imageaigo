#!/bin/bash

# ImageAI Go 管理后台快速设置脚本
# 使用方法: ./setup-admin.sh

echo "🎨 ImageAI Go 管理后台设置向导"
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

# 设置管理员密码
echo "📝 步骤 1: 设置管理员密码"
echo "请输入一个强密码（包含大小写字母、数字和特殊字符）"
echo "---"
wrangler secret put ADMIN_PASSWORD
echo ""

# 设置密钥
echo "📝 步骤 2: 设置 Token 签名密钥"
echo "建议使用随机字符串（至少32位）"
echo "提示: 可以使用以下命令生成随机密钥:"
echo "  openssl rand -base64 32"
echo "  或直接输入自定义密钥"
echo "---"
wrangler secret put ADMIN_SECRET
echo ""

# 确认部署
echo "🚀 步骤 3: 部署到 Cloudflare Workers"
read -p "是否现在部署？(y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "正在部署..."
    wrangler deploy
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ 部署成功！"
        echo ""
        echo "📍 管理后台地址:"
        echo "   https://your-worker.your-subdomain.workers.dev/admin/login"
        echo ""
        echo "📚 使用文档:"
        echo "   - 快速入门: ./ADMIN_QUICKSTART.md"
        echo "   - 详细文档: ./ADMIN_README.md"
        echo "   - 部署指南: ./DEPLOYMENT.md"
        echo ""
        echo "🎉 开始使用吧！"
    else
        echo ""
        echo "❌ 部署失败，请检查错误信息"
        exit 1
    fi
else
    echo ""
    echo "⏸️  已跳过部署"
    echo "稍后可以运行: wrangler deploy"
fi

echo ""
echo "=================================="
echo "设置完成！"

