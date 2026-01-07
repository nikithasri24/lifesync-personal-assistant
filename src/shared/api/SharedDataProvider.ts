/**
 * SharedDataProvider Service
 * 
 * Fetches data considering sharing permissions - returns own data + shared data
 * from connections based on module permissions.
 */

import { supabase } from '../../lib/supabase';
import { logger } from '../../services/logger';
import type { ShareableModule, ModulePermissionLevel } from '../types/connections';

interface SharedDataContext {
  userId: string;
  connectionId: string;
  connectionUserId: string;
  permissionLevel: ModulePermissionLevel;
  relationship: string;
}

interface SharedDataResult<T> {
  ownData: T[];
  sharedData: {
    data: T[];
    context: SharedDataContext;
  }[];
}

export interface SharedItem {
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

export type SharedData = Partial<Record<ShareableModule, SharedItem[]>>;

interface PermissionSettings {
  includeIds?: string[];
  excludeIds?: string[];
  limit?: number;
  offset?: number;
}

interface ConnectionPermission {
  connectionId: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  module: ShareableModule;
  permissionLevel: ModulePermissionLevel;
  settings?: PermissionSettings;
}

interface ProfileConnectionRow {
  id: string;
  requester_id: string;
  receiver_id: string;
  requester_user?: { id: string; email: string; full_name?: string; avatar_url?: string } | { id: string; email: string; full_name?: string; avatar_url?: string }[];
  receiver_user?: { id: string; email: string; full_name?: string; avatar_url?: string } | { id: string; email: string; full_name?: string; avatar_url?: string }[];
}

interface ModulePermissionRow {
  connection_id: string;
  module: string;
  permission_level: string;
  user_id: string;
  settings?: PermissionSettings | null;
}

/**
 * Get the permission level a connected user has granted to the current user
 * for a specific module.
 */
export async function getModulePermissions(
  module: ShareableModule
): Promise<SharedDataContext[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  // Get active connections where we are either requester or receiver
  const { data: connections, error: connError } = await supabase
    .from('profile_connections')
    .select(`
      id,
      requester_id,
      receiver_id,
      relationship,
      status
    `)
    .eq('status', 'active')
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
  
  if (connError || !connections) return [];
  
  const contexts: SharedDataContext[] = [];
  
  for (const conn of connections) {
    // The other user in the connection
    const otherUserId = conn.requester_id === user.id 
      ? conn.receiver_id 
      : conn.requester_id;
    
    // Get permissions the OTHER user has granted to us for this module
    const { data: permissions } = await supabase
      .from('module_permissions')
      .select('permission_level')
      .eq('connection_id', conn.id)
      .eq('module', module)
      .eq('user_id', otherUserId)  // Permission granted BY the other user
      .single();
    
    if (permissions && permissions.permission_level !== 'none') {
      contexts.push({
        userId: user.id,
        connectionId: conn.id,
        connectionUserId: otherUserId,
        permissionLevel: permissions.permission_level as ModulePermissionLevel,
        relationship: conn.relationship,
      });
    }
  }
  
  return contexts;
}

async function getIncomingPermissions(): Promise<ConnectionPermission[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: connections, error: connError } = await supabase
    .from('profile_connections')
    .select(`
      id,
      requester_id,
      receiver_id,
      requester_user:profiles!profile_connections_requester_id_fkey(id, email, full_name, avatar_url),
      receiver_user:profiles!profile_connections_receiver_id_fkey(id, email, full_name, avatar_url)
    `)
    .eq('status', 'active')
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (connError || !connections) {
    logger.error('SharedData', new Error(`Failed to fetch connections: ${connError?.message}`));
    return [];
  }

  const connectionRows = connections as ProfileConnectionRow[];
  const connectionIds = connectionRows.map((conn) => conn.id);
  if (connectionIds.length === 0) return [];

  const { data: permissions, error: permissionsError } = await supabase
    .from('module_permissions')
    .select('connection_id, module, permission_level, user_id, settings')
    .in('connection_id', connectionIds)
    .neq('permission_level', 'none');

  if (permissionsError) {
    logger.error('SharedData', new Error(`Failed to fetch permissions: ${permissionsError.message}`));
    return [];
  }

  const connectionMap = new Map<string, { otherUserId: string; otherUserName: string; avatarUrl?: string }>();
  for (const conn of connectionRows) {
    const isRequester = conn.requester_id === user.id;
    const otherUserId = isRequester ? conn.receiver_id : conn.requester_id;
    const rawUser = isRequester ? conn.receiver_user : conn.requester_user;
    const otherUser = Array.isArray(rawUser) ? rawUser[0] : rawUser;
    if (!otherUser) continue;
    connectionMap.set(conn.id, {
      otherUserId,
      otherUserName: otherUser.full_name || otherUser.email || 'Unknown',
      avatarUrl: otherUser.avatar_url ?? undefined,
    });
  }

  const incoming: ConnectionPermission[] = [];
  for (const perm of (permissions || []) as ModulePermissionRow[]) {
    const connectionInfo = connectionMap.get(perm.connection_id);
    if (!connectionInfo) continue;
    if (perm.user_id !== connectionInfo.otherUserId) continue;
    incoming.push({
      connectionId: perm.connection_id,
      userId: connectionInfo.otherUserId,
      userName: connectionInfo.otherUserName,
      avatarUrl: connectionInfo.avatarUrl,
      module: perm.module as ShareableModule,
      permissionLevel: perm.permission_level as ModulePermissionLevel,
      settings: perm.settings ?? undefined,
    });
  }

