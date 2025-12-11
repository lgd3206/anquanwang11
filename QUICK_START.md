# 快速开始指南

## 📋 前置要求

- Node.js 18+
- npm 或 yarn
- GitHub 账号
- Vercel 账号（免费）

---

## 🚀 5 分钟快速开始

### 步骤 1：克隆或下载项目

```bash
# 如果已有项目文件，跳过此步
cd safety-resources
```

### 步骤 2：安装依赖

```bash
npm install
```

### 步骤 3：创建 Vercel Postgres 数据库

#### 3.1 访问 Vercel 控制面板
- 打开 https://vercel.com/dashboard
- 使用 GitHub 账号登录

#### 3.2 创建数据库
1. 点击 "New Project"
2. 选择 "Import Git Repository"
3. 选择 `safety-resources` 仓库
4. 点击 "Import"

#### 3.3 创建 Postgres 数据库
1. 在项目页面，点击 "Storage" 标签
2. 点击 "Create Database"
3. 选择 "Postgres"
4. 选择地区（推荐选择离你最近的）
5. 数据库名称：`safety_resources`
6. 点击 "Create"

#### 3.4 获取连接字符串
1. 在 Storage 页面找到你的 Postgres 数据库
2. 点击数据库卡片
3. 点击 ".env.local" 标签
4. 复制所有环境变量

### 步骤 4：配置环境变量

#### 4.1 创建 .env.local 文件

在项目根目录创建 `.env.local` 文件：

```env
# 从 Vercel 复制的数据库连接字符串
POSTGRES_PRISMA_URL=postgresql://user:password@host:5432/safety_resources?schema=public
POSTGRES_URL_NON_POOLING=postgresql://user:password@host:5432/safety_resources?schema=public

# NextAuth 配置
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# 支付配置（暂时留空）
WECHAT_APPID=
WECHAT_SECRET=
ALIPAY_APPID=
ALIPAY_PRIVATE_KEY=

# 应用配置
NEXT_PUBLIC_APP_NAME=安全资源分享网
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 4.2 生成 NEXTAUTH_SECRET

运行以下命令生成安全密钥：

```bash
openssl rand -base64 32
```

或访问 https://generate-secret.vercel.app/32 生成

将生成的密钥复制到 `NEXTAUTH_SECRET`

### 步骤 5：初始化数据库

#### 5.1 生成 Prisma 客户端

```bash
npm run prisma:generate
```

#### 5.2 运行数据库迁移

```bash
npm run prisma:migrate
```

系统会提示输入迁移名称，输入 `init` 然后按 Enter

```
? Enter a name for this migration: › init
```

等待迁移完成，你会看到：
```
✔ Generated Prisma Client
✔ Created migration folder(s)
✔ Ran all pending migrations
```

### 步骤 6：启动开发服务器

```bash
npm run dev
```

你会看到：
```
> next dev

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
```

### 步骤 7：测试应用

1. 打开浏览器访问 http://localhost:3000
2. 点击 "免费注册"
3. 填写邮箱、密码、用户名
4. 点击 "注册"
5. 如果成功注册并跳转到登录页，说明数据库配置成功！

---

## ✅ 验证数据库配置

### 方法 1：使用 Prisma Studio

```bash
npm run prisma:studio
```

这会在浏览器中打开 Prisma Studio（通常是 http://localhost:5555）

检查以下表是否存在：
- ✅ users
- ✅ categories
- ✅ resources
- ✅ downloads
- ✅ payments
- ✅ import_logs

### 方法 2：测试应用功能

1. **注册账户** - 测试用户认证
2. **导入资源** - 访问 http://localhost:3000/admin/import
3. **浏览资源** - 访问 http://localhost:3000/resources
4. **查看个人中心** - 访问 http://localhost:3000/dashboard

---

## 🎯 常见问题

### Q: 连接字符串在哪里找？

A: 在 Vercel 控制面板：
1. 选择你的项目
2. 点击 "Storage" 标签
3. 找到 Postgres 数据库
4. 点击数据库卡片
5. 点击 ".env.local" 标签
6. 复制连接字符串

### Q: 数据库连接失败怎么办？

A: 检查以下几点：
1. 连接字符串是否正确复制
2. 网络连接是否正常
3. 防火墙是否阻止了连接
4. 数据库是否已创建完成

### Q: 如何重置数据库？

A:
1. 在 Vercel Storage 页面找到数据库
2. 点击三点菜单
3. 选择 "Delete"
4. 重新创建数据库

### Q: 如何查看数据库中的数据？

A: 使用 Prisma Studio：
```bash
npm run prisma:studio
```

### Q: 支付功能如何配置？

A: 支付功能框架已实现，需要：
1. 申请微信商户号或支付宝商户号
2. 获取 AppID 和密钥
3. 在 `.env.local` 中配置
4. 在 API 中集成真实支付 SDK

详见 `DEPLOYMENT.md` 中的支付集成部分

---

## 📚 下一步

### 本地开发
- ✅ 数据库已配置
- 开始开发新功能
- 测试所有功能

### 部署到 Vercel
1. 推送代码到 GitHub
2. Vercel 自动部署
3. 配置自定义域名
4. 上线运营

### 集成支付
1. 申请支付商户号
2. 配置支付 API
3. 测试支付流程
4. 上线支付功能

---

## 🔧 有用的命令

```bash
# 启动开发服务器
npm run dev

# 生成 Prisma 客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 打开 Prisma Studio
npm run prisma:studio

# 构建项目
npm run build

# 启动生产服务器
npm start

# 运行 ESLint
npm run lint
```

---

## 📞 需要帮助？

查看以下文档：
- `README.md` - 项目说明
- `DATABASE_SETUP.md` - 详细的数据库配置指南
- `FEATURES.md` - 功能清单
- `DEPLOYMENT.md` - 部署指南

---

## 🎉 恭喜！

你已经成功配置了数据库！现在可以：
1. 开始开发新功能
2. 测试应用的所有功能
3. 部署到 Vercel
4. 邀请用户使用

祝你使用愉快！🚀
