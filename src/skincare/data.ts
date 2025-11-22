/**
 * Skincare data layer - Supabase integration
 */

import { supabase } from '../lib/supabase';
import type {
  SkincareProduct,
  SkincareProductInput,
  SkincareRoutine,
  SkincareRoutineInput,
  SkincareLog,
  SkincareLogInput,
  SkinObservation,
  SkinObservationInput,
  SkincareProductsResponse,
  SkincareRoutinesResponse,
  SkincareLogsResponse,
  SkinObservationsResponse,
  SkincareStreak,
  RoutineSummary,
} from './types';

// Helper function to convert snake_case to camelCase
function toCamelCase<T>(obj: unknown): T {
  if (!obj) return obj as T;
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase) as T;
  }
  if (typeof obj !== 'object') return obj as T;

  const camelObj: Record<string, unknown> = {};
  for (const key in obj as Record<string, unknown>) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    camelObj[camelKey] = toCamelCase((obj as Record<string, unknown>)[key]);
  }
  return camelObj as T;
}

// Helper function to convert camelCase to snake_case
function toSnakeCase(obj: unknown): unknown {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  if (typeof obj !== 'object') return obj;

  const snakeObj: Record<string, unknown> = {};
  for (const key in obj as Record<string, unknown>) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    snakeObj[snakeKey] = toSnakeCase((obj as Record<string, unknown>)[key]);
  }
  return snakeObj;
}

