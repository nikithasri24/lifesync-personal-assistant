/**
 * Finance Institutions API
 * Handles financial institution operations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticationError } from '@/lib/errors';
import type { Institution } from '../types';

export class InstitutionsAPI {
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
  // INSTITUTIONS
  // =====================================================

  async listInstitutions(): Promise<Institution[]> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('finance_institutions')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      logoUrl: row.logo_url,
    }));
  }
}
