/**
 * API functions for managing user passports and visas
 */

import { supabase } from '../../lib/supabase';
import { getMergedConnectionId, type MergedConnectionResult } from '../../shared/api/SharedDataProvider';
import type { UserPassport, UserVisa } from '../types/visa';
import { logger } from '../../services/logger';

// Cache for merged connection (to avoid repeated database calls)
let cachedMergedConnection: MergedConnectionResult | null | undefined = undefined;

/**
 * Get the merged connection ID for visa module if both users have enabled merged mode.
 * Results are cached for the session to avoid repeated database calls.
 */
export async function getVisaMergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedMergedConnection !== undefined) {
    logger.debug('Travel', 'Using cached merged connection', { cachedMergedConnection });
    return cachedMergedConnection;
  }
  cachedMergedConnection = await getMergedConnectionId('visa');
  logger.debug('Travel', 'Fetched merged connection', { cachedMergedConnection });
  return cachedMergedConnection;
}

/**
 * Clear the cached merged connection (call when permissions change)
 */
export function clearVisaMergedConnectionCache(): void {
  cachedMergedConnection = undefined;
}

// Database row types (snake_case as stored in Supabase)
interface UserPassportRow {
  id: string;
  user_id: string;
  country_code: string;
  country_name: string;
  passport_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

interface UserVisaRow {
  id: string;
  user_id: string;
  country_code: string;
  country_name: string;
  visa_type: string;
  issue_date: string | null;
  expiry_date: string;
  multiple_entry: boolean;
  max_stay_days: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Type guard functions
function isUserPassportRow(data: unknown): data is UserPassportRow {
  if (!data || typeof data !== 'object') return false;
  const row = data as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.user_id === 'string' &&
    typeof row.country_code === 'string' &&
    typeof row.country_name === 'string' &&
    (row.passport_number === null || typeof row.passport_number === 'string') &&
    (row.issue_date === null || typeof row.issue_date === 'string') &&
    (row.expiry_date === null || typeof row.expiry_date === 'string') &&
    typeof row.is_primary === 'boolean' &&
    typeof row.created_at === 'string' &&
    typeof row.updated_at === 'string'
  );
}

function isUserVisaRow(data: unknown): data is UserVisaRow {
  if (!data || typeof data !== 'object') return false;
  const row = data as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.user_id === 'string' &&
    typeof row.country_code === 'string' &&
    typeof row.country_name === 'string' &&
    typeof row.visa_type === 'string' &&
    (row.issue_date === null || typeof row.issue_date === 'string') &&
    typeof row.expiry_date === 'string' &&
    typeof row.multiple_entry === 'boolean' &&
    (row.max_stay_days === null || typeof row.max_stay_days === 'number') &&
    (row.notes === null || typeof row.notes === 'string') &&
    typeof row.created_at === 'string' &&
    typeof row.updated_at === 'string'
  );
}

