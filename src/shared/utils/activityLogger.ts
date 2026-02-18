/**
 * Activity Logger Utility
 * Automatically log partner actions to connection activity feed
 *
 * USAGE: Call from mutation hooks in each feature
 *
 * @example
 * ```typescript
 * export function useCreateTask() {
 *   return useMutation({
 *     mutationFn: createTask,
 *     onSuccess: (task) => {
 *       // ... existing logic
 *       logActivity({
 *         module: 'tasks',
 *         actionType: 'created',
 *         resourceType: 'task',
 *         resourceId: task.id,
 *         description: `Created task: ${task.title}`,
 *       });
 *     },
 *   });
 * }
 * ```
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';

interface LogActivityParams {
  module: string;
  actionType: 'created' | 'updated' | 'deleted' | 'completed';
  resourceType: string;
  resourceId: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log activity to connection activity feed
 * Automatically logs partner actions if a connection exists
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Not authenticated, skip logging

    // Check if user has an active partner connection
    // Using RPC function to get active connections
    const { data: connections, error: connError } = await supabase
      .rpc('get_connections_with_users');

    if (connError || !connections || connections.length === 0) {
      // No partner connection, skip logging
      return;
    }

    // Get first active connection (assuming one partner for now)
    const connection = connections[0];
    if (!connection || connection.status !== 'active') {
      return;
    }

    // Insert activity log
    const { error: insertError } = await supabase
      .from('connection_activity')
      .insert({
        connection_id: connection.id,
        actor_id: user.id,
        action_type: params.actionType,
        module: params.module,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        description: params.description,
        metadata: params.metadata || null,
      });

    if (insertError) {
      logger.warn('ActivityLogger', 'Failed to log activity', {
        error: insertError.message,
        module: params.module,
      });
    } else {
      logger.debug('ActivityLogger', 'Activity logged', {
        module: params.module,
        actionType: params.actionType,
      });
    }
  } catch (error) {
    // Silently fail - activity logging should never break the main flow
    logger.warn('ActivityLogger', 'Error logging activity', {
      error: error instanceof Error ? error.message : 'Unknown error',
      module: params.module,
    });
  }
}

/**
 * Integration helper for mutations
 * Use this in React Query mutation onSuccess callbacks
 */
export function logMutationActivity(
  module: string,
  actionType: LogActivityParams['actionType'],
  resourceType: string,
  resourceId: string,
  description: string,
  metadata?: Record<string, unknown>
) {
  // Fire and forget - don't await
  void logActivity({
    module,
    actionType,
    resourceType,
    resourceId,
    description,
    metadata,
  });
}
