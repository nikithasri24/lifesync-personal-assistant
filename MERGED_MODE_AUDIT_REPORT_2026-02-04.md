# Merged Mode Audit Report
**Date:** 2026-02-04
**Commit:** 7375e640e620bba141c2b60a4ce98886f19ca44a
**Branch:** feature/shopping-integration

---

## Executive Summary

- **Total Features Analyzed:** 15 major features
- **Complete Merged Mode:** 4 features (27%)
- **Partial Merged Mode:** 1 feature (7%)
- **Missing Merged Mode:** 10 features (66%)
- **Overall Completion:** 27%

**Status:**
Your LifeSync app has strong merged mode infrastructure with `SharedDataProvider.ts` implementing the core pattern. Four major features (Shopping, Finance, Meals, Life Goals) have complete merged mode support, but the majority of productivity and lifestyle features still need implementation.

---

## Infrastructure Status

### Core Infrastructure: ✅ EXCELLENT

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| **SharedDataProvider** | ✅ Complete | `src/shared/api/SharedDataProvider.ts` | 536 lines, robust implementation with `getMergedConnectionId()` |
| **ConnectionsAPI** | ✅ Complete | `src/shared/api/connectionsAPI.ts` | Connection management available |
| **Database Tables** | ✅ Complete | Supabase | `profile_connections`, `module_permissions` tables exist |
| **OwnerBadge Component** | ✅ Available | Finance & Shopping modules | Two implementations (can be unified) |
| **OwnerFilter Component** | ✅ Available | Finance module | Filter for All/Mine/Partner |
| **Owner Utilities** | ✅ Available | `src/shopping/utils/ownerUtils.ts`, `src/finance/utils/ownerFilter.ts` | Helper functions exist |

**Infrastructure Quality:** Production-ready with clear patterns established

---

## Summary Status Table

| Feature | API | DB/RLS | Hooks | UI | Page | Overall | Priority | Effort |
|---------|-----|--------|-------|----|----|---------|----------|--------|
| **Shopping** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete | - | - |
| **Finance** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete | - | - |
| **Meals** | ✅ | ✅ | ✅ | 🟡 | 🟡 | ✅ Complete | - | 1h UI polish |
| **Life Goals** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete | - | - |
| **Travel/Visa** | ✅ | ✅ | ✅ | ❌ | ❌ | 🟡 Partial | Medium | 2h |
| **Tasks/Todos** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ Missing | **HIGH** | 3h |
| **Projects** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ Missing | **HIGH** | 3-4h |
| **Habits** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ Missing | High | 2-3h |
| **Calendar** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ Missing | High | 2-3h |
| **Notes** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ Missing | Medium | 2h |
| **Journal** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ Missing | Low | 2h |
| **Focus** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ Missing | Low | 2h |
| **Nutrition** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ Missing | Low | 2h |
| **Skincare** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ Missing | Low | 1-2h |
| **National Parks** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ Missing | Low | 2h |

---

## Detailed Feature Breakdown

### ✅ SHOPPING - Complete

**API Layer**: ✅ Complete
- File: `src/api/shoppingAPI.ts`
- getMergedConnectionId: No (relies on RLS policies)
- Fetches partner data: Yes, via RLS
- Notes: RLS policy handles merged access: "RLS policy handles filtering - returns own lists + partner's lists if merged"

**Database Layer**: ✅ Complete
- Migration files: Exists (multiple iterations in git status)
- RLS policies: Yes, comprehensive
- Supports merged access: Yes
- Notes: Shopping tables have proper RLS policies for merged mode

**Hooks Layer**: ✅ Complete
- Hook file: `src/hooks/useShoppingQuery.ts`
- Merged connection hook: Implicit via RLS
- Notes: Uses React Query with proper cache management

**UI Components**: ✅ Complete
- Owner badges: Yes (`src/shopping/components/common/OwnerBadge.tsx`)
- Owner filter: Yes
- Components checked: `DistributeView.tsx`, `PantryView.tsx`, `MasterItemCard.tsx`, `StoreListCard.tsx`
- Notes: Comprehensive owner display across all shopping components

**Page Integration**: ✅ Complete
- Page file: `src/pages/ShoppingSmart.tsx`
- Uses merged data: Yes
- Notes: Full merged mode integration with visual indicators

**Overall Status**: ✅ **Production-Ready**
**Estimated effort to complete**: N/A - Complete
**Priority for user**: N/A - Complete
**User Value**: High - couples can share shopping lists, distribute items to stores, manage pantry together

---

### ✅ FINANCE - Complete

