/**
 * Profile Connections & Sharing Types
 * Defines types for the multi-user collaboration system
 */

// =====================================================
// ENUMS
// =====================================================

export type ConnectionRelationship =
  | 'spouse'
  | 'partner'
  | 'friend'
  | 'family'
  | 'roommate'
  | 'colleague'
  | 'other';

export type ConnectionStatus =
  | 'pending'
  | 'active'
  | 'blocked'
  | 'archived';

export type ModulePermissionLevel =
  | 'none'      // No access
  | 'view'      // Can view only
  | 'collaborate' // Can view and edit shared items
  | 'merged';   // Full merge (see everything as if it's yours)

export type ShareableModule =
  | 'travel'
  | 'visa'
  | 'trip-planner'
  | 'finances'
  | 'shopping'
  | 'meals'
  | 'nutrition'
  | 'goals'
  | 'habits'
  | 'todos'
  | 'notes'
  | 'projects'
  | 'journal'
  | 'skincare';

// =====================================================
// CORE TYPES
// =====================================================

export interface ProfileConnection {
  id: string;
  requesterId: string;
  receiverId: string;
  relationship: ConnectionRelationship;
  status: ConnectionStatus;
  userId?: string;
  connectedUserId?: string;
  requesterLabel?: string;  // Custom nickname from requester's perspective
  receiverLabel?: string;   // Custom nickname from receiver's perspective
  label?: string;
  connectedUserEmail?: string;
  connectedUserName?: string;
  connectedUserAvatar?: string;
  notes?: string;
  createdAt: string;
  acceptedAt?: string;
  updatedAt: string;
  isPending?: boolean;
}

