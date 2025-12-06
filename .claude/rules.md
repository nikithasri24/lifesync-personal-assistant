# Claude Code Rules for LifeSync Personal Assistant

## 🚨 Critical Rules (NEVER Break These)

### TypeScript Strict Mode

#### No `any` Types - EVER
- ❌ NEVER use `any` type in any form
- ❌ NEVER use `as any` assertions
- ❌ NEVER use `Record<string, any>`
- ❌ NEVER use `Array<any>`
- ❌ NEVER use `: any` in function parameters or return types
- ✅ Use proper types, interfaces, or type unions
- ✅ Use `unknown` if the type is truly dynamic, then narrow with type guards
- ✅ Use generics for reusable type-safe functions
- 🚨 **If you don't know the type, STOP and ASK ME to clarify**

**Examples:**

```typescript
// ❌ WRONG
const handleChange = (e: any) => { ... }
const data: any = await fetch(...)
const items: Record<string, any> = {}

// ✅ CORRECT
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... }
const data: Recipe = await fetch(...).then(r => r.json())
const items: Record<string, Recipe> = {}

// ✅ CORRECT (when truly dynamic)
const data: unknown = await fetch(...).then(r => r.json())
if (isRecipe(data)) {
  // Now TypeScript knows it's a Recipe
  console.log(data.title)
}
```

### File Size Limits

- ❌ NEVER create files over 400 lines (excluding blank lines and comments)
- ✅ If a file approaches 350 lines, STOP and extract components/hooks/utils
- ✅ Ask me which parts to extract if unclear
- ✅ Page components should orchestrate, not implement
- ✅ Keep components focused on ONE responsibility

**When a file gets large:**
1. Stop at 350 lines
2. Identify logical sections (components, hooks, utilities, types)
3. Show me an extraction plan
4. Wait for approval
5. Extract and verify

### Testing Discipline

- ✅ ALWAYS run `npm test -- --run` before showing me code
- ✅ ALWAYS run `npm run typecheck` before showing me code
- ✅ ALWAYS run `npm run lint` before showing me code
- ❌ NEVER leave failing tests
- ❌ NEVER skip tests "to fix later"
- ✅ Fix broken tests immediately when you change code
- ✅ Update test assertions when you change behavior (e.g., console.log → logger)
- ✅ Write tests for new features as you build them, not after

**Test Requirements:**
- New components → Unit test with @testing-library/react
- New services/utils → Unit test with vitest
- New features → E2E test with Playwright (if user-facing)
- Bug fixes → Test that reproduces the bug first

### Code Quality

#### No Console Usage
- ❌ NEVER use `console.log`, `console.warn`, `console.error`
- ✅ ALWAYS use the centralized logger service
- ✅ Use appropriate log levels:
  - `logger.debug('Domain', 'message', context)` - Development only
  - `logger.info('Domain', 'message', context)` - Important events
  - `logger.warn('Domain', 'message', context)` - Warnings
  - `logger.error('Domain', error, context)` - Errors

```typescript
// ❌ WRONG
console.log('User created:', user)
console.error('Failed to save:', error)

// ✅ CORRECT
logger.info('UserService', 'User created successfully', { userId: user.id })
logger.error('UserService', error, { operation: 'createUser', userId })
```

#### Explicit Return Types
- ✅ All functions must have explicit return types
- ✅ React components: `: React.FC` or `: JSX.Element`
- ✅ Async functions: `: Promise<Type>`
- ✅ Helps catch errors early

```typescript
// ❌ WRONG
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ✅ CORRECT
const calculateTotal = (items: ShoppingItem[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

## 📐 Architecture Patterns (Follow Strictly)

### State Management

**React Query** - For ALL server/database state:
- ✅ Tasks, habits, notes, journal, goals (from Supabase)
- ✅ Use hooks: `useTasks()`, `useCreateTask()`, etc.
- ✅ Let React Query handle caching, refetching, loading states
- ❌ DON'T put server data in Zustand

**Zustand** - ONLY for client/UI state:
- ✅ activeView, sidebarCollapsed
- ✅ Global UI settings (weekStartsOn, mealOptions)
- ✅ Toast notifications
- ✅ Ephemeral UI state
- ❌ DON'T put server data here

```typescript
// ❌ WRONG - Server data in Zustand
const useAppStore = create((set) => ({
  tasks: [],
  loadTasks: async () => { /* fetching from API */ }
}))

