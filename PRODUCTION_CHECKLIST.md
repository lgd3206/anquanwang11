# Ping++ 生产部署 - 快速检查清单

## 🎯 目标
获得 Ping++ 企业资质后，按照此清单激活真实支付功能

---

## ✅ 第一阶段：获取凭证 (1-2 天)

### 账户设置
- [ ] 注册 Ping++ 账户: https://www.pingxx.com
- [ ] 登录控制台: https://dashboard.pingxx.com
- [ ] 完成企业认证（营业执照 + 法人身份证）
- [ ] 等待认证通过（通常 24-48 小时）

### 获取 API 密钥
- [ ] 认证完成后，进入 **设置 → API Keys**
- [ ] 记录以下信息：
  ```
  App ID:           ________________
  Live Secret Key:  ________________
  Test Secret Key:  ________________
  ```

### 获取 Webhook Key
- [ ] 进入 **设置 → Webhooks**
- [ ] 配置 Webhook URL:
  ```
  生产: https://yourdomain.com/api/payments/callback
  ```
- [ ] 记录 Webhook Secret Key:
  ```
  Webhook Secret Key: ________________
  ```

---

## ✅ 第二阶段：本地测试 (30 分钟)

### 使用测试凭证测试
```bash
# 1. 更新 .env.local (使用 Test Keys)
PING_APP_ID=sk_test_xxx
PING_API_KEY=sk_test_xxx
PING_WEBHOOK_KEY=whsec_test_xxx

# 2. 启动开发服务器
npm run dev

# 3. 访问充值页面
http://localhost:3000/recharge

# 4. 使用 Ping++ 测试账号完成支付
# 详见: https://www.pingxx.com/docs/server#test
```

### 测试检查清单
- [ ] 能否成功初始化支付？
- [ ] 二维码是否正确显示？
- [ ] Webhook 是否正确接收？
- [ ] 积分是否正确增加？
- [ ] 支付状态是否正确更新？

**注:** 本地 Webhook 测试需要使用 ngrok 或类似工具暴露本地端口

---

## ✅ 第三阶段：Vercel 部署 (15 分钟)

