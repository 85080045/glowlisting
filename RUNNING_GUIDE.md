# Pholisting™ Running Guide

## Prerequisites

- **Node.js** 18 or higher
- **npm** (usually installed with Node.js)

Check versions:

```bash
node --version
npm --version
```

If not installed, download from [nodejs.org](https://nodejs.org/).

---

## Installation

### Step 1: Frontend dependencies

From project root:

```bash
npm install
```

### Step 2: Backend dependencies

```bash
cd server
npm install
cd ..
```

---

## Starting the app

**You need two terminal windows.**

### Terminal 1 – Frontend (port 3000)

From project root:

```bash
npm run dev
```

Success looks like:

```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:3000/
```

### Terminal 2 – Backend (port 3001)

From project root:

```bash
cd server
npm run dev
```

Success looks like:

```
🚀 Pholisting™ API server running at http://localhost:3001
📝 Set AUTOENHANCE_API_KEY in env for real image enhancement
```

---

## Open the app

Visit: **http://localhost:3000**

---

## API key (optional)

For real enhancement (not demo):

1. Get an API key from [autoenhance.ai](https://autoenhance.ai) or another provider.
2. Create `server/.env`:
   ```env
   AUTOENHANCE_API_KEY=your_api_key_here
   AUTOENHANCE_API_URL=https://api.autoenhance.ai/v1/enhance
   PORT=3001
   ```
3. Restart the backend.

Without an API key, the server returns the original image (demo only).

---

## Common issues

### Port already in use

- Change the port in `vite.config.js` (frontend) or `server/.env` (backend), or stop the process using the port.

### Cannot find module

```bash
rm -rf node_modules package-lock.json
npm install
cd server
rm -rf node_modules package-lock.json
npm install
```

### API connection error

1. Ensure the backend is running (Terminal 2).
2. Check the browser console.
3. Verify `VITE_ENHANCE_API_URL` in the frontend env.

### Upload fails

- Keep files under 10MB and use JPG, PNG, or other supported formats.

---

## Command reference

```bash
# Install all (frontend + backend)
npm install && cd server && npm install && cd ..

# Start frontend (Terminal 1)
npm run dev

# Start backend (Terminal 2)
cd server && npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

For more information, see [README.md](./README.md).
