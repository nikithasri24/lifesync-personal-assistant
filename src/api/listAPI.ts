/**
 * List API
 * Operations for list items with Supabase
 */

import { supabase } from '../lib/supabase';
import { apiCall, requireAuth } from './apiWrapper';

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
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase.from('list_items').insert({
        list_id: listId,
        user_id: user.id,
        content,
        completed: false,
      });

      if (error) throw error;
    },
    { domain: 'ListAPI', operation: 'addListItem', data: { listId, content } }
  );
}

