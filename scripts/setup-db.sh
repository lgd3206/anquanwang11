#!/bin/bash

# 安全资源分享网 - 数据库配置脚本

echo "================================"
echo "安全资源分享网 - 数据库配置"
echo "================================"
echo ""

# 检查 .env.local 文件
if [ ! -f .env.local ]; then
    echo "❌ 错误：.env.local 文件不存在"
    echo "请先创建 .env.local 文件"
    exit 1
fi

echo "✅ 检测到 .env.local 文件"
echo ""

# 检查数据库连接字符串
if grep -q "POSTGRES_PRISMA_URL" .env.local; then
    echo "✅ 检测到 POSTGRES_PRISMA_URL"
else
    echo "❌ 错误：未找到 POSTGRES_PRISMA_URL"
    echo "请在 .env.local 中添加数据库连接字符串"
    exit 1
fi

echo ""
echo "开始数据库配置..."
echo ""

# 生成 Prisma 客户端
echo "1️⃣  生成 Prisma 客户端..."
npm run prisma:generate

if [ $? -ne 0 ]; then
    echo "❌ Prisma 客户端生成失败"
    exit 1
fi

echo "✅ Prisma 客户端生成成功"
echo ""

# 运行数据库迁移
echo "2️⃣  运行数据库迁移..."
npm run prisma:migrate

if [ $? -ne 0 ]; then
    echo "❌ 数据库迁移失败"
    exit 1
fi

echo "✅ 数据库迁移成功"
echo ""

# 验证数据库连接
echo "3️⃣  验证数据库连接..."
echo "打开 Prisma Studio 进行验证..."
echo ""
echo "提示：Prisma Studio 将在浏览器中打开"
echo "请检查以下表是否存在："
echo "  - users"
echo "  - categories"
echo "  - resources"
echo "  - downloads"
echo "  - payments"
echo "  - import_logs"
echo ""

# 可选：打开 Prisma Studio
read -p "是否打开 Prisma Studio 进行验证？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run prisma:studio
fi

echo ""
echo "================================"
echo "✅ 数据库配置完成！"
echo "================================"
echo ""
echo "下一步："
echo "1. 运行 'npm run dev' 启动开发服务器"
echo "2. 访问 http://localhost:3000"
echo "3. 测试注册和登录功能"
echo ""