### 配置环境变量
1. 登录 [Vercel 控制台](https://vercel.com)
2. 进入项目 → **Settings** → **Environment Variables**
3. 添加或更新以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `PING_APP_ID` | `sk_live_xxx` | Live App ID |
| `PING_API_KEY` | `sk_live_xxx` | Live Secret Key |
| `PING_WEBHOOK_KEY` | `whsec_xxx` | Webhook Secret Key |

4. **确保变量对正确的环境有效**（默认应为 Production）

### 重新部署项目
```bash
# 推送空提交以触发重新部署
git commit --allow-empty -m "Activate Ping++ production payment"
git push origin main

# 等待 Vercel 自动部署完成
# 在 https://vercel.com/deployments 检查部署状态
```

### 验证部署
- [ ] Vercel 部署成功（显示绿色检查）
- [ ] 环境变量已正确设置
- [ ] 访问 https://yourdomain.com/recharge 页面加载正常

---

## ✅ 第四阶段：Ping++ 后台配置 (20 分钟)

### 启用支付方式
1. 登录 Ping++ 控制台
2. 进入 **设置 → 支付方式**
3. 启用以下方式：
   - [ ] 微信支付 (WeChat)
   - [ ] 支付宝 (Alipay)
   - [ ] 银行卡（可选）

### 配置 Webhook
1. 进入 **设置 → Webhooks**
2. 添加 Webhook：
   ```
   URL: https://yourdomain.com/api/payments/callback
   ```
3. 选择事件：
   - [ ] charge.succeeded
   - [ ] charge.failed
   - [ ] refund.succeeded

4. 测试 Webhook：
   - [ ] 发送测试数据
   - [ ] 查看服务器日志是否收到回调

### 配置银行账户
1. 进入 **账户设置 → 提现账户**
2. 添加提现银行账户信息
3. 验证账户（通常需要 1-2 个工作日）

---

## ✅ 第五阶段：生产环境测试 (1 小时)

### 端到端支付流程测试

**测试场景 1: 微信支付**
```
1. 访问 https://yourdomain.com/recharge
2. 选择积分套餐（例如 100 点）
3. 选择"微信支付"
4. 点击"充值"
5. 使用真实微信账号扫码支付
6. 确认支付成功
7. 验证积分已增加
```

- [ ] 支付流程完整
- [ ] 二维码正确显示
- [ ] 支付成功后积分增加
- [ ] 数据库记录正确

**测试场景 2: 支付宝支付**
```
1. 重复上述步骤，选择"支付宝"
2. 使用真实支付宝账号扫码支付
3. 验证支付和积分增加
```

- [ ] 支付宝支付成功
- [ ] 积分正确增加
- [ ] 支付记录完整

**测试场景 3: Webhook 回调**
```
1. 检查支付记录状态
2. 验证 Webhook 已处理
3. 查看服务器日志
```

- [ ] Webhook 已接收和处理
- [ ] 支付状态已更新
- [ ] 用户积分已增加

**测试场景 4: 支付失败处理**
```
1. 尝试支付但中途取消
2. 或让支付自然超时
```

- [ ] 支付记录标记为失败
- [ ] 用户未获得积分
- [ ] 用户可重新尝试支付

### 监控和日志检查
```bash
# 在 Vercel 控制台检查日志
vercel logs --follow

# 关键日志项
✅ "Payment succeeded: ch_xxx, added 100 points"
✅ "Webhook processing error: none"
✅ "Webhook signature verified"
```

---

## ✅ 第六阶段：上线发布 (30 分钟)

### 最终安全检查
- [ ] 所有 API Keys 已正确配置
- [ ] 支付金额验证逻辑正确
- [ ] Webhook 签名验证启用
- [ ] 错误日志记录完整
- [ ] SSL 证书有效且最新

### 公告用户
- [ ] 更新应用公告告知支付已开放
- [ ] 提供支付教程和常见问题
- [ ] 设置客服支持流程

### 监控和告警
```bash
# 监控关键指标
1. 每日支付成功率
2. 支付平均处理时间
3. Webhook 失败次数
4. 用户积分增加日志

# 设置告警
- 支付成功率 < 95%
- Webhook 处理失败超过 5 次
- 数据库异常
```

---

## ⚠️ 常见问题和解决方案

### 支付失败: "Ping++ API 错误"

**原因 1:** API Key 不正确
```bash
# 检查环境变量
echo $PING_API_KEY
# 应该显示 sk_live_xxx，不能是 sk_test_xxx
```

**原因 2:** 金额格式不正确
```javascript
// ✅ 正确
0.01元 → 1分
10元 → 1000分

// ❌ 错误
10分 → 传值应为 0.10 元，然后系统转为 10分
```

### Webhook 未接收

**排查步骤:**
```bash
# 1. 验证 Webhook URL 正确
https://yourdomain.com/api/payments/callback

# 2. 验证 SSL 证书有效
curl -I https://yourdomain.com/api/payments/callback
# 应该返回 200 或 4xx

# 3. 在 Ping++ 后台发送测试
设置 → Webhooks → 选择事件 → 发送测试

# 4. 查看服务器日志
vercel logs --follow
# 查找 "Webhook processing" 日志

# 5. 验证 Webhook Secret Key 正确
echo $PING_WEBHOOK_KEY
```

### 积分未增加

**排查步骤:**
```bash
# 1. 确认支付状态是 completed
SELECT status FROM payments WHERE id = ?;

# 2. 查看 webhook 处理日志
grep "Payment succeeded" /var/log/app.log

# 3. 验证用户积分表
SELECT points FROM users WHERE id = ?;

# 4. 检查数据库连接
# Vercel → Storage → 测试连接
```

---

## 📞 紧急支持

### Ping++ 技术支持
- 📧 Email: api@pingxx.com
- 📞 客服: 400-827-8618
- 🌐 文档: https://www.pingxx.com/docs
- 💬 技术社区: https://www.pingxx.com/community

### 应用内支持流程
1. 记录问题截图和错误日志
2. 检查 Vercel 部署日志
3. 查阅文档中的常见问题部分
4. 联系 Ping++ 技术支持

---

## 📋 部署检查清单最终版

```
🔐 安全配置
  [ ] Ping++ API Keys 已配置
  [ ] Webhook Secret Key 已配置
  [ ] SSL 证书有效
  [ ] 环境隔离正确（production）

💳 支付配置
  [ ] 微信支付已启用
  [ ] 支付宝已启用
  [ ] Webhook URL 已配置
  [ ] 银行账户已绑定

✅ 功能测试
  [ ] 微信支付流程完整
  [ ] 支付宝支付流程完整
  [ ] Webhook 回调正常
  [ ] 积分增加正确
  [ ] 错误处理完善

📊 监控配置
  [ ] 日志记录启用
  [ ] 告警规则设置
  [ ] 性能监控就绪
  [ ] 备份策略确定

📚 文档完整
  [ ] 用户支付教程已发布
  [ ] 常见问题已回答
  [ ] 客服流程已建立
  [ ] 社区公告已发布
```

---

## 🎉 完成！

所有步骤完成后，您的支付系统已准备好为用户服务！

**需要帮助？**
- 查看完整指南: `PINGPP_SETUP_GUIDE.md`
- 查看集成文档: `PINGPP_INTEGRATION.md`
- 查看实现总结: `IMPLEMENTATION_SUMMARY.md`

---

**文档版本:** 1.0
**最后更新:** 2025-12-11
**状态:** ✅ 生产就绪
