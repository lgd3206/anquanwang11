# 部署指南

## 本地开发

### 1. 安装依赖
```bash
cd safety-resources
npm install
```

### 2. 配置环境变量
创建 `.env.local` 文件：
```env
# Database
POSTGRES_PRISMA_URL=postgresql://user:password@localhost:5432/safety_resources
POSTGRES_URL_NON_POOLING=postgresql://user:password@localhost:5432/safety_resources

# NextAuth
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Payment (可选)
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

---

## Vercel 部署

### 1. 推送代码到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/safety-resources.git
git push -u origin main
```

### 2. 在 Vercel 中创建项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择 GitHub 仓库
4. 选择 "safety-resources" 项目
5. 点击 "Import"

### 3. 配置环境变量

在 Vercel 项目设置中，添加以下环境变量：

```
POSTGRES_PRISMA_URL=your_vercel_postgres_url
POSTGRES_URL_NON_POOLING=your_vercel_postgres_url
NEXTAUTH_SECRET=your-random-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret
ALIPAY_APPID=your_alipay_appid
ALIPAY_PRIVATE_KEY=your_alipay_private_key
NEXT_PUBLIC_APP_NAME=安全资源分享网
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 4. 配置 PostgreSQL 数据库

#### 使用 Vercel Postgres

1. 在 Vercel 项目中，点击 "Storage"
2. 点击 "Create Database"
3. 选择 "Postgres"
4. 按照提示完成设置
5. 复制连接字符串到环境变量

#### 或使用其他 PostgreSQL 服务

- **Railway**: https://railway.app
- **Supabase**: https://supabase.com
- **Neon**: https://neon.tech
- **AWS RDS**: https://aws.amazon.com/rds

### 5. 运行数据库迁移

在 Vercel 部署后，需要运行数据库迁移：

```bash
# 本地运行（连接到 Vercel 数据库）
npm run prisma:migrate

# 或在 Vercel 中运行
vercel env pull
npm run prisma:migrate
```

### 6. 部署

Vercel 会自动部署你的代码。部署完成后，你会获得一个 URL。

---

## 自定义域名

### 1. 在 Vercel 中添加域名

1. 在 Vercel 项目设置中，点击 "Domains"
2. 输入你的域名
3. 按照提示配置 DNS 记录

### 2. 配置 DNS

根据你的域名提供商，添加以下 DNS 记录：

**CNAME 记录：**
```
Name: www
Value: cname.vercel-dns.com
```

**A 记录（可选）：**
```
Name: @
Value: 76.76.19.132
```

### 3. 更新环境变量

更新 `NEXTAUTH_URL` 为你的自定义域名：
```
NEXTAUTH_URL=https://your-domain.com
```

---

## 支付集成

### 微信支付

1. 申请微信商户号：https://pay.weixin.qq.com
2. 获取 AppID 和 Secret
3. 在 Vercel 环境变量中配置
4. 在 `/api/payments/initiate` 中实现微信 API 调用

### 支付宝

1. 申请支付宝商户号：https://open.alipay.com
2. 获取 AppID 和私钥
3. 在 Vercel 环境变量中配置
4. 在 `/api/payments/initiate` 中实现支付宝 API 调用

---

## 监控和维护

### 日志查询

在 Vercel 中查看实时日志：
```bash
vercel logs
```

### 数据库管理

使用 Prisma Studio 管理数据库：
```bash
npm run prisma:studio
```

### 性能监控

- 使用 Vercel Analytics 监控性能
- 使用 Vercel Web Analytics 跟踪用户行为

---

## 故障排除

### 数据库连接错误

**问题：** `Error: connect ECONNREFUSED`

**解决：**
1. 检查数据库 URL 是否正确
2. 确保数据库服务正在运行
3. 检查防火墙设置

### 支付回调失败

**问题：** 支付成功但积分未到账

**解决：**
1. 检查支付回调 URL 是否正确配置
2. 查看 Vercel 日志中的错误信息
3. 确保支付提供商的 IP 白名单包含 Vercel 服务器

### 资源导入失败

**问题：** 导入资源时出错

**解决：**
1. 检查资源格式是否正确
2. 查看导入日志中的错误信息
3. 确保数据库连接正常

---

## 性能优化

### 1. 启用缓存

在 `next.config.ts` 中配置缓存：
```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  headers: async () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=120',
          },
        ],
      },
    ];
  },
};
```

### 2. 数据库查询优化

- 使用 Prisma 的 `select` 只查询需要的字段
- 使用 `include` 进行关联查询
- 添加适当的数据库索引

### 3. 前端优化

- 使用 Next.js 的图片优化
- 启用代码分割
- 使用 CDN 加速静态资源

---

## 安全建议

### 1. 环境变量安全

- 不要在代码中硬编码敏感信息
- 使用 Vercel 的环境变量管理
- 定期轮换密钥

### 2. 数据库安全

- 使用强密码
- 启用 SSL 连接
- 定期备份数据库
- 限制数据库访问 IP

### 3. API 安全

- 实现速率限制
- 验证所有输入
- 使用 HTTPS
- 实现 CORS 策略

### 4. 支付安全

- 不要在客户端存储支付密钥
- 验证支付回调签名
- 使用 HTTPS 传输敏感数据
- 定期审计支付日志

---

## 备份和恢复

### 数据库备份

```bash
# 导出数据库
pg_dump -U user -h host -d database > backup.sql

# 导入数据库
psql -U user -h host -d database < backup.sql
```

### 代码备份

使用 GitHub 作为代码备份：
```bash
git push origin main
```

---

## 常见问题

**Q: 如何更改充值套餐？**
A: 编辑 `/app/recharge/page.tsx` 中的 `packages` 数组

**Q: 如何修改资源消费点数？**
A: 在数据库中修改 `categories` 表的 `pointsCost` 字段

**Q: 如何添加新的资源分类？**
A: 使用 `/admin/import` 页面或直接调用 `POST /api/categories` API

**Q: 支付失败怎么办？**
A: 检查支付提供商的配置，查看 Vercel 日志中的错误信息

---

## 联系支持

如有问题，请：
1. 查看 Vercel 文档：https://vercel.com/docs
2. 查看 Next.js 文档：https://nextjs.org/docs
3. 查看 Prisma 文档：https://www.prisma.io/docs
