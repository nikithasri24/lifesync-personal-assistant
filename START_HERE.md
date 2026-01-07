# 🚀 Start Here: LifeSync Cleanup Guide

**Created**: December 20, 2025
**Your Mission**: Transform LifeSync from feature-bloated to focused and maintainable

---

## 📋 Before You Start

### Step 1: Run the Analysis Script

```bash
./scripts/cleanup-analysis.sh
```

This will show you:
- How many `any` types need fixing
- Console.log statements to replace
- Files over 400 lines
- Services bypassing the API layer

### Step 2: Make Strategic Decisions (DO THIS FIRST!)

**You MUST decide on scope before fixing code.** Otherwise you'll waste time fixing features you'll remove.

#### Decision 1: Finance Module

**Question**: Do you actively use the finance features?

- **YES** → Keep it, but modularize (see CLEANUP_ROADMAP_PART3.md section 5.1)
- **NO** → Remove it entirely (saves weeks of work)

#### Decision 2: Core Features

**Question**: Which features do you actually use daily/weekly?

Mark each feature:
- ✅ **Use Daily**: Tasks, Habits, Calendar, AI Assistant, Focus
- ⚠️ **Use Weekly**: Notes, Journal, Goals, Meal Planning, Shopping
- ❌ **Rarely Use**: Travel, Skincare, Nutrition, National Parks, Visa Calculator

**Action**: Remove features you marked ❌

#### Decision 3: AI Complexity

**Question**: Do you need advanced AI features?

- **Life Coach Service** - Do you use weekly check-ins? YES/NO
- **Pattern Prediction** - Do you use predictions? YES/NO
- **Sentiment Analysis** - Do you use journal sentiment? YES/NO

If NO to any, mark for removal.

### Step 3: Document Your Decisions

Create a file `MY_DECISIONS.md`:

```markdown
# My Feature Decisions

## Keep
- Tasks & Projects ✅
- Habits ✅
- Calendar ✅
- AI Assistant ✅
- Focus Timer ✅
- [Add others you use]

## Remove
- Skincare ❌
- National Parks ❌
- Visa Calculator ❌
- [Add others you don't use]

## Simplify
- Finance → Keep but modularize
- AI → Remove sentiment analysis, keep basics
```

---

## 🎯 Quick Wins (Start Here - Week 1)

These are easy fixes that make immediate impact:

### Day 1: Remove Console.log (2 hours)

```bash
# Find all console usage
grep -rn "console\." src --include="*.ts" --include="*.tsx" > console-usage.txt

# Fix pattern:
# Before: console.log('User logged in', userId);
# After:  logger.info('Auth', 'User logged in', { userId });
```

**Script to help**:
```bash
# Replace console.log with logger.info
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/console\.log/logger.info/g'

# Then manually fix the parameters to match logger format
```

### Day 2: Remove eslint-disable Comments (2 hours)

```bash
# Find all eslint-disable
grep -rn "eslint-disable" src --include="*.ts" --include="*.tsx"

# For each file:
# 1. Remove the comment
# 2. Run: npm run lint -- path/to/file.ts
# 3. Fix the actual issues
```

### Day 3-4: Fix API Layer `any` Types (1 day)

**Priority files** (fix these first):
```bash
# Find API files with 'any'
grep -r ": any" src/api --include="*.ts" | cut -d: -f1 | sort | uniq
```

**Pattern**:
```typescript
// ❌ Before
export async function getTasks(): Promise<any> {
  const { data } = await supabase.from('tasks').select('*');
  return data;
}

// ✅ After
import type { Task } from '@/types/task';

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) throw error;
  return data as Task[];
}
```

### Day 5: Audit Zustand Stores (1 day)

**Check each slice** in `src/stores/slices/`:

