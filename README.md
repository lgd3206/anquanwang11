# 安全资源分享网

一个专业的安全资源分享平台，支持资源分类、用户认证、积分系统和支付功能。

n> **部署测试**: Git 配置已修复（329938313@qq.com），测试 Vercel 自动部署触发
## 功能特性

- ✅ 用户注册/登录（邮箱认证）
- ✅ 资源分类管理（安全课件、事故报告、标准规范等）
- ✅ 智能资源导入（文本粘贴、CSV导入）
- ✅ 自动解析网盘链接和提取码
- ✅ 资源搜索和筛选
- ✅ 积分系统（注册赠送100点）
- ✅ 下载记录统计
- ✅ **Ping++ 支付集成** (微信/支付宝支付) - 已完成！
- 🔄 后台管理系统（开发中）

## 技术栈

- **前端**: React 19 + Next.js 16 (App Router)
- **后端**: Next.js API Routes (Serverless)
- **数据库**: PostgreSQL (Neon)
- **ORM**: Prisma v5
- **认证**: JWT + bcryptjs
- **样式**: Tailwind CSS v4
- **支付**: Ping++ 聚合支付 API
- **部署**: Vercel

## 🚀 支付系统 (新功能)

本项目现已集成 **Ping++ 聚合支付**，支持：

### 支持的支付方式
- ✅ 微信支付（扫码支付）
- ✅ 支付宝（扫码支付）
- ✅ 银行卡支付（可选）

### 关键特性
- **智能降级**: 无凭证时自动使用模拟二维码（开发友好）
- **生产就绪**: 完整的 Webhook 处理和幂等性控制
- **安全可靠**: HMAC-SHA256 签名验证、JWT 认证
- **易于扩展**: 模块化设计，支持添加更多支付方式

### 快速开始支付功能

```bash
# 1. 本地开发（无需配置）
npm run dev
# 访问 http://localhost:3000/recharge 使用模拟二维码

# 2. 生产部署（获得凭证后）
# 在 Vercel 添加环境变量
PING_APP_ID=sk_live_xxx
PING_API_KEY=sk_live_xxx
PING_WEBHOOK_KEY=whsec_xxx
```

详见 [PINGPP_SETUP_GUIDE.md](./PINGPP_SETUP_GUIDE.md) 和 [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)

## 文档导航

| 文档 | 说明 |
|------|------|
| [PINGPP_SETUP_GUIDE.md](./PINGPP_SETUP_GUIDE.md) | Ping++ 快速开始和常见问题 |
| [PINGPP_INTEGRATION.md](./PINGPP_INTEGRATION.md) | 完整的集成指南 |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | 生产部署检查清单 |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | 实现总结报告 |
| [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) | 系统架构概览 |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# Database
DATABASE_URL=your_neon_database_url

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Ping++ Payment Gateway (可选，本地开发无需配置)
PING_APP_ID=
PING_API_KEY=
PING_WEBHOOK_KEY=

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
│   ├── api/                           # API 路由
│   │   ├── auth/                      # 认证相关
│   │   │   ├── login/route.ts
│   │   │   └── register/route.ts
│   │   ├── resources/                 # 资源相关
│   │   │   └── [id]/route.ts
│   │   ├── categories/                # 分类相关
│   │   │   └── route.ts
│   │   └── payments/                  # 🆕 支付相关
│   │       ├── initiate/route.ts      # 支付初始化
│   │       ├── callback/route.ts      # Webhook 回调
│   │       └── status/[paymentId]/    # 状态查询
│   ├── resources/                     # 资源浏览页面
│   ├── recharge/                      # 积分充值页面
│   ├── login/                         # 登录页面
│   ├── register/                      # 注册页面
│   ├── layout.tsx                     # 根布局
│   ├── page.tsx                       # 首页
│   └── globals.css                    # 全局样式
├── lib/
│   ├── auth.ts                        # 认证工具
│   └── pingpp.ts                      # 🆕 Ping++ API 客户端
├── prisma/
│   └── schema.prisma                  # 数据库 schema
├── scripts/
│   ├── init-data.ts                   # 数据初始化脚本
│   └── init-data.sql                  # SQL 初始化数据
├── PINGPP_*.md                        # 🆕 支付文档
└── package.json                       # 项目依赖
```

## 数据库设计

### 用户表 (users)
```
- id: 用户ID
- email: 邮箱（唯一）
- password: 密码哈希
- points: 积分余额
- createdAt: 创建时间
- updatedAt: 更新时间
```

### 支付表 (payments) 🆕
```
- id: 支付ID
- userId: 用户ID
- amount: 金额（元）
- pointsAdded: 增加的点数
- paymentMethod: 支付方式 (wechat/alipay)
- status: 支付状态 (pending/completed/failed/refunded)
- transactionId: 交易ID (Ping++ charge ID)
- createdAt: 创建时间
- updatedAt: 更新时间
```

### 其他表
```
- categories: 分类表
- resources: 资源表
- downloads: 下载记录表
```

## 支付系统 API

### 初始化支付
```
POST /api/payments/initiate
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "points": 500,
  "amount": 5.00,
  "paymentMethod": "wechat"
}
```

### 查询支付状态
```
GET /api/payments/status/{paymentId}
```

### Webhook 回调（来自 Ping++）
```
POST /api/payments/callback
X-Pingplusplus-Signature: {signature}

{
  "type": "charge.succeeded|charge.failed|refund.succeeded",
  "data": { ... }
}
```

## 部署到 Vercel

### 1. 推送代码到 GitHub
```bash
git push origin main
```

### 2. 在 Vercel 中导入项目
- 访问 https://vercel.com
- 连接 GitHub 仓库
- 选择项目根目录

### 3. 配置环境变量
```
DATABASE_URL=your_neon_database_url
PING_APP_ID=sk_live_xxx
PING_API_KEY=sk_live_xxx
PING_WEBHOOK_KEY=whsec_xxx
```

### 4. 部署
- 自动部署：推送到 main 分支
- 手动部署：在 Vercel 控制台点击 "Redeploy"

## 常见命令

```bash
# 开发服务器
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start

# 数据库迁移
npm run prisma:migrate

# Prisma Studio（数据库可视化）
npm run prisma:studio

# 初始化示例数据
npm run db:setup
```

## 支付集成步骤

### 第 1 步：获取 Ping++ 凭证
1. 注册 Ping++ 账户
2. 完成企业认证
3. 获取 API Key 和 Webhook Key

### 第 2 步：配置环境
1. 更新 Vercel 环境变量
2. 配置 Webhook URL

### 第 3 步：测试
1. 使用测试凭证进行支付测试
2. 验证 Webhook 回调

详见 [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)

## 免责声明

本网站仅为资源分享交流学习平台，所有资源均来自用户分享。用户应自行判断资源的合法性和真实性。本网站不对资源内容的准确性、完整性、合法性负责。付费仅为维持网站日常服务器等正常费用。用户使用本网站资源产生的任何后果，本网站不承担任何责任。

## 许可证

ISC
