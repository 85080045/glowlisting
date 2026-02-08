# AI Bot testing guide

## Method 1: Browser console (simplest)

1. **Log in as admin**
   - Open your site and log in with an admin account

2. **Open DevTools (F12)**

3. **Run:**
```javascript
const token = localStorage.getItem('glowlisting_token')
console.log('Token:', token)

fetch('https://your-render-backend-url/api/admin/test-ai-bot', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'How do I use this service?'
  })
})
.then(res => res.json())
.then(data => {
  console.log('Success:', data)
  if (data.reply) console.log('AI reply:', data.reply)
})
.catch(err => console.error('Failed:', err))
```

Replace `https://your-render-backend-url` with your actual Render backend URL.

## Method 2: Test script

### Step 1: Get admin token

1. Log in as admin in the browser
2. Open DevTools (F12)
3. Run: `localStorage.getItem('glowlisting_token')`
4. Copy the token

### Step 2: Run script

```bash
export ADMIN_TOKEN=your_token_here
export API_URL=https://your-render-backend-url/api
./test-ai-bot.sh
```

Or with Node:
```bash
cd server
npm install axios dotenv
ADMIN_TOKEN=your_token API_URL=https://your-render-backend-url/api node ../test-ai-bot.js
```

## Method 3: curl

```bash
curl -X POST https://your-render-backend-url/api/admin/test-ai-bot \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I use this service?"}'
```

## Expected response

Success:
```json
{
  "success": true,
  "reply": "AI-generated reply text...",
  "message": "AI Bot test successful"
}
```

On failure you get an error payload; check Render logs and the response body.

## Troubleshooting

- **401 Unauthorized:** Token invalid or expired; log in again to get a new token
- **404 Not Found:** Wrong API URL; check Render backend URL
- **500 Internal Server Error:** Check Render logs; often missing or invalid API key or AI call failure