**API Layer**: ✅ Complete
- File: `src/finance/data/supabaseApi.ts`
- getMergedConnectionId: Yes, via `useFinanceMergedConnectionQuery()`
- Fetches partner data: Yes
- Notes: Comment in code: "Don't filter by user_id - let RLS handle access control"

**Database Layer**: ✅ Complete
- Migration files: Multiple finance merge migrations (now deleted from migrations folder)
- RLS policies: Yes, comprehensive
- Supports merged access: Yes
- Notes: Finance tables have auto-merge support with sophisticated RLS

**Hooks Layer**: ✅ Complete
- Hook file: `src/hooks/useFinanceQuery.ts`
- Merged connection hook: Yes - `useFinanceMergedConnectionQuery()`
- Notes: Full React Query integration with merged connection support

**UI Components**: ✅ Complete
- Owner badges: Yes (`src/finance/components/OwnerBadge.tsx`)
- Owner filter: Yes (`src/finance/components/OwnerFilter.tsx`)
- Components checked: 9+ finance components use OwnerBadge
  - `AccountsPage.tsx`, `DashboardPage.tsx`, `BudgetsPage.tsx`, `NetWorthPage.tsx`
  - `CreditCardsPage.tsx`, `InsuranceCard.tsx`, `RetirementAccountCard.tsx`
  - `LoanCard.tsx`, `GoalCard.tsx`, `EditableTransactionRow.tsx`
- Notes: Comprehensive owner display with color coding (blue=me, purple=partner)

**Page Integration**: ✅ Complete
- Page file: `src/pages/Finances.tsx` + 18 finance sub-pages
- Uses merged data: Yes
- Notes: All 18 finance sub-pages support merged mode with owner filtering

**Overall Status**: ✅ **Production-Ready**
**Estimated effort to complete**: N/A - Complete
**Priority for user**: N/A - Complete
**User Value**: Very High - comprehensive financial collaboration (accounts, budgets, goals, net worth, etc.)

---

### ✅ MEALS - Complete (Minor UI Polish Needed)

**API Layer**: ✅ Complete
- File: `src/api/mealPlanningAPI.ts`
- getMergedConnectionId: Yes - `getMealsMergedConnection()` with caching
- Fetches partner data: Yes
- Notes: Explicit merged mode support with comment: "Supports 'merged' mode where connected users share the same meal plans"

**Database Layer**: ✅ Complete
- Migration files: Meal planning migrations exist
- RLS policies: Yes
- Supports merged access: Yes
- Notes: Includes automatic migration of personal meals to shared plans

**Hooks Layer**: ✅ Complete
- Hook file: `src/hooks/useMealPlanningQuery.ts`
- Merged connection hook: Yes - `useMergedConnectionQuery()`
- Notes: Full React Query integration with merged support

**UI Components**: 🟡 Partial
- Owner badges: Limited visibility
- Owner filter: Not prominent
- Components checked: `src/mealPlanning/components/`
- Notes: API and hooks are complete, but UI could show ownership more clearly

**Page Integration**: 🟡 Partial
- Page file: `src/pages/MealPlanning.tsx`
- Uses merged data: Yes
- Notes: Fetches merged data but owner display could be more prominent

**Overall Status**: ✅ **Functional** (UI could be polished)
**Estimated effort to complete**: 1 hour - Add owner badges to meal cards
**Priority for user**: Low - Already functional
**User Value**: High - couples can plan meals together, share recipes

---

### ✅ LIFE GOALS - Complete

**API Layer**: ✅ Complete
- File: `src/goals/api/lifeGoalsAPI.ts`
- getMergedConnectionId: Yes - `getGoalsMergedConnection()` with caching
- Fetches partner data: Yes
- Notes: Sophisticated merged mode with both personal and shared goals

**Database Layer**: ✅ Complete
- Migration files: Goals merge migrations exist
- RLS policies: Yes
- Supports merged access: Yes
- Notes: Supports both `user_id` (personal) and `connection_id` (shared) goals with individual progress tracking

**Hooks Layer**: ✅ Complete
- Hook file: `src/goals/hooks/`
- Merged connection hook: Yes - `useMergedGoalsConnectionQuery()`
- Notes: Full React Query integration

**UI Components**: ✅ Complete
- Owner badges: Yes (visible in goals UI)
- Owner filter: Implied
- Components checked: `src/goals/components/`
- Notes: Goals show ownership badges for personal vs shared goals

**Page Integration**: ✅ Complete
- Page file: `src/pages/LifeGoals.tsx`
- Uses merged data: Yes
- Notes: Shows personal goals + partner's personal goals + shared goals

