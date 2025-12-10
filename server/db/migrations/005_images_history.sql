-- 扩展 images 表，支持永久保存图片历史
-- 添加原图和增强图的 base64 数据字段
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS original_data TEXT, -- 原图 base64 数据
ADD COLUMN IF NOT EXISTS enhanced_data TEXT, -- 增强图 base64 数据
ADD COLUMN IF NOT EXISTS thumbnail_data TEXT, -- 缩略图 base64 数据
ADD COLUMN IF NOT EXISTS original_filename TEXT, -- 原始文件名
ADD COLUMN IF NOT EXISTS file_size BIGINT, -- 文件大小（字节）
ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT 'image/jpeg', -- MIME 类型
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(); -- 更新时间

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_images_user_id_created_at ON images(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);

-- 更新 token_usage 表，确保 image_id 可以关联到 images 表
-- 如果 image_id 是 UUID 格式，可以添加外键约束
-- ALTER TABLE token_usage ADD CONSTRAINT fk_token_usage_image_id FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL;

