# GoDaddy Microsoft 365 SMTP 配置指南

根据 [GoDaddy官方文档](https://www.godaddy.com/en/help/set-up-microsoft-365-email-with-smtp-on-a-multifunction-device-41962)，需要完成以下步骤：

## ✅ 必须完成的步骤

### 步骤1: 登录 Email & Office Dashboard
1. 访问 [GoDaddy Email & Office Dashboard](https://email.secureserver.net/)
2. 使用您的 **GoDaddy用户名和密码**（不是邮箱密码）登录

### 步骤2: 启用 SMTP Authentication
1. 在 Email & Office Dashboard 中，找到用户 `hello@glowlisting.ai`
2. 点击该用户进入设置
3. 找到 **"SMTP Authentication"** 或 **"邮件应用"** 设置
4. **启用 SMTP Authentication**

### 步骤3: 检查安全默认值
1. 如果您的组织启用了"安全默认值"（Security Defaults），需要**禁用它**
2. 或者为特定用户创建例外

### 步骤4: 处理多因素认证（MFA）

#### 选项A: 如果启用了MFA（推荐）
1. 为 `hello@glowlisting.ai` 启用MFA
2. 设置MFA认证方法
3. **创建应用专用密码**（App Password）
4. 在 `.env` 文件中使用**应用专用密码**而不是普通密码

#### 选项B: 如果不使用MFA
1. 为 `hello@glowlisting.ai` **禁用MFA**
2. 在 `.env` 文件中使用普通密码

## 📧 当前配置

根据GoDaddy文档，配置应该是：

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hello@glowlisting.ai
SMTP_PASS=您的密码或应用专用密码
SMTP_FROM_NAME=GlowListing
```

**重要提示：**
- 端口：`587`
- 加密方法：`STARTTLS`（不是SSL）
- 如果启用了MFA，必须使用**应用专用密码**

## 🔑 如何创建应用专用密码（如果启用了MFA）

1. 登录 [Microsoft 365 安全设置](https://mysignins.microsoft.com/security-info)
2. 进入 **"安全信息"** > **"应用密码"**
3. 创建新的应用密码
4. 复制生成的16位密码
5. 在 `.env` 文件中使用这个应用专用密码

## ⚠️ 常见问题

### 错误：`SmtpClientAuthentication is disabled for the Tenant`

**解决方法：**
1. 确认已在 Email & Office Dashboard 中启用了 SMTP Authentication
2. 确认已禁用安全默认值（或创建例外）
3. 等待5-10分钟让设置生效
4. 如果启用了MFA，确保使用应用专用密码

### 仍然无法连接？

1. 检查是否在 Email & Office Dashboard 中正确启用了设置
2. 确认使用的是 GoDaddy 的 Email & Office Dashboard，不是 Microsoft 365 管理中心
3. 联系 GoDaddy 支持确认账户状态

## 📞 需要帮助？

如果按照以上步骤仍然无法发送邮件，请：
1. 检查服务器控制台的详细错误信息
2. 确认所有步骤都已正确完成
3. 联系 GoDaddy 支持获取帮助

