@echo off
REM 安全资源分享网 - 数据库配置脚本 (Windows)

echo ================================
echo 安全资源分享网 - 数据库配置
echo ================================
echo.

REM 检查 .env.local 文件
if not exist .env.local (
    echo ❌ 错误：.env.local 文件不存在
    echo 请先创建 .env.local 文件
    pause
    exit /b 1
)

echo ✅ 检测到 .env.local 文件
echo.

REM 检查数据库连接字符串
findstr /M "POSTGRES_PRISMA_URL" .env.local >nul
if errorlevel 1 (
    echo ❌ 错误：未找到 POSTGRES_PRISMA_URL
    echo 请在 .env.local 中添加数据库连接字符串
    pause
    exit /b 1
)

echo ✅ 检测到 POSTGRES_PRISMA_URL
echo.

echo 开始数据库配置...
echo.

REM 生成 Prisma 客户端
echo 1️⃣  生成 Prisma 客户端...
call npm run prisma:generate

if errorlevel 1 (
    echo ❌ Prisma 客户端生成失败
    pause
    exit /b 1
)

echo ✅ Prisma 客户端生成成功
echo.

REM 运行数据库迁移
echo 2️⃣  运行数据库迁移...
call npm run prisma:migrate

if errorlevel 1 (
    echo ❌ 数据库迁移失败
    pause
    exit /b 1
)

echo ✅ 数据库迁移成功
echo.

REM 验证数据库连接
echo 3️⃣  验证数据库连接...
echo 打开 Prisma Studio 进行验证...
echo.
echo 提示：Prisma Studio 将在浏览器中打开
echo 请检查以下表是否存在：
echo   - users
echo   - categories
echo   - resources
echo   - downloads
echo   - payments
echo   - import_logs
echo.

REM 可选：打开 Prisma Studio
set /p OPEN_STUDIO="是否打开 Prisma Studio 进行验证？(y/n): "
if /i "%OPEN_STUDIO%"=="y" (
    call npm run prisma:studio
)

echo.
echo ================================
echo ✅ 数据库配置完成！
echo ================================
echo.
echo 下一步：
echo 1. 运行 'npm run dev' 启动开发服务器
echo 2. 访问 http://localhost:3000
echo 3. 测试注册和登录功能
echo.
pause
