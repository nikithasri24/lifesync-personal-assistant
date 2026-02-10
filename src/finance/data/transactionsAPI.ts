/**
 * Finance Transactions API
 * Handles transaction operations with cursor-based pagination
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticationError } from '@/lib/errors';
import type { Transaction, TxnQuery, Paginated, TransactionInput } from '../types';

export class TransactionsAPI {
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
  // TRANSACTIONS
  // =====================================================

  async listTransactions(params: TxnQuery): Promise<Paginated<Transaction>> {
    // Don't filter by user_id - let RLS handle access control
    // This allows viewing partner's transactions in merged mode
    let query = this.client
      .from('finance_transactions')
      .select('*');

    // Apply filters
    if (params.fromISO) query = query.gte('date', params.fromISO);
    if (params.toISO) query = query.lte('date', params.toISO);
    if (params.accountIds?.length) query = query.in('account_id', params.accountIds);
    if (params.categoryIds?.length) query = query.in('category_id', params.categoryIds);
    if (params.type) query = query.eq('type', params.type);
    if (params.text) query = query.ilike('description', `%${params.text}%`);

    // Cursor-based pagination
    // Cursor format: "date:id" (e.g., "2024-01-15:abc123")
    if (params.cursor) {
      try {
        const [cursorDate, cursorId] = params.cursor.split(':');
        if (cursorDate && cursorId) {
          // For descending order, get rows where (date < cursorDate) OR (date = cursorDate AND id < cursorId)
          query = query.or(`date.lt.${cursorDate},and(date.eq.${cursorDate},id.lt.${cursorId})`);
        }
      } catch (e) {
        // Invalid cursor format - ignore and start from beginning
      }
    }

    // Order by date DESC, then by id DESC for consistent pagination
    query = query.order('date', { ascending: false }).order('id', { ascending: false });

    // Fetch limit + 1 to determine if there are more results
    const limit = params.limit || 100;
    query = query.limit(limit + 1);

    const { data, error } = await query;
    if (error) throw error;

    const rows = data || [];
    const hasMore = rows.length > limit;
    const itemsToReturn = hasMore ? rows.slice(0, limit) : rows;

    const items = itemsToReturn.map(row => ({
      id: row.id,
      userId: row.user_id,
      accountId: row.account_id,
      dateISO: row.date,
      description: row.description,
      categoryId: row.category_id,
      amount: parseFloat(row.amount),
      type: row.type,
      notes: row.notes,
      merchantName: row.merchant_name,
      confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : undefined,
      suggestedCategoryId: row.suggested_category_id,
      categorizationRuleId: row.categorization_rule_id,
    }));

    // Generate next cursor if there are more results
    let nextCursor: string | undefined;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = `${lastItem.dateISO}:${lastItem.id}`;
    }

    return { items, nextCursor };
  }

  async upsertTransaction(txn: TransactionInput): Promise<void> {
    const currentUserId = await this.getUserId();

    if (txn.id) {
      // Update existing
      const { error } = await this.client
        .from('finance_transactions')
        .update({
          account_id: txn.accountId,
          date: txn.dateISO,
          description: txn.description,
          category_id: txn.categoryId,
          amount: txn.amount,
          type: txn.type,
          notes: txn.notes,
          merchant_name: txn.merchantName,
          confidence_score: txn.confidenceScore,
          suggested_category_id: txn.suggestedCategoryId,
          categorization_rule_id: txn.categorizationRuleId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', txn.id)
        .eq('user_id', currentUserId);

      if (error) throw error;
    } else {
      // Insert new - use provided userId or default to current user
      const { error } = await this.client
        .from('finance_transactions')
        .insert({
          user_id: txn.userId ?? currentUserId,
          account_id: txn.accountId,
          date: txn.dateISO,
          description: txn.description,
          category_id: txn.categoryId,
          amount: txn.amount,
          type: txn.type,
          notes: txn.notes,
          merchant_name: txn.merchantName,
          confidence_score: txn.confidenceScore,
          suggested_category_id: txn.suggestedCategoryId,
          categorization_rule_id: txn.categorizationRuleId,
        });

      if (error) throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client
      .from('finance_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }
}
