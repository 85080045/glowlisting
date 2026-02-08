# AI Bot diagnosis and fix guide

## How the AI Bot works

1. User sends a message → server receives it
2. Wait 3 seconds (so an admin can reply first)
3. Check if an admin replied
4. If no admin reply → call `generateAIBotReply`
5. Generate and store the AI reply

## Verified working

- Server: `https://glowlisting.onrender.com`
- Endpoints: `/api/admin/test-ai-bot`, `/api/support/messages`
- Logic: 3-second delay then AI Bot run

## What to check

### 1. Render environment

**Required:** `GOOGLE_AI_API_KEY`

1. Log in at https://dashboard.render.com
2. Open the backend service (e.g. glowlisting)
3. Open "Environment"
4. Find `GOOGLE_AI_API_KEY` and ensure it is set (value starts with `AIzaSy`)

### 2. Startup logs

1. Render dashboard → your service → Logs
2. Look for:
   - **OK:** `✅ AI Bot configured: GOOGLE_AI_API_KEY found (AIzaSyCRSR...)`
   - **Wrong:** `⚠️ AI Bot NOT configured: GOOGLE_AI_API_KEY not found`

### 3. Logs when a user sends a message

You should see the sequence described in [AI_BOT_TROUBLESHOOTING.md](./AI_BOT_TROUBLESHOOTING.md). If the key is missing you will see:
`❌ GOOGLE_AI_API_KEY not configured, AI bot disabled`

## Fix steps

### Step 1: Set Google AI API key

1. Get a key: https://aistudio.google.com/app/apikey → create API key → copy (`AIzaSy...`)
2. In Render: service → Environment → add:
   - **Key:** `GOOGLE_AI_API_KEY` (exact name)
   - **Value:** your key
3. Save and **restart the service**

### Step 2: Confirm

1. After restart, check Logs for: `✅ AI Bot configured: GOOGLE_AI_API_KEY found`
2. Test via browser console (see TEST_AI_BOT.md or AI_BOT_TROUBLESHOOTING.md)

### Step 3: Test in the app

1. Log in as a normal user
2. Open support chat (e.g. bottom-right)
3. Send a message (e.g. “How do I use this service?”)
4. Wait 3–5 seconds; you should get an auto-reply prefixed with `[AI Assistant]`

## FAQ

**Q: AI Bot does not reply but logs say configured**  
Check Render logs for Gemini errors; verify key and quota in Google AI Studio.

**Q: Logs say "AI Bot NOT configured"**  
Confirm env var name is exactly `GOOGLE_AI_API_KEY`, value has no extra spaces, and **restart the service** after changing env.

**Q: Test endpoint returns 401**  
Use an admin account and a valid token.

**Q: Reply is very slow**  
Gemini often takes 2–5 seconds; if it’s over ~10 seconds, check network and API status.

## Related code

- `server/index.js` – AI Bot implementation
- `generateAIBotReply` – reply generation
- Trigger logic after user message (e.g. ~3s delay)
- Startup config check

If problems persist, check full Render logs, Google AI Studio key status, and quota.