**Overall Status**: ✅ **Production-Ready**
**Estimated effort to complete**: N/A - Complete
**Priority for user**: N/A - Complete
**User Value**: High - couples can set shared life goals and track individual progress

---

### 🟡 TRAVEL/VISA - Partial (API Complete, UI Missing)

**API Layer**: ✅ Complete
- File: `src/travel/api/passportAPI.ts`
- getMergedConnectionId: Yes - `getVisaMergedConnection()` with caching
- Fetches partner data: Yes
- Notes: Merged mode implemented in API layer

**Database Layer**: ✅ Complete
- Migration files: Visa/travel merge migrations exist (archived)
- RLS policies: Yes
- Supports merged access: Yes
- Notes: Passport and visa tables support merged access

**Hooks Layer**: ✅ Complete
- Hook file: `src/travel/hooks/`
- Merged connection hook: Yes
- Notes: API layer exposes merged data

**UI Components**: ❌ Missing
- Owner badges: No
- Owner filter: No
- Components checked: `src/travel/components/`
- Notes: Components don't display ownership information

**Page Integration**: ❌ Partial
- Page file: `src/pages/Travel.tsx`
- Uses merged data: Yes (fetches it)
- Notes: Data is fetched but not visually distinguished

**Overall Status**: 🟡 **Partial** - API ready, UI needs work
**Estimated effort to complete**: 2 hours - Add owner badges to visa calculator and passport cards
**Priority for user**: Medium - API works, just needs visual clarity
**User Value**: Medium - couples can see each other's visa requirements for trip planning

---

### ❌ TASKS/TODOS - Missing

**API Layer**: ❌ Missing
- File: `src/api/tasksAPI.ts`
- getMergedConnectionId: No
- Fetches partner data: No - only filters by `user_id`
- Notes: Line 34: `.eq('user_id', user.id)` - no merged mode support

**Database Layer**: ❌ Missing
- Migration file: Tasks table exists but no merged RLS
- RLS policies: Only user-specific
- Supports merged access: No
- Notes: Would need `connection_id` field and RLS policies updated

**Hooks Layer**: ❌ Missing
- Hook file: Likely exists but no merged support
- Merged connection hook: No
- Notes: Would need to create merged connection hook

**UI Components**: ❌ Missing
- Owner badges: No
- Owner filter: No
- Components checked: N/A
- Notes: Would need to add OwnerBadge component

**Page Integration**: ❌ Missing
- Page file: `src/pages/Todos.tsx`
- Uses merged data: No
- Notes: Only shows personal tasks

**Overall Status**: ❌ **Not Implemented**
**Estimated effort to complete**: 3 hours
- Add `getMergedConnectionId('todos')` to API
- Update RLS policies
- Create merged connection hook
- Add owner badges to task UI
- Add owner filter option

**Priority for user**: **🔴 HIGH**
**User Value**: **VERY HIGH** - Shared to-do lists are essential for couples (grocery lists, household chores, errands)

---

### ❌ PROJECTS - Missing

**API Layer**: ❌ Missing
- File: `src/api/projectsAPI.ts`
- getMergedConnectionId: No
- Fetches partner data: No - only filters by `user_id`
- Notes: Line 30: `.eq('user_id', user.id)` - no merged mode support

**Database Layer**: ❌ Missing
- Migration file: Projects table exists but no merged RLS
- RLS policies: Only user-specific
- Supports merged access: No
- Notes: Would need `connection_id` field for shared projects

**Hooks Layer**: ❌ Missing
- Hook file: Likely exists but no merged support
- Merged connection hook: No
- Notes: Would need to create merged connection hook

**UI Components**: ❌ Missing
- Owner badges: No
- Owner filter: No
- Components checked: N/A
- Notes: Would need to add OwnerBadge component

**Page Integration**: ❌ Missing
- Page file: `src/pages/ProjectTracking.tsx`
- Uses merged data: No
- Notes: Only shows personal projects

**Overall Status**: ❌ **Not Implemented**
**Estimated effort to complete**: 3-4 hours (more complex due to milestones and project tasks)
- Add `getMergedConnectionId('projects')` to API
- Update RLS policies for projects, milestones, and project_tasks
- Create merged connection hook
- Add owner badges to project cards and milestone UI
- Add owner filter option

**Priority for user**: **🔴 HIGH**
**User Value**: **VERY HIGH** - Couples collaborate on home projects, vacation planning, renovations, etc.

---

### ❌ HABITS - Missing

