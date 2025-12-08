# 邮件配置说明

## 📧 需要提供的信息

为了启用自动发送验证码功能，您需要提供以下SMTP邮件配置信息：

### 必需信息：

1. **SMTP服务器地址** (SMTP_HOST)
   - Gmail: `smtp.gmail.com`
   - QQ邮箱: `smtp.qq.com`
   - Outlook: `smtp-mail.outlook.com` 或 `smtp.office365.com`
   - 其他邮箱服务商的SMTP地址

2. **SMTP端口** (SMTP_PORT)
   - 通常使用 `587` (TLS) 或 `465` (SSL)
   - Gmail推荐: `587`
   - QQ邮箱: `587` 或 `465`

3. **邮箱账号** (SMTP_USER)
   - 您的完整邮箱地址，例如: `hello@glowlisting.ai`

4. **邮箱密码** (SMTP_PASS)
   - 您的邮箱密码
   - **重要**: 对于Gmail，需要使用"应用专用密码"而不是普通密码
   - 对于QQ邮箱，也需要使用授权码而不是登录密码

5. **是否使用SSL/TLS** (SMTP_SECURE)
   - 端口465: `true`
   - 端口587: `false`

6. **发送者名称** (SMTP_FROM_NAME) - 可选
   - 显示在收件人邮箱中的发送者名称，默认: `GlowListing`

## 🔧 配置步骤

### 步骤1: 创建 .env 文件

在 `server` 目录下创建 `.env` 文件（可以复制 `.env.example` 文件）：

```bash
cd server
cp .env.example .env
```

### 步骤2: 填写配置信息

编辑 `.env` 文件，填入您的SMTP配置：

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hello@glowlisting.ai
SMTP_PASS=your-password-or-app-password
SMTP_FROM_NAME=GlowListing
```

### 步骤3: 获取应用专用密码（如使用Gmail）

如果使用Gmail，需要生成"应用专用密码"：

1. 登录您的Google账号
2. 前往 [Google账号安全设置](https://myaccount.google.com/security)
3. 启用"两步验证"（如果尚未启用）
4. 在"应用专用密码"部分，生成新密码
5. 将生成的16位密码填入 `SMTP_PASS`

### 步骤4: 重启服务器

配置完成后，重启服务器使配置生效：

```bash
npm start
# 或开发模式
npm run dev
```

## 📝 常见邮箱服务商配置

### Gmail
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

### QQ邮箱
```
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@qq.com
SMTP_PASS=your-authorization-code
```

### Outlook/Office365
```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

## ✅ 测试邮件发送

配置完成后，当用户注册时：
1. 系统会自动发送验证码到用户邮箱
2. 验证码为6位数字
3. 验证码有效期为10分钟
4. 邮件包含中英文双语内容

## 🔒 安全提示

- ⚠️ **不要**将 `.env` 文件提交到Git仓库
- ⚠️ `.env` 文件已添加到 `.gitignore`
- ⚠️ 使用应用专用密码而不是账户密码
- ⚠️ 定期更换密码

## 🐛 故障排查

如果邮件发送失败：

1. 检查 `.env` 文件配置是否正确
2. 确认邮箱账号和密码正确
3. 检查防火墙是否阻止SMTP端口
4. 查看服务器控制台错误日志
5. 确认邮箱服务商允许SMTP访问

## 📞 需要帮助？

如果遇到问题，请检查：
- 服务器控制台的错误日志
- 邮箱服务商的SMTP设置要求
- 网络连接和防火墙设置

