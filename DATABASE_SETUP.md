# Vercel Postgres 数据库配置指南

## 第一步：创建 Vercel 项目

### 1.1 访问 Vercel 控制面板
- 访问 https://vercel.com/dashboard
- 使用 GitHub 账号登录

### 1.2 创建新项目
1. 点击 "New Project"
2. 选择 "Import Git Repository"
3. 选择你的 GitHub 仓库（safety-resources）
4. 点击 "Import"

---

## 第二步：创建 PostgreSQL 数据库

### 2.1 在 Vercel 中创建数据库

1. 在项目页面，点击 "Storage" 标签
2. 点击 "Create Database"
3. 选择 "Postgres"
4. 选择地区（建议选择离你最近的地区）
5. 输入数据库名称：`safety_resources`
6. 点击 "Create"

### 2.2 等待数据库创建完成

创建过程通常需要 1-2 分钟。完成后，你会看到数据库连接信息。

---

## 第三步：获取数据库连接字符串

### 3.1 查看连接信息

1. 在 Storage 页面，找到你创建的 Postgres 数据库
2. 点击数据库卡片
3. 点击 ".env.local" 标签
4. 你会看到以下环境变量：

```
POSTGRES_PRISMA_URL=postgresql://user:password@host:5432/safety_resources?schema=public
POSTGRES_URL_NON_POOLING=postgresql://user:password@host:5432/safety_resources?schema=public
```

### 3.2 复制连接字符串

- 点击 "Copy" 按钮复制所有环境变量
- 或者分别复制两个 URL

---

## 第四步：配置本地环境变量

### 4.1 更新 .env.local 文件

在项目根目录的 `.env.local` 文件中，更新以下内容：

```env
# Database - 从 Vercel 复制
POSTGRES_PRISMA_URL=postgresql://user:password@host:5432/safety_resources?schema=public
POSTGRES_URL_NON_POOLING=postgresql://user:password@host:5432/safety_resources?schema=public

# NextAuth
NEXTAUTH_SECRET=your-random-secret-key-here-change-this
NEXTAUTH_URL=http://localhost:3000

# Payment (可选，暂时留空)
WECHAT_APPID=
WECHAT_SECRET=
ALIPAY_APPID=
ALIPAY_PRIVATE_KEY=

# App
NEXT_PUBLIC_APP_NAME=安全资源分享网
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4.2 生成 NEXTAUTH_SECRET

运行以下命令生成安全的密钥：

```bash
openssl rand -base64 32
```

或者使用在线工具：https://generate-secret.vercel.app/32

将生成的密钥复制到 `NEXTAUTH_SECRET`

---

## 第五步：初始化数据库

### 5.1 生成 Prisma 客户端

```bash
npm run prisma:generate
```

### 5.2 运行数据库迁移

```bash
npm run prisma:migrate
```

系统会提示：
```
? Enter a name for this migration: ›
```

输入迁移名称，例如：`init`

```bash
npm run prisma:migrate
? Enter a name for this migration: › init
```

### 5.3 等待迁移完成

迁移过程会：
1. 创建所有数据库表
2. 设置表关系
3. 创建索引

完成后，你会看到：
```
✔ Generated Prisma Client (X.X.X) to ./node_modules/@prisma/client in XXms
✔ Created migration folder(s), and migration_lock.toml. Read more about Prisma Migrate at https://pris.ly/d/migrate
✔ Ran all pending migrations, and created the database schema. All good!
```

---

## 第六步：验证数据库连接

### 6.1 打开 Prisma Studio

```bash
npm run prisma:studio
```

这会在浏览器中打开 Prisma Studio（通常是 http://localhost:5555）

### 6.2 检查数据库表

在 Prisma Studio 中，你应该看到以下表：
- ✅ users
- ✅ categories
- ✅ resources
- ✅ downloads
- ✅ payments
- ✅ import_logs

如果所有表都存在，说明数据库配置成功！

---

## 第七步：启动开发服务器

### 7.1 运行开发服务器

```bash
npm run dev
```

### 7.2 测试应用

1. 访问 http://localhost:3000
2. 点击 "免费注册"
3. 创建一个测试账户
4. 验证注册成功

如果能成功注册，说明数据库连接正常！

---

## 第八步：配置 Vercel 环境变量

### 8.1 在 Vercel 中添加环境变量

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. 点击 "Settings"
4. 点击 "Environment Variables"
5. 添加以下环境变量：

```
POSTGRES_PRISMA_URL = postgresql://user:password@host:5432/safety_resources?schema=public
POSTGRES_URL_NON_POOLING = postgresql://user:password@host:5432/safety_resources?schema=public
NEXTAUTH_SECRET = your-random-secret-key
NEXTAUTH_URL = https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME = 安全资源分享网
NEXT_PUBLIC_APP_URL = https://your-domain.vercel.app
```

### 8.2 保存环境变量

点击 "Save" 按钮

---

## 第九步：部署到 Vercel

### 9.1 推送代码到 GitHub

```bash
git add .
git commit -m "Configure database"
git push origin main
```

### 9.2 Vercel 自动部署

Vercel 会自动检测到代码更新，并开始部署。

### 9.3 等待部署完成

在 Vercel 控制面板中，你会看到部署进度。完成后，你会获得一个 URL。

---

## 数据库表详解

### users 表
存储用户信息和积分

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  points INT DEFAULT 100,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### categories 表
存储资源分类

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  pointsCost INT DEFAULT 10,
  description TEXT
);
```

