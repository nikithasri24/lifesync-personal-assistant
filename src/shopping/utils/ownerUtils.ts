/**
 * Owner Utilities
 * Helper functions for managing owner information in merged mode
 */

import { supabase } from '@/lib/supabase';

export interface OwnerInfo {
  ownerId: string;
  ownerName: string;
  isOwnedByCurrentUser: boolean;
}

/**
 * Get owner information for a specific user ID
 */
export async function getOwnerInfo(userId: string): Promise<OwnerInfo> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const isOwnedByCurrentUser = userId === user.id;

  if (isOwnedByCurrentUser) {
    return {
      ownerId: userId,
      ownerName: 'Me',
      isOwnedByCurrentUser: true,
    };
  }

  // Get partner's name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .single();

  return {
    ownerId: userId,
    ownerName: profile?.full_name || profile?.email || 'Partner',
    isOwnedByCurrentUser: false,
  };
}

/**
 * Add owner information to an array of items
 */
export function addOwnerInfo<T extends { user_id: string }>(
  items: T[],
  currentUserId: string,
  partnerName: string = 'Partner'
): (T & OwnerInfo)[] {
  return items.map(item => ({
    ...item,
    ownerId: item.user_id,
    ownerName: item.user_id === currentUserId ? 'Me' : partnerName,
    isOwnedByCurrentUser: item.user_id === currentUserId,
  }));
}

/**
 * Get partner name from active connection
 */
export async function getPartnerName(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'Partner';

  const { data: connections } = await supabase
    .from('profile_connections')
    .select(`
      requester_id,
      receiver_id,
      requester_user:profiles!profile_connections_requester_id_fkey(full_name, email),
      receiver_user:profiles!profile_connections_receiver_id_fkey(full_name, email)
    `)
    .eq('status', 'active')
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .single();

  if (!connections) return 'Partner';

  const isRequester = connections.requester_id === user.id;
  const partnerProfile = isRequester ? connections.receiver_user : connections.requester_user;
  
  // Handle both array and object responses
  const profile = Array.isArray(partnerProfile) ? partnerProfile[0] : partnerProfile;
  
  return profile?.full_name || profile?.email || 'Partner';
}

/**
 * Check if user has merged permission for shopping module
 */
export async function hasMergedPermission(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('module_permissions')
    .select('permission_level')
    .eq('user_id', user.id)
    .eq('module', 'shopping')
    .eq('permission_level', 'merged')
    .single();

  return !!data;
}

/**
 * Get connection_id for merged mode
 */
export async function getConnectionId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('module_permissions')
    .select('connection_id')
    .eq('user_id', user.id)
    .eq('module', 'shopping')
    .eq('permission_level', 'merged')
    .single();

  return data?.connection_id ?? null;
}

