#!/bin/bash

# 用户认证系统数据库迁移脚本

echo "==================================="
echo "ImageAI Go 用户认证系统数据库迁移"
echo "==================================="
echo ""

# 检查是否有 wrangler.toml
if [ ! -f "wrangler.toml" ]; then
  echo "错误: 未找到 wrangler.toml 文件"
  echo "请确保在项目根目录运行此脚本"
  exit 1
fi

# 提取数据库名称
DB_NAME=$(grep "database_name" wrangler.toml | head -1 | sed 's/.*"\(.*\)".*/\1/')

if [ -z "$DB_NAME" ]; then
  echo "错误: 无法从 wrangler.toml 中提取数据库名称"
  exit 1
fi

echo "数据库名称: $DB_NAME"
echo ""

# 创建迁移 SQL
cat > /tmp/migrate_user_auth.sql << 'EOF'
-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 创建密码重置表
CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reset_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(reset_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
EOF

echo "开始执行数据库迁移..."
echo ""

# 执行迁移
wrangler d1 execute $DB_NAME --file=/tmp/migrate_user_auth.sql --local

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ 本地数据库迁移成功！"
  echo ""
  read -p "是否要迁移远程数据库？(y/n): " -n 1 -r
  echo ""
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "开始远程数据库迁移..."
    wrangler d1 execute $DB_NAME --file=/tmp/migrate_user_auth.sql --remote
    
    if [ $? -eq 0 ]; then
      echo ""
      echo "✓ 远程数据库迁移成功！"
    else
      echo ""
      echo "✗ 远程数据库迁移失败"
      exit 1
    fi
  fi
else
  echo ""
  echo "✗ 本地数据库迁移失败"
  exit 1
fi

# 清理临时文件
rm /tmp/migrate_user_auth.sql

echo ""
echo "==================================="
echo "迁移完成！"
echo ""
echo "下一步："
echo "1. 运行 'npm run dev' 启动本地开发服务器"
echo "2. 访问 http://localhost:8787/register 注册新用户"
echo "3. 访问 http://localhost:8787/login 登录"
echo "4. 登录后才能使用图片分析功能"
echo "==================================="