```typescript
// ❌ BAD: Server state in Zustand
tasks: Task[] = [];
habits: Habit[] = [];
loadTasks: async () => { ... }

// ✅ GOOD: UI state only
activeView: 'list' | 'board' = 'list';
filterStatus: 'all' | 'active' = 'all';
sidebarCollapsed: boolean = false;
```

**Action**: Remove all server state, keep only UI state.

---

## 🏗️ Medium Wins (Week 2-3)

### Week 2: Create Missing API Modules

**Files to create**:
1. `src/api/memoryAPI.ts`
2. `src/api/automationAPI.ts`
3. `src/api/locationAPI.ts`
4. `src/api/remindersAPI.ts`
5. `src/api/visionBoardAPI.ts`

**Template** (copy this for each):
```typescript
// src/api/memoryAPI.ts
import { supabase } from '@/lib/supabase';
import type { Memory } from '@/types';

export async function getMemories(userId: string): Promise<Memory[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', user.id);
  
  if (error) throw error;
  return data as Memory[];
}

// Add other CRUD operations...
```

### Week 3: Migrate Services to API Layer

**For each service** in the list (see CLEANUP_ROADMAP.md):

1. Open the service file
2. Find all `supabase.from()` calls
3. Replace with API layer calls
4. Remove `import { supabase }` 
5. Add `import { getX, createX } from '@/api/xAPI'`

**Example**:
```typescript
// ❌ Before
import { supabase } from '@/lib/supabase';

class LifeCoachService {
  async getData() {
    const { data } = await supabase.from('tasks').select('*');
    return data;
  }
}

// ✅ After
import { getTasks } from '@/api/tasksAPI';

class LifeCoachService {
  async getData() {
    return getTasks();
  }
}
```

---

## 🔨 Big Wins (Week 4-6)

### Refactor Large Components

**Priority order**:
1. **intelligenceTools.ts** (1726 lines) - Split into 8 files
2. **Calendar.tsx** (1711 lines) - Extract hooks and components
3. **MealPlanning.tsx** (1327 lines) - Move hooks to files

**See CLEANUP_ROADMAP_PART2.md** for detailed refactoring plans.

---

## 📊 Track Your Progress

Update this checklist as you go:

### Phase 1: Code Quality ✅
- [ ] Removed all console.log
- [ ] Removed all eslint-disable comments
- [ ] Fixed API layer `any` types
- [ ] Audited Zustand stores

### Phase 2: Architecture ✅
- [ ] Created missing API modules
- [ ] Migrated services to API layer
- [ ] Standardized error handling

### Phase 3: Components ✅
- [ ] Refactored intelligenceTools.ts
- [ ] Refactored Calendar.tsx
- [ ] Refactored MealPlanning.tsx
- [ ] Refactored other large files

### Phase 4: Infrastructure ✅
- [ ] Implemented React Router
- [ ] Added error boundaries
- [ ] Improved code splitting
- [ ] Added performance monitoring

### Phase 5: Scope ✅
- [ ] Made feature decisions
- [ ] Removed deprecated features
- [ ] Updated documentation

---

## 🆘 When You Get Stuck

1. **Too many `any` types?** → Fix API layer first, then work outward
2. **Component too complex?** → Extract hooks first, then split components
3. **Service migration unclear?** → Check ARCHITECTURE.md for patterns
4. **Lost motivation?** → Focus on features you actually use

---

## 📚 Reference Documents

- **CLEANUP_ROADMAP.md** - Detailed Phase 1-2 plans
- **CLEANUP_ROADMAP_PART2.md** - Phase 3-4 plans
- **CLEANUP_ROADMAP_PART3.md** - Phase 5 and success metrics
- **ARCHITECTURE.md** - Architecture patterns to follow

---

## ✅ Success Criteria

You'll know you're done when:
- ✅ `npm run lint` passes with 0 errors
- ✅ All files are <400 lines
- ✅ No `any` types in src/
- ✅ All services use API layer
- ✅ App has clear focus and value proposition

**Good luck! Start with the decisions, then tackle quick wins.** 🚀

