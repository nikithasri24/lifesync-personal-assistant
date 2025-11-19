/**
 * API functions for managing user passports and visas
 */

import { supabase } from '../../lib/supabase';
import type { UserPassport, UserVisa } from '../types/visa';

// ========== PASSPORTS ==========

/**
 * Get all passports for the current user
 */
export async function getUserPassports(): Promise<UserPassport[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_passports')
    .select('*')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(p => ({
    id: p.id,
    userId: p.user_id,
    countryCode: p.country_code,
    countryName: p.country_name,
    passportNumber: p.passport_number,
    issueDate: p.issue_date,
    expiryDate: p.expiry_date,
    isPrimary: p.is_primary,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));
}

/**
 * Get primary passport for the current user
 */
export async function getPrimaryPassport(): Promise<UserPassport | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_passports')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    countryCode: data.country_code,
    countryName: data.country_name,
    passportNumber: data.passport_number,
    issueDate: data.issue_date,
    expiryDate: data.expiry_date,
    isPrimary: data.is_primary,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // If setting as primary, unset other primary passports first
  if (passport.isPrimary) {
    await supabase
      .from('user_passports')
      .update({ is_primary: false })
      .eq('user_id', user.id)
      .eq('is_primary', true);
  }

  const { data, error } = await supabase
    .from('user_passports')
    .insert({
      user_id: user.id,
      country_code: passport.countryCode,
      country_name: passport.countryName,
      passport_number: passport.passportNumber,
      issue_date: passport.issueDate,
      expiry_date: passport.expiryDate,
      is_primary: passport.isPrimary,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    countryCode: data.country_code,
    countryName: data.country_name,
    passportNumber: data.passport_number,
    issueDate: data.issue_date,
    expiryDate: data.expiry_date,
    isPrimary: data.is_primary,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update a passport
 */
export async function updatePassport(
  passportId: string,
  updates: Partial<Omit<UserPassport, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<UserPassport> {
  const { data: { user } } = await supabase.auth.getUser();
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

  const dbUpdates: any = {};
  if (updates.countryCode !== undefined) dbUpdates.country_code = updates.countryCode;
  if (updates.countryName !== undefined) dbUpdates.country_name = updates.countryName;
  if (updates.passportNumber !== undefined) dbUpdates.passport_number = updates.passportNumber;
  if (updates.issueDate !== undefined) dbUpdates.issue_date = updates.issueDate;
  if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate;
  if (updates.isPrimary !== undefined) dbUpdates.is_primary = updates.isPrimary;

  const { data, error } = await supabase
    .from('user_passports')
    .update(dbUpdates)
    .eq('id', passportId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    countryCode: data.country_code,
    countryName: data.country_name,
    passportNumber: data.passport_number,
    issueDate: data.issue_date,
    expiryDate: data.expiry_date,
    isPrimary: data.is_primary,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Delete a passport
 */
export async function deletePassport(passportId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
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
 * Get all visas for the current user
 */
export async function getUserVisas(): Promise<UserVisa[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_visas')
    .select('*')
    .eq('user_id', user.id)
    .order('expiry_date', { ascending: false });

  if (error) throw error;

  return (data || []).map(v => ({
    id: v.id,
    userId: v.user_id,
    countryCode: v.country_code,
    countryName: v.country_name,
    visaType: v.visa_type,
    issueDate: v.issue_date,
    expiryDate: v.expiry_date,
    multipleEntry: v.multiple_entry,
    maxStayDays: v.max_stay_days,
    notes: v.notes,
    createdAt: v.created_at,
    updatedAt: v.updated_at,
  }));
}

/**
 * Get active (non-expired) visas for the current user
 */
export async function getActiveVisas(): Promise<UserVisa[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('user_visas')
    .select('*')
    .eq('user_id', user.id)
    .gte('expiry_date', today)
    .order('expiry_date', { ascending: false });

  if (error) throw error;

  return (data || []).map(v => ({
    id: v.id,
    userId: v.user_id,
    countryCode: v.country_code,
    countryName: v.country_name,
    visaType: v.visa_type,
    issueDate: v.issue_date,
    expiryDate: v.expiry_date,
    multipleEntry: v.multiple_entry,
    maxStayDays: v.max_stay_days,
    notes: v.notes,
    createdAt: v.created_at,
    updatedAt: v.updated_at,
  }));
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_visas')
    .insert({
      user_id: user.id,
      country_code: visa.countryCode,
      country_name: visa.countryName,
      visa_type: visa.visaType,
      issue_date: visa.issueDate,
      expiry_date: visa.expiryDate,
      multiple_entry: visa.multipleEntry,
      max_stay_days: visa.maxStayDays,
      notes: visa.notes,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    countryCode: data.country_code,
    countryName: data.country_name,
    visaType: data.visa_type,
    issueDate: data.issue_date,
    expiryDate: data.expiry_date,
    multipleEntry: data.multiple_entry,
    maxStayDays: data.max_stay_days,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update a visa
 */
export async function updateVisa(
  visaId: string,
  updates: Partial<Omit<UserVisa, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<UserVisa> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const dbUpdates: any = {};
  if (updates.countryCode !== undefined) dbUpdates.country_code = updates.countryCode;
  if (updates.countryName !== undefined) dbUpdates.country_name = updates.countryName;
  if (updates.visaType !== undefined) dbUpdates.visa_type = updates.visaType;
  if (updates.issueDate !== undefined) dbUpdates.issue_date = updates.issueDate;
  if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate;
  if (updates.multipleEntry !== undefined) dbUpdates.multiple_entry = updates.multipleEntry;
  if (updates.maxStayDays !== undefined) dbUpdates.max_stay_days = updates.maxStayDays;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { data, error } = await supabase
    .from('user_visas')
    .update(dbUpdates)
    .eq('id', visaId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    countryCode: data.country_code,
    countryName: data.country_name,
    visaType: data.visa_type,
    issueDate: data.issue_date,
    expiryDate: data.expiry_date,
    multipleEntry: data.multiple_entry,
    maxStayDays: data.max_stay_days,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Delete a visa
 */
export async function deleteVisa(visaId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_visas')
    .delete()
    .eq('id', visaId)
    .eq('user_id', user.id);

  if (error) throw error;
}
