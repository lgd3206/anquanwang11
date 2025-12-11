# 安全资源分享网

一个专业的安全资源分享平台，支持资源分类、用户认证、积分系统和支付功能。

## 功能特性

- ✅ 用户注册/登录（邮箱认证）
- ✅ 资源分类管理（安全课件、事故报告、标准规范等）
- ✅ 智能资源导入（文本粘贴、CSV导入）
- ✅ 自动解析网盘链接和提取码
- ✅ 资源搜索和筛选
- ✅ 积分系统（注册赠送100点）
- ✅ 下载记录统计
- 🔄 微信/支付宝支付集成（开发中）
- 🔄 后台管理系统（开发中）

## 技术栈

- **前端**: Next.js 14+ (App Router)
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL (Vercel Postgres)
- **ORM**: Prisma
- **认证**: JWT + bcryptjs
- **样式**: Tailwind CSS
- **部署**: Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# Database
POSTGRES_PRISMA_URL=your_database_url
POSTGRES_URL_NON_POOLING=your_database_url

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Payment
WECHAT_APPID=
WECHAT_SECRET=
ALIPAY_APPID=
ALIPAY_PRIVATE_KEY=

# App
NEXT_PUBLIC_APP_NAME=安全资源分享网
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 初始化数据库

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
safety-resources/
├── app/
│   ├── api/                    # API 路由
│   │   ├── auth/              # 认证相关
│   │   ├── resources/         # 资源相关
│   │   ├── categories/        # 分类相关
│   │   └── payments/          # 支付相关
│   ├── admin/                 # 管理后台
│   │   └── import/            # 资源导入
│   ├── resources/             # 资源浏览页面
│   ├── login/                 # 登录页面
│   ├── register/              # 注册页面
│   ├── layout.tsx             # 根布局
│   ├── page.tsx               # 首页
│   └── globals.css            # 全局样式
├── lib/
│   └── resourceParser.ts      # 资源解析工具
├── prisma/
│   └── schema.prisma          # 数据库 schema
├── public/                    # 静态资源
├── .env.local                 # 环境变量
├── next.config.ts             # Next.js 配置
├── tailwind.config.ts         # Tailwind 配置
├── tsconfig.json              # TypeScript 配置
└── package.json               # 项目依赖
```

## 数据库设计

### 用户表 (users)
- id: 用户ID
- email: 邮箱（唯一）
- password: 密码哈希
- name: 用户名
- points: 积分余额
- createdAt: 创建时间
- updatedAt: 更新时间

### 分类表 (categories)
- id: 分类ID
- name: 分类名称
- pointsCost: 默认消耗点数
- description: 描述

### 资源表 (resources)
- id: 资源ID
- title: 标题
- categoryId: 分类ID
- description: 描述
- mainLink: 主链接
- password: 提取码
- backupLink1/2: 备用链接
- source: 来源（baidu/quark等）
- pointsCost: 消耗点数
- downloads: 下载次数
- isNew: 是否新资源
- createdAt: 创建时间

### 下载记录表 (downloads)
- id: 记录ID
- userId: 用户ID
- resourceId: 资源ID
- pointsSpent: 消耗点数
- downloadedAt: 下载时间

### 支付表 (payments)
- id: 支付ID
- userId: 用户ID
- amount: 金额
- pointsAdded: 增加的点数
- paymentMethod: 支付方式
- status: 支付状态
- transactionId: 交易ID
- createdAt: 创建时间

## 资源导入格式

### 文本格式

```
通过网盘分享的文件：2025消防宣传月消防安全知识培训 2025-11-7 92035 2.pptx
链接: https://pan.baidu.com/s/1AcJvBQg8mLSV07jp-J-XtQ?pwd=5678 提取码: 5678
--来自百度网盘超级会员v5的分享

---

通过网盘分享的文件：事故调查报告.pdf
链接: https://pan.baidu.com/s/1xxx 提取码: 1234
```

### CSV 格式

```csv
标题,分类,链接,提取码
2025消防宣传月,安全课件,https://pan.baidu.com/s/1xxx,5678
事故调查报告,事故调查报告,https://pan.baidu.com/s/1yyy,1234
```

## 分类和点数

| 分类 | 默认点数 | 说明 |
|------|---------|------|
| 安全课件 | 5-10 | 培训资料、讲座 |
| 事故调查报告 | 15-20 | 专业报告 |
| 标准规范 | 20-30 | 行业标准、规程 |
| 事故警示视频 | 10-15 | 视频资料 |
| 安全管理书籍 | 30-50 | 电子书籍 |

## API 端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 资源
- `GET /api/resources` - 获取资源列表
- `POST /api/resources/import` - 导入资源

### 分类
- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建分类

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 中连接 GitHub 仓库
3. 配置环境变量
4. 自动部署

## 免责声明

本网站仅为资源分享交流学习平台，所有资源均来自用户分享。用户应自行判断资源的合法性和真实性。本网站不对资源内容的准确性、完整性、合法性负责。付费仅为维持网站日常服务器等正常费用。用户使用本网站资源产生的任何后果，本网站不承担任何责任。

## 许可证

ISC
