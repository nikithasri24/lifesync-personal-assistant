/**
 * Script to add Travel category to finance categories
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../services/logger';


const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

async function addTravelCategory() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.error('AddTravelCategory', 'Authentication error:', authError);
    return;
  }

  logger.info('AddTravelCategory', 'Adding Travel category for user:', user.id);

  // Check if Travel category already exists
  const { data: existing, error: checkError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('name', 'Travel')
    .maybeSingle();

  if (checkError) {
    logger.error('AddTravelCategory', 'Error checking for existing category:', checkError);
    return;
  }

  if (existing) {
    logger.info('AddTravelCategory', 'Travel category already exists:', existing.id);
    return;
  }

  // Insert Travel category
  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name: 'Travel',
      icon: '✈️',
      color: '#06b6d4', // cyan-500
    })
    .select()
    .single();

  if (error) {
    logger.error('AddTravelCategory', 'Error adding Travel category:', error);
    return;
  }

  logger.info('AddTravelCategory', '✅ Successfully added Travel category:', data);
}

addTravelCategory()
  .then(() => {
    logger.info('AddTravelCategory', 'Script completed');
    process.exit(0);
  })
  .catch((err) => {
    logger.error('AddTravelCategory', 'Script failed:', err);
    process.exit(1);
  });
