/**
 * Finance Categories API
 * Handles transaction category operations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticationError } from '@/lib/errors';
import type { Category } from '../types';

export class CategoriesAPI {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  private async getUserId(): Promise<string> {
    const { data: { user }, error } = await this.client.auth.getUser();
    if (error || !user) throw new AuthenticationError('Not authenticated', { error });
    return user.id;
  }

  // =====================================================
  // CATEGORIES
  // =====================================================

  async listCategories(): Promise<Category[]> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('finance_categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      parentId: row.parent_id,
      icon: row.icon,
      color: row.color,
    }));
  }
}
