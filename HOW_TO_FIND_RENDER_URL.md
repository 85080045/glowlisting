# How to find the Render backend URL

## Method 1: Render dashboard

1. Log in at https://dashboard.render.com
2. Open your backend service (e.g. “Web Service”).
3. Open the service details; the URL is shown at the top (e.g. `https://your-service-name.onrender.com`).
4. API base is that URL + `/api`, e.g. `https://glowlisting-backend.onrender.com/api`.

## Method 2: From the frontend

1. In Vercel (or your frontend host), open project settings and check environment variables for `VITE_API_URL` (or similar). That value is the backend URL.
2. Or open the site, open DevTools (F12) → Network, trigger a request (e.g. send a message), and inspect the request URL to see the backend host.

## Method 3: From config

Check:
- `.env` (if present)
- `vite.config.js`
- Frontend host (e.g. Vercel) environment variables

## URL format

- Service: `https://your-service-name.onrender.com` (or with a random suffix).
- API: `https://your-service-name.onrender.com/api`

## Quick check

Open in a browser:
- `https://your-service-name.onrender.com/api/health`
- or `https://your-service-name.onrender.com/`

A valid JSON or normal response means the URL is correct.
