/**
 * Connections API
 * CRUD operations for profile connections and permissions
 */

import { supabase } from '../../lib/supabase';
import { logger } from '../../services/logger';

import type {
  ProfileConnection,
  ModulePermission,
  ConnectionInvitation,
  ConnectionWithUser,
  _ConnectionWithPermissions,
  PendingInvitation,
  CreateConnectionInput,
  UpdateConnectionInput,
  _UpdatePermissionInput,
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
    .rpc('get_connections_with_users');

  if (error) throw error;

  // Filter for active connections and sort by created_at
  const activeConnections = (data || [])
    .filter((conn: any) => conn.status === 'active')
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return activeConnections.map((conn: any) => {
    const isRequester = conn.requester_id === user.id;
    const otherUser = isRequester ? conn.receiver_user : conn.requester_user;

    return {
      ...mapDbToConnection(conn),
      otherUser: {
        id: otherUser.id,
        email: otherUser.email,
        fullName: otherUser.full_name,
        avatarUrl: otherUser.avatar_url,
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
    .rpc('get_invitations_with_connections');

  if (error) throw error;

  const sent: PendingInvitation[] = [];
  const received: PendingInvitation[] = [];

  (data || []).forEach((inv: any) => {
    if (!inv.connection) return;

    const isRequester = inv.connection.requester_id === user.id;
    const fromUser = isRequester ? inv.connection.requester_user : inv.connection.receiver_user;

    const pendingInv: PendingInvitation = {
      invitation: mapDbToInvitation(inv),
      connection: mapDbToConnection(inv.connection),
      fromUser: {
        id: fromUser.id,
        email: fromUser.email,
        fullName: fromUser.full_name,
        avatarUrl: fromUser.avatar_url,
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

  // Find receiver by email using RPC function
  const { data: receiverData, error: receiverError } = await supabase
    .rpc('lookup_user_by_email', { user_email: input.receiverEmail })
    .single();

  if (receiverError || !receiverData) {
    throw new Error('User not found with that email');
  }

  // Check if trying to connect to yourself
  if (receiverData.user_id === user.id) {
    throw new Error('You cannot connect with yourself');
  }

  // Create connection
  const { data: connectionData, error: connectionError } = await supabase
    .from('profile_connections')
    .insert({
      requester_id: user.id,
      receiver_id: receiverData.user_id,
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

  // Send email notification to receiver
  try {
    await sendInvitationEmail({
      to: receiverData.email,
      fromEmail: user.email!,
      fromName: user.user_metadata?.full_name,
      relationship: input.relationship,
      message: input.message,
    });
  } catch (emailError) {
    logger.error('ConnectionsAPI', 'Failed to send invitation email:', emailError);
    // Don't fail the invitation if email fails
  }

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

// =====================================================
// EMAIL NOTIFICATIONS
// =====================================================

/**
 * Send invitation email via Supabase Edge Function
 */
async function sendInvitationEmail(params: {
  to: string;
  fromEmail: string;
  fromName?: string;
  relationship: string;
  message?: string;
}): Promise<void> {
  const invitationUrl = `${window.location.origin}/#/shared`; // Deep link to invitations

  const { data, error } = await supabase.functions.invoke('send-invitation-email', {
    body: {
      to: params.to,
      fromEmail: params.fromEmail,
      fromName: params.fromName,
      relationship: params.relationship,
      message: params.message,
      invitationUrl,
    },
  });

  if (error) throw error;
  return data;
}
