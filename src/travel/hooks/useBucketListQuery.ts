/**
 * React Query hooks for Bucket List operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listBucketListDestinations,
  getBucketListDestination,
  createBucketListDestination,
  updateBucketListDestination,
  deleteBucketListDestination,
  markDestinationAsVisited,
  markDestinationAsNotVisited,
} from '../api/bucketListAPI';
import type { BucketListDestinationInput } from '../types';
import { logger } from '@/services/logger';

// Query keys
export const bucketListKeys = {
  all: ['bucketList'] as const,
  lists: () => [...bucketListKeys.all, 'list'] as const,
  list: (filters?: any) => [...bucketListKeys.lists(), filters] as const,
  details: () => [...bucketListKeys.all, 'detail'] as const,
  detail: (id: string) => [...bucketListKeys.details(), id] as const,
};

/**
 * Query: List all bucket list destinations
 */
export function useBucketListDestinations() {
  return useQuery({
    queryKey: bucketListKeys.lists(),
    queryFn: listBucketListDestinations,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Query: Get single bucket list destination
 */
export function useBucketListDestination(id: string) {
  return useQuery({
    queryKey: bucketListKeys.detail(id),
    queryFn: () => getBucketListDestination(id),
    enabled: !!id,
  });
}

/**
 * Mutation: Create bucket list destination
 */
export function useCreateBucketListDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, sharedWith }: { input: BucketListDestinationInput; sharedWith?: string[] }) =>
      createBucketListDestination(input, sharedWith),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bucketListKeys.lists() });
      logger.info('Travel', 'Bucket list destination created');
    },
    onError: (error) => {
      logger.error('Travel', error as Error, { context: 'create bucket list destination' });
    },
  });
}

/**
 * Mutation: Update bucket list destination
 */
export function useUpdateBucketListDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BucketListDestinationInput> }) =>
      updateBucketListDestination(id, updates),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: bucketListKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: bucketListKeys.detail(variables.id) });
      logger.info('Travel', 'Bucket list destination updated', { id: variables.id });
    },
    onError: (error) => {
      logger.error('Travel', error as Error, { context: 'update bucket list destination' });
    },
  });
}

/**
 * Mutation: Delete bucket list destination
 */
export function useDeleteBucketListDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBucketListDestination,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bucketListKeys.lists() });
      logger.info('Travel', 'Bucket list destination deleted');
    },
    onError: (error) => {
      logger.error('Travel', error as Error, { context: 'delete bucket list destination' });
    },
  });
}

/**
 * Mutation: Mark destination as visited
 */
export function useMarkDestinationAsVisited() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markDestinationAsVisited,
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: bucketListKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: bucketListKeys.detail(id) });
      logger.info('Travel', 'Destination marked as visited', { id });
    },
    onError: (error) => {
      logger.error('Travel', error as Error, { context: 'mark destination as visited' });
    },
  });
}

/**
 * Mutation: Mark destination as not visited
 */
export function useMarkDestinationAsNotVisited() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markDestinationAsNotVisited,
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: bucketListKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: bucketListKeys.detail(id) });
      logger.info('Travel', 'Destination marked as not visited', { id });
    },
    onError: (error) => {
      logger.error('Travel', error as Error, { context: 'mark destination as not visited' });
    },
  });
}
