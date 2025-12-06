-- Create storage bucket for 75 Hard progress photos
-- This bucket stores daily progress photos uploaded by users

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  '75hard-photos',
  '75hard-photos',
  true,  -- Public bucket for easy access to photos
  5242880,  -- 5MB limit per photo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']  -- Only allow image uploads
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy: Users can upload their own photos
CREATE POLICY "Users can upload own 75hard photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = '75hard-photos' AND
  -- Check that the path starts with user's challenge ID
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM sfh_challenge WHERE user_id = auth.uid()
  )
);

-- Create RLS policy: Users can view their own photos
CREATE POLICY "Users can view own 75hard photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = '75hard-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM sfh_challenge WHERE user_id = auth.uid()
  )
);

-- Create RLS policy: Users can delete their own photos
CREATE POLICY "Users can delete own 75hard photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = '75hard-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM sfh_challenge WHERE user_id = auth.uid()
  )
);

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
