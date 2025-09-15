// Compatibility layer - redirect all imports to the real database store
// This ensures existing components continue to work without changes

export { useRealAppStore as useAppStore } from './useRealAppStore';

// All the old mock store code is now replaced with real database integration
// Components can continue using useAppStore() and will automatically get real data

/*
The original useAppStore with mock data has been replaced.
All existing components will now use the real database through useRealAppStore.
This maintains backward compatibility while enabling real database functionality.
*/