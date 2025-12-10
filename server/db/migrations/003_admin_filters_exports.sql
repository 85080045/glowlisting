-- Additional indices for admin filters
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_token_usage_action ON token_usage(action);

CREATE INDEX IF NOT EXISTS idx_revenue_created_at ON revenue(created_at);

