-- Extend images table for persistent history; add base64 and metadata columns
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS original_data TEXT,
ADD COLUMN IF NOT EXISTS enhanced_data TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_data TEXT,
ADD COLUMN IF NOT EXISTS original_filename TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT 'image/jpeg',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_images_user_id_created_at ON images(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
