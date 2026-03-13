-- Add youtube_url to batch_cook_sessions for reference cooking videos
ALTER TABLE batch_cook_sessions ADD COLUMN IF NOT EXISTS youtube_url text;
