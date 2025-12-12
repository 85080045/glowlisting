# AI Bot 问题排查清单

## 🔍 请按以下步骤检查：

### 1. 检查 Render 环境变量
- [ ] 登录 https://dashboard.render.com
- [ ] 进入后端服务
- [ ] 点击 "Environment" 标签
- [ ] **确认 `GOOGLE_AI_API_KEY` 已设置**
- [ ] **确认值是正确的 API Key（以 `AIzaSy` 开头）**
- [ ] **确认没有多余的空格或引号**

### 2. 检查 Render 启动日志
查看服务启动时的日志，应该看到：
```
✅ AI Bot configured: GOOGLE_AI_API_KEY found (AIzaSy...)
```

如果看到：
```
⚠️ AI Bot NOT configured: GOOGLE_AI_API_KEY not found
```
说明环境变量没有正确设置。

### 3. 检查用户发送消息时的日志
当用户发送消息时，应该看到以下日志序列：

1. 用户发送消息：
```
📨 User {userId} sent message. Admin online: {true/false}
🤖 Scheduling AI bot reply in 3 seconds for user {userId}...
```

2. 3秒后触发：
```
🤖 AI bot timeout triggered for user {userId} at {timestamp}
🤖 Checking for admin replies: {count} found
```

3. 如果没有管理员回复：
```
🤖 No admin reply found, generating AI bot reply for user {userId}...
🔑 Checking API key...
🔑 GOOGLE_AI_API_KEY exists: true
🔑 Final key: Found (AIzaSy...)
🤖 AI Bot: Generating reply for user {userId}...
🤖 AI Bot: Calling Gemini API with model gemini-1.5-flash...
```

4. 如果成功：
```
🤖 AI Bot: Gemini API call successful
✅ AI Bot: Successfully generated reply ({length} chars)
🤖 AI Bot replied to user {userId} successfully
```

5. 如果失败，会看到错误信息：
```
❌ GOOGLE_AI_API_KEY not configured, AI bot disabled
```
或
```
❌ AI Bot reply generation error: {error details}
```

### 4. 常见问题

#### 问题1: 环境变量未设置
**症状：** 日志显示 `⚠️ AI Bot NOT configured`
**解决：** 在 Render 中设置 `GOOGLE_AI_API_KEY` 并重启服务

#### 问题2: 服务未重启
**症状：** 设置了环境变量但日志仍显示未配置
**解决：** 在 Render 控制台手动重启服务

#### 问题3: API Key 无效
**症状：** 日志显示配置成功，但调用失败
**解决：** 检查 API Key 是否有效，在 Google AI Studio 测试

#### 问题4: 代码未部署
**症状：** 修改了代码但行为未改变
**解决：** 确认代码已推送到 GitHub，Render 已自动部署

### 5. 快速测试方法

在浏览器控制台运行（需要管理员登录）：
```javascript
(async function testAIBot() {
  const token = localStorage.getItem('glowlisting_token')
  const apiUrl = 'https://glowlisting.onrender.com/api'
  
  const response = await fetch(`${apiUrl}/admin/test-ai-bot`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: '测试' })
  })
  
  const data = await response.json()
  console.log('测试结果:', data)
})()
```

### 6. 需要提供的信息

如果问题仍然存在，请提供：
1. Render 启动日志（特别是 AI Bot 配置相关的日志）
2. 用户发送消息时的完整日志
3. 测试端点的响应结果
4. 任何错误信息

