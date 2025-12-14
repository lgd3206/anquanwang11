# 域名迁移指南：sora3ai.online → www.hseshare.com

## 迁移目标
- ✅ 将主域名从 www.sora3ai.online 切换到 www.hseshare.com
- ✅ 保留 sora3ai.online 并重定向到新域名
- ✅ 更新应用内部配置（邮件链接、环境变量等）
- ✅ 确保用户体验无缝切换

## 完整迁移步骤

### 第一步：在 Vercel 中添加新域名

**操作位置**: Vercel Dashboard → 你的项目 → Settings → Domains

1. 点击 "Add Domain"
2. 输入 `www.hseshare.com`
3. 选择 "Using external nameservers" （因为你使用 Cloudflare）
4. 记下 Vercel 提供的 CNAME 记录

**示例 CNAME 记录**:
```
www.hseshare.com CNAME cname.vercel-dns.com
```

5. 等待 DNS 验证完成（通常 5-30 分钟）

### 第二步：在 Cloudflare 中配置 DNS

**操作位置**: Cloudflare Dashboard → DNS 管理

#### 2.1 添加 www.hseshare.com 的 CNAME 记录

| 字段 | 值 |
|------|-----|
| Type | CNAME |
| Name | www |
| Content | cname.vercel-dns.com |
| TTL | Auto |
| Proxy status | 灰色云（DNS only） |

**注意**：设为"灰色云"而不是"橙色云"，这样 SSL 证书将由 Vercel 管理。

#### 2.2 添加根域名 A 记录（可选，但推荐）

如果想让 `hseshare.com`（不带 www）也能访问：

| 字段 | 值 |
|------|-----|
| Type | A |
| Name | @ |
| IPv4 address | 76.76.19.132 |
| TTL | Auto |
| Proxy status | 灰色云 |

或者使用重定向（更简单）：
- 在 Cloudflare Page Rules 中添加：`hseshare.com/*` → `https://www.hseshare.com/$1` (301 Permanent Redirect)

#### 2.3 配置 sora3ai.online 重定向到新域名

在 Cloudflare 中为旧域名设置 301 永久重定向：

**方式 A：使用 Cloudflare Page Rules**
1. 进入 Cloudflare → Rules → Page Rules
2. 创建新规则：
   - 地址: `sora3ai.online/*`
   - 操作: 设置为 "Forwarding URL"
   - 目标: `https://www.hseshare.com/$1`
   - 状态码: 301 (Permanent)

3. 创建另一条规则处理 www：
   - 地址: `www.sora3ai.online/*`
   - 操作: 相同配置

**方式 B：使用 Cloudflare Redirect Rules（更现代）**
1. 进入 Rules → Redirect Rules
2. 创建新规则
3. 配置条件：
   ```
   (cf.zone_name == "sora3ai.online" or cf.zone_name == "www.sora3ai.online")
   ```
4. 配置重定向动作：
   ```
   https://www.hseshare.com${http.request.uri.path}
   ```

### 第三步：更新应用配置

#### 3.1 更新邮件默认 URL

编辑 `lib/email.ts`，将所有 `sora3ai.online` 改为 `hseshare.com`：

```typescript
// 验证邮件
export async function sendVerificationEmail(
  email: string,
  token: string,
  appUrl?: string
) {
  const baseUrl = appUrl || "https://www.hseshare.com";
  // ...
}

// 奖励邮件
export async function sendBonusEmail(
  email: string,
  bonusPoints: number,
  appUrl?: string
) {
  const baseUrl = appUrl || "https://www.hseshare.com";
  // ...
}
```

#### 3.2 更新环境变量

编辑 `.env.local`：

```bash
# 改前
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 改后（生产环境会使用 Vercel 的自动环境变量）
NEXT_PUBLIC_APP_URL=https://www.hseshare.com
```

在 Vercel 项目中，添加环境变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| NEXT_PUBLIC_APP_URL | https://www.hseshare.com | Production |
| NEXT_PUBLIC_APP_URL | http://localhost:3000 | Development |

**操作步骤**:
1. Vercel Dashboard → 你的项目
2. Settings → Environment Variables
3. 添加/编辑 `NEXT_PUBLIC_APP_URL`

#### 3.3 更新 Vercel 自定义域名设置

在 Vercel 中：
1. Settings → Domains
2. 将 www.hseshare.com 设置为主域名（Primary Domain）
3. 可选：保留 sora3ai.online 以支持备用访问（虽然会重定向）

### 第四步：验证和测试

