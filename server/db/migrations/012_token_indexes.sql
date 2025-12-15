-- Additional indices for token balance and usage queries
-- This migration adds indexes to improve query performance for token-related operations

-- Token usage indices for better query performance
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_action ON token_usage(user_id, action);

-- Token balance indices
CREATE INDEX IF NOT EXISTS idx_tokens_balance_user_id ON tokens_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_balance_updated_at ON tokens_balance(updated_at);