**API Layer**: ❌ Missing
- File: `src/api/habitsAPI.ts`
- getMergedConnectionId: No
- Fetches partner data: No - only filters by `user_id`
- Notes: Line 28: `.eq('user_id', user.id)` - no merged mode support

**Database Layer**: ❌ Missing
- Migration file: Habits table exists but no merged RLS
- RLS policies: Only user-specific
- Supports merged access: No
- Notes: Would need to support shared habits with individual progress tracking

**Hooks Layer**: ❌ Missing
- Hook file: Exists but no merged support
- Merged connection hook: No
- Notes: Would need to create merged connection hook

**UI Components**: ❌ Missing
- Owner badges: No
- Owner filter: No
- Components checked: N/A
- Notes: Would need to add OwnerBadge component

**Page Integration**: ❌ Missing
- Page file: `src/pages/Habits.tsx`
- Uses merged data: No
- Notes: Only shows personal habits

**Overall Status**: ❌ **Not Implemented**
**Estimated effort to complete**: 2-3 hours
- Add `getMergedConnectionId('habits')` to API
- Update RLS policies
- Support shared habits with individual progress (like goals)
- Create merged connection hook
- Add owner badges and comparison UI
- Optional: Add competitive leaderboard view

**Priority for user**: 🟡 **HIGH**
**User Value**: **HIGH** - Couples can track shared habits (exercise, water intake, meditation) and motivate each other

---

### ❌ CALENDAR - Missing

**API Layer**: ❌ Missing
- File: `src/api/calendarAPI.ts`
- getMergedConnectionId: No
- Fetches partner data: No - only filters by `user_id`
- Notes: Line 48: `.eq('user_id', user.id)` - no merged mode support

**Database Layer**: ❌ Missing
- Migration file: Calendar events table exists but no merged RLS
- RLS policies: Only user-specific
- Supports merged access: No
- Notes: Would need RLS to allow viewing partner's calendar

**Hooks Layer**: ❌ Missing
- Hook file: Likely exists but no merged support
- Merged connection hook: No
- Notes: Would need to create merged connection hook

**UI Components**: ❌ Missing
- Owner badges: No
- Owner filter: No
- Components checked: N/A
- Notes: Would need color-coded events (me vs partner)

**Page Integration**: ❌ Missing
- Page file: `src/pages/Calendar.tsx`
- Uses merged data: No
- Notes: Only shows personal calendar

**Overall Status**: ❌ **Not Implemented**
**Estimated effort to complete**: 2-3 hours
- Add `getMergedConnectionId('calendar')` to API
- Update RLS policies
- Create merged connection hook
- Add color-coded events (blue=me, purple=partner)
- Add toggle to show/hide partner's calendar

**Priority for user**: 🟡 **HIGH**
**User Value**: **HIGH** - Essential for couples to coordinate schedules, plan date nights, avoid conflicts

---

### ❌ NOTES - Missing

**API Layer**: ❌ Missing
- File: `src/api/notesAPI.ts`
- getMergedConnectionId: No
- Fetches partner data: No - only filters by `user_id`
- Notes: Line 77: `.eq('user_id', user.id)` - no merged mode support

**Database Layer**: ❌ Missing
- Migration file: Notes table exists but no merged RLS
- RLS policies: Only user-specific
- Supports merged access: No
- Notes: Would need RLS for shared notes

**Hooks Layer**: ❌ Missing
- Hook file: Likely exists but no merged support
- Merged connection hook: No
- Notes: Would need to create merged connection hook

**UI Components**: ❌ Missing
- Owner badges: No
- Owner filter: No
- Components checked: N/A
- Notes: Would need to add OwnerBadge component

**Page Integration**: ❌ Missing
- Page file: `src/pages/Notes.tsx`
- Uses merged data: No
- Notes: Only shows personal notes

**Overall Status**: ❌ **Not Implemented**
**Estimated effort to complete**: 2 hours
- Add `getMergedConnectionId('notes')` to API
- Update RLS policies
- Create merged connection hook
- Add owner badges to note cards
- Optional: Add collaboration features (commenting, @mentions)

**Priority for user**: 🟢 **Medium**
**User Value**: **Medium** - Useful for shared shopping lists, recipe notes, household documentation

---

### ❌ JOURNAL - Missing

**API Layer**: ❌ Missing
- File: `src/api/journalAPI.ts`
- getMergedConnectionId: No
- Fetches partner data: No - only filters by `user_id`
- Notes: Line 77: `.eq('user_id', user.id)` - no merged mode support

**Database Layer**: ❌ Missing
- Migration file: Journal entries table exists but no merged RLS
- RLS policies: Only user-specific
- Supports merged access: No
- Notes: Journal is typically private - may want opt-in sharing per entry

