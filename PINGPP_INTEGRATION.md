# Ping++ 支付集成完整指南

## 概述

本文档提供 Ping++ 支付集成的完整步骤。Ping++ 是国内领先的聚合支付平台，支持微信支付、支付宝、银行卡等多种支付方式。

## 第一步：Ping++ 账户配置

### 1.1 注册和认证
1. 访问 [Ping++ 官网](https://www.pingxx.com)
2. 注册企业账户
3. 完成企业资质认证（营业执照、法人身份证等）
4. 获得 Ping++ 账户

### 1.2 获取 API 密钥

认证完成后，在 Ping++ 后台获取：
- **APP ID** - 应用标识
- **API Key** - 服务端 API 密钥（用于后端调用）
- **Test Key** - 沙箱环境测试密钥

### 1.3 配置支付方式

在 Ping++ 后台启用：
- ✅ 微信支付 (WeChat Pay)
- ✅ 支付宝 (Alipay)
- ✅ 银行卡支付 (可选)

## 第二步：环境变量配置

### 2.1 在 `.env.local` 中添加

```env
# Ping++ 支付配置
PING_APP_ID=your_ping_app_id
PING_API_KEY=your_ping_api_key
PING_API_URL=https://api.pingxx.com
PING_WEBHOOK_KEY=your_webhook_key
PING_WEBHOOK_URL=https://yourdomain.com/api/payments/callback

# 支付环境
NODE_ENV=production
```

### 2.2 在 Vercel 中添加环境变量

1. 登录 [Vercel 控制台](https://vercel.com)
2. 进入项目设置 → Environment Variables
3. 添加上述环境变量
4. **重新部署**项目使环境变量生效

## 第三步：实现支付接口

### 3.1 创建 `/api/payments/initiate` 路由

该路由负责初始化支付订单，调用 Ping++ API 创建支付。

**功能流程：**
1. 验证用户身份 (JWT Token)
2. 验证积分和金额参数
3. 创建支付记录 (status: pending)
4. 调用 Ping++ API 创建支付
5. 返回支付二维码 URL 或支付链接

**支持的支付方式：**
- wechat - 微信支付
- alipay - 支付宝

### 3.2 创建 `/api/payments/callback` 路由

该路由处理 Ping++ 的 webhook 回调，验证支付结果并更新数据库。

**功能流程：**
1. 验证 webhook 签名（确保来自 Ping++）
2. 检查支付状态
3. 如果支付成功：
   - 更新支付记录状态为 'completed'
   - 增加用户积分
   - 返回 200 确认
4. 如果支付失败：
   - 更新支付记录状态为 'failed'

### 3.3 创建支付管理工具函数

在 `/lib/pingpp.ts` 中创建：

**函数列表：**
- `createCharge()` - 创建支付订单
- `verifyWebhookSignature()` - 验证 webhook 签名
- `queryPaymentStatus()` - 查询支付状态
- `formatAmount()` - 将人民币转换为分（Ping++ 使用）

## 第四步：前端集成

### 4.1 支付流程

```
用户选择积分包 → 选择支付方式 → 调用 /api/payments/initiate → 显示二维码 → 扫码支付 → 轮询支付状态或等待 webhook → 支付成功，更新积分
```

### 4.2 前端实现

在 `/app/recharge/page.tsx` 中：

1. 显示积分套餐和支付方式选择
2. 调用 `/api/payments/initiate` 获取支付二维码
3. 显示二维码供用户扫码
4. 轮询 `/api/payments/status/{paymentId}` 检查支付状态
5. 支付完成后刷新用户积分

## 第五步：测试

### 5.1 沙箱环境测试

1. 使用 Ping++ 提供的**测试 API Key**
2. 使用测试金额（如 0.01 元）
3. Ping++ 提供测试账号和手机号用于模拟支付

### 5.2 测试流程

```
1. 使用测试 API Key 创建支付订单
2. 使用 Ping++ 测试账号完成支付
3. 验证 webhook 回调
4. 验证数据库积分更新
5. 验证前端显示最新积分
```

### 5.3 调试技巧

- 使用 Ping++ 文档中的[测试数据](https://www.pingxx.com/docs/server#%E6%B5%8B%E8%AF%95%E6%95%B0%E6%8D%AE)
- 在 Ping++ 后台查看实时支付日志
- 使用 Postman 测试 API 端点
- 在服务器日志中检查 webhook 接收

## 第六步：部署到生产环境

### 6.1 切换到生产 API Key

1. 在 Ping++ 后台获取生产 API Key
2. 更新 Vercel 环境变量
3. 重新部署项目

### 6.2 配置 Webhook URL

在 Ping++ 后台设置：
- Webhook 地址：`https://yourdomain.com/api/payments/callback`
- 启用所有相关事件：`charge.succeeded`, `charge.failed`, `refund.succeeded`

### 6.3 上线前检查清单

- [ ] 环境变量配置正确
- [ ] Webhook URL 正确且可访问
- [ ] 支付积分对应关系正确
- [ ] 数据库积分字段可正确更新
- [ ] 前端显示最新积分
- [ ] SSL 证书有效（webhook 要求 HTTPS）
- [ ] 错误处理和日志完整
- [ ] 支付超时处理逻辑就位

## 常见问题 (FAQ)

### Q: 如何测试 webhook？

A: 在 Ping++ 后台有"测试 webhook"功能，可以模拟支付回调进行测试。

### Q: 支付失败时如何处理？

A:
1. 更新支付记录状态为 failed
2. 不增加用户积分
3. 返回错误信息给前端
4. 用户可以重新尝试支付

### Q: 如何处理支付超时？

A:
1. 在 webhook 中检查订单是否已处理
2. 如果 webhook 未收到，可在前端轮询检查支付状态
3. 定期清理过期的 pending 支付订单

### Q: 支付金额有限制吗？

A:
- 最小金额：0.01 元（单位：分）
- 最大金额：Ping++ 限制为 999,999 元

### Q: 如何退款？

A:
1. 调用 Ping++ 退款 API
2. 在 webhook 中处理退款回调
3. 更新支付记录和用户积分

## 相关文档链接

- [Ping++ 官方文档](https://www.pingxx.com/docs)
- [Ping++ API 参考](https://www.pingxx.com/docs/server)
- [Ping++ Webhook 文档](https://www.pingxx.com/docs/server#webhook)
- [Ping++ SDK 下载](https://www.pingxx.com/docs/client)

## 联系方式

- Ping++ 客服：400-827-8618
- 技术支持：api@pingxx.com

---

**最后更新日期：** 2025-12-11
**状态：** 准备就绪，等待企业资质认证完成
