# LifeSync Architecture

## Overview

LifeSync is a comprehensive personal productivity and life management application built with React, TypeScript, Zustand, and Supabase.

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library + Playwright
- **Styling**: TailwindCSS + Custom CSS

## Project Structure

```
lifesync/
├── src/
│   ├── api/                    # Supabase API clients
│   │   ├── notesAPI.ts
│   │   ├── journalAPI.ts
│   │   ├── goalsAPI.ts
│   │   └── ...
│   ├── components/             # Shared UI components
│   ├── finance/                # Finance module (isolated architecture)
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── services/
│   │   └── utils/
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Third-party integrations (Supabase)
│   ├── pages/                  # Main application pages
│   ├── services/               # API clients and business logic
│   ├── stores/                 # Zustand stores
│   │   ├── useRealAppStore.ts  # Main application store
│   │   └── seventyFiveHardActions.ts
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Utility functions and helpers
├── docs/                       # Documentation
├── supabase/                   # Database migrations and schemas
└── tests/                      # E2E tests
```

## Core Modules

### 1. Tasks & Projects
- Kanban-style task management
- Project organization
- Priority and status tracking
- Due dates and assignments
- Drag-and-drop interface

### 2. Habits
- Daily/weekly/monthly habit tracking
- Streak tracking
- Categories and progress analytics
- Reminder system

### 3. Notes & Journal
- Rich text notes with tagging
- Daily journaling with mood tracking
- Full-text search
- Category organization

### 4. Goals & Dreams
- Goal tracking with progress monitoring
- Bucket list (Dreams)
- Category-based organization
- Target dates and priorities

### 5. Finance
- Account management
- Transaction tracking
- Budget management with templates
- Reports and analytics
- Tax planning features

### 6. 75 Hard Challenge
- Daily task tracking
- Rule completion system
- Progress photos
- Challenge restart/pause functionality

### 7. Shopping & Meal Planning
- Shopping lists with pantry integration
- Meal planning calendar
- Recipe management
- Ingredient tracking

### 8. Focus Timer
- Pomodoro timer
- Session tracking
- Task integration

## Data Layer Architecture

### Current State: Supabase-First

All user data is persisted to Supabase PostgreSQL database with the following APIs:

- **Tasks**: `apiClient.getTasks()`, `apiClient.createTask()`, etc.
- **Notes**: `notesAPI.getNotes()`, `notesAPI.createNote()`, etc.
- **Journal**: `journalAPI.getJournalEntries()`, etc.
- **Goals/Dreams**: `goalsAPI.getGoals()`, `goalsAPI.getDreams()`, etc.
- **Finance**: Finance-specific API in `finance/data/supabaseApi.ts`
- **75 Hard**: `seventyFiveHardActions.ts` (standalone action functions)

### LocalStorage Usage

LocalStorage is **only** used for UI preferences:
- `lifesync:activeView` - Current active page
- `lifesync:settings:weekStartsOn` - Week start day preference
- `lifesync:mealOptions` - Meal option preferences
- `lifesync:settings:sfhShowInTasks` - Show 75 Hard tasks in task list
- `lifesync:sidebarCollapsed` - Sidebar collapsed state

### Data Migration

Migration utilities exist for one-time data migration from localStorage to Supabase:
- `migrateNotes()` - Migrates notes
- `migrateJournalEntries()` - Migrates journal entries
- `migrateGoals()` - Migrates goals and dreams

These run once per user on login (tracked in database).

## State Management

### Main Store: `useRealAppStore`

**Note**: This is a 3,000+ line monolithic store that needs refactoring.

Current structure:
```typescript
interface AppStore {
  // Data
  tasks: TodoItem[]
  habits: Habit[]
  notes: Note[]
  journalEntries: JournalEntry[]
  goals: Goal[]
  dreams: Dream[]
  // ... many more

  // Actions
  addTodo: (todo) => Promise<void>
  updateTodo: (id, updates) => Promise<void>
  // ... hundreds of actions

  // Initialization
  initializeData: () => Promise<void>
}
```

### Initialization Flow

1. User logs in via Supabase Auth
2. `App.tsx` triggers `initializeData()`
3. Store loads all data in parallel from Supabase
4. Migration utilities run (one-time per user)
5. UI renders with loaded data

## Authentication

- Supabase Auth with email/password
- Row Level Security (RLS) on all tables
- User-scoped data queries
- AuthGate component protects routes

## Known Issues & Technical Debt

1. **Mega Store**: 3,280-line `useRealAppStore.ts` needs to be broken into feature-specific stores
2. **Dual State**: `tasks` and `todos` both point to same data (memory waste)
3. **Inconsistent Module Structure**: Finance has isolated architecture, others don't
4. **Test Coverage Gaps**: No tests for Travel, Shopping, Meal Planning, Notes, Goals
5. **Bundle Size**: Heavy dependencies (Leaflet, Google Maps, D3, Recharts) all loaded upfront
6. **No Code Splitting**: All features load on initial page load

## Future Architecture Improvements

### Phase 1: Break Up Mega Store
- Create `useTasksStore`, `useHabitsStore`, `useFinanceStore`, etc.
- Use Zustand slices pattern
- Lazy load feature stores

### Phase 2: Standardize Module Structure
```
src/features/
  ├── tasks/
  │   ├── api/
  │   ├── components/
  │   ├── hooks/
  │   ├── store/
  │   └── types/
  ├── habits/
  └── [each feature isolated]
```

### Phase 3: Performance Optimization
- Implement code splitting by route
- Add pagination for large data sets
- Lazy load heavy dependencies
- Optimize bundle size

### Phase 4: Testing
- Add integration tests for all features
- Increase unit test coverage to 80%+
- Add E2E tests for critical flows

## Database Schema

See `supabase/migrations/` for full schema definitions.

Key tables:
- `tasks` - Task/todo items
- `projects` - Project organization
- `habits` - Habit definitions
- `habit_entries` - Habit completion records
- `notes` - User notes
- `journal_entries` - Journal entries
- `goals` - User goals
- `bucket_list_items` - Dreams/bucket list
- `financial_accounts` - Bank/credit accounts
- `financial_transactions` - Transaction records
- `sfh_challenges` - 75 Hard challenges
- `sfh_check_ins` - 75 Hard daily check-ins

All tables include:
- `user_id` - Foreign key to Supabase auth.users
- `created_at` - Timestamp
- `updated_at` - Timestamp (auto-updated via trigger)

## Development Workflow

1. **Local Development**: `npm run dev`
2. **Type Checking**: `npm run typecheck`
3. **Testing**: `npm test` or `npm run guard` (watch mode)
4. **Building**: `npm run build`
5. **Database Changes**: Create migration in `supabase/migrations/`

## Deployment

- Frontend: Hosted on your preferred platform (Vercel, Netlify, etc.)
- Database: Supabase cloud
- Environment Variables Required:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Contributing

When adding new features:
1. Create API client in `src/api/` if needed
2. Add types to `src/types/`
3. Add Supabase migration if schema changes needed
4. Update store actions in `useRealAppStore` (or create feature store)
5. Create page component in `src/pages/`
6. Add route to `App.tsx`
7. Write tests

## References

- [Supabase Docs](https://supabase.com/docs)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [React 19 Docs](https://react.dev)
