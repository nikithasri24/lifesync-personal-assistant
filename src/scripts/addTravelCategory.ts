/**
 * Script to add Travel category to finance categories
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

async function addTravelCategory() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication error:', authError);
    return;
  }

  console.log('Adding Travel category for user:', user.id);

  // Check if Travel category already exists
  const { data: existing, error: checkError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('name', 'Travel')
    .maybeSingle();

  if (checkError) {
    console.error('Error checking for existing category:', checkError);
    return;
  }

  if (existing) {
    console.log('Travel category already exists:', existing.id);
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
    console.error('Error adding Travel category:', error);
    return;
  }

  console.log('✅ Successfully added Travel category:', data);
}

addTravelCategory()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  });
