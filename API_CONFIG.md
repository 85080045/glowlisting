# API configuration notes

## Current issue

Testing shows the API error: **"Model does not support the requested response modalities: image"**

The model in use does not support image generation.

## Information needed

To configure the API correctly, please confirm:

### 1. Actual API endpoint

- If using Google Gemini API: provide the correct model name (one that supports image generation) and the API endpoint URL.
- If using another provider: provide base URL, request format (JSON/FormData), and auth (API Key/Token).

### 2. API documentation or examples

Please share:
- API docs link
- Sample request code
- Response format

### 3. API key validity

Confirm that the API key in use is valid and has access to image generation (and any other required scopes).

## Temporary workaround

If the API is not available yet:

1. Use the **sharp** library for basic enhancement (brightness, contrast, sharpening).
2. Integrate the external API once the correct endpoint and format are confirmed.

## Next steps

Provide:
1. Correct API endpoint URL
2. Request format and parameters
3. Response format

Or specify the actual service provider so the integration can be looked up.
