# LifeSync Cleanup Roadmap

**Created**: December 20, 2025
**Status**: Planning Phase
**Goal**: Address critical technical debt and architectural issues

---

## Overview

This roadmap addresses the critical issues identified in the technical assessment:
1. Code quality violations (959 `any` types, console.log usage, massive files)
2. Architectural violations (services bypassing API layer)
3. Component size violations (1700+ line files)
4. Missing infrastructure (routing, error boundaries, code splitting)
5. Scope rationalization (too many features)

---

## Phase 1: Critical Code Quality Fixes (Week 1-2)

**Goal**: Make the codebase compliant with its own standards

### 1.1 Remove `any` Type Violations (959 instances)

**Strategy**: Tackle highest-impact files first

```bash
# Find files with most violations
grep -r ": any\|<any>\|as any" src --include="*.ts" --include="*.tsx" | \
  cut -d: -f1 | sort | uniq -c | sort -rn | head -20
```

**Priority Order**:
1. **API layer files** (tasksAPI, habitsAPI, etc.) - Most critical
2. **Service layer files** - High impact
3. **Hook files** - Medium impact
4. **Component files** - Lower impact (but still fix)

**Approach for each file**:
- Replace `any` with proper types from `src/types/` or `src/services/types.ts`
- Use `unknown` + type guards for truly dynamic data
- Use generics for reusable functions
- Create new types if needed

**Example**:
```typescript
// ❌ Before
const handleData = (data: any) => {
  return data.items.map((item: any) => item.name);
};

// ✅ After
interface DataResponse {
  items: Array<{ name: string; id: string }>;
}

const handleData = (data: DataResponse): string[] => {
  return data.items.map((item) => item.name);
};
```

### 1.2 Remove console.log Statements

```bash
# Find all console usage
grep -rn "console\." src --include="*.ts" --include="*.tsx"
```

**Replace with logger**:
```typescript
// ❌ Before
console.log('User logged in', userId);
console.error('Failed to fetch', error);

// ✅ After
import { logger } from '@/services/logger';
logger.info('Auth', 'User logged in', { userId });
logger.error('API', error as Error, { context: 'fetch' });
```

### 1.3 Remove eslint-disable Comments

```bash
# Find all eslint-disable comments
grep -rn "eslint-disable" src --include="*.ts" --include="*.tsx"
```

**Common patterns**:
- `/* eslint-disable max-lines */` → Refactor component (see Phase 3)
- `/* eslint-disable @typescript-eslint/no-explicit-any */` → Fix types (see 1.1)
- `/* eslint-disable no-console */` → Use logger (see 1.2)

### 1.4 Audit Zustand Stores

**Files to check**:
- `src/stores/slices/*.ts`

**Rule**: Zustand = UI state ONLY. Server state = React Query.

**Bad pattern** (remove):
```typescript
// ❌ Server state in Zustand
tasks: Task[] = [];
setTasks: (tasks: Task[]) => set({ tasks });
```

**Good pattern** (keep):
```typescript
// ✅ UI state in Zustand
activeView: 'list' | 'board' = 'list';
setActiveView: (view) => set({ activeView: view });
filterStatus: 'all' | 'active' = 'all';
```

**Migration**:
- Move server state to React Query hooks
- Keep only view modes, filters, modal states, UI preferences

---

## Phase 2: Architectural Cleanup (Week 3-4)

**Goal**: Enforce proper layering and separation of concerns

### 2.1 Migrate Services to Use API Layer

**Services that need migration** (from ARCHITECTURE.md):
- `ai/ContextAggregator.ts`
- `ai/ContextualMemoryService.ts`
- `ai/LifeCoachService.ts`
- `ai/PredictionService.ts`
- `ai/SentimentAnalysisService.ts`
- `ai/UserPatternService.ts`
- `automation/AutomationEngine.ts`
- `bills/BillService.ts`
- `briefing/DailyBriefingService.ts`
- `dates/ImportantDatesService.ts`
- `gamification/GamificationService.ts`
- `inbox/InboxService.ts`
- `location/LocationService.ts`
- `nutrition/NutritionService.ts`
- `planning/WeeklyPlanningService.ts`
- `reminders/ReminderService.ts`
- `reminders/SmartReminderService.ts`
- `scheduler/ScheduleEngine.ts`
- `visionBoard/VisionBoardService.ts`

**Pattern**:
```typescript
// ❌ Before (direct Supabase)
import { supabase } from '@/lib/supabase';

class MyService {
  async getData() {
    const { data } = await supabase.from('my_table').select('*');
    return data;
  }
}

// ✅ After (using API layer)
import { getMyData } from '@/api/myAPI';

class MyService {
  async getData() {
    return getMyData();
  }
}
```


