#!/bin/bash

# 更新 Turnstile Site Key 的脚本

echo "🔑 Turnstile Site Key 更新工具"
echo ""
echo "当前站点密钥: 0x4AAAAAAAzX8PJx0lF_CDHO"
echo ""
read -p "请输入你的新站点密钥（或直接回车保持当前值）: " NEW_SITEKEY

if [ -z "$NEW_SITEKEY" ]; then
    echo "✅ 保持当前站点密钥不变"
    exit 0
fi

echo ""
echo "准备将站点密钥更新为: $NEW_SITEKEY"
read -p "确认更新? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "❌ 取消更新"
    exit 0
fi

# 更新 src/user-pages.js
echo "📝 更新 src/user-pages.js..."
sed -i.bak "s/sitekey: '0x4AAAAAAAzX8PJx0lF_CDHO'/sitekey: '$NEW_SITEKEY'/g" src/user-pages.js

if [ $? -eq 0 ]; then
    echo "✅ 站点密钥已更新"
    echo ""
    echo "下一步："
    echo "1. 部署更新: wrangler deploy"
    echo "2. 测试功能: https://imageaigo.cc/login"
    rm -f src/user-pages.js.bak
else
    echo "❌ 更新失败"
    mv src/user-pages.js.bak src/user-pages.js
fi

