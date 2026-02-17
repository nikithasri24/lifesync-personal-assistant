// API Layer Barrel Exports
// Centralized exports for all API modules
// See ARCHITECTURE.md for API layer conventions

// Core domain APIs
export * from './tasksAPI';
export * from './projectsAPI';
export * from './habitsAPI';
export * from './lifeGoalsAPI';

// Analytics
export * from './analyticsAPI';

// Conversations
export * from './conversationsAPI';

// Content APIs
export * from './notesAPI';
export * from './journalAPI';
export * from './calendarAPI';

// Lifestyle APIs
export * from './shoppingAPI';
export * from './focusAPI';
export * from './skincareAPI';
// export * from './travelAPI'; // TODO: Re-enable when travelAPI is implemented
export * from './nutritionAPI';

// Finance & Bills
export * from './billsAPI';
export * from './financeAPI';

// Meal Planning
export * from './mealPlanningAPI';

// Productivity APIs
export * from './schedulerAPI';
export * from './inboxAPI';
export * from './importantDatesAPI';
export * from './automationAPI';
export * from './notificationAPI';
export * from './listAPI';
export * from './userSettingsAPI';
export * from './pushSubscriptionsAPI';

// Gamification removed - no longer needed
