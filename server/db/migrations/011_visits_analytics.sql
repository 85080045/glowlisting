-- 访问追踪和统计表
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  page_path VARCHAR(500) NOT NULL,
  referrer VARCHAR(1000),
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  user_agent TEXT,
  ip_address INET,
  country VARCHAR(100),
  country_code VARCHAR(10),
  city VARCHAR(100),
  device_type VARCHAR(50), -- desktop, mobile, tablet
  browser VARCHAR(100),
  os VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 结账放弃追踪表
CREATE TABLE IF NOT EXISTS checkout_abandonments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  plan_type VARCHAR(50), -- pro, pack, etc.
  price_id VARCHAR(255),
  amount DECIMAL(10, 2),
  currency VARCHAR(10),
  page_path VARCHAR(500),
  referrer VARCHAR(1000),
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_visits_session_id ON visits(session_id);
CREATE INDEX IF NOT EXISTS idx_visits_user_id ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_page_path ON visits(page_path);
CREATE INDEX IF NOT EXISTS idx_visits_utm_source ON visits(utm_source);
CREATE INDEX IF NOT EXISTS idx_checkout_abandonments_session_id ON checkout_abandonments(session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_abandonments_user_id ON checkout_abandonments(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_abandonments_created_at ON checkout_abandonments(created_at DESC);