**Hooks Layer**: ❌ Missing
- Hook file: Likely exists but no merged support
- Merged connection hook: No
- Notes: Would need to create merged connection hook

**UI Components**: ❌ Missing
- Owner badges: No
- Owner filter: No
- Components checked: N/A
- Notes: Would need privacy controls

**Page Integration**: ❌ Missing
- Page file: Journal page
- Uses merged data: No
- Notes: Only shows personal journal

**Overall Status**: ❌ **Not Implemented**
**Estimated effort to complete**: 2 hours (with privacy controls)
- Add `getMergedConnectionId('journal')` to API
- Add per-entry privacy flag (shared: true/false)
- Update RLS policies
- Create merged connection hook
- Add owner badges and privacy indicator
- Optional: Add selective sharing (only certain entries)

**Priority for user**: 🟢 **Low**
**User Value**: **Low-Medium** - Journaling is typically private, but couples may want to share certain reflections

---

### ❌ FOCUS - Missing

**API Layer**: ❌ Missing
- File: `src/api/focusAPI.ts`
- getMergedConnectionId: No
- Fetches partner data: No - only filters by `user_id`
- Notes: Line 29: `.eq('user_id', user.id)` - no merged mode support

**Database Layer**: ❌ Missing
- Migration file: Focus sessions table exists but no merged RLS
- RLS policies: Only user-specific
- Supports merged access: No
- Notes: Could support seeing partner's focus sessions

**Hooks Layer**: ❌ Missing
- Hook file: Likely exists but no merged support
- Merged connection hook: No
- Notes: Would need to create merged connection hook

**UI Components**: ❌ Missing
- Owner badges: No
- Owner filter: No
- Components checked: N/A
- Notes: Could show partner's active focus sessions

**Page Integration**: ❌ Missing
- Page file: `src/pages/Focus.tsx`
- Uses merged data: No
- Notes: Only shows personal focus sessions

**Overall Status**: ❌ **Not Implemented**
**Estimated effort to complete**: 2 hours
- Add `getMergedConnectionId('focus')` to API
- Update RLS policies
- Create merged connection hook
- Add owner badges to focus session history
- Optional: Show partner's active focus session (for "do not disturb" awareness)

**Priority for user**: 🟢 **Low**
**User Value**: **Low-Medium** - Nice to know when partner is focused, but not critical

---

### ❌ NUTRITION - Missing

**API Layer**: ❌ Missing
- File: `src/api/nutritionAPI.ts`
- getMergedConnectionId: No
- Fetches partner data: No - likely only user-specific
- Notes: Personal nutrition tracking, no merged mode

**Database Layer**: ❌ Missing
- Migration file: Nutrition tables exist but no merged RLS
- RLS policies: Only user-specific
- Supports merged access: No
- Notes: Would need RLS for viewing partner's nutrition data

**Hooks Layer**: ❌ Missing
- Hook file: Likely exists but no merged support
- Merged connection hook: No
- Notes: Would need to create merged connection hook

**UI Components**: ❌ Missing
- Owner badges: No
- Owner filter: No
- Components checked: N/A
- Notes: Would need to add comparison views

**Page Integration**: ❌ Missing
- Page file: `src/pages/Nutrition.tsx`
- Uses merged data: No
- Notes: Only shows personal nutrition

**Overall Status**: ❌ **Not Implemented**
**Estimated effort to complete**: 2 hours
- Add `getMergedConnectionId('nutrition')` to API
- Update RLS policies
- Create merged connection hook
- Add owner badges and comparison charts

**Priority for user**: 🟢 **Low**
**User Value**: **Low** - Nutrition is typically personal, but could support couples with shared fitness goals

---

### ❌ SKINCARE - Missing

**API Layer**: ❌ Missing
- File: `src/api/skincareAPI.ts`
- getMergedConnectionId: No
- Fetches partner data: No - only filters by `user_id`
- Notes: Line 37: `.eq('user_id', user.id)` - no merged mode support

**Database Layer**: ❌ Missing
- Migration file: Skincare tables exist but no merged RLS
- RLS policies: Only user-specific
- Supports merged access: No
- Notes: Personal skincare tracking

**Hooks Layer**: ❌ Missing
- Hook file: Likely exists but no merged support
- Merged connection hook: No
- Notes: Would need to create merged connection hook

**UI Components**: ❌ Missing
- Owner badges: No
- Owner filter: No
- Components checked: N/A
- Notes: Would need to add owner display

**Page Integration**: ❌ Missing
- Page file: `src/pages/Skincare.tsx`
- Uses merged data: No
- Notes: Only shows personal skincare

