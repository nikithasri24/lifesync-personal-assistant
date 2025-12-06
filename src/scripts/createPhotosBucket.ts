/**
 * Script to create the 75hard-photos storage bucket
 * Run with: npx tsx src/scripts/createPhotosBucket.ts
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../services/logger';

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? 'https://rfwaiijodrowakcpayoa.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd2FpaWpvZHJvd2FrY3BheW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDA0OTMsImV4cCI6MjA3MzcxNjQ5M30.NovyRrFV9k6iVK8FWpakCmxAzRCsUFmrxOtHIeepfqs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBucket(): Promise<void> {
  logger.debug('CreatePhotosBucket', 'Creating 75hard-photos bucket...');

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    logger.error('Error listing buckets:', { listError });
    return;
  }

  const bucketExists = buckets?.some(b => b.id === '75hard-photos');

  if (bucketExists) {
    logger.debug('CreatePhotosBucket', '✅ Bucket already exists!');
    return;
  }

  // Create bucket
  const { data, error } = await supabase.storage.createBucket('75hard-photos', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  });

  if (error) {
    logger.error('❌ Error creating bucket:', { error });
    return;
  }

  logger.debug('✅ Bucket created successfully!', { data });
}

createBucket().catch((error: unknown) => logger.error('PhotosBucket', error));
