# SSH 方式推送到 GitHub 配置指南

## 📋 当前状态

✅ 项目已成功推送到 GitHub：
- 仓库地址：https://github.com/lgd3206/anquanwang
- 分支：main
- 提交数：1

---

## 🔐 配置 SSH 密钥（可选）

如果你想使用 SSH 方式推送（更安全，无需每次输入密码），请按照以下步骤配置：

### 步骤 1：生成 SSH 密钥

#### Windows (Git Bash)
```bash
ssh-keygen -t ed25519 -C "lgd3206@gmail.com"
```

#### Linux/Mac
```bash
ssh-keygen -t ed25519 -C "lgd3206@gmail.com"
```

**提示：**
- 按 Enter 使用默认位置 (`~/.ssh/id_ed25519`)
- 输入密码（可选，按 Enter 跳过）
- 再次输入密码确认

### 步骤 2：添加 SSH 密钥到 SSH Agent

#### Windows (Git Bash)
```bash
eval $(ssh-agent -s)
ssh-add ~/.ssh/id_ed25519
```

#### Linux/Mac
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### 步骤 3：复制公钥

```bash
# Windows (Git Bash)
cat ~/.ssh/id_ed25519.pub | clip

# Linux/Mac
cat ~/.ssh/id_ed25519.pub | pbcopy
```

### 步骤 4：添加公钥到 GitHub

1. 访问 https://github.com/settings/keys
2. 点击 "New SSH key"
3. 标题：输入 "My Computer" 或其他描述
4. 密钥类型：选择 "Authentication Key"
5. 粘贴你复制的公钥
6. 点击 "Add SSH key"

### 步骤 5：测试 SSH 连接

```bash
ssh -T git@github.com
```

如果看到以下信息，说明配置成功：
```
Hi lgd3206! You've successfully authenticated, but GitHub does not provide shell access.
```

### 步骤 6：更改 Git 远程 URL 为 SSH

```bash
cd "F:\航海\网站\安全资源分享网\safety-resources"
git remote set-url origin git@github.com:lgd3206/anquanwang.git
```

### 步骤 7：验证配置

```bash
git remote -v
```

你应该看到：
```
origin  git@github.com:lgd3206/anquanwang.git (fetch)
origin  git@github.com:lgd3206/anquanwang.git (push)
```

---

## 🚀 使用 SSH 推送

配置完成后，你可以使用以下命令推送：

```bash
# 推送当前分支
git push

# 推送所有分支
git push --all

# 推送标签
git push --tags
```

---

## 📝 常用 Git 命令

```bash
# 查看状态
git status

# 查看日志
git log --oneline

# 添加文件
git add .

# 提交更改
git commit -m "Your commit message"

# 推送到远程
git push

# 拉取最新代码
git pull

# 创建新分支
git checkout -b feature/your-feature

# 切换分支
git checkout main

# 合并分支
git merge feature/your-feature

# 删除分支
git branch -d feature/your-feature
```

---

## 🔒 安全建议

1. **不要共享私钥** - 私钥文件 (`id_ed25519`) 只能你自己拥有
2. **定期轮换密钥** - 每年更新一次 SSH 密钥
3. **使用强密码** - 如果设置了密码，使用强密码
4. **备份私钥** - 在安全的地方备份私钥
5. **删除旧密钥** - 不再使用的密钥应该从 GitHub 删除

---

## 🐛 故障排除

### 问题 1：Permission denied (publickey)
**症状：** SSH 连接失败

**解决：**
1. 检查 SSH 密钥是否正确生成
2. 检查公钥是否已添加到 GitHub
3. 检查 SSH Agent 是否运行
4. 运行 `ssh -vT git@github.com` 查看详细错误

### 问题 2：Could not open a connection to your authentication agent
**症状：** SSH Agent 未运行

**解决：**
```bash
eval $(ssh-agent -s)
ssh-add ~/.ssh/id_ed25519
```

### 问题 3：Host key verification failed
**症状：** 首次连接时出现警告

**解决：**
输入 `yes` 确认添加 GitHub 到已知主机

---

## 📚 相关资源

- [GitHub SSH 文档](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [生成 SSH 密钥](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- [添加 SSH 密钥到 GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)

---

## ✅ 配置检查清单

- [ ] 生成 SSH 密钥
- [ ] 添加 SSH 密钥到 SSH Agent
- [ ] 复制公钥
- [ ] 添加公钥到 GitHub
- [ ] 测试 SSH 连接
- [ ] 更改 Git 远程 URL
- [ ] 验证配置

---

**完成后，你就可以使用 SSH 方式安全地推送代码到 GitHub！** 🔐