**Overall Status**: ❌ **Not Implemented**
**Estimated effort to complete**: 1-2 hours
- Add `getMergedConnectionId('skincare')` to API
- Update RLS policies
- Create merged connection hook
- Add owner badges

**Priority for user**: 🟢 **Low**
**User Value**: **Low** - Highly personal, limited collaboration value

---

### ❌ NATIONAL PARKS - Missing

**API Layer**: ❌ Missing
- File: `src/api/nationalParksAPI.ts`
- getMergedConnectionId: No
- Fetches partner data: No
- Notes: Visited parks tracking is user-specific

**Database Layer**: ❌ Missing
- Migration file: Visited parks table exists but no merged RLS
- RLS policies: Only user-specific
- Supports merged access: No
- Notes: Would need RLS for viewing partner's visited parks

**Hooks Layer**: ❌ Missing
- Hook file: Likely exists but no merged support
- Merged connection hook: No
- Notes: Would need to create merged connection hook

**UI Components**: ❌ Missing
- Owner badges: No
- Owner filter: No
- Components checked: N/A
- Notes: Could show both users' visited parks on map

**Page Integration**: ❌ Missing
- Page file: `src/pages/NationalParks.tsx`
- Uses merged data: No
- Notes: Only shows personal visited parks

**Overall Status**: ❌ **Not Implemented**
**Estimated effort to complete**: 2 hours
- Add `getMergedConnectionId('travel')` to API
- Update RLS policies
- Create merged connection hook
- Add color-coded markers on map (me=blue, partner=purple, both=green)

**Priority for user**: 🟢 **Low**
**User Value**: **Medium** - Nice for couples to see which parks they've both visited vs. want to visit together

---

## Prioritized Action Plan

### 🔴 Priority 1 - High Collaboration Value (Do First)

These features are used daily by couples and have the highest collaboration value:

#### 1. **Tasks/Todos** - ❌ Missing - 3 hours
**Why First:** Shared to-do lists are essential for couples (grocery lists, household chores, errands)
**Implementation:**
- Add `getMergedConnectionId('todos')` to tasksAPI
- Update tasks table RLS policies
- Create `useMergedTasksConnectionQuery()` hook
- Add OwnerBadge to task cards
- Add OwnerFilter dropdown (All/Mine/Partner)

#### 2. **Projects** - ❌ Missing - 3-4 hours
**Why Second:** Couples collaborate on projects (home renovations, vacation planning, moving)
**Implementation:**
- Add `getMergedConnectionId('projects')` to projectsAPI
- Update RLS for projects, milestones, and project_tasks tables
- Create `useMergedProjectsConnectionQuery()` hook
- Add OwnerBadge to project cards and milestones
- Add OwnerFilter dropdown
- Consider: Team member assignment features

#### 3. **Calendar** - ❌ Missing - 2-3 hours
**Why Third:** Essential for coordinating schedules, avoiding conflicts
**Implementation:**
- Add `getMergedConnectionId('calendar')` to calendarAPI
- Update calendar_events table RLS
- Create `useMergedCalendarConnectionQuery()` hook
- Add color-coded events (blue=me, purple=partner, shared=green)
- Add toggle to show/hide partner's calendar
- Consider: Free/busy status view

---

### 🟡 Priority 2 - Medium Collaboration Value

These features enhance collaboration but aren't daily essentials:

#### 4. **Habits** - ❌ Missing - 2-3 hours
**User Value:** Accountability and motivation for shared health goals
**Implementation:**
- Add `getMergedConnectionId('habits')` to habitsAPI
- Support shared habits with individual progress tracking (like Goals)
- Add comparison/leaderboard view
- OwnerBadge for personal habits
- Consider: Competitive streaks, achievements

#### 5. **Travel/Visa** (Complete API, Add UI) - 🟡 Partial - 2 hours
**User Value:** Trip planning together, knowing visa requirements
**Implementation:**
- Add OwnerBadge to visa calculator results
- Add OwnerBadge to passport cards
- Add color indicators on travel maps
- Polish existing merged data display

#### 6. **Notes** - ❌ Missing - 2 hours
**User Value:** Shared documentation, recipe notes, household info
**Implementation:**
- Add `getMergedConnectionId('notes')` to notesAPI
- Update RLS policies
- Add OwnerBadge to note cards
- Consider: Collaboration features (@mentions, comments)

#### 7. **Meals** (Polish UI) - ✅ Functional - 1 hour
**User Value:** Already functional, just needs better ownership display
**Implementation:**
- Add more prominent OwnerBadge to meal cards
- Add OwnerFilter to meal planning page
- Polish UI for clarity

