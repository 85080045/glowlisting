# Image processing failure – debug guide

## Possible causes and fixes

### 1. Backend not running
```bash
cd server
npm run dev
```
You should see: `🚀 Pholisting™ API server running at http://localhost:3001`

### 2. API key
- If the API key is invalid, the backend logs will show 401 or 403.

### 3. API endpoint
- If the endpoint is wrong, you will see 404 in the backend logs.

### 4. Backend logs
On upload, the server logs request/response details. On errors you may see messages like:
- `API error: ...`
- `Error details: ...`

### 5. Common errors

#### 401 Unauthorized
- Check the API key and permissions.

#### 404 Not Found
- Check the model name and endpoint. You may need a different model (e.g. `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-2.0-flash-exp`).

#### 400 Bad Request
- Check request body: correct `mimeType`, complete `base64Image`, valid `prompt`.

#### No image data in response
- Check the API response structure and parsing; confirm the model supports image generation.

### 6. Test API with curl

Use your API key and the correct model/endpoint from the provider’s docs.

### 7. Network
- Ensure the server can reach the external API; check firewall and proxy if used.

### 8. Browser devtools
- **Network:** Inspect API requests and responses.
- **Console:** Check for frontend errors.

## Next steps

1. Start the backend and watch the logs.
2. Upload an image and note any errors.
3. Use the log messages to narrow down the cause (key, endpoint, model, or response format).
