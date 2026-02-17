/**
 * List API
 * Operations for list items with Supabase
 */

import { supabase } from '../lib/supabase';
import { apiCall, requireAuth } from './apiWrapper';

export interface ListItem {
  id?: string;
  note_id: string;
  user_id: string;
  title: string;
  notes?: string | null;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Add an item to a list
 */
export async function addListItem(
  noteId: string,
  title: string
): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase.from('list_items').insert({
        note_id: noteId,
        user_id: user.id,
        title,
        completed: false,
      });

      if (error) throw error;
    },
    { domain: 'ListAPI', operation: 'addListItem', data: { noteId, title } }
  );
}

