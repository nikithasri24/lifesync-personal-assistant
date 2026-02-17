/**
 * Shared Feature Types
 * Types for partner connections, invitations, and activity tracking
 */

export type RelationshipType =
  | 'spouse'
  | 'partner'
  | 'friend'
  | 'family'
  | 'roommate'
  | 'colleague';

export type PermissionLevel = 'off' | 'view' | 'edit' | 'merged';

export type ShareableModule =
  | 'meals'
  | 'shopping'
  | 'tasks'
  | 'finances'
  | 'habits'
  | 'goals'
  | 'travel'
  | 'journal'
  | 'notes'
  | 'calendar';

export interface ModulePermission {
  module: ShareableModule;
  permission: PermissionLevel;
}

export interface PartnerConnection {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_email: string;
  relationship: RelationshipType;
  permissions: ModulePermission[];
  connected_at: string;
  status: 'active' | 'paused';
}

export interface Invitation {
  id: string;
  from_user_id: string;
  from_name: string;
  from_email: string;
  to_user_id: string | null;
  to_email: string;
  relationship: RelationshipType;
  message: string | null;
  permissions: ModulePermission[];
  status: 'pending' | 'accepted' | 'declined';
  direction: 'sent' | 'received';
  created_at: string;
  expires_at: string;
}

export interface ActivityItem {
  id: string;
  user_id: string;
  user_name: string;
  module: ShareableModule;
  action: string; // e.g., "Added Pasta Carbonara to meal plan"
  item_type: string; // e.g., "recipe", "task", "transaction"
  item_id: string;
  timestamp: string;
}

export interface SharedStats {
  partner_count: number;
  shared_modules_count: number;
  shared_items_count: number;
}
