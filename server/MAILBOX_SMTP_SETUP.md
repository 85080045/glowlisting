# 为邮箱启用SMTP Authentication

## 当前状态
错误信息已从 "disabled for the Tenant" 变为 **"disabled for the Mailbox"**

这说明：
- ✅ 租户级别的SMTP AUTH已启用
- ❌ 邮箱级别的SMTP AUTH还需要启用

## 需要完成的步骤

### 在GoDaddy Email & Office Dashboard中：

1. 登录 https://email.secureserver.net/
2. 找到用户：**hello@glowlisting.ai**
3. 点击进入该用户的详细设置
4. 找到 **"邮件应用"** 或 **"Mail Apps"** 部分
5. 找到 **"SMTP Authentication"** 选项
6. **确保为这个特定邮箱启用了SMTP Authentication**
7. 保存设置

### 或者使用PowerShell（如果有权限）：

```powershell
Connect-ExchangeOnline
Set-CASMailbox -Identity hello@glowlisting.ai -SmtpClientAuthenticationDisabled $false
```

## 重要提示

- 需要为**特定邮箱**启用，不只是租户级别
- 设置保存后等待5-10分钟生效
- 确认设置已正确保存

