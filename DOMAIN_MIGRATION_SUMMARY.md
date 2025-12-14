# 域名迁移总结 - www.hseshare.com

## 🎯 迁移计划

从 `www.sora3ai.online` 切换到 `www.hseshare.com`，同时保留旧域名并重定向。

## ✅ 已完成部分（代码和配置）

### 1. 代码更新
- ✅ `lib/email.ts` 中的邮件链接默认 URL 已更新
  - 从: `https://www.sora3ai.online`
  - 到: `https://www.hseshare.com`

### 2. 文档准备
- ✅ `DOMAIN_MIGRATION_GUIDE.md` - 完整的技术指南
- ✅ `DOMAIN_MIGRATION_CHECKLIST.md` - 快速操作清单

### 3. 代码部署
- ✅ 所有代码已提交到 GitHub
- ✅ Vercel 会自动部署最新代码

## ⏳ 需要你手动完成的部分

### 在 Vercel 中（5 分钟）
```
1. Vercel Dashboard → 你的项目 → Settings → Domains
2. 点击 "Add Domain"
3. 输入: www.hseshare.com
4. 选择: Using external nameservers
5. 记下 CNAME 值: cname.vercel-dns.com
```

### 在 Cloudflare 中（5 分钟操作 + 等待 DNS 传播）
```
1. Cloudflare Dashboard → DNS
2. 添加 CNAME 记录:
   - Type: CNAME
   - Name: www
   - Content: cname.vercel-dns.com
   - Proxy: 灰色云 ☁️（DNS only）

3. 设置重定向（Rules > Redirect Rules）:
   - 条件: cf.zone_name == "sora3ai.online"
   - 目标: https://www.hseshare.com${http.request.uri.path}
   - 状态码: 301 (Permanent)
```

### 在 Vercel 环境变量中（3 分钟）
```
Settings → Environment Variables

添加/更新:
- Name: NEXT_PUBLIC_APP_URL
- Value: https://www.hseshare.com
- Environments: Production

然后点击 "Redeploy" 重新部署
```

## 📋 完整的操作步骤

详见两个文档：

1. **DOMAIN_MIGRATION_CHECKLIST.md** - 实际操作指南（推荐先看这个）
2. **DOMAIN_MIGRATION_GUIDE.md** - 详细的技术文档

## ✨ 迁移效果

完成后你将拥有：

```
✅ www.hseshare.com - 新的主域名
   ↑
   └─ 所有访问都会转向这个域名

✅ www.sora3ai.online - 旧域名自动重定向
✅ sora3ai.online - 旧域名自动重定向

📧 邮件验证链接 - 自动使用新域名
   例: https://www.hseshare.com/api/auth/verify?token=...

🔒 HTTPS - 自动获取 SSL 证书
```

## ⏱️ 预计总时间

```
操作时间: 20 分钟
DNS 传播: 5-30 分钟（可并行进行）
测试验证: 15 分钟

总计: 约 45 分钟
```

## 📌 关键点

1. **不会导致任何停机** - 可以在用户使用中完成迁移
2. **旧域名用户无缝体验** - 自动重定向，用户无感知
3. **邮件验证无影响** - 已更新为使用新域名
4. **HTTPS 自动配置** - Vercel 自动获取证书

## 🚀 开始操作

按照 `DOMAIN_MIGRATION_CHECKLIST.md` 中的步骤一步步操作即可。

如有问题，参考 `DOMAIN_MIGRATION_GUIDE.md` 中的"故障排除"部分。
