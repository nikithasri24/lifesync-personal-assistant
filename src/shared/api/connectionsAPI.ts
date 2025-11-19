/**
 * Connections API
 * CRUD operations for profile connections and permissions
 */

import { supabase } from '../../lib/supabase';
import type {
  ProfileConnection,
  ModulePermission,
  ConnectionInvitation,
  ConnectionWithUser,
  ConnectionWithPermissions,
  PendingInvitation,
  CreateConnectionInput,
  UpdateConnectionInput,
  UpdatePermissionInput,
  AcceptConnectionInput,
  ShareableModule,
  ModulePermissionLevel,
} from '../types/connections';

// =====================================================
// CONNECTIONS
// =====================================================

/**
 * Get all connections for the current user
 */
export async function getUserConnections(): Promise<ConnectionWithUser[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profile_connections')
    .select(`
      *,
      requester:auth.users!profile_connections_requester_id_fkey(id, email, raw_user_meta_data),
      receiver:auth.users!profile_connections_receiver_id_fkey(id, email, raw_user_meta_data)
    `)
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((conn: any) => {
    const isRequester = conn.requester_id === user.id;
    const otherUser = isRequester ? conn.receiver : conn.requester;

    return {
      ...mapDbToConnection(conn),
      otherUser: {
        id: otherUser.id,
        email: otherUser.email,
        fullName: otherUser.raw_user_meta_data?.full_name,
        avatarUrl: otherUser.raw_user_meta_data?.avatar_url,
      },
      myLabel: isRequester ? conn.requester_label : conn.receiver_label,
      theirLabel: isRequester ? conn.receiver_label : conn.requester_label,
    };
  });
}

/**
 * Get pending invitations (sent and received)
 */
export async function getPendingInvitations(): Promise<{
  sent: PendingInvitation[];
  received: PendingInvitation[];
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('connection_invitations')
    .select(`
      *,
      connection:profile_connections(
        *,
        requester:auth.users!profile_connections_requester_id_fkey(id, email, raw_user_meta_data),
        receiver:auth.users!profile_connections_receiver_id_fkey(id, email, raw_user_meta_data)
      )
    `)
    .not('connection', 'is', null);

  if (error) throw error;

  const sent: PendingInvitation[] = [];
  const received: PendingInvitation[] = [];

  (data || []).forEach((inv: any) => {
    if (!inv.connection) return;

    const isRequester = inv.connection.requester_id === user.id;
    const fromUser = isRequester ? inv.connection.requester : inv.connection.receiver;

    const pendingInv: PendingInvitation = {
      invitation: mapDbToInvitation(inv),
      connection: mapDbToConnection(inv.connection),
      fromUser: {
        id: fromUser.id,
        email: fromUser.email,
        fullName: fromUser.raw_user_meta_data?.full_name,
        avatarUrl: fromUser.raw_user_meta_data?.avatar_url,
      },
    };

    if (isRequester) {
      sent.push(pendingInv);
    } else {
      received.push(pendingInv);
    }
  });

  return { sent, received };
}

/**
 * Create a new connection (send invitation)
 */
export async function createConnection(input: CreateConnectionInput): Promise<ProfileConnection> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Find receiver by email
  const { data: receiverData, error: receiverError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', input.receiverEmail)
    .single();

  if (receiverError || !receiverData) {
    throw new Error('User not found with that email');
  }

  // Create connection
  const { data: connectionData, error: connectionError } = await supabase
    .from('profile_connections')
    .insert({
      requester_id: user.id,
      receiver_id: receiverData.id,
      relationship: input.relationship,
      requester_label: input.label,
      status: 'pending',
    })
    .select()
    .single();

  if (connectionError) throw connectionError;

  // Create invitation
  const { error: invitationError } = await supabase
    .from('connection_invitations')
    .insert({
      connection_id: connectionData.id,
      message: input.message,
      proposed_permissions: input.proposedPermissions || {},
    });

  if (invitationError) throw invitationError;

  return mapDbToConnection(connectionData);
}

/**
 * Accept a connection invitation
 */
export async function acceptConnection(input: AcceptConnectionInput): Promise<ProfileConnection> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Update connection status
  const { data, error } = await supabase
    .from('profile_connections')
    .update({
      status: 'active',
      accepted_at: new Date().toISOString(),
      receiver_label: input.label,
    })
    .eq('id', input.connectionId)
    .eq('receiver_id', user.id)
    .select()
    .single();

  if (error) throw error;

  // Set initial permissions if provided
  if (input.permissions) {
    await Promise.all(
      Object.entries(input.permissions).map(([module, level]) =>
        setModulePermission({
          connectionId: input.connectionId,
          module: module as ShareableModule,
          permissionLevel: level,
        })
      )
    );
  }

  // Delete invitation
  await supabase
    .from('connection_invitations')
    .delete()
    .eq('connection_id', input.connectionId);

  return mapDbToConnection(data);
}