  return incoming;
}

async function fetchModuleData(
  module: ShareableModule,
  userId: string,
  userName: string,
  avatarUrl?: string,
  settings?: PermissionSettings
): Promise<SharedItem[]> {
  const tableMappings: Partial<Record<ShareableModule, string>> = {
    meals: 'meal_plans',
    shopping: 'shopping_lists',
    todos: 'tasks',
    goals: 'goals',
    habits: 'habits',
    notes: 'notes',
    projects: 'projects',
    journal: 'journal_entries',
    mood: 'journal_entries',
    travel: 'visited_locations',
    visa: 'user_visas',
    'trip-planner': 'trips',
    finances: 'finance_transactions',
    nutrition: 'food_log',
    skincare: 'skincare_products',
  };

  const table = tableMappings[module];
  if (!table) return [];

  const limit = settings?.limit ?? 20;
  const offset = settings?.offset ?? 0;

  let query = supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .range(offset, Math.max(offset + limit - 1, offset));

  if (module === 'mood' && table === 'journal_entries') {
    query = query.not('mood', 'is', null);
  }

  if (settings?.includeIds && settings.includeIds.length > 0) {
    query = query.in('id', settings.includeIds);
  }

  if (table === 'tasks') {
    query = query.order('updated_at', { ascending: false });
  } else if (table === 'shopping_lists' || table === 'meal_plans' || table === 'goals') {
    query = query.order('created_at', { ascending: false });
  } else if (table === 'journal_entries' || table === 'notes') {
    query = query.order('date', { ascending: false });
  } else {
    query = query.order('updated_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    logger.warn('SharedData', `Failed to fetch ${module} data: ${error.message}`);
    return [];
  }

  const filtered = (data || []).filter((item: Record<string, unknown>) => {
    if (settings?.excludeIds && settings.excludeIds.length > 0) {
      return !settings.excludeIds.includes(item.id as string);
    }
    return true;
  });

  return filtered.map((item: Record<string, unknown>) => ({
    ...item,
    id: item.id as string,
    sharedBy: {
      id: userId,
      name: userName,
      avatarUrl,
    },
  }));
}

export async function fetchSharedDashboardData(): Promise<SharedData> {
  const permissions = await getIncomingPermissions();
  const sharedData: SharedData = {};

  const moduleGroups = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<ShareableModule, ConnectionPermission[]>);

  await Promise.all(
    Object.entries(moduleGroups).map(async ([module, perms]) => {
      const items = await Promise.all(
        perms.map((perm) =>
          fetchModuleData(
            module as ShareableModule,
            perm.userId,
            perm.userName,
            perm.avatarUrl,
            perm.settings
          )
        )
      );
      sharedData[module as ShareableModule] = items.flat();
    })
  );

  logger.info('SharedData', 'Shared data loaded', {
    modules: Object.keys(sharedData).length,
    totalItems: Object.values(sharedData).flat().length,
  });

  return sharedData;
}

/**
 * Generic function to fetch shared data from a table
 */
export async function fetchSharedData<T>(
  tableName: string,
  module: ShareableModule,
  selectColumns: string = '*',
  buildQuery?: (baseQuery: { from: string; select: string; userId: string }) => Promise<T[]>
): Promise<SharedDataResult<T>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ownData: [], sharedData: [] };

  // Fetch own data
  let ownData: T[] = [];
  if (buildQuery) {
    ownData = await buildQuery({ from: tableName, select: selectColumns, userId: user.id });
  } else {
    const { data } = await supabase.from(tableName).select(selectColumns).eq('user_id', user.id);
    ownData = (data as T[]) || [];
  }

  // Get permissions for this module
  const permissions = await getModulePermissions(module);

  const sharedData: SharedDataResult<T>['sharedData'] = [];

  for (const perm of permissions) {
    // Only fetch if permission allows viewing
    if (perm.permissionLevel === 'none') continue;

    let data: T[] = [];
    if (buildQuery) {
      data = await buildQuery({ from: tableName, select: selectColumns, userId: perm.connectionUserId });
    } else {
      const result = await supabase
        .from(tableName)
        .select(selectColumns)
        .eq('user_id', perm.connectionUserId);
      data = (result.data as T[]) || [];
    }

    if (data.length > 0) {
      sharedData.push({
        data,
        context: perm,
      });
    }
  }

  return {
    ownData,
    sharedData,
  };
}

/**
 * Check if current user can edit shared data from a connected user
 */
export async function canEditSharedData(
  module: ShareableModule,
  ownerUserId: string
): Promise<boolean> {
  const permissions = await getModulePermissions(module);
  const perm = permissions.find(p => p.connectionUserId === ownerUserId);
  return perm?.permissionLevel === 'collaborate' || perm?.permissionLevel === 'merged';
}

/**
 * Module-specific data fetchers
 */

export async function fetchSharedTasks() {
  return fetchSharedData('tasks', 'todos');
}

export async function fetchSharedHabits() {
  return fetchSharedData('habits', 'habits');
}

export async function fetchSharedGoals() {
  return fetchSharedData('goals', 'goals');
}

export async function fetchSharedMeals() {
  return fetchSharedData('meal_plans', 'meals');
}

export async function fetchSharedShoppingLists() {
  return fetchSharedData('shopping_lists', 'shopping');
}

export async function fetchSharedFinances() {
  return fetchSharedData('transactions', 'finances');
}
