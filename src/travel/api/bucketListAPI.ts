/**
 * Bucket List API - CRUD operations for dream destinations
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { AuthenticationError, DatabaseError, NotFoundError } from '@/lib/errors';
import { getMergedConnectionId } from '@/shared/api/SharedDataProvider';
import type { BucketListDestination, BucketListDestinationRow, BucketListDestinationInput, CategorizedBucketListDestination, BucketListCategory_Ownership } from '../types';

/**
 * Convert database row (snake_case) to application type (camelCase)
 */
function rowToDestination(row: BucketListDestinationRow): BucketListDestination {
  return {
    id: row.id,
    userId: row.user_id,
    connectionId: row.connection_id,
    sharedWith: row.shared_with,
    name: row.name,
    description: row.description,
    countryCode: row.country_code,
    countryName: row.country_name,
    cityName: row.city_name,
    regionName: row.region_name,
    priority: row.priority,
    category: row.category,
    estimatedBudget: row.estimated_budget,
    currency: row.currency,
    targetYear: row.target_year,
    targetSeason: row.target_season,
    isVisited: row.is_visited,
    visitedDate: row.visited_date,
    notes: row.notes,
    inspirationUrl: row.inspiration_url,
    tags: row.tags,
    mustDo: row.must_do,
    mustEat: row.must_eat,
    mustSee: row.must_see,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert application input (camelCase) to database format (snake_case)
 * Also converts empty strings to null for optional fields
 */
function inputToRow(input: Partial<BucketListDestinationInput>): Partial<BucketListDestinationRow> {
  return {
    connection_id: input.connectionId || null,
    shared_with: input.sharedWith,
    name: input.name,
    description: input.description || null,
    country_code: input.countryCode || null,
    country_name: input.countryName || null,
    city_name: input.cityName || null,
    region_name: input.regionName || null,
    priority: input.priority,
    category: input.category,
    estimated_budget: input.estimatedBudget || null,
    currency: input.currency || 'USD',
    target_year: input.targetYear || null,
    target_season: input.targetSeason && input.targetSeason.trim() !== '' ? input.targetSeason : null,
    is_visited: input.isVisited,
    visited_date: input.visitedDate || null,
    notes: input.notes || null,
    inspiration_url: input.inspirationUrl || null,
    tags: input.tags,
    must_do: input.mustDo,
    must_eat: input.mustEat,
    must_see: input.mustSee,
  };
}

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
    .or(`user_id.eq.${user.id},shared_with.cs.{${user.id}}`)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Travel', 'Failed to list bucket list destinations', { error });
    throw new DatabaseError(error.message);
  }

  // Get partner ID for categorization using shared data provider
  const mergedConnection = await getMergedConnectionId('travel');
  const partnerId = mergedConnection?.partnerId || null;

  return (data || []).map((row: BucketListDestinationRow) => {
    const dest = rowToDestination(row);
    return {
      ...dest,
      ownershipCategory: categorizeBucketListDestination(dest, user.id, partnerId),
    };
  });
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

  return rowToDestination(data as BucketListDestinationRow);
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

  const rowData = inputToRow(input);

  const { data, error } = await supabase
    .from('travel_bucket_list')
    .insert({
      ...rowData,
      user_id: user.id,
      shared_with: sharedWith || [],
    })
    .select()
    .single();

  if (error) {
    logger.error('Travel', 'Failed to create bucket list destination', { error });
    throw new DatabaseError(error.message);
  }

  logger.info('Travel', 'Bucket list destination created', { id: data.id });
  return rowToDestination(data as BucketListDestinationRow);
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

  const rowUpdates = inputToRow(updates);

  const { data, error } = await supabase
    .from('travel_bucket_list')
    .update(rowUpdates)
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
  return rowToDestination(data as BucketListDestinationRow);
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
  } as any);
}

/**
 * Mark destination as not visited (back to bucket list)
 */
export async function markDestinationAsNotVisited(id: string): Promise<BucketListDestination> {
  return updateBucketListDestination(id, {
    isVisited: false,
    visitedDate: undefined,
  } as any);
}