// ✅ CORRECT - Server data in React Query
const { data: tasks } = useTasksQuery()

// ✅ CORRECT - UI state in Zustand
const { activeView, setActiveView } = useAppStore()
```

### Feature Module Structure

Every feature should follow this structure:

```
/src/[feature]/
  /components/       - UI components
    /[feature]Card.tsx
    /[feature]Form.tsx
  /hooks/           - Custom hooks
    /use[feature]Query.ts
  /services/        - Business logic, parsers, utilities
    /[feature]Helpers.ts
  /types/           - TypeScript types/interfaces
    /index.ts
  /constants.ts     - Constants and enums
  /api/            - API layer (if needed)
    /[feature]API.ts
```

**Examples that follow this:**
- ✅ `src/habits/` - Perfect example
- ✅ `src/goals/` - Perfect example
- ✅ `src/projects/` - Perfect example
- ✅ `src/mealPlanning/` - Good example

### Layered Architecture

Code should flow in ONE direction:

```
Domain Layer (types, constants)
    ↓
Services Layer (business logic, parsers, helpers)
    ↓
Hooks Layer (React Query, custom hooks)
    ↓
Components Layer (UI rendering)
```

**Rules:**
- ❌ Components should NOT import from services directly (use hooks)
- ❌ Services should NOT import React hooks
- ✅ Each layer only imports from layers below
- ✅ No circular dependencies

## 📋 Workflow Rules

### Before Writing ANY Code

1. ✅ Read the existing code in the affected area
2. ✅ Understand current patterns and architecture
3. ✅ Check if similar code exists that can be reused
4. ✅ Show me a detailed plan
5. ✅ Wait for my approval
6. ✅ THEN execute

### When Adding a New Feature

**Process:**
1. Create types/interfaces first
2. Create services/utilities with business logic
3. Create React Query hooks (if server state)
4. Create UI components
5. Write tests alongside code
6. Update documentation
7. Manual smoke test

**Example Task:**

```markdown
## Feature: Add Habit Reminders

**Files to Create:**
- src/habits/types.ts - Add `reminder` field to Habit interface
- src/habits/services/reminderService.ts - Browser notification logic
- src/habits/hooks/useHabitReminders.ts - Hook to manage reminders
- src/habits/components/HabitReminderForm.tsx - UI to set reminders

**Acceptance Criteria:**
- [ ] User can set reminder time for a habit
- [ ] Browser notification shows at reminder time
- [ ] User can disable reminders
- [ ] Reminders persist across sessions
- [ ] TypeScript compiles
- [ ] Tests pass
- [ ] No `any` types
```

### When Refactoring

**CRITICAL**: Complete ONE module 100% before starting another.

**Definition of 100% Complete:**
- [ ] Code extracted to proper files
- [ ] All imports updated
- [ ] TypeScript compiles with no errors
- [ ] All tests pass
- [ ] No `any` types in new code
- [ ] Documentation updated
- [ ] Manual smoke test passed
- [ ] Git commit created

**Process:**
1. Create a detailed refactor plan showing:
   - Current state (file size, issues)
   - Target state (file structure, line counts)
   - What goes where
   - Testing strategy
2. Show me the plan
3. Wait for approval
4. Extract ONE category at a time (e.g., components, then hooks, then services)
5. After EACH category, verify tests pass
6. Show me completion checklist
7. Get approval before moving to next module

**Example:**

```markdown
## Refactor: LifeGoals.tsx

**Current State:**
- File: src/pages/LifeGoals.tsx
- Lines: 802
- Issues: Large file, mixed concerns

**Target State:**
- Main file: <300 lines (orchestration only)
- Extract to src/goals/:
  - /components/GoalCard.tsx (~150 lines)
  - /components/GoalForm.tsx (~100 lines)
  - /components/DreamCard.tsx (~100 lines)
  - /hooks/useGoalForm.ts (~80 lines)
  - /services/goalCalculations.ts (~100 lines)

**Approach:**
1. Extract GoalCard, DreamCard components
2. Extract GoalForm component
3. Extract useGoalForm hook
4. Extract goalCalculations service
5. Update main page to use extracted modules

