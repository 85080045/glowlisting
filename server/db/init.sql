-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token balance per user
CREATE TABLE IF NOT EXISTS tokens_balance (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token usage history
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- generate | download
  image_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Images (basic)
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT,
  hd_path TEXT,
  thumbnail_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL, -- pro | pack | free
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revenue records
CREATE TABLE IF NOT EXISTS revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed super admin if not exists
INSERT INTO users (id, name, email, password_hash, is_admin)
SELECT gen_random_uuid(), 'Super Admin', 'dingmason@gmail.com', '$2a$10$JjoH9MuquMNFc13JUO2cSuu6MHcDL4wvSi7WuH6Kt4lUW.GDPwrba', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'dingmason@gmail.com');

INSERT INTO tokens_balance (user_id, balance)
SELECT id, 9999 FROM users WHERE email = 'dingmason@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET balance = EXCLUDED.balance;
