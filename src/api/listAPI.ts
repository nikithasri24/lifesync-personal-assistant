/**
 * List API
 * Operations for list items with Supabase
 */

import { supabase } from '../lib/supabase';

export interface ListItem {
  id?: string;
  list_id: string;
  user_id: string;
  content: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Add an item to a list
 */
export async function addListItem(
  listId: string,
  content: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('list_items').insert({
    list_id: listId,
    user_id: user.id,
    content,
    completed: false,
  });

  if (error) throw error;
}

