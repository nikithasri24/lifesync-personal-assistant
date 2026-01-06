// Shared Domain Barrel Exports
// Centralized exports for shared/collaboration features

// API
export * from './api/connectionsAPI';

// Types
export * from './types/connections';

// Components
export { default as ConnectionsList } from './components/ConnectionsList';
export { default as InvitationsPanel } from './components/InvitationsPanel';
export { default as NewConnectionForm } from './components/NewConnectionForm';
export { default as PermissionManager } from './components/PermissionManager';
export { default as SharedDashboard } from './components/SharedDashboard';

// Hooks
export { useSharedDataQuery } from './hooks/useSharedDataQuery';

// Services (now in api folder)
export * from './api/SharedDataProvider';