---

### 🟢 Priority 3 - Low Priority / Optional

These features are typically personal or have limited collaboration value:

#### 8. **Journal** - ❌ Missing - 2 hours
**User Value:** Typically private, but selective sharing could be intimate
**Implementation:**
- Add per-entry privacy flag (shared: true/false)
- Add `getMergedConnectionId('journal')` with privacy checks
- Add privacy indicator UI
- Owner badges for shared entries only

#### 9. **Focus** - ❌ Missing - 2 hours
**User Value:** Awareness of partner's focus sessions ("do not disturb")
**Implementation:**
- Add `getMergedConnectionId('focus')` to focusAPI
- Show partner's active focus session
- Add focus session history with owner badges

#### 10. **National Parks** - ❌ Missing - 2 hours
**User Value:** Fun to see which parks you've both visited
**Implementation:**
- Add `getMergedConnectionId('travel')` to nationalParksAPI
- Add color-coded map markers (me, partner, both)
- Add visited parks comparison view

#### 11. **Nutrition** - ❌ Missing - 2 hours
**User Value:** Limited, unless both tracking for shared fitness goals
**Implementation:**
- Add `getMergedConnectionId('nutrition')` to nutritionAPI
- Add comparison charts
- Add owner badges

#### 12. **Skincare** - ❌ Missing - 1-2 hours
**User Value:** Very limited, highly personal
**Implementation:**
- Add `getMergedConnectionId('skincare')` to skincareAPI
- Add owner badges
- (Consider: Maybe not worth implementing)

---

## Common Issues Found

### 1. **Inconsistent OwnerBadge Implementation**
- Finance has its own: `src/finance/components/OwnerBadge.tsx`
- Shopping has its own: `src/shopping/components/common/OwnerBadge.tsx`
- **Fix:** Create a shared component at `src/components/common/OwnerBadge.tsx`

### 2. **Migration File Management Issues**
- Multiple deleted migration files in git status
- Suggests iterative debugging in production
- **Fix:** Clean up git history, consolidate migrations

### 3. **RLS Policy Documentation**
- Some features have RLS but it's not documented in code comments
- **Fix:** Add comments to API files indicating RLS handles merged access

### 4. **Owner Utility Duplication**
- `src/shopping/utils/ownerUtils.ts`
- `src/finance/utils/ownerFilter.ts`
- **Fix:** Create shared utilities at `src/shared/utils/ownerUtils.ts`

### 5. **Merged Connection Caching Pattern**
- Finance, Meals, Goals all implement their own caching
- **Fix:** Consider centralizing cache in SharedDataProvider

---

## Recommendations

### Quick Wins (Minimal Effort, High Impact)

1. **Travel/Visa UI** (2 hours) - API is done, just add badges
2. **Meals UI Polish** (1 hour) - Already functional, just make ownership clearer
3. **Unify OwnerBadge** (30 min) - Create shared component, reduce duplication

### Standard Implementation Pattern

Use this checklist for each new feature:

```typescript
// 1. API Layer - Add merged connection with caching
import { getMergedConnectionId } from '@/shared/api/SharedDataProvider';

let cachedMergedConnection: MergedConnectionResult | null | undefined;

export async function getFeatureMergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedMergedConnection !== undefined) return cachedMergedConnection;
  cachedMergedConnection = await getMergedConnectionId('feature-module');
  return cachedMergedConnection;
}

// 2. Hooks Layer - Create merged connection query
export function useMergedFeatureConnectionQuery() {
  return useQuery({
    queryKey: ['feature', 'mergedConnection'],
    queryFn: getFeatureMergedConnection,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// 3. Database Layer - Update RLS policy
CREATE POLICY "merged_access_feature" ON feature_table
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profile_connections pc
      JOIN module_permissions mp ON mp.connection_id = pc.id
      WHERE (
        (pc.requester_id = auth.uid() AND pc.receiver_id = user_id) OR
        (pc.receiver_id = auth.uid() AND pc.requester_id = user_id)
      )
      AND mp.module = 'feature-name'
      AND mp.permission_level = 'merged'
      AND mp.user_id = auth.uid()
      AND pc.status = 'active'
    )
  );

// 4. UI Layer - Add OwnerBadge
import { OwnerBadge } from '@/components/common/OwnerBadge';

<OwnerBadge
  userId={item.userId}
  currentUserId={currentUser.id}
  partnerName={partnerName}
/>

// 5. UI Layer - Optional OwnerFilter
import { OwnerFilter } from '@/components/common/OwnerFilter';

<OwnerFilter
  value={ownerFilter}
  onChange={setOwnerFilter}
  partnerName={partnerName}
/>
```

