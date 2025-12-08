# 在GoDaddy中启用SMTP Authentication的详细步骤

## 🔍 关键步骤

根据错误信息，SMTP Authentication仍然被禁用。需要在GoDaddy的Email & Office Dashboard中启用。

### 步骤1: 登录Email & Office Dashboard

1. 访问：**https://email.secureserver.net/**
2. 使用您的 **GoDaddy账户用户名和密码** 登录（不是邮箱密码）

### 步骤2: 找到用户设置

1. 登录后，找到或搜索用户：`hello@glowlisting.ai`
2. 点击该用户进入详细设置

### 步骤3: 启用SMTP Authentication

1. 在用户设置页面中，找到 **"邮件应用"** 或 **"Mail Apps"** 部分
2. 找到 **"SMTP Authentication"** 选项
3. **启用** SMTP Authentication
4. 保存设置

### 步骤4: 检查安全默认值

1. 在Email & Office Dashboard中，检查是否有"安全默认值"（Security Defaults）设置
2. 如果启用了，需要禁用它或为这个用户创建例外

### 步骤5: 等待生效

设置更改后，通常需要等待 **5-10分钟** 才能生效。

## ⚠️ 重要提示

- 必须在 **GoDaddy的Email & Office Dashboard** 中设置，不是Microsoft 365管理中心
- 使用GoDaddy账户登录，不是邮箱账号
- 如果找不到SMTP设置，可能需要联系GoDaddy支持

## 🔄 设置完成后

设置完成并等待几分钟后，运行测试：

```bash
curl -X POST http://localhost:3001/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"dingmason@gmail.com"}'
```

如果成功，您会收到测试邮件！