### resources 表
存储资源信息

```sql
CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  categoryId INT REFERENCES categories(id),
  description TEXT,
  mainLink VARCHAR(500) NOT NULL,
  password VARCHAR(50),
  backupLink1 VARCHAR(500),
  backupLink2 VARCHAR(500),
  source VARCHAR(50),
  pointsCost INT DEFAULT 10,
  downloads INT DEFAULT 0,
  isNew BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### downloads 表
存储下载记录

```sql
CREATE TABLE downloads (
  id SERIAL PRIMARY KEY,
  userId INT REFERENCES users(id),
  resourceId INT REFERENCES resources(id),
  pointsSpent INT,
  downloadedAt TIMESTAMP DEFAULT NOW()
);
```

### payments 表
存储支付记录

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  userId INT REFERENCES users(id),
  amount FLOAT,
  pointsAdded INT,
  paymentMethod VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  transactionId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### import_logs 表
存储导入日志

```sql
CREATE TABLE import_logs (
  id SERIAL PRIMARY KEY,
  totalCount INT,
  successCount INT,
  failedCount INT,
  importData JSONB,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## 常见问题

### Q: 连接字符串在哪里找？
A: 在 Vercel Storage 页面，点击你的 Postgres 数据库，然后点击 ".env.local" 标签

### Q: 如何重置数据库？
A: 在 Vercel Storage 页面，点击数据库的三点菜单，选择 "Delete"，然后重新创建

### Q: 如何备份数据库？
A: 使用 `pg_dump` 命令：
```bash
pg_dump -U user -h host -d database > backup.sql
```

### Q: 如何导入数据库备份？
A: 使用 `psql` 命令：
```bash
psql -U user -h host -d database < backup.sql
```

### Q: 数据库连接超时怎么办？
A:
1. 检查网络连接
2. 检查防火墙设置
3. 检查连接字符串是否正确
4. 尝试重新生成连接字符串

### Q: 如何查看数据库中的数据？
A: 使用 Prisma Studio：
```bash
npm run prisma:studio
```

---

## 下一步

数据库配置完成后，你可以：

1. **测试应用** - 注册账户，导入资源，测试下载功能
2. **配置支付** - 集成微信支付和支付宝
3. **部署上线** - 推送到 Vercel 部署
4. **监控性能** - 使用 Vercel Analytics 监控应用

---

## 支持

如有问题，请查看：
- [Vercel Postgres 文档](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma 文档](https://www.prisma.io/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs)
