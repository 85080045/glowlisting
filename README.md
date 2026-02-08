# Pholisting™ – AI Photo Enhancement for Real Estate

AI-powered photo enhancement for real estate agents, Airbnb hosts, and property managers. Upload photos and get listing-ready results without a professional photographer.

## Features

- **AI enhancement** – Auto-adjust brightness, contrast, color, and clarity
- **Easy to use** – Upload from your phone; no photo skills required
- **Fast** – Results in seconds after upload
- **Cost-effective** – No need to hire a photographer
- **Professional output** – Quality comparable to pro real estate photography
- **Batch support** – Upload and process multiple photos

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)

### Backend
- Node.js
- Express
- Multer (file upload)
- Axios (API calls)

## Install & Run

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
cd server
npm install
cd ..
```

### 3. Environment variables

Create `.env` in the project root (frontend):

```env
VITE_ENHANCE_API_URL=http://localhost:3001/api/enhance
```

Create `server/.env` (backend):

```env
AUTOENHANCE_API_KEY=your_api_key_here
AUTOENHANCE_API_URL=https://api.autoenhance.ai/v1/enhance
PORT=3001
```

### 4. Start dev servers

**Terminal 1 – frontend:**
```bash
npm run dev
```

**Terminal 2 – backend:**
```bash
cd server
npm run dev
```

Open http://localhost:3000

## API integration

### autoenhance.ai

1. Sign up and get an API key at [autoenhance.ai](https://autoenhance.ai).
2. Set in `server/.env`:
   ```env
   AUTOENHANCE_API_KEY=your_api_key_here
   AUTOENHANCE_API_URL=https://api.autoenhance.ai/v1/enhance
   ```
3. Restart the backend.

### Other image APIs

You can plug in other services in `server/index.js` at the `/api/enhance` endpoint (e.g. Adobe Photoshop API, Remove.bg, or other AI image APIs).

## Project structure

```
Pholisting™/
├── src/
│   ├── components/       # React components
│   ├── services/         # API services
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── server/               # Backend
│   ├── index.js
│   └── package.json
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Build for production

```bash
npm run build
```

Output is in `dist/`.

### Deployment

- **Frontend:** Vercel, Netlify, GitHub Pages, or any static host
- **Backend:** Heroku, Railway, DigitalOcean, AWS, or any Node.js host

## Security

1. **API keys** – Never commit API keys to Git.
2. **File size** – 10MB limit is enforced.
3. **CORS** – Configure CORS correctly for production.
4. **Rate limiting** – Consider adding rate limits to the API.

## License

MIT License

---

Made for real estate professionals
