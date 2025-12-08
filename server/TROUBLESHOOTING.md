# SMTP 配置故障排查

## 当前状态
- ✅ MFA已重置
- ✅ SMTP Authentication已在GoDaddy中启用
- ❌ 仍然收到 "SmtpClientAuthentication is disabled for the Tenant" 错误

## 可能的原因和解决方案

### 1. 设置传播延迟
- **问题**: GoDaddy的设置可能需要15-30分钟才能完全生效
- **解决**: 等待更长时间后重试

### 2. 租户级别设置
- **问题**: 可能需要在Microsoft 365管理中心启用租户级别的SMTP AUTH
- **解决**: 
  1. 登录 https://admin.microsoft.com
  2. 进入 **设置** > **组织设置** > **邮件**
  3. 检查是否有租户级别的SMTP设置需要启用

### 3. 安全默认值
- **问题**: 如果启用了"安全默认值"，可能阻止SMTP AUTH
- **解决**: 在GoDaddy Email & Office Dashboard中禁用安全默认值，或为特定用户创建例外

### 4. 联系GoDaddy支持
- 如果以上方法都不行，可能需要联系GoDaddy支持
- 告诉他们您需要为 `hello@glowlisting.ai` 启用SMTP AUTH用于应用程序发送邮件
- 参考文档：https://www.godaddy.com/en/help/set-up-microsoft-365-email-with-smtp-on-a-multifunction-device-41962

## 替代方案

如果SMTP AUTH无法启用，可以考虑：

1. **使用Microsoft Graph API**（需要应用注册，但更可靠）
2. **使用第三方邮件服务**（如SendGrid、Mailgun等）
3. **使用其他邮箱服务**（如Gmail、SendGrid等）

## 测试命令

设置完成后，使用以下命令测试：

```bash
curl -X POST http://localhost:3001/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"dingmason@gmail.com"}'
```