#### 4.1 DNS 检查
```bash
# 检查 www.hseshare.com 的 CNAME 记录
nslookup www.hseshare.com
# 应该返回 Vercel 的 CNAME 地址

# 检查 sora3ai.online 的 A 记录
nslookup sora3ai.online
```

#### 4.2 测试新域名访问
```bash
# 在浏览器中访问
https://www.hseshare.com

# 检查：
# - 页面正常加载
# - 注册/登录功能正常
# - 邮件发送功能正常
```

#### 4.3 测试域名重定向
```bash
# 访问旧域名，应该自动重定向到新域名
https://www.sora3ai.online
https://sora3ai.online

# 检查：
# - 地址栏最终显示 www.hseshare.com
# - 所有功能正常（重定向应该透明）
```

#### 4.4 测试邮件验证链接
```bash
# 使用新域名注册账户
1. 访问 https://www.hseshare.com/register
2. 填写邮箱和密码注册
3. 检查接收到的验证邮件
4. 验证邮件中的链接应该包含 www.hseshare.com
5. 点击链接应该正常验证
```

### 第五步：SSL/TLS 证书配置

Vercel 和 Cloudflare 的 SSL 配置：

1. **Cloudflare SSL/TLS 设置**
   - 进入 SSL/TLS → Overview
   - 确保设置为 "Flexible" 或 "Full" 模式
   - 推荐使用 "Full (strict)" 如果 Vercel 支持

2. **Vercel 自动 SSL**
   - Vercel 会自动为你的自定义域名获取 Let's Encrypt 证书
   - 无需额外配置

### 第六步：监控和维护

#### 6.1 检查 HTTPS 重定向
- 确保 HTTP 自动重定向到 HTTPS
- Vercel 默认处理这个

#### 6.2 检查 www 前缀重定向
- 确保 `hseshare.com` 重定向到 `www.hseshare.com`
- 或配置两者都可访问

#### 6.3 旧域名迁移期（建议 3-6 个月）
- 保持 sora3ai.online 重定向活跃
- 监控是否有用户仍在使用旧域名
- 观察搜索引擎索引更新

#### 6.4 SEO 考虑（可选）
```html
<!-- 在新域名的 HTML head 中添加 canonical 标签 -->
<link rel="canonical" href="https://www.hseshare.com{current-path}" />

<!-- 在 next.config.js 中可以配置（可选） -->
```

## 故障排除

### 问题 1：新域名显示 404
**原因**: DNS 还未传播或 Vercel 未验证域名
**解决**:
- 等待 5-30 分钟
- 在 Vercel Dashboard 检查域名状态
- 刷新浏览器 DNS 缓存: `ipconfig /flushdns`

### 问题 2：邮件链接仍指向旧域名
**原因**: 环境变量未更新或应用未重新部署
**解决**:
- 更新 Vercel 环境变量
- 手动触发重新部署（在 Vercel Dashboard 点击 "Redeploy"）
- 等待部署完成（约 5 分钟）

### 问题 3：旧域名不重定向
**原因**: Cloudflare Page Rules 未生效
**解决**:
- 检查规则优先级（Priority）
- 确保 Cloudflare 正在代理域名（橙色云）
- 尝试清除 Cloudflare 缓存

### 问题 4：HTTPS 证书错误
**原因**: Cloudflare 和 Vercel SSL 配置冲突
**解决**:
- 将 Cloudflare SSL 设置为 "灰色云"（DNS only）
- 让 Vercel 单独管理 SSL

## 代码更改清单

需要修改的文件：
- [ ] `lib/email.ts` - 更新邮件默认 URL
- [ ] `.env.local` - 更新 NEXT_PUBLIC_APP_URL（开发环境）
- [ ] Vercel 环境变量 - 更新生产环境的 NEXT_PUBLIC_APP_URL

## 时间线

| 步骤 | 预计时间 |
|------|---------|
| 第一步（Vercel 配置） | 5 分钟 |
| 第二步（Cloudflare DNS） | 5 分钟操作 + 5-30 分钟 DNS 传播 |
| 第三步（代码更新） | 10 分钟 |
| 第四步（验证测试） | 15 分钟 |
| **总计** | **约 1 小时** |

## 检查清单

迁移完成后的验证清单：

- [ ] www.hseshare.com 在 Vercel 中已添加
- [ ] Cloudflare DNS 记录已配置
- [ ] sora3ai.online 重定向已设置
- [ ] lib/email.ts 已更新
- [ ] 环境变量已更新
- [ ] 应用已重新部署
- [ ] www.hseshare.com 访问正常
- [ ] 旧域名重定向工作正常
- [ ] 新注册邮件链接包含新域名
- [ ] HTTPS 证书有效
- [ ] 所有功能测试通过
