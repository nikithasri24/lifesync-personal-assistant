// Hooks Barrel Exports
// Centralized exports for all custom hooks

// ==================== Core Hooks ====================
export * from './useApiFocus';
export * from './useApiHealth';
export * from './useApiTasks';
export * from './useAsync';
export * from './useAuth';
export * from './useCommandBus';
export * from './useConversationalVoice';
export * from './useDependencies';
export * from './useFocus';
export * from './useHealth';
export * from './useLocalStorage';
export * from './useLocation';
export * from './useNotifications';
export * from './useOptimization';
export * from './usePlatform';
export * from './usePushNotifications';
export * from './useReminders';
export * from './useProactiveNotifications';
export * from './useResponsiveMap';
export * from './useTheme';
export * from './useToast';
export * from './useVoice';
export * from './useWebSocket';

// ==================== React Query Hooks ====================
// Tasks & Projects
export * from './useTasksQuery';
export * from './useProjectsQuery';

// Goals & Habits
export * from './useLifeGoalsQuery';
export * from './useHabitsQuery';

// Calendar & Scheduling
export * from './useCalendarQuery';
export * from './useSchedulingQuery';
export * from './useFocusQuery';

// Content & Notes
export * from './useNotesQuery';
export * from './useJournalQuery';
export * from './useInboxQuery';

// Lifestyle
export * from './useMealPlanningQuery';
export * from './useNutritionQuery';
export * from './useShoppingQuery';
export * from './useStoresQuery';
export * from './useSkincareQuery';
export * from './useTravelQuery';

// Finance
export * from './useFinanceQuery';
export * from './useBillsQuery';

// Gamification & Social
export * from './useGamificationQuery';
export * from './useConnectionsQuery';

// Specialty
export * from './useBriefingQuery';
export * from './useImportantDatesQuery';

// ==================== Deprecated Hooks ====================
// export * from './useTasks'; // Deprecated - use useTasksQuery instead