export const skincareAPI = {
  // ============= PRODUCTS =============

  async listProducts(): Promise<SkincareProductsResponse> {
    const { data, error } = await supabase
      .from('skincare_products')
      .select('*')
      .order('currently_using', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;
    return toCamelCase(data || []);
  },

  async getProduct(id: string): Promise<SkincareProduct | null> {
    const { data, error } = await supabase
      .from('skincare_products')
      .select('*')
      .eq('id', id)
      .single() as { data: unknown; error: unknown };

    if (error) throw error as Error;
    return toCamelCase<SkincareProduct | null>(data);
  },

  async createProduct(product: SkincareProductInput): Promise<SkincareProduct> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('skincare_products')
      .insert(toSnakeCase({ ...product, userId: userData.user.id }))
      .select()
      .single() as { data: unknown; error: unknown };

    if (error) throw error as Error;
    return toCamelCase<SkincareProduct>(data);
  },

  async updateProduct(id: string, updates: Partial<SkincareProductInput>): Promise<SkincareProduct> {
    const { data, error } = await supabase
      .from('skincare_products')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single() as { data: unknown; error: unknown };

    if (error) throw error as Error;
    return toCamelCase<SkincareProduct>(data);
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('skincare_products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ============= ROUTINES =============

  async listRoutines(): Promise<SkincareRoutinesResponse> {
    const { data, error } = await supabase
      .from('skincare_routines')
      .select('*')
      .order('is_active', { ascending: false })
      .order('routine_type', { ascending: true });

    if (error) throw error;
    return toCamelCase(data || []);
  },

  async getRoutine(id: string): Promise<SkincareRoutine | null> {
    const { data, error } = await supabase
      .from('skincare_routines')
      .select('*')
      .eq('id', id)
      .single() as { data: unknown; error: unknown };

    if (error) throw error as Error;
    return toCamelCase<SkincareRoutine | null>(data);
  },

  async createRoutine(routine: SkincareRoutineInput): Promise<SkincareRoutine> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('skincare_routines')
      .insert(toSnakeCase({ ...routine, userId: userData.user.id }))
      .select()
      .single() as { data: unknown; error: unknown };

    if (error) throw error as Error;
    return toCamelCase<SkincareRoutine>(data);
  },

  async updateRoutine(id: string, updates: Partial<SkincareRoutineInput>): Promise<SkincareRoutine> {
    const { data, error } = await supabase
      .from('skincare_routines')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single() as { data: unknown; error: unknown };

    if (error) throw error as Error;
    return toCamelCase<SkincareRoutine>(data);
  },

  async deleteRoutine(id: string): Promise<void> {
    const { error } = await supabase
      .from('skincare_routines')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ============= LOGS =============

  async listLogs(params?: {
    startDate?: string;
    endDate?: string;
    routineType?: string;
    limit?: number;
  }): Promise<SkincareLogsResponse> {
    let query = supabase
      .from('skincare_logs')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false });

    if (params?.startDate) {
      query = query.gte('date', params.startDate);
    }
    if (params?.endDate) {
      query = query.lte('date', params.endDate);
    }
    if (params?.routineType) {
      query = query.eq('routine_type', params.routineType);
    }
    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return {
      items: toCamelCase(data ?? []),
      total: count ?? 0,
    };
  },

  async getLog(id: string): Promise<SkincareLog | null> {
    const { data, error } = await supabase
      .from('skincare_logs')
      .select('*')
      .eq('id', id)
      .single() as { data: unknown; error: unknown };

    if (error) throw error as Error;
    return toCamelCase<SkincareLog | null>(data);
  },

  async getLogByDate(date: string, routineType: string): Promise<SkincareLog | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('skincare_logs')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('date', date)
      .eq('routine_type', routineType)
      .maybeSingle() as { data: unknown; error: unknown };

    if (error) throw error as Error;
    return toCamelCase<SkincareLog | null>(data);
  },

  async createLog(log: SkincareLogInput): Promise<SkincareLog> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('skincare_logs')
      .insert(toSnakeCase({ ...log, userId: userData.user.id }))
      .select()
      .single() as { data: unknown; error: unknown };

    if (error) throw error as Error;
    return toCamelCase<SkincareLog>(data);
  },

  async updateLog(id: string, updates: Partial<SkincareLogInput>): Promise<SkincareLog> {
    const { data, error } = await supabase
      .from('skincare_logs')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single() as { data: unknown; error: unknown };

    if (error) throw error as Error;
    return toCamelCase<SkincareLog>(data);
  },

  async deleteLog(id: string): Promise<void> {
    const { error } = await supabase
      .from('skincare_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ============= OBSERVATIONS =============

  async listObservations(params?: {
    startDate?: string;
    endDate?: string;
    resolved?: boolean;
    limit?: number;
  }): Promise<SkinObservationsResponse> {
    let query = supabase
      .from('skin_observations')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false });

    if (params?.startDate) {
      query = query.gte('date', params.startDate);
    }
    if (params?.endDate) {
      query = query.lte('date', params.endDate);
    }
    if (params?.resolved !== undefined) {
      query = query.eq('resolved', params.resolved);
    }
    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return {
      items: toCamelCase(data ?? []),
      total: count ?? 0,
    };
  },

  async createObservation(observation: SkinObservationInput): Promise<SkinObservation> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('skin_observations')
      .insert(toSnakeCase({ ...observation, userId: userData.user.id }))
      .select()
      .single() as { data: unknown; error: unknown };

    if (error) throw error as Error;
    return toCamelCase<SkinObservation>(data);
  },

  async updateObservation(id: string, updates: Partial<SkinObservationInput>): Promise<SkinObservation> {
    const { data, error } = await supabase
      .from('skin_observations')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single() as { data: unknown; error: unknown };

    if (error) throw error as Error;
    return toCamelCase<SkinObservation>(data);
  },

  async deleteObservation(id: string): Promise<void> {
    const { error } = await supabase
      .from('skin_observations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ============= ANALYTICS =============

  async getStreak(): Promise<SkincareStreak | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('skincare_streaks')
      .select('*')
      .eq('user_id', userData.user.id)
      .single() as { data: unknown; error: { code?: string } | null };

    if (error && error.code !== 'PGRST116') throw error as Error; // PGRST116 = no rows returned
    return toCamelCase<SkincareStreak | null>(data);
  },

  async getRoutineSummaries(): Promise<RoutineSummary[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('skincare_routine_summary')
      .select('*')
      .eq('user_id', userData.user.id);

    if (error) throw error;
    return toCamelCase(data || []);
  },
};
