/**
 * Create 75 Hard photos storage bucket
 */

import { ensureSupabase } from '../lib/supabase';

async function createPhotosBucket() {
  const supabase = ensureSupabase();

  console.log('Creating 75hard-photos bucket...');

  // Create bucket
  const { data: bucket, error: bucketError } = await supabase.storage.createBucket('75hard-photos', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  });

  if (bucketError) {
    if (bucketError.message?.includes('already exists')) {
      console.log('✅ Bucket already exists');
    } else {
      console.error('❌ Error creating bucket:', bucketError);
      return;
    }
  } else {
    console.log('✅ Bucket created successfully');
  }

  console.log('\n✅ Photo storage is ready!');
}

createPhotosBucket().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