// Conversion functions
function passportRowToUserPassport(row: UserPassportRow): UserPassport {
  return {
    id: row.id,
    userId: row.user_id,
    countryCode: row.country_code,
    countryName: row.country_name,
    passportNumber: row.passport_number ?? undefined,
    issueDate: row.issue_date ?? undefined,
    expiryDate: row.expiry_date ?? undefined,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function visaRowToUserVisa(row: UserVisaRow): UserVisa {
  return {
    id: row.id,
    userId: row.user_id,
    countryCode: row.country_code,
    countryName: row.country_name,
    visaType: row.visa_type,
    issueDate: row.issue_date ?? '',
    expiryDate: row.expiry_date,
    multipleEntry: row.multiple_entry,
    maxStayDays: row.max_stay_days ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ========== PASSPORTS ==========

/**
 * Get all passports for the current user.
 * In merged mode, returns passports from both users.
 * RLS policies handle access control automatically.
 */
export async function getUserPassports(): Promise<UserPassport[]> {
  const { data: authData } = await supabase.auth.getUser();
  const { user } = authData;
  if (!user) throw new Error('Not authenticated');

  // RLS policies automatically handle merged mode access
  // No need to check merged connection here - just query all accessible passports
  const { data, error } = await supabase
    .from('user_passports')
    .select('*')
    .order('is_primary', { ascending: false})
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  return rows
    .filter((row): row is UserPassportRow => isUserPassportRow(row))
    .map(passportRowToUserPassport);
}

/**
 * Get primary passport for the current user.
 * In merged mode, returns the current user's primary passport (not partner's).
 */
export async function getPrimaryPassport(): Promise<UserPassport | null> {
  const { data: authData } = await supabase.auth.getUser();
  const { user } = authData;
  if (!user) throw new Error('Not authenticated');

  const result = await supabase
    .from('user_passports')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .single();

  if (result.error) {
    if (result.error.code === 'PGRST116') return null; // No rows returned
    throw result.error;
  }

  if (!result.data || !isUserPassportRow(result.data)) return null;

  return passportRowToUserPassport(result.data);
}

/**
 * Add a new passport
 */
export async function addPassport(passport: {
  countryCode: string;
  countryName: string;
  passportNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  isPrimary: boolean;
}): Promise<UserPassport> {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  logger.debug('Travel', 'Auth data retrieved', { hasUser: !!authData?.user, hasError: !!authError });

  if (authError) {
    logger.error('Travel', authError, { action: 'get user auth' });
    throw new Error(`Authentication error: ${authError.message}`);
  }

  const { user } = authData;
  if (!user) {
    logger.error('Travel', 'No user found in auth data', {});
    throw new Error('Not authenticated');
  }

  if (!user.id) {
    logger.error('Travel', 'User ID is null/undefined', { user });
    throw new Error('User ID is missing');
  }

  logger.debug('Travel', 'Adding passport', { userId: user.id, country: passport.countryCode });

  // If setting as primary, unset other primary passports first
  if (passport.isPrimary) {
    const updateResult = await supabase
      .from('user_passports')
      .update({ is_primary: false })
      .eq('user_id', user.id)
      .eq('is_primary', true);

    logger.debug('Travel', 'Unset primary passport', { updateResult });
  }

  const insertData = {
    user_id: user.id,
    country_code: passport.countryCode,
    country_name: passport.countryName,
    passport_number: passport.passportNumber ?? null,
    issue_date: passport.issueDate ?? null,
    expiry_date: passport.expiryDate ?? null,
    is_primary: passport.isPrimary,
  };

  logger.debug('Travel', 'Inserting passport data', { country: passport.countryCode });

  const result = await supabase
    .from('user_passports')
    .insert(insertData)
    .select()
    .single();

  logger.debug('Travel', 'Passport insert result', { hasData: !!result.data, hasError: !!result.error });

  if (result.error) {
    logger.error('Travel', result.error, { action: 'insert passport' });
    throw result.error;
  }

  if (!result.data || !isUserPassportRow(result.data)) {
    logger.error('Travel', 'Invalid data returned from database', { data: result.data });
    throw new Error('Invalid passport data returned from database');
  }

  return passportRowToUserPassport(result.data);
}

/**
 * Update a passport
 */
export async function updatePassport(
  passportId: string,
  updates: Partial<Omit<UserPassport, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<UserPassport> {
  const { data: authData } = await supabase.auth.getUser();
  const { user } = authData;
  if (!user) throw new Error('Not authenticated');

  // If setting as primary, unset other primary passports first
  if (updates.isPrimary) {
    await supabase
      .from('user_passports')
      .update({ is_primary: false })
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .neq('id', passportId);
  }

  const dbUpdates: Partial<Omit<UserPassportRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>> = {};
  if (updates.countryCode !== undefined) dbUpdates.country_code = updates.countryCode;
  if (updates.countryName !== undefined) dbUpdates.country_name = updates.countryName;
  if (updates.passportNumber !== undefined) dbUpdates.passport_number = updates.passportNumber ?? null;
  if (updates.issueDate !== undefined) dbUpdates.issue_date = updates.issueDate ?? null;
  if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate ?? null;
  if (updates.isPrimary !== undefined) dbUpdates.is_primary = updates.isPrimary;

  const result = await supabase
    .from('user_passports')
    .update(dbUpdates)
    .eq('id', passportId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (result.error) throw result.error;
  if (!result.data || !isUserPassportRow(result.data)) {
    throw new Error('Invalid passport data returned from database');
  }

  return passportRowToUserPassport(result.data);
}

/**
 * Delete a passport
 */
export async function deletePassport(passportId: string): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  const { user } = authData;
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_passports')
    .delete()
    .eq('id', passportId)
    .eq('user_id', user.id);

  if (error) throw error;
}

// ========== VISAS ==========

/**
 * Get all visas for the current user.
 * In merged mode, returns visas from both users.
 * RLS policies handle access control automatically.
 */
export async function getUserVisas(): Promise<UserVisa[]> {
  const { data: authData } = await supabase.auth.getUser();
  const { user } = authData;
  if (!user) throw new Error('Not authenticated');

  // RLS policies automatically handle merged mode access
  // No need to check merged connection here - just query all accessible visas
  const { data, error } = await supabase
    .from('user_visas')
    .select('*')
    .order('expiry_date', { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  return rows
    .filter((row): row is UserVisaRow => isUserVisaRow(row))
    .map(visaRowToUserVisa);
}

/**
 * Get active (non-expired) visas for the current user.
 * In merged mode, returns active visas from both users.
 */
export async function getActiveVisas(): Promise<UserVisa[]> {
  const { data: authData } = await supabase.auth.getUser();
  const { user } = authData;
  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];

  // RLS policies automatically handle merged mode access
  const { data, error } = await supabase
    .from('user_visas')
    .select('*')
    .gte('expiry_date', today)
    .order('expiry_date', { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  return rows
    .filter((row): row is UserVisaRow => isUserVisaRow(row))
    .map(visaRowToUserVisa);
}

/**
 * Add a new visa
 */
export async function addVisa(visa: {
  countryCode: string;
  countryName: string;
  visaType?: string;
  issueDate?: string;
  expiryDate: string;
  multipleEntry: boolean;
  maxStayDays?: number;
  notes?: string;
}): Promise<UserVisa> {
  const { data: authData } = await supabase.auth.getUser();
  const { user } = authData;
  if (!user) throw new Error('Not authenticated');

  const result = await supabase
    .from('user_visas')
    .insert({
      user_id: user.id,
      country_code: visa.countryCode,
      country_name: visa.countryName,
      visa_type: visa.visaType ?? '',
      issue_date: visa.issueDate ?? null,
      expiry_date: visa.expiryDate,
      multiple_entry: visa.multipleEntry,
      max_stay_days: visa.maxStayDays ?? null,
      notes: visa.notes ?? null,
    })
    .select()
    .single();

  if (result.error) throw result.error;
  if (!result.data || !isUserVisaRow(result.data)) {
    throw new Error('Invalid visa data returned from database');
  }

  return visaRowToUserVisa(result.data);
}

/**
 * Update a visa
 */
export async function updateVisa(
  visaId: string,
  updates: Partial<Omit<UserVisa, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<UserVisa> {
  const { data: authData } = await supabase.auth.getUser();
  const { user } = authData;
  if (!user) throw new Error('Not authenticated');

  const dbUpdates: Partial<Omit<UserVisaRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>> = {};
  if (updates.countryCode !== undefined) dbUpdates.country_code = updates.countryCode;
  if (updates.countryName !== undefined) dbUpdates.country_name = updates.countryName;
  if (updates.visaType !== undefined) dbUpdates.visa_type = updates.visaType;
  if (updates.issueDate !== undefined) dbUpdates.issue_date = updates.issueDate ?? null;
  if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate;
  if (updates.multipleEntry !== undefined) dbUpdates.multiple_entry = updates.multipleEntry;
  if (updates.maxStayDays !== undefined) dbUpdates.max_stay_days = updates.maxStayDays ?? null;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes ?? null;

  const result = await supabase
    .from('user_visas')
    .update(dbUpdates)
    .eq('id', visaId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (result.error) throw result.error;
  if (!result.data || !isUserVisaRow(result.data)) {
    throw new Error('Invalid visa data returned from database');
  }

  return visaRowToUserVisa(result.data);
}

/**
 * Delete a visa
 */
export async function deleteVisa(visaId: string): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  const { user } = authData;
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_visas')
    .delete()
    .eq('id', visaId)
    .eq('user_id', user.id);

  if (error) throw error;
}
