# Vercel 环境变量更新指南

## 步骤1：在 Vercel Dashboard 中更新环境变量

### 1.1 访问 Vercel 项目设置
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目：`anquanwang11`
3. 点击顶部菜单 **Settings**（设置）

### 1.2 找到环境变量配置
1. 左侧菜单 → **Environment Variables**（环境变量）
2. 找到 `NEXT_PUBLIC_APP_URL` 变量

### 1.3 修改或添加变量

**如果已存在 NEXT_PUBLIC_APP_URL：**
- 点击右侧的编辑按钮（铅笔图标）
- 将值更改为：`https://www.sora3ai.online`
- 点击 **Save**（保存）

**如果不存在，添加新的环境变量：**
- 点击 **Add New** 按钮
- 名称：`NEXT_PUBLIC_APP_URL`
- 值：`https://www.sora3ai.online`
- 环境：选择 **Production**、**Preview** 和 **Development**（全选）
- 点击 **Save**

### 1.4 确认所有环境都已更新
```
Production:  https://www.sora3ai.online ✅
Preview:     https://www.sora3ai.online ✅
Development: https://www.sora3ai.online ✅
```

---

## 步骤2：触发重新部署

### 2.1 自动方式（推荐）
代码已经提交到 GitHub，Vercel 会自动检测到新的提交并重新部署。

**检查部署状态：**
1. Vercel Dashboard → 项目
2. 找到最新的部署记录
3. 等待状态变为 ✅ **Ready**

### 2.2 手动方式
1. 在 Vercel Dashboard 中选择您的项目
2. 找到最新的提交记录
3. 点击右侧的 **Redeploy** 按钮
4. 等待部署完成

### 2.3 验证部署成功
部署完成后，会显示：
```
✅ Production: Ready
   https://www.sora3ai.online
```

---

## 步骤3：验证邮件链接是否更新

### 方式1：注册新账户测试
1. 访问 https://www.sora3ai.online（或您的域名）
2. 注册一个测试账户
3. 检查邮件中的验证链接
4. **验证链接应该以 www.sora3ai.online 开头**，而不是 anquanwang11.vercel.app

### 方式2：查看邮件源代码
1. 在邮件客户端中右键点击邮件
2. 选择 **Show Original**（显示原始文件）或 **View Source**
3. 搜索验证链接，应该包含：
   ```
   https://www.sora3ai.online/api/auth/verify?token=...&email=...
   ```

### 方式3：检查服务器日志
在 Vercel 中查看函数日志，确认使用的是正确的域名。

---

## 预期结果

### 部署前（❌ 问题状态）
```
邮件中的验证链接：https://anquanwang11.vercel.app/api/auth/verify?token=xxx&email=xxx
↓
国内用户点击 → 直连 Vercel 美国服务器
↓
延迟 1-5+ 秒 ❌
```

### 部署后（✅ 解决状态）
```
邮件中的验证链接：https://www.sora3ai.online/api/auth/verify?token=xxx&email=xxx
↓
Cloudflare DNS 解析 → 代理到 Vercel + CDN 加速
↓
国内用户延迟降低到 300-800ms ✅
```

---

## 常见问题

### Q: 为什么还是很慢？
**A:** Cloudflare 免费版在国内没有自己的节点。主要改进来自于：
- DNS 解析优化
- 请求路由优化
- Cloudflare 全球 CDN 加速
- 减少跳转次数（验证后直接显示成功，而不是重定向）

### Q: 需要更新 DNS 吗？
**A:** 不需要。您已经将 www.sora3ai.online 指向 Vercel，现在只是确保应用使用同一个域名。

### Q: 多久能看到效果？
**A:**
- 代码部署：5-10 分钟
- DNS 缓存刷新：最多 24 小时（通常 1 小时内）
- 用户立即感受到改进

### Q: 还能做什么优化？
**A:** 详见下方的 Cloudflare 配置优化部分。

---

## Vercel 环境变量截图位置

```
Vercel Dashboard
  └── 项目：anquanwang11
      └── Settings（设置）
          └── Environment Variables（环境变量）
              ├── NEXT_PUBLIC_APP_URL = https://www.sora3ai.online
              ├── DATABASE_URL = postgresql://...
              ├── ADMIN_EMAILS = ...
              └── [其他变量...]
```

---

## 部署检查清单

- [ ] 代码已推送到 GitHub（commit: 98d642a）
- [ ] Vercel 已检测到新提交
- [ ] 在 Vercel Dashboard 中更新了 `NEXT_PUBLIC_APP_URL`
- [ ] 部署状态为 ✅ **Ready**
- [ ] 注册测试账户验证邮件链接
- [ ] 邮件中的链接包含 www.sora3ai.online
- [ ] 点击验证链接，成功验证账户
- [ ] 国内用户反馈验证速度改善

---

完成这些步骤后，邮件验证链接将使用您的自定义域名，国内用户的访问延迟会显著降低！