/**
 * Reject/decline a connection invitation
 */
export async function rejectConnection(connectionId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profile_connections')
    .delete()
    .eq('id', connectionId)
    .eq('receiver_id', user.id);

  if (error) throw error;
}

/**
 * Update connection metadata
 */
export async function updateConnection(
  connectionId: string,
  input: UpdateConnectionInput
): Promise<ProfileConnection> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get connection to determine if user is requester or receiver
  const { data: conn } = await supabase
    .from('profile_connections')
    .select('requester_id, receiver_id')
    .eq('id', connectionId)
    .single();

  if (!conn) throw new Error('Connection not found');

  const isRequester = conn.requester_id === user.id;

  const updateData: any = {};
  if (input.relationship) updateData.relationship = input.relationship;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.label !== undefined) {
    updateData[isRequester ? 'requester_label' : 'receiver_label'] = input.label;
  }

  const { data, error } = await supabase
    .from('profile_connections')
    .update(updateData)
    .eq('id', connectionId)
    .select()
    .single();

  if (error) throw error;
  return mapDbToConnection(data);
}

/**
 * Delete/end a connection
 */
export async function deleteConnection(connectionId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profile_connections')
    .delete()
    .eq('id', connectionId);

  if (error) throw error;
}

// =====================================================
// PERMISSIONS
// =====================================================

/**
 * Get permissions for a connection
 */
export async function getConnectionPermissions(
  connectionId: string
): Promise<{ myPermissions: ModulePermission[]; theirPermissions: ModulePermission[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('module_permissions')
    .select('*')
    .eq('connection_id', connectionId);

  if (error) throw error;

  const myPermissions = (data || [])
    .filter((p: any) => p.user_id === user.id)
    .map(mapDbToPermission);

  const theirPermissions = (data || [])
    .filter((p: any) => p.user_id !== user.id)
    .map(mapDbToPermission);

  return { myPermissions, theirPermissions };
}

/**
 * Set permission for a module
 */
export async function setModulePermission(input: {
  connectionId: string;
  module: ShareableModule;
  permissionLevel: ModulePermissionLevel;
  settings?: Record<string, any>;
}): Promise<ModulePermission> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('module_permissions')
    .upsert({
      connection_id: input.connectionId,
      module: input.module,
      permission_level: input.permissionLevel,
      user_id: user.id,
      settings: input.settings || {},
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbToPermission(data);
}

/**
 * Update multiple permissions at once
 */
export async function updateMultiplePermissions(
  connectionId: string,
  permissions: Partial<Record<ShareableModule, ModulePermissionLevel>>
): Promise<ModulePermission[]> {
  const results = await Promise.all(
    Object.entries(permissions).map(([module, level]) =>
      setModulePermission({
        connectionId,
        module: module as ShareableModule,
        permissionLevel: level,
      })
    )
  );

  return results;
}

/**
 * Delete a permission (revoke access)
 */
export async function deleteModulePermission(
  connectionId: string,
  module: ShareableModule
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('module_permissions')
    .delete()
    .eq('connection_id', connectionId)
    .eq('module', module)
    .eq('user_id', user.id);

  if (error) throw error;
}

// =====================================================
// MAPPER FUNCTIONS
// =====================================================

function mapDbToConnection(data: any): ProfileConnection {
  return {
    id: data.id,
    requesterId: data.requester_id,
    receiverId: data.receiver_id,
    relationship: data.relationship,
    status: data.status,
    requesterLabel: data.requester_label,
    receiverLabel: data.receiver_label,
    notes: data.notes,
    createdAt: data.created_at,
    acceptedAt: data.accepted_at,
    updatedAt: data.updated_at,
  };
}

function mapDbToPermission(data: any): ModulePermission {
  return {
    id: data.id,
    connectionId: data.connection_id,
    module: data.module,
    permissionLevel: data.permission_level,
    userId: data.user_id,
    settings: data.settings || {},
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapDbToInvitation(data: any): ConnectionInvitation {
  return {
    id: data.id,
    connectionId: data.connection_id,
    message: data.message,
    proposedPermissions: data.proposed_permissions || {},
    createdAt: data.created_at,
    expiresAt: data.expires_at,
  };
}
