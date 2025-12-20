/**
 * useSharedDataQuery Hook
 *
 * Fetches shared data from connected users based on module permissions.
 * Returns combined data from all connections for each module.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import type { ShareableModule, ModulePermissionLevel } from '../types/connections';

interface SharedItem {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  sharedBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt?: string;
  [key: string]: unknown;
}

type SharedData = Partial<Record<ShareableModule, SharedItem[]>>;

interface ConnectionPermission {
  connectionId: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  module: ShareableModule;
  permissionLevel: ModulePermissionLevel;
}

const sharedDataKeys = {
  all: ['shared-data'] as const,
  byModule: (module: ShareableModule) => [...sharedDataKeys.all, module] as const,
};

/**
 * Get all permissions that connections have granted to the current user
 */
async function getIncomingPermissions(): Promise<ConnectionPermission[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get active connections
  const { data: connections, error: connError } = await supabase
    .from('profile_connections')
    .select(`
      id,
      requester_id,
      receiver_id,
      requester_user:users!profile_connections_requester_id_fkey(id, email, full_name, avatar_url),
      receiver_user:users!profile_connections_receiver_id_fkey(id, email, full_name, avatar_url)
    `)
    .eq('status', 'active')
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (connError || !connections) {
    logger.error('SharedData', new Error(`Failed to fetch connections: ${connError?.message}`));
    return [];
  }

  const permissions: ConnectionPermission[] = [];

  for (const conn of connections) {
    // Determine the other user in the connection
    const isRequester = conn.requester_id === user.id;
    const otherUserId = isRequester ? conn.receiver_id : conn.requester_id;

    // Extract user from joined data (may be array or object depending on query)
    type UserData = { id: string; email: string; full_name?: string; avatar_url?: string };
    const rawUser = isRequester ? conn.receiver_user : conn.requester_user;
    const otherUser: UserData | null = Array.isArray(rawUser)
      ? (rawUser[0] as UserData | undefined) ?? null
      : (rawUser as UserData | null);

    // Get permissions the other user has granted to us
    const { data: perms } = await supabase
      .from('module_permissions')
      .select('module, permission_level')
      .eq('connection_id', conn.id)
      .eq('user_id', otherUserId)
      .neq('permission_level', 'none');

    if (perms) {
      perms.forEach((p: { module: string; permission_level: string }) => {
        permissions.push({
          connectionId: conn.id,
          userId: otherUserId,
          userName: otherUser?.full_name || otherUser?.email || 'Unknown',
          avatarUrl: otherUser?.avatar_url,
          module: p.module as ShareableModule,
          permissionLevel: p.permission_level as ModulePermissionLevel,
        });
      });
    }
  }

  return permissions;
}

/**
 * Fetch shared data for a specific module from a user
 */
async function fetchModuleData(
  module: ShareableModule,
  userId: string,
  userName: string,
  avatarUrl?: string
): Promise<SharedItem[]> {
  const tableMappings: Partial<Record<ShareableModule, string>> = {
    meals: 'meal_plans',
    shopping: 'shopping_lists',
    todos: 'tasks',
    goals: 'goals',
    habits: 'habits',
    notes: 'notes',
    travel: 'visited_countries',
  };

  const table = tableMappings[module];
  if (!table) return [];

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .limit(20);

  if (error) {
    logger.warn('SharedData', `Failed to fetch ${module} data: ${error.message}`);
    return [];
  }

  return (data || []).map((item: Record<string, unknown>) => ({
    ...item,
    id: item.id as string,
    sharedBy: {
      id: userId,
      name: userName,
      avatarUrl,
    },
  }));
}

/**
 * Main hook to fetch all shared data
 */
export function useSharedDataQuery() {
  return useQuery<SharedData>({
    queryKey: sharedDataKeys.all,
    queryFn: async () => {
      const permissions = await getIncomingPermissions();
      const sharedData: SharedData = {};

      // Group permissions by module
      const moduleGroups = permissions.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
      }, {} as Record<ShareableModule, ConnectionPermission[]>);

      // Fetch data for each module from each user
      for (const [module, perms] of Object.entries(moduleGroups)) {
        const items: SharedItem[] = [];
        for (const perm of perms) {
          const data = await fetchModuleData(
            module as ShareableModule,
            perm.userId,
            perm.userName,
            perm.avatarUrl
          );
          items.push(...data);
        }
        sharedData[module as ShareableModule] = items;
      }

      logger.info('SharedData', 'Shared data loaded', {
        modules: Object.keys(sharedData).length,
        totalItems: Object.values(sharedData).flat().length,
      });

      return sharedData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: true,
  });
}

export default useSharedDataQuery;

