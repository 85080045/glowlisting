# User authentication system

## Implemented features

### 1. Registration and login
- Registration and login pages
- JWT authentication
- Passwords stored with bcrypt

### 2. Token system
- New users receive initial tokens
- Remaining tokens shown in the header
- One token consumed per enhanced image
- User is notified when tokens run out

### 3. UI
- Login / register pages
- User dashboard
- Profile and usage stats (processed count, etc.)

### 4. Backend API
- `/api/auth/register` – register
- `/api/auth/login` – login
- `/api/auth/me` – current user
- `/api/enhance` – image enhancement (requires auth and tokens)

## Dependencies

### Frontend
```bash
npm install react-router-dom
```

### Backend
```bash
cd server
npm install bcryptjs jsonwebtoken dotenv
```

## Setup and run

### 1. Install
```bash
npm install
cd server && npm install && cd ..
```

### 2. Environment (optional)

Create `server/.env`:
```env
JWT_SECRET=your-secret-key-here
PORT=3001
AUTOENHANCE_API_KEY=your_api_key_here
```

### 3. Start

**Terminal 1 – frontend:** `npm run dev`  
**Terminal 2 – backend:** `cd server && npm run dev`

## Usage

### Register
1. Go to `/login`
2. Click “Sign up” (or equivalent)
3. Fill name, email, password
4. After signup you are logged in and redirected to the dashboard; new users get initial free tokens

### Login
1. Go to `/login`
2. Enter email and password
3. You are redirected to the dashboard

### Image enhancement
1. From dashboard or home, upload a photo
2. Click “Enhance”
3. One token is used; remaining tokens are shown in the header

## Security

- Passwords hashed with bcrypt
- JWT with configurable expiry (e.g. 30 days)
- Token-check middleware
- Token balance checked before enhancement

## Production notes

1. Use a strong `JWT_SECRET`
2. Use a real database (e.g. PostgreSQL) instead of in-memory storage
3. Consider token purchase and subscription features
4. Consider password reset and email verification
