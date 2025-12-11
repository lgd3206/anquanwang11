# Ping++ 支付集成 - 开发者快速指南

## 快速开始 (Quick Start)

### 1️⃣ 本地开发环境 (无需 Ping++ 配置)

支付系统已配置自动降级：
- 如果未配置 Ping++ 凭证 → **自动使用模拟二维码**
- 完美支持本地开发和测试

```bash
# 直接运行，无需任何配置
npm run dev
```

访问 http://localhost:3000/recharge 测试充值流程（使用模拟二维码）

---

## 第一步：注册 Ping++ 账户 (Getting Ping++ Credentials)

### A. 创建账户

1. 访问 [Ping++ 官网](https://www.pingxx.com)
2. 点击"立即开通"创建账户
3. 填写基本信息并验证邮箱

### B. 企业认证 (关键步骤)

1. 上传营业执照或身份证
2. 银行卡验证（绑定开户账户）
3. 等待审核（通常 24-48 小时）

### C. 获取 API 凭证

认证完成后：

1. 登录 [Ping++ 管理后台](https://dashboard.pingxx.com)
2. 左侧菜单 → **设置** → **API Keys**
3. 记录以下信息：
   ```
   应用 ID (App ID):        [你的 App ID]
   Live Secret Key:         [你的 API Key]
   ```

### D. 获取 Webhook Key

1. 左侧菜单 → **设置** → **Webhooks**
2. 配置 Webhook URL：
   ```
   https://yourdomain.com/api/payments/callback
   ```
3. 获取 **Webhook Secret Key**

---

## 第二步：配置环境变量 (Local Development)

### 本地配置 (`.env.local`)

```env
# Ping++ API 凭证
PING_APP_ID=sk_live_your_app_id_here
PING_API_KEY=sk_live_your_api_key_here
PING_WEBHOOK_KEY=whsec_your_webhook_key_here

# 其他必需变量
DATABASE_URL=your_database_url
```

### Vercel 部署配置

1. 登录 [Vercel 控制台](https://vercel.com)
2. 进入项目 → **Settings** → **Environment Variables**
3. 添加以下变量：
   ```
   PING_APP_ID = sk_live_xxx
   PING_API_KEY = sk_live_xxx
   PING_WEBHOOK_KEY = whsec_xxx
   ```
4. **重新部署** 项目使配置生效：
   ```bash
   git commit --allow-empty -m "Trigger Vercel redeploy with Ping++ config"
   git push
   ```

---

## 第三步：测试支付集成 (Testing)

### A. 沙箱环境测试 (推荐)

使用 **Test Keys** 安全地测试支付流程：

1. 在 Ping++ 后台切换到 **Test Mode**
2. 使用 Test App ID 和 Test API Key
3. 使用 Ping++ 提供的测试账号完成支付模拟

### B. 本地测试流程

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 访问充值页面
http://localhost:3000/recharge

# 4. 选择积分套餐和支付方式
# - 微信支付
# - 支付宝

# 5. 查看支付二维码
# 开发环境：显示模拟二维码
# 生产环境：显示真实二维码（来自 Ping++）
```

### C. 验证 Webhook 回调

```bash
# 1. 测试 Webhook 签名验证
curl -X POST http://localhost:3000/api/payments/callback \
  -H "Content-Type: application/json" \
  -H "X-Pingplusplus-Signature: your_test_signature" \
  -d '{"type":"charge.succeeded","data":{"object":{"id":"test_charge_id"}}}'

# 2. 查看服务器日志
# 应该看到：Webhook processing error 或 Payment processed
```

### D. 检查支付状态

```bash
# 查询支付状态 API
curl http://localhost:3000/api/payments/status/1
```

---

## API 端点参考

### 1. 初始化支付 (POST)

```
POST /api/payments/initiate
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "points": 500,        // 购买的积分数
  "amount": 5.00,      // 支付金额（元）
  "paymentMethod": "wechat"  // 或 "alipay"
}
```

**成功响应 (201):**
```json
{
  "message": "支付初始化成功",
  "paymentId": 123,
  "chargeId": "ch_xxx",
  "qrCode": "data:image/svg+xml,...",
  "amount": 5.00,
  "points": 500,
  "channel": "wechat"
}
```

### 2. 查询支付状态 (GET)

```
GET /api/payments/status/{paymentId}
```

**响应:**
```json
{
  "payment": {
    "id": 123,
    "status": "pending|completed|failed|refunded",
    "amount": 5.00,
    "pointsAdded": 500
  },
  "isCompleted": false,
  "isPending": true,
  "isFailed": false
}
```

### 3. Webhook 回调 (POST)

```
POST /api/payments/callback
X-Pingplusplus-Signature: {signature}
Content-Type: application/json

{
  "type": "charge.succeeded|charge.failed|refund.succeeded",
  "data": {
    "object": { /* charge 或 refund 对象 */ }
  }
}
```

---

## 常见问题排查 (Troubleshooting)

### Q: 支付失败，显示"支付初始化失败"

**原因 1:** Ping++ API Key 不正确
```bash
# 检查环境变量
echo $PING_API_KEY
echo $PING_APP_ID
```

**原因 2:** Ping++ 服务暂时不可用
```bash
# 查看服务状态
curl https://api.pingxx.com/v1/charges \
  -u sk_live_your_api_key:
```

**原因 3:** 金额不在有效范围内（需要 0.01-999,999 元）
```json
// 有效的金额
{"amount": 0.01}  // ✅ 最小金额
{"amount": 100}   // ✅ 有效
{"amount": 999999} // ✅ 最大金额
```

### Q: Webhook 回调未被收到

**检查清单:**

1. Webhook URL 是否正确？
   ```
   生产: https://yourdomain.com/api/payments/callback
   本地: https://localhost:3000/api/payments/callback (需要公网 URL)
   ```

2. SSL 证书有效吗？（Ping++ 要求 HTTPS）
   ```bash
   curl -I https://yourdomain.com/api/payments/callback
   # 应该返回 200 或 405（POST 方法未实现）
   ```

3. Webhook Secret Key 是否正确？
   ```
   在 Ping++ 后台验证 Webhook Secret Key
   ```

4. 在 Ping++ 后台测试 Webhook：
   ```
   设置 → Webhooks → 选择事件 → 发送测试数据
   ```

### Q: 用户积分未增加

**检查步骤:**

1. 确认支付状态是 `completed`
   ```bash
   SELECT status FROM payments WHERE id = ?;
   ```

2. 检查数据库日志
   ```bash
   # 查看 webhook 处理日志
   npm logs  # 如果使用 Vercel
   ```

3. 验证用户积分表
   ```bash
   SELECT points FROM users WHERE id = ?;
   ```

### Q: 如何切换到生产环境？

**步骤:**

1. 在 Ping++ 后台获取 **Live Secret Key**（不是 Test Key）
2. 更新 Vercel 环境变量：
   ```
   PING_API_KEY = sk_live_[Live Secret Key]
   ```
3. 重新部署：
   ```bash
   git commit --allow-empty -m "Switch to production Ping++ keys"
   git push
   ```

---

## 安全建议 (Security Best Practices)

### 1. 保护 API Keys

❌ **不要:**
```bash
# 不要提交到 GitHub
git add .env.local
echo "PING_API_KEY=sk_live_xxx" >> file.ts
```

✅ **要:**
```bash
# 使用 .env.local 和 .gitignore
echo ".env.local" >> .gitignore
# 在 Vercel 使用环境变量
```

### 2. 验证 Webhook 签名

✅ 总是验证 webhook 签名（已在代码中实现）：
```typescript
if (!pingxxClient.verifySignature(rawBody, signature)) {
  return error;
}
```

### 3. 幂等性处理

✅ 防止重复支付（已在代码中实现）：
```typescript
if (payment.status === "completed") {
  return "Payment already processed";
}
```

### 4. HTTPS 只

✅ Webhook URL 必须使用 HTTPS：
```
https://yourdomain.com/api/payments/callback ✅
http://yourdomain.com/api/payments/callback ❌
```

---

## 有用的链接

| 资源 | 链接 |
|------|------|
| Ping++ 官方文档 | https://www.pingxx.com/docs |
| API 参考 | https://www.pingxx.com/docs/server |
| Webhook 文档 | https://www.pingxx.com/docs/server#webhook |
| 管理后台 | https://dashboard.pingxx.com |
| 测试数据 | https://www.pingxx.com/docs/server#test |
| 客服支持 | support@pingxx.com |

---

## 支持的支付方式

| 方式 | 代码 | 说明 |
|------|------|------|
| 微信支付 | `wechat` | 微信扫码支付 |
| 支付宝 | `alipay` | 支付宝扫码支付 |
| 银行卡 | `bfb` | 百度钱包（可选） |

---

## 代码文件快速导航

| 文件 | 用途 |
|------|------|
| `lib/pingpp.ts` | Ping++ API 客户端 |
| `app/api/payments/initiate/route.ts` | 支付初始化接口 |
| `app/api/payments/callback/route.ts` | Webhook 回调处理 |
| `app/api/payments/status/[paymentId]/route.ts` | 支付状态查询 |
| `.env.local` | 本地环境变量 |

---

**最后更新:** 2025-12-11
**状态:** ✅ 准备就绪 - 等待企业资质获得后填入 API 凭证
