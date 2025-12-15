/**
 * Script to add Travel category to finance categories
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../services/logger';
import type { User } from '@supabase/supabase-js';

// Ensure environment variables are defined
const supabaseUrl: string = process.env.VITE_SUPABASE_URL ?? '';
const supabaseKey: string = process.env.VITE_SUPABASE_ANON_KEY ?? '';

interface ExistingCategory {
  id: number;
  name: string;
}

interface NewCategory {
  user_id: string;
  name: string;
  icon: string;
  color: string;
}

async function addTravelCategory(): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get current user with explicit typing
  const { data, error: authError } = await supabase.auth.getUser();
  const user: User | null = data?.user ?? null;

  if (authError || !user) {
    logger.error('AddTravelCategory', authError?.message ?? 'Unknown error', { operation: 'authentication' });
    return;
  }

  logger.info('AddTravelCategory', 'Adding Travel category for user', { userId: user.id });

  // Explicitly type the existing category check
  const { data: existing, error: checkError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('name', 'Travel')
    .maybeSingle<ExistingCategory>();

  if (checkError) {
    logger.error('AddTravelCategory', checkError.message, { operation: 'checkExisting' });
    return;
  }

  if (existing) {
    logger.info('AddTravelCategory', 'Travel category already exists', { categoryId: existing.id });
    return;
  }

  // Define new category with explicit typing
  const newCategory: NewCategory = {
    user_id: user.id,
    name: 'Travel',
    icon: '✈️',
    color: '#06b6d4', // cyan-500
  };

  // Insert Travel category with explicit typing
  const { data: insertedData, error } = await supabase
    .from('categories')
    .insert(newCategory)
    .select()
    .single<NewCategory>();

  if (error) {
    logger.error('AddTravelCategory', error.message, { operation: 'insertCategory' });
    return;
  }

  logger.info('AddTravelCategory', '✅ Successfully added Travel category', { categoryName: newCategory.name });
}

addTravelCategory()
  .then(() => {
    logger.info('AddTravelCategory', 'Script completed', {});
    process.exit(0);
  })
  .catch((err: unknown) => {
    logger.error('AddTravelCategory', err instanceof Error ? err : String(err), { operation: 'script' });
    process.exit(1);
  });