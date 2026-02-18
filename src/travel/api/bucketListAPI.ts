/**
 * Bucket List API - CRUD operations for dream destinations
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { AuthenticationError, DatabaseError, NotFoundError } from '@/lib/errors';
import type { BucketListDestination, BucketListDestinationInput, CategorizedBucketListDestination, BucketListCategory_Ownership } from '../types';

/**
 * Helper function to categorize bucket list destination by ownership
 */
export function categorizeBucketListDestination(
  destination: BucketListDestination,
  currentUserId: string,
  partnerId: string | null
): BucketListCategory_Ownership {
  if (!partnerId) return 'mine';

  const sharedWith = destination.sharedWith || [];
  const hasCurrentUser = destination.userId === currentUserId || sharedWith.includes(currentUserId);
  const hasPartner = destination.userId === partnerId || sharedWith.includes(partnerId);

  if (hasCurrentUser && hasPartner) return 'shared';
  if (hasPartner) return 'partner';
  return 'mine';
}

/**
 * List all bucket list destinations for current user
 */
export async function listBucketListDestinations(): Promise<CategorizedBucketListDestination[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError('Not authenticated');

  const { data, error } = await supabase
    .from('travel_bucket_list')
    .select('*')
    .or(`userId.eq.${user.id},sharedWith.cs.{${user.id}}`)
    .order('priority', { ascending: false })
    .order('createdAt', { ascending: false });

  if (error) {
    logger.error('Travel', 'Failed to list bucket list destinations', { error });
    throw new DatabaseError(error.message);
  }

  // Get partner ID for categorization
  const { data: connectionData } = await supabase
    .from('merged_connections')
    .select('partnerId')
    .eq('userId', user.id)
    .eq('feature', 'travel')
    .maybeSingle();

  const partnerId = connectionData?.partnerId || null;

  return (data || []).map(dest => ({
    ...dest,
    ownershipCategory: categorizeBucketListDestination(dest, user.id, partnerId),
  }));
}

/**
 * Get a single bucket list destination by ID
 */
export async function getBucketListDestination(id: string): Promise<BucketListDestination> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError('Not authenticated');

  const { data, error } = await supabase
    .from('travel_bucket_list')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Travel', 'Failed to get bucket list destination', { error, id });
    throw new DatabaseError(error.message);
  }

  if (!data) {
    throw new NotFoundError('Bucket list destination', id);
  }

  return data;
}

/**
 * Create a new bucket list destination
 */
export async function createBucketListDestination(
  input: BucketListDestinationInput,
  sharedWith?: string[]
): Promise<BucketListDestination> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError('Not authenticated');

  const { data, error } = await supabase
    .from('travel_bucket_list')
    .insert({
      ...input,
      userId: user.id,
      sharedWith: sharedWith || [],
    })
    .select()
    .single();

  if (error) {
    logger.error('Travel', 'Failed to create bucket list destination', { error });
    throw new DatabaseError(error.message);
  }

  logger.info('Travel', 'Bucket list destination created', { id: data.id });
  return data;
}

/**
 * Update a bucket list destination
 */
export async function updateBucketListDestination(
  id: string,
  updates: Partial<BucketListDestinationInput>
): Promise<BucketListDestination> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError('Not authenticated');

  const { data, error } = await supabase
    .from('travel_bucket_list')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Travel', 'Failed to update bucket list destination', { error, id });
    throw new DatabaseError(error.message);
  }

  if (!data) {
    throw new NotFoundError('Bucket list destination', id);
  }

  logger.info('Travel', 'Bucket list destination updated', { id });
  return data;
}

/**
 * Delete a bucket list destination
 */
export async function deleteBucketListDestination(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError('Not authenticated');

  const { error } = await supabase
    .from('travel_bucket_list')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Travel', 'Failed to delete bucket list destination', { error, id });
    throw new DatabaseError(error.message);
  }

  logger.info('Travel', 'Bucket list destination deleted', { id });
}

/**
 * Mark destination as visited
 */
export async function markDestinationAsVisited(id: string): Promise<BucketListDestination> {
  return updateBucketListDestination(id, {
    isVisited: true,
    visitedDate: new Date().toISOString(),
  });
}

/**
 * Mark destination as not visited (back to bucket list)
 */
export async function markDestinationAsNotVisited(id: string): Promise<BucketListDestination> {
  return updateBucketListDestination(id, {
    isVisited: false,
    visitedDate: undefined,
  });
}
