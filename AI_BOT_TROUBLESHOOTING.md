# AI Bot troubleshooting checklist

## Steps to check

### 1. Render environment variables
- [ ] Log in at https://dashboard.render.com
- [ ] Open the backend service
- [ ] Go to the "Environment" tab
- [ ] **Confirm `GOOGLE_AI_API_KEY` is set**
- [ ] **Value is a valid API key (starts with `AIzaSy`)**
- [ ] **No extra spaces or quotes**

### 2. Render startup logs
On startup you should see something like:
```
✅ AI Bot configured: GOOGLE_AI_API_KEY found (AIzaSy...)
```

If you see:
```
⚠️ AI Bot NOT configured: GOOGLE_AI_API_KEY not found
```
the env var is missing or wrong.

### 3. Logs when a user sends a message

1. User sends message:
```
📨 User {userId} sent message. Admin online: {true/false}
🤖 Scheduling AI bot reply in 3 seconds for user {userId}...
```

2. After 3 seconds:
```
🤖 AI bot timeout triggered for user {userId} at {timestamp}
🤖 Checking for admin replies: {count} found
```

3. If no admin reply:
```
🤖 No admin reply found, generating AI bot reply for user {userId}...
🔑 Checking API key...
🔑 GOOGLE_AI_API_KEY exists: true
🤖 AI Bot: Generating reply for user {userId}...
🤖 AI Bot: Calling Gemini API with model gemini-1.5-flash...
```

4. On success:
```
🤖 AI Bot: Gemini API call successful
✅ AI Bot: Successfully generated reply ({length} chars)
🤖 AI Bot replied to user {userId} successfully
```

5. On failure you may see:
```
❌ GOOGLE_AI_API_KEY not configured, AI bot disabled
```
or
```
❌ AI Bot reply generation error: {error details}
```

### 4. Common issues

- **Env not set:** Logs show `⚠️ AI Bot NOT configured` → Set `GOOGLE_AI_API_KEY` on Render and restart.
- **Service not restarted:** Env was set but logs still show not configured → Manually restart the service on Render.
- **Invalid API key:** Config looks OK but calls fail → Verify the key in Google AI Studio.
- **Code not deployed:** Behavior unchanged after code change → Ensure the repo is pushed and Render has redeployed.

### 5. Quick test (browser, admin only)

In the browser console (with admin logged in):
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
    body: JSON.stringify({ message: 'Hello' })
  })
  const data = await response.json()
  console.log('Result:', data)
})()
```

### 6. If it still fails

Provide:
1. Render startup logs (especially AI Bot config lines)
2. Full logs from when a user sends a message
3. Response from the test endpoint above
4. Any error messages
