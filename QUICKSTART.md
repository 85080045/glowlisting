# Quick Start Guide

## 5-minute setup

### Step 1: Install dependencies

```bash
npm install
cd server
npm install
cd ..
```

### Step 2: Start services

Use two terminal windows.

**Terminal 1 – frontend:**
```bash
npm run dev
```

**Terminal 2 – backend:**
```bash
cd server
npm run dev
```

### Step 3: Open the app

Visit: http://localhost:3000

## API key (optional)

To use real image enhancement (not demo mode):

1. Sign up at [autoenhance.ai](https://autoenhance.ai) and get an API key.
2. Create `server/.env`:
   ```env
   AUTOENHANCE_API_KEY=your_api_key_here
   AUTOENHANCE_API_URL=https://api.autoenhance.ai/v1/enhance
   PORT=3001
   ```
3. Restart the backend.

Without an API key, the app returns the original image (demo only).

## Usage

1. **Upload** – Click or drag photos into the upload area.
2. **Enhance** – Click “Enhance” (or equivalent) to run AI enhancement.
3. **Download** – When done, download the enhanced photo.

## Troubleshooting

### Port in use
Change ports if needed:
- Frontend: `port` in `vite.config.js`
- Backend: `PORT` in `server/.env`

### API connection fails
- Ensure the backend is running.
- Check `VITE_ENHANCE_API_URL` in the frontend env.
- Check browser console and server logs.

### Upload fails
- Keep images under 10MB.
- Use JPG or PNG.

For more detail, see [README.md](./README.md).