### Common Pitfalls to Avoid

1. **Don't forget INSERT/UPDATE/DELETE RLS policies** - SELECT is just the start
2. **Always cache merged connection results** - Avoid redundant DB queries
3. **Include partner's data in API fetch** - Not just RLS filtering
4. **Test both merged and non-merged states** - Handle null connection gracefully
5. **Consider mobile UI** - Owner badges should work on small screens

---

## Implementation Checklist Template

Use this checklist when adding merged mode to a new feature:

### Adding Merged Mode to [Feature Name]

**API Layer**
- [ ] Import `getMergedConnectionId` from SharedDataProvider
- [ ] Create `get[Feature]MergedConnection()` with caching
- [ ] Update fetch functions to include partner data when merged
- [ ] Add logging for merged connection status

**Database Layer**
- [ ] Create migration file with timestamp
- [ ] Add RLS policy for SELECT (merged access)
- [ ] Add RLS policy for INSERT (own data only)
- [ ] Add RLS policy for UPDATE (own data only unless collaborate)
- [ ] Add RLS policy for DELETE (own data only)
- [ ] Test RLS policies in Supabase dashboard

**Hooks Layer**
- [ ] Create `useMerged[Feature]ConnectionQuery()` hook
- [ ] Update existing query hooks to use merged connection
- [ ] Add staleTime cache configuration
- [ ] Test hook returns correct merged status

**UI Components**
- [ ] Import OwnerBadge component
- [ ] Add OwnerBadge to list items
- [ ] Add OwnerBadge to detail views
- [ ] Optional: Add OwnerFilter dropdown
- [ ] Add owner information to cards/rows

**Page Integration**
- [ ] Use `useMerged[Feature]ConnectionQuery()` in page
- [ ] Handle merged/non-merged states
- [ ] Add owner filtering if applicable
- [ ] Update loading states
- [ ] Update empty states

**Testing**
- [ ] Test with no connection (personal mode)
- [ ] Test with connection but no merged permission
- [ ] Test with full merged permission
- [ ] Verify data shows for both users
- [ ] Verify owner information displays correctly
- [ ] Test on mobile UI
- [ ] Test RLS policies manually in Supabase
- [ ] Check console for errors

**Documentation**
- [ ] Add comment to API file about RLS handling
- [ ] Update README if needed
- [ ] Add to merged mode feature list

---

## Estimated Total Effort

| Priority | Features | Total Hours |
|----------|----------|-------------|
| Priority 1 (High) | Tasks, Projects, Calendar | 8-10 hours |
| Priority 2 (Medium) | Habits, Travel UI, Notes, Meals UI | 7-8 hours |
| Priority 3 (Low) | Journal, Focus, Parks, Nutrition, Skincare | 9-10 hours |
| **TOTAL** | **All 10 missing features** | **24-28 hours** |

**Optimized Plan:** Focus on Priority 1 features first (8-10 hours) for maximum user impact.

---

## Next Steps

### This Week (Priority 1)
1. ✅ **Audit complete** - You have this report
2. **Implement Tasks merged mode** (3 hours)
   - Most impactful for daily use
   - Simplest to implement (good starting point)
3. **Implement Projects merged mode** (3-4 hours)
   - High collaboration value
   - More complex (good learning experience)

### Next Week (Priority 1 + 2)
4. **Implement Calendar merged mode** (2-3 hours)
5. **Implement Habits merged mode** (2-3 hours)
6. **Polish Travel/Visa UI** (2 hours)

### Future (Priority 3)
- Notes, Journal, Focus, National Parks, Nutrition, Skincare as time permits

---

## Conclusion

**Strong Foundation:** Your merged mode infrastructure is production-ready with excellent patterns established in Finance and Shopping.

**Clear Path Forward:** Implementing merged mode for remaining features is straightforward - copy the pattern from Finance/Shopping/Meals/Goals.

**Highest Impact:** Focus on Tasks, Projects, and Calendar first - these are daily collaboration tools for couples.

**Realistic Timeline:** With the `/audit-merged-mode` skill created and this report, you can implement all high-priority features (Tasks, Projects, Calendar) in 8-10 hours of focused work.

**Automation Opportunity:** Create the `/add-merged-mode` and `/complete-feature-merged` skills to reduce implementation time from 3 hours to 30 minutes per feature.

---

**Report Generated by:** `/audit-merged-mode` skill
**Agent ID:** To be assigned
**Report Version:** 1.0