export interface ModulePermission {
  id: string;
  connectionId: string;
  module: ShareableModule;
  permissionLevel: ModulePermissionLevel;
  userId: string;  // Who is granting this permission
  settings: Record<string, unknown>;  // Module-specific settings
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionInvitation {
  id: string;
  connectionId: string;
  message?: string;
  proposedPermissions: Record<ShareableModule, ModulePermissionLevel>;
  createdAt: string;
  expiresAt: string;
}

// =====================================================
// EXTENDED TYPES (with joined data)
// =====================================================

export interface ConnectionWithUser extends ProfileConnection {
  otherUser: {
    id: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
  };
  myLabel?: string;  // What I call them
  theirLabel?: string;  // What they call me
}

export interface ConnectionWithPermissions extends ConnectionWithUser {
  myPermissions: ModulePermission[];  // Permissions I've granted them
  theirPermissions: ModulePermission[];  // Permissions they've granted me
}

export interface PendingInvitation {
  invitation: ConnectionInvitation;
  connection: ProfileConnection;
  fromUser: {
    id: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
  };
}

// =====================================================
// INPUT TYPES
// =====================================================

export interface CreateConnectionInput {
  receiverEmail: string;
  relationship: ConnectionRelationship;
  label?: string;  // What I want to call them
  message?: string;  // Invitation message
  proposedPermissions?: Partial<Record<ShareableModule, ModulePermissionLevel>>;
}

export interface UpdateConnectionInput {
  relationship?: ConnectionRelationship;
  label?: string;
  notes?: string;
}

export interface UpdatePermissionInput {
  module: ShareableModule;
  permissionLevel: ModulePermissionLevel;
  settings?: Record<string, unknown>;
}

export interface AcceptConnectionInput {
  connectionId: string;
  label?: string;  // What I want to call them
  permissions?: Partial<Record<ShareableModule, ModulePermissionLevel>>;
}

// =====================================================
// PERMISSION HELPERS
// =====================================================

export interface ModulePermissionConfig {
  module: ShareableModule;
  label: string;
  description: string;
  icon: string;
  defaultLevel: ModulePermissionLevel;
  supportedLevels: ModulePermissionLevel[];
  hasSettings: boolean;
}

// Default module configurations
export const MODULE_CONFIGS: Record<ShareableModule, ModulePermissionConfig> = {
  travel: {
    module: 'travel',
    label: 'Travel',
    description: 'Visited countries, travel plans, and trip history',
    icon: 'MapPin',
    defaultLevel: 'none',
    supportedLevels: ['none', 'view', 'merged'],
    hasSettings: true,
  },
  visa: {
    module: 'visa',
    label: 'Visa Calculator',
    description: 'Visa requirements and travel calculations',
    icon: 'Plane',
    defaultLevel: 'none',
    supportedLevels: ['none', 'view'],
    hasSettings: false,
  },
  'trip-planner': {
    module: 'trip-planner',
    label: 'Trip Planner',
    description: 'Multi-country trip plans and itineraries',
    icon: 'Map',
    defaultLevel: 'none',
    supportedLevels: ['none', 'view', 'collaborate'],
    hasSettings: true,
  },
  finances: {
    module: 'finances',
    label: 'Finances',
    description: 'Accounts, transactions, and budgets',
    icon: 'DollarSign',
    defaultLevel: 'none',
    supportedLevels: ['none', 'view', 'collaborate', 'merged'],
    hasSettings: true,
  },
  shopping: {
    module: 'shopping',
    label: 'Shopping',
    description: 'Grocery lists and shopping plans',
    icon: 'ShoppingCart',
    defaultLevel: 'none',
    supportedLevels: ['none', 'view', 'collaborate'],
    hasSettings: false,
  },
  meals: {
    module: 'meals',
    label: 'Meals',
    description: 'Meal planning and recipes',
    icon: 'ChefHat',
    defaultLevel: 'none',
    supportedLevels: ['none', 'view', 'collaborate'],
    hasSettings: false,
  },
  goals: {
    module: 'goals',
    label: 'Goals',
    description: 'Life goals and dreams',
    icon: 'Trophy',
    defaultLevel: 'none',
    supportedLevels: ['none', 'view', 'collaborate'],
    hasSettings: true,
  },
  habits: {
    module: 'habits',
    label: 'Habits',
    description: 'Daily habits and tracking',
    icon: 'Target',
    defaultLevel: 'none',
    supportedLevels: ['none', 'view'],
    hasSettings: false,
  },
  todos: {
    module: 'todos',
    label: 'Tasks',
    description: 'Todo lists and task management',
    icon: 'CheckSquare',
    defaultLevel: 'none',
    supportedLevels: ['none', 'view', 'collaborate'],
    hasSettings: false,
  },
  notes: {
    module: 'notes',
    label: 'Notes',
    description: 'Personal notes and documents',
    icon: 'FileText',
    defaultLevel: 'none',
    supportedLevels: ['none', 'view', 'collaborate'],
    hasSettings: false,
  },
  projects: {
    module: 'projects',
    label: 'Projects',
    description: 'Project tracking and management',
    icon: 'FolderOpen',
    defaultLevel: 'none',
    supportedLevels: ['none', 'view', 'collaborate'],
    hasSettings: false,
  },
  journal: {
    module: 'journal',
    label: 'Journal',
    description: 'Daily journal entries',
    icon: 'BookOpen',
    defaultLevel: 'none',
    supportedLevels: ['none', 'view'],
    hasSettings: false,
  },
  skincare: {
    module: 'skincare',
    label: 'Skincare',
    description: 'Skincare routine and products',
    icon: 'Sparkles',
    defaultLevel: 'none',
    supportedLevels: ['none', 'view'],
    hasSettings: false,
  },
  nutrition: {
    module: 'nutrition',
    label: 'Nutrition',
    description: 'Nutrition tracking and meal analysis',
    icon: 'Utensils',
    defaultLevel: 'none',
    supportedLevels: ['none', 'view'],
    hasSettings: false,
  },
};

// Permission level labels and descriptions
export const PERMISSION_LEVEL_INFO: Record<ModulePermissionLevel, { label: string; description: string; color: string }> = {
  none: {
    label: 'Private',
    description: 'No access to this module',
    color: 'slate',
  },
  view: {
    label: 'View Only',
    description: 'Can see your data but cannot edit',
    color: 'blue',
  },
  collaborate: {
    label: 'Collaborate',
    description: 'Can view and edit shared items',
    color: 'purple',
  },
  merged: {
    label: 'Merged',
    description: 'Full access - see and edit everything as if it were theirs',
    color: 'green',
  },
};

// Relationship labels and icons
export const RELATIONSHIP_INFO: Record<ConnectionRelationship, { label: string; icon: string; color: string }> = {
  spouse: { label: 'Spouse', icon: 'Heart', color: 'red' },
  partner: { label: 'Partner', icon: 'Heart', color: 'pink' },
  friend: { label: 'Friend', icon: 'Users', color: 'blue' },
  family: { label: 'Family', icon: 'Home', color: 'green' },
  roommate: { label: 'Roommate', icon: 'Home', color: 'purple' },
  colleague: { label: 'Colleague', icon: 'Briefcase', color: 'orange' },
  other: { label: 'Other', icon: 'User', color: 'slate' },
};