**Acceptance Criteria:**
- [ ] LifeGoals.tsx <300 lines
- [ ] All tests pass
- [ ] No `any` types
- [ ] Can create/edit/delete goals and dreams
- [ ] Manual test completed
```

### Before Showing Me Results

**Pre-flight Checklist** (Run these EVERY time):

```bash
# 1. TypeScript compilation
npm run typecheck
# Must show: "Found 0 errors"

# 2. Linting
npm run lint
# Must show: "0 errors, 0 warnings"

# 3. Tests
npm test -- --run
# Must show: All tests passing

# 4. Check for 'any' types in files you modified
git diff --name-only | xargs grep -n ": any\|<any>\|as any" || echo "✓ No any types"
```

**If ANY of these fail, fix them before showing me the code.**

## 🎯 Code Quality Standards

### Naming Conventions

**Components:**
- ✅ PascalCase: `HabitCard`, `TaskList`, `RecipeForm`
- ✅ Descriptive: Name describes what it renders
- ✅ Suffix with type: `Card`, `Form`, `List`, `Modal`, `Page`

**Hooks:**
- ✅ Prefix with `use`: `useTasksQuery`, `useHabitForm`, `useRecipeImport`
- ✅ Query hooks: `use[Resource]Query`, `useCreate[Resource]`, `useUpdate[Resource]`
- ✅ Custom hooks: `use[Feature][Purpose]` - `useTaskFilters`, `useMealFormModals`

**Services/Utils:**
- ✅ camelCase: `calculateStreak`, `parseRecipe`, `formatDate`
- ✅ Pure functions when possible
- ✅ Descriptive verb-noun names: `validateHabit`, `transformApiTasks`

**Variables:**
- ✅ Descriptive names: `completedHabits`, `recipeDraft`, `selectedDate`
- ❌ Avoid generic: `data`, `item`, `thing`, `temp`, `x`, `result`
- ✅ Boolean variables: `isLoading`, `hasError`, `canEdit`, `shouldShow`

### Error Handling

**Always handle errors:**

```typescript
// ❌ WRONG - Silent failure
const data = await fetchRecipe(id)

// ❌ WRONG - Console error
try {
  const data = await fetchRecipe(id)
} catch (error) {
  console.error('Error:', error)
}

