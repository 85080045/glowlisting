-- 创建 messages 表用于聊天式支持系统
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE, -- true = 管理员发送, false = 用户发送
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_admin ON messages(is_admin);

-- 将现有的 feedback 数据迁移到 messages（可选，保留 feedback 表用于历史记录）
-- 注意：这里不自动迁移，因为 feedback 和 messages 的结构不同

