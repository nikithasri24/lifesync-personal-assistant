/**
 * SharedDataProvider Service
 * 
 * Fetches data considering sharing permissions - returns own data + shared data
 * from connections based on module permissions.
 */

import { supabase } from '@/lib/supabase';
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

