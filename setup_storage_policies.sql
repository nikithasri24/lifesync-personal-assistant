-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own 75hard photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own 75hard photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own 75hard photos" ON storage.objects;

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
