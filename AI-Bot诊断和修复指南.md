# AI Bot 诊断和修复指南

## 🔍 问题诊断

根据代码分析，AI Bot 的工作流程是：
1. 用户发送消息 → 服务器接收
2. 延迟 3 秒（给管理员时间先回复）
3. 检查是否有管理员回复
4. 如果没有管理员回复 → 调用 `generateAIBotReply`
5. 生成 AI 回复并保存到数据库

## ✅ 已确认正常的部分

- ✅ 服务器在线：`https://glowlisting.onrender.com`
- ✅ API 端点存在：`/api/admin/test-ai-bot` 和 `/api/support/messages`
- ✅ 代码逻辑正确：延迟 3 秒后触发 AI Bot

## 🔧 需要检查的配置

### 1. 检查 Render 环境变量

**必须配置的环境变量：**
- `GOOGLE_AI_API_KEY`

**检查方法：**
1. 登录 https://dashboard.render.com
2. 进入后端服务（glowlisting）
3. 点击 "Environment" 标签
4. 查找 `GOOGLE_AI_API_KEY`
5. 确保值已正确设置（应该是 `AIzaSy...` 开头的字符串）

### 2. 检查 Render 启动日志

**查看日志方法：**
1. 登录 https://dashboard.render.com
2. 进入后端服务
3. 点击 "Logs" 标签
4. 查找以下日志信息：

**如果配置正确，应该看到：**
```
✅ AI Bot configured: GOOGLE_AI_API_KEY found (AIzaSyCRSR...)
```

**如果配置错误，应该看到：**
```
⚠️ AI Bot NOT configured: GOOGLE_AI_API_KEY not found
⚠️ AI bot will not work until API key is set in environment variables
```

### 3. 检查用户发送消息时的日志

当用户发送消息时，应该看到以下日志：
```
📨 User {userId} sent message. Admin online: {true/false}
🤖 Scheduling AI bot reply in 3 seconds for user {userId}...
🤖 AI bot timeout triggered for user {userId} at {timestamp}
🤖 Checking for admin replies: {count} found for user {userId}
🤖 No admin reply found, generating AI bot reply for user {userId}...
🔑 Checking API key...
🔑 GOOGLE_AI_API_KEY exists: true/false
🤖 AI Bot: Generating reply for user {userId}, message: {message}...
🤖 AI Bot: Calling Gemini API with model gemini-1.5-flash...
```

**如果 API key 未配置，会看到：**
```
❌ GOOGLE_AI_API_KEY not configured, AI bot disabled
❌ Please set GOOGLE_AI_API_KEY in environment variables
```

**如果 API key 配置错误，会看到：**
```
❌ AI Bot reply generation error: {error details}
```

## 🛠️ 修复步骤

### 步骤 1: 配置 Google AI API Key

1. **获取 API Key：**
   - 访问 https://aistudio.google.com/app/apikey
   - 登录 Google 账号
   - 创建新的 API Key
   - 复制 API Key（格式：`AIzaSy...`）

2. **在 Render 中设置：**
   - 登录 https://dashboard.render.com
   - 进入后端服务
   - 点击 "Environment" 标签
   - 添加环境变量：
     - **Key:** `GOOGLE_AI_API_KEY`（注意：必须是这个名称，不是 GEMINI_API_KEY）
     - **Value:** 你的 API Key（`AIzaSy...`）
   - 点击 "Save Changes"
   - **重要：** 重启服务以应用更改

### 步骤 2: 验证配置

1. **查看启动日志：**
   - 重启服务后，查看 "Logs" 标签
   - 应该看到：`✅ AI Bot configured: GOOGLE_AI_API_KEY found`

2. **测试 AI Bot：**
   - 登录管理员账号
   - 在浏览器控制台运行测试代码（见下方）

### 步骤 3: 测试 AI Bot

**方法 1: 浏览器控制台测试（推荐）**

1. 登录管理员账号
2. 打开控制台（F12）
3. 运行以下代码：

```javascript
(async function testAIBot() {
  const token = localStorage.getItem('glowlisting_token')
  const apiUrl = 'https://glowlisting.onrender.com/api'
  
  if (!token) {
    console.error('❌ 未找到 token，请先登录管理员账号')
    return
  }
  
  try {
    const response = await fetch(`${apiUrl}/admin/test-ai-bot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: '你好，我想了解如何使用这个服务' })
    })
    
    const data = await response.json()
    console.log('📊 状态码:', response.status)
    console.log('📋 响应:', data)
    
    if (response.ok && data.reply) {
      console.log('✅ AI Bot 回复:', data.reply)
      alert('✅ 测试成功！\n\nAI回复:\n' + data.reply.substring(0, 200))
    } else {
      console.error('❌ 测试失败:', data)
      alert('❌ 测试失败: ' + (data.error || '未知错误'))
    }
  } catch (error) {
    console.error('❌ 请求失败:', error)
    alert('❌ 请求失败: ' + error.message)
  }
})()
```

**方法 2: 实际使用测试**

1. 使用普通用户账号登录
2. 打开支持聊天窗口（右下角）
3. 发送一条消息，例如："你好，我想了解如何使用这个服务"
4. 等待 3-5 秒
5. 应该会收到 AI Bot 的自动回复（前缀为 `[AI Assistant]`）

## 📋 常见问题

### Q1: AI Bot 不回复，但日志显示配置正确

**可能原因：**
- Gemini API 调用失败
- API Key 权限不足
- 网络连接问题

**解决方法：**
1. 查看 Render 日志中的错误信息
2. 检查 API Key 是否有效（在 Google AI Studio 中测试）
3. 确保 API Key 有足够的配额

### Q2: 日志显示 "AI Bot NOT configured"

**解决方法：**
1. 确认环境变量名称正确：`GOOGLE_AI_API_KEY`（必须是这个名称）
2. 确认环境变量值正确（没有多余空格）
3. **重启服务**（重要！环境变量更改后必须重启）

### Q3: 测试端点返回 401

**原因：**
- 需要管理员权限
- Token 无效或已过期

**解决方法：**
1. 使用管理员账号登录
2. 重新获取 token
3. 确保 token 未过期

### Q4: AI Bot 回复延迟很长

**可能原因：**
- Gemini API 响应慢
- 网络延迟

**解决方法：**
- 这是正常的，Gemini API 响应时间通常在 2-5 秒
- 如果超过 10 秒，检查网络连接和 API 状态

## 🔗 相关文件

- `server/index.js` - AI Bot 实现代码
- `server/index.js:3716` - `generateAIBotReply` 函数
- `server/index.js:1662` - AI Bot 触发逻辑
- `server/index.js:3635` - 启动时配置检查

## 📞 需要帮助？

如果按照以上步骤仍然无法解决问题，请：
1. 查看 Render 日志中的完整错误信息
2. 检查 Google AI Studio 中的 API Key 状态
3. 确认 API Key 有足够的配额和权限

