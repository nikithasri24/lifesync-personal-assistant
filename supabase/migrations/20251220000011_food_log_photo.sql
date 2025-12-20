-- ============================================================================
-- Add photo upload support to food logging
-- Allows users to take/upload photos of food for AI nutrition analysis
-- ============================================================================

-- Add image_url column to food_log for storing food photos
ALTER TABLE food_log ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add photo analysis metadata
ALTER TABLE food_log ADD COLUMN IF NOT EXISTS ai_analyzed BOOLEAN DEFAULT false;
ALTER TABLE food_log ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3, 2); -- 0.00 to 1.00

-- Add photo_url to food_items for custom foods with photos
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ============================================================================
-- Storage bucket for food photos
-- ============================================================================
-- Note: Run this in the Supabase dashboard or via supabase CLI storage:
-- supabase storage create food-photos --public

-- Policy for food photos bucket (run in dashboard):
-- CREATE POLICY "Users can upload own food photos" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'food-photos' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
-- 
-- CREATE POLICY "Users can view own food photos" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'food-photos' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- CREATE POLICY "Users can delete own food photos" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'food-photos' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );

-- ============================================================================
-- Comment for documentation
-- ============================================================================
COMMENT ON COLUMN food_log.image_url IS 'URL to photo of food (stored in food-photos bucket)';
COMMENT ON COLUMN food_log.ai_analyzed IS 'Whether nutrition was estimated by AI from photo';
COMMENT ON COLUMN food_log.ai_confidence IS 'AI confidence score for nutrition estimate (0.0-1.0)';
COMMENT ON COLUMN food_items.image_url IS 'Optional image URL for custom food items';