// ✅ CORRECT - Proper error handling
try {
  const data = await fetchRecipe(id)
  return data
} catch (error) {
  logger.error('RecipeService', error, { recipeId: id, operation: 'fetchRecipe' })
  throw new Error(`Failed to fetch recipe: ${error instanceof Error ? error.message : 'Unknown error'}`)
}
```

**User-facing errors:**
- ✅ Show friendly error messages
- ✅ Use toast notifications for temporary errors
- ✅ Use error states in UI for persistent errors
- ✅ Provide actionable guidance ("Try again" button)

### Performance

**Memoization:**
- ✅ Use `useMemo` for expensive calculations
- ✅ Use `useCallback` for functions passed as props
- ✅ Use `React.memo` for components that render frequently with same props

**Lists:**
- ✅ Always use `key` prop (stable IDs, not indexes)
- ✅ Virtualize lists with >100 items
- ✅ Paginate API responses

**Code Splitting:**
- ✅ All pages already lazy-loaded (keep this pattern)
- ✅ Lazy load heavy components (charts, maps)
- ✅ Dynamic imports for conditional features

### Accessibility

- ✅ Semantic HTML (`<button>`, `<nav>`, `<main>`, `<article>`)
- ✅ ARIA labels where needed
- ✅ Keyboard navigation support
- ✅ Focus management in modals
- ✅ Alt text for images
- ✅ Color contrast ratios (use design system colors)

## 🔄 Git & Commits

### Commit Strategy

**One logical change per commit:**
- ✅ Good: "refactor(habits): extract HabitCard component"
- ❌ Bad: "fixed stuff and added features"

**Conventional Commits Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring (no behavior change)
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `chore`: Tooling, dependencies, config

**Examples:**
```
feat(habits): add reminder notifications
fix(todos): correct drag-and-drop state update
refactor(meals): extract RecipeCard component to 192 lines
test(shopping): add comprehensive pantry tests
docs(readme): update installation instructions
```

### Before Every Commit

**Required checks:**
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes (with `--max-warnings 0`)
- [ ] `npm test -- --run` passes
- [ ] No `any` types in changed files
- [ ] No `console.log` in changed files
- [ ] Updated relevant documentation

**These will be enforced by git hooks.**

## ❓ When to Ask vs. When to Proceed

### STOP and ASK ME if:

- ❓ You're unsure about the correct TypeScript type
- ❓ You're unsure which architecture pattern to use
- ❓ You're about to make a breaking change
- ❓ You need to change database schema
- ❓ You're about to delete code you didn't write
- ❓ The file is approaching 400 lines and you're unsure what to extract
- ❓ Tests are failing and you don't understand why
- ❓ You need to add a new dependency
- ❓ You're considering a significant performance optimization
- ❓ You're about to use a new library or API

### Proceed WITHOUT asking if:

- ✅ You're following established patterns in the codebase
- ✅ You're extracting code that clearly belongs together
- ✅ You're fixing obvious bugs
- ✅ You're adding tests
- ✅ You're updating documentation to match code
- ✅ You're applying these rules

**Default: When in doubt, ASK.**

## 🎓 Project-Specific Patterns

### React Query Patterns

**Query Hooks:**
```typescript
// File: src/hooks/use[Resource]Query.ts
export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: getTasks,
  })
}
```

**Mutation Hooks:**
```typescript
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
    },
  })
}
```

### Component Patterns

**Page Components** (Orchestrators):
```typescript
// Pages should be thin orchestrators
const HabitsPage: React.FC = () => {
  const { data: habits, isLoading } = useHabitsQuery()
  const createMutation = useCreateHabit()

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <HabitList habits={habits} />
      <AddHabitButton onCreate={createMutation.mutate} />
    </div>
  )
}
```

**Presentational Components:**
```typescript
// Components should be dumb and reusable
interface HabitCardProps {
  habit: Habit
  onComplete: () => void
  onEdit: () => void
  onDelete: () => void
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onComplete,
  onEdit,
  onDelete
}) => {
  // Just render, no business logic
  return (...)
}
```

### Service Patterns

**Pure Functions:**
```typescript
// Services should be pure, testable functions
export const calculateHabitStreak = (
  completions: HabitCompletion[],
  habitId: string
): number => {
  // Pure logic, no side effects
  const sorted = completions
    .filter(c => c.habitId === habitId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  let streak = 0
  let currentDate = new Date()

  for (const completion of sorted) {
    // ... streak calculation
  }

  return streak
}
```

## 📚 Documentation Requirements

### Update These When Changing Code:

**README.md** - If you add/remove features
**REFACTOR_PROGRESS.md** - If you complete refactoring work
**Architecture docs** - If you change patterns
**Component comments** - For complex components
**Function JSDoc** - For exported services/utilities

### JSDoc Format:

```typescript
/**
 * Calculate the current streak for a habit
 *
 * @param completions - All habit completions for the user
 * @param habitId - The habit to calculate streak for
 * @returns The current streak in days
 *
 * @example
 * const streak = calculateHabitStreak(completions, 'habit-123')
 * console.log(`Current streak: ${streak} days`)
 */
export const calculateHabitStreak = (
  completions: HabitCompletion[],
  habitId: string
): number => {
  // ...
}
```

## 🚀 Summary: The Golden Rules

1. **NO `any` TYPES. EVER.** If unsure of type, ask.
2. **Files <400 lines.** Extract before hitting limit.
3. **Tests must pass.** Fix immediately if they break.
4. **Use logger, not console.** Always.
5. **React Query for server state.** Zustand for UI only.
6. **Follow feature module structure.** Like habits/, goals/, projects/.
7. **Show me a plan before coding.** Wait for approval.
8. **Complete one thing 100% before starting another.** Definition of Done required.
9. **Run typecheck, lint, tests before showing code.** Every time.
10. **When uncertain, ASK.** Don't guess.

---

**Remember:** These rules exist to maintain code quality and prevent the "refactor treadmill" where we keep going back to fix the same issues. Following them makes everyone's life easier.

**If you (Claude) violate these rules, I (the user) will remind you of this file.**
