// Shared Domain Barrel Exports
// Centralized exports for shared/collaboration features

// API
export * from './api/connectionsAPI';

// Types (old structure)
export * from './types/connections';
// Types (new structure)
export * from './types';

// Components (old structure)
export { default as ConnectionsList } from './components/ConnectionsList';
export { default as InvitationsPanel } from './components/InvitationsPanel';
export { default as NewConnectionForm } from './components/NewConnectionForm';
export { default as PermissionManager } from './components/PermissionManager';
export { default as SharedDashboard } from './components/SharedDashboard';

// Components (new structure - redesigned)
export { StatsGrid } from './components/StatsGrid';
export { PermissionBadge } from './components/PermissionBadge';
export { ConnectionCard } from './components/ConnectionCard';
export { InvitationCard } from './components/InvitationCard';
export { ActivityItem } from './components/ActivityItem';
export * from './components/views';

// Hooks (old structure)
export { useSharedDataQuery } from './hooks/useSharedDataQuery';

// Hooks (new structure - redesigned)
export { useSharedState, type SharedTabView } from './hooks/useSharedState';

// Services (now in api folder)
export * from './api/SharedDataProvider';
