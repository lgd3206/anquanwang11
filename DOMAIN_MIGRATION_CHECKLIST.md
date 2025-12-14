# 域名迁移快速操作清单

## 📋 你需要手动操作的部分

### ✅ 已完成（代码端）
- [x] 更新 `lib/email.ts` 中的默认 appUrl
- [x] 创建完整的域名迁移指南文档
- [x] 提交代码到 GitHub
- [x] Vercel 会自动部署最新代码

### ⏳ 需要你手动完成的部分

## 第一步：在 Vercel 中添加新域名（5 分钟）

1. **登录 Vercel Dashboard**
   - 地址：https://vercel.com/dashboard

2. **选择你的项目**
   - 项目名称：anquanwang11（或你的项目名）

3. **进入 Settings > Domains**
   - 点击 "Add Domain" 按钮

4. **添加新域名**
   - 输入：`www.hseshare.com`
   - 点击 "Add"

5. **选择配置方式**
   - 选择：`Using external nameservers`
   - （因为你使用 Cloudflare）

6. **记下 CNAME 记录**
   - Vercel 会显示类似下面的记录：
     ```
     CNAME: www.hseshare.com → cname.vercel-dns.com
     ```
   - **复制这个信息**，你在 Cloudflare 中需要用到

7. **等待验证**
   - 保持 Vercel 页面打开
   - 状态应该从 "Pending" 变为 "Active"
   - 这会在配置 Cloudflare DNS 后自动完成

---

## 第二步：在 Cloudflare 中配置 DNS（5 分钟）

1. **登录 Cloudflare Dashboard**
   - 地址：https://dash.cloudflare.com

2. **选择你的域名**
   - 如果有多个域名，选择 `hseshare.com`

3. **进入 DNS Management**
   - 左侧菜单 → DNS

4. **添加 CNAME 记录**
   - 点击 "Add record"
   - **Type**: CNAME
   - **Name**: www
   - **Content**: cname.vercel-dns.com （从 Vercel 复制）
   - **TTL**: Auto
   - **Proxy status**: 灰色云 ☁️（DNS only）
   - 点击 "Save"

5. **等待 DNS 传播**
   - 通常需要 5-30 分钟
   - 你可以在这时间做第三步

---

## 第三步：设置旧域名重定向（5 分钟）

### 方式 A：使用 Redirect Rules（推荐，更现代）

1. **在 Cloudflare 中**
   - 进入 Rules > Redirect Rules

2. **创建新规则**
   - 点击 "Create rule"
   - **Rule name**: "Redirect sora3ai to hseshare"

3. **配置条件**
   - 点击 "Edit expression"
   - 复制粘贴以下条件：
     ```
     (cf.zone_name == "sora3ai.online")
     ```

4. **配置重定向**
   - **Choose action**: Redirect
   - **To URL**: `https://www.hseshare.com${http.request.uri.path}${http.request.uri.query}`
   - **Status code**: 301 (Permanent redirect)

5. **保存**
   - 点击 "Save and deploy"

### 方式 B：使用 Page Rules（如果没有 Redirect Rules）

1. **在 Cloudflare 中**
   - 进入 Rules > Page Rules

2. **创建规则**
   - 点击 "Create Page Rule"
   - **URL pattern**: `sora3ai.online/*`
   - 点击 "Add a Setting"
   - **Forwarding URL**: 301 - Permanent Redirect
   - **Target**: `https://www.hseshare.com/$1`
   - 点击 "Save and Deploy"

3. **创建第二条规则**（用于 www）
   - **URL pattern**: `www.sora3ai.online/*`
   - 同上配置

---

## 第四步：在 Vercel 中配置环境变量（3 分钟）

1. **在 Vercel Dashboard 中**
   - Settings > Environment Variables

2. **添加环境变量**
   - **Name**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://www.hseshare.com`
   - **Environments**: 选择 "Production"（生产环境）
   - 点击 "Save"

3. **触发重新部署**（可选，但推荐）
   - 进入 Deployments
   - 找到最新的部署
   - 点击 "..." → "Redeploy"
   - 等待部署完成（约 5 分钟）

---

## 第五步：验证和测试（15 分钟）

### 检查 DNS
```bash
# 在你的电脑上打开命令行，执行：
nslookup www.hseshare.com

# 应该返回类似的结果，表示指向 Vercel
```

### 测试新域名
1. **在浏览器中访问**
   - https://www.hseshare.com
   - 页面应该正常加载

2. **检查页面内容**
   - 标题应该是 "安全资源分享网"
   - 所有功能正常（注册、登录、资源列表等）

3. **测试邮件功能**
   - 注册新账户
   - 查看验证邮件
   - 邮件中的链接应该包含 `www.hseshare.com`
   - 点击链接进行验证

### 测试旧域名重定向
1. **在浏览器中访问**
   - https://www.sora3ai.online
   - https://sora3ai.online

2. **检查**
   - 浏览器地址栏最终应该显示 `www.hseshare.com`
   - 页面内容应该完全相同

3. **测试重定向中的路径**
   - 访问 https://www.sora3ai.online/resources
   - 应该重定向到 https://www.hseshare.com/resources
   - 资源列表应该正常加载

---

## 📝 操作顺序总结

```
1. Vercel 添加新域名 (5分钟)
   ↓
2. Cloudflare 配置 DNS (5分钟操作 + 5-30分钟传播)
   ↓
3. Cloudflare 设置重定向 (5分钟)
   ↓
4. Vercel 配置环境变量并重新部署 (3-5分钟)
   ↓
5. 测试新域名和重定向 (15分钟)

总计：约 45 分钟
```

---

## 🆘 遇到问题？

### 问题 1：新域名显示 404
- **原因**: DNS 还未传播或 Vercel 未完成验证
- **解决**: 等待 5-30 分钟，刷新浏览器（Ctrl+Shift+Delete 清除缓存）

### 问题 2：邮件链接仍指向旧域名
- **原因**: Vercel 环境变量未更新或应用未重新部署
- **解决**:
  1. 确保在 Vercel 中设置了环境变量
  2. 手动点击 "Redeploy" 重新部署
  3. 等待部署完成

### 问题 3：旧域名不重定向
- **原因**: Cloudflare Redirect Rules 未生效
- **解决**:
  1. 检查规则是否已保存
  2. 清除 Cloudflare 缓存（Caching > Cache Purge）
  3. 等待几分钟后重试

### 问题 4：HTTPS 证书错误
- **原因**: Cloudflare SSL 配置不当
- **解决**:
  1. 在 Cloudflare 中将代理状态改为 "灰色云"（DNS only）
  2. 让 Vercel 管理 SSL 证书
  3. 等待 5 分钟后重试

---

## ✅ 迁移完成检查清单

- [ ] www.hseshare.com 在 Vercel 中已添加
- [ ] Cloudflare DNS 记录已配置
- [ ] sora3ai.online 重定向已设置
- [ ] Vercel 环境变量已更新
- [ ] 应用已重新部署
- [ ] www.hseshare.com 访问正常
- [ ] 旧域名重定向工作正常
- [ ] 新注册邮件链接包含新域名
- [ ] HTTPS 证书有效（地址栏显示锁头）
- [ ] 所有功能测试通过

---

## 📞 后续支持

如果遇到任何问题，提供以下信息会更快解决：
- 你遇到的具体错误信息
- 访问的 URL 是什么
- 在浏览器控制台（F12）中看到的错误

我已经为你做了所有的代码准备，现在只需要你在控制台上做配置就可以了！
