# AI Bot 测试指南

## 方法1: 使用浏览器直接测试（最简单）

1. **登录管理员账号**
   - 在浏览器中打开你的网站
   - 使用管理员账号登录

2. **打开浏览器控制台 (F12)**

3. **运行以下代码**：
```javascript
// 获取token
const token = localStorage.getItem('glowlisting_token')
console.log('Token:', token)

// 测试AI Bot
fetch('https://your-render-backend-url/api/admin/test-ai-bot', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: '你好，我想了解如何使用这个服务'
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ 测试成功:', data)
  if (data.reply) {
    console.log('🤖 AI回复:', data.reply)
  }
})
.catch(err => {
  console.error('❌ 测试失败:', err)
})
```

**注意**: 将 `https://your-render-backend-url` 替换为你的实际 Render 后端 URL

## 方法2: 使用测试脚本

### 步骤1: 获取管理员Token

1. 在浏览器中登录管理员账号
2. 打开浏览器控制台 (F12)
3. 运行: `localStorage.getItem('glowlisting_token')`
4. 复制返回的token

### 步骤2: 运行测试脚本

```bash
# 设置环境变量
export ADMIN_TOKEN=your_token_here
export API_URL=https://your-render-backend-url/api

# 运行测试
./test-ai-bot.sh
```

或者使用Node.js脚本：

```bash
# 安装依赖（如果还没有）
cd server
npm install axios dotenv

# 运行测试
ADMIN_TOKEN=your_token API_URL=https://your-render-backend-url/api node ../test-ai-bot.js
```

## 方法3: 使用curl命令

```bash
curl -X POST https://your-render-backend-url/api/admin/test-ai-bot \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "你好，我想了解如何使用这个服务"}'
```

## 预期结果

如果测试成功，应该返回：
```json
{
  "success": true,
  "reply": "AI生成的回复内容...",
  "message": "AI Bot test successful"
}
```

如果失败，会返回错误信息，请查看：
1. Render后台日志
2. 错误响应中的详细信息

## 排查问题

1. **401 Unauthorized**: Token无效或已过期，重新登录获取新token
2. **404 Not Found**: API URL不正确，检查Render后端URL
3. **500 Internal Server Error**: 查看Render日志，可能是API key未配置或AI调用失败

