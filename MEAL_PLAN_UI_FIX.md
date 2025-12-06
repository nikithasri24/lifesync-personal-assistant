# Meal Plan UI Update Issue - FIXED

## Problem
User selected "Oatmeal" from the autocomplete dropdown, but the meal didn't appear in the meal plan grid.

## Root Causes Found

### 1. **Critical: Week Start Mismatch** 🔴
**Location**: `src/pages/MealPlanning.tsx:949-950`

**The Bug**:
```typescript
// OLD - WRONG: Hardcoded weekStartsOn: 0 (Sunday)
const plan = mealPlans.find(p =>
  isSameWeek(ensureDate(p.weekStartDate),
    startOfWeek(parseLocalDateKey(dateKey), { weekStartsOn: 0 })
  )
) || await ensureMealPlanForWeek(
  startOfWeek(parseLocalDateKey(dateKey), { weekStartsOn: 0 })
);
```

**The Problem**:
- AddMealControl was using hardcoded `weekStartsOn: 0` (Sunday)
- But user's global setting might be `weekStartsOn: 1` (Monday)
- This caused meals to be added to a **different week's plan** than the one being displayed
- Meal was saved to database but appeared in the wrong week

**The Fix**:
```typescript
// NEW - CORRECT: Use global weekStartsOn setting
const { weekStartsOn } = useAppStore(); // Added to component

const plan = mealPlans.find(p =>
  isSameWeek(ensureDate(p.weekStartDate),
    startOfWeek(parseLocalDateKey(dateKey), { weekStartsOn })
  )
) || await ensureMealPlanForWeek(
  startOfWeek(parseLocalDateKey(dateKey), { weekStartsOn })
);
```

---

### 2. **React Re-render Issue**
**Location**: `src/pages/MealPlanning.tsx:1531`

**The Bug**:
```typescript
// OLD - WRONG: Missing weekStartsOn in dependencies
const activePlan: MealPlanWeek | null = useMemo(() => {
  // ... uses weekStartsOn in computation ...
  return mealPlans.find((plan) =>
    isSameWeek(ensureDate(plan.weekStartDate), currentWeekStart, { weekStartsOn }),
  ) ?? null;
}, [activePlanId, mealPlans, currentWeekStart]); // ❌ weekStartsOn missing!
```

**The Problem**:
- `useMemo` was using `weekStartsOn` in its computation
- But `weekStartsOn` was NOT in the dependency array
- This caused stale closures where old `weekStartsOn` values were used
- Changing week start setting wouldn't update the active plan

**The Fix**:
```typescript
// NEW - CORRECT: Added weekStartsOn to dependencies
const activePlan: MealPlanWeek | null = useMemo(() => {
  // ... same computation ...
}, [activePlanId, mealPlans, currentWeekStart, weekStartsOn]); // ✅ Added!
```

---

### 3. **UX Issue: Can't Add Multiple Meals**
**Location**: `src/pages/MealPlanning.tsx:1865-1873`

**The Bug**:
```typescript
// OLD - WRONG: Input disappears after first meal
{dayMeals.length === 0 ? (
  <AddMealControl dateKey={key} mealType={mealType} />
) : (
  <ul className="space-y-1">
    {dayMeals.map((meal) => (
      <MealItem key={meal.id} meal={meal} recipes={recipes} />
    ))}
  </ul>
)}
```

**The Problem**:
- When `dayMeals.length === 0`: Show input only
- When `dayMeals.length > 0`: Show meals only (NO INPUT!)
- User could only add ONE meal per slot
- To add more meals, they'd have to delete the first one

**The Fix**:
```typescript
// NEW - CORRECT: Always show input
{dayMeals.length > 0 && (
  <ul className="space-y-1">
    {dayMeals.map((meal) => (
      <MealItem key={meal.id} meal={meal} recipes={recipes} />
    ))}
  </ul>
)}
<AddMealControl dateKey={key} mealType={mealType} />
```

---

## Changes Made

### File: `src/pages/MealPlanning.tsx`

#### Change 1: AddMealControl - Get weekStartsOn from store
```diff
function AddMealControl({ dateKey, mealType, onAdded }: { ... }) {
-  const { recipes, addPlannedMeal, mealPlans, ensureMealPlanForWeek, mealOptions } = useAppStore();
+  const { recipes, addPlannedMeal, mealPlans, ensureMealPlanForWeek, mealOptions, weekStartsOn } = useAppStore();
```

#### Change 2: AddMealControl - Use global weekStartsOn in add function
```diff
  const add = async (recipeId?: string, customMeal?: string) => {
    try {
-      const plan = mealPlans.find(p => isSameWeek(ensureDate(p.weekStartDate), startOfWeek(parseLocalDateKey(dateKey), { weekStartsOn: 0 })))
-        || await ensureMealPlanForWeek(startOfWeek(parseLocalDateKey(dateKey), { weekStartsOn: 0 }));
+      const plan = mealPlans.find(p => isSameWeek(ensureDate(p.weekStartDate), startOfWeek(parseLocalDateKey(dateKey), { weekStartsOn })))
+        || await ensureMealPlanForWeek(startOfWeek(parseLocalDateKey(dateKey), { weekStartsOn }));
```

#### Change 3: MealPlanning - Add weekStartsOn to useMemo dependencies
```diff
  const activePlan: MealPlanWeek | null = useMemo(() => {
    // ... computation using weekStartsOn ...
-  }, [activePlanId, mealPlans, currentWeekStart]);
+  }, [activePlanId, mealPlans, currentWeekStart, weekStartsOn]);
```

#### Change 4: MealPlanning - Always show AddMealControl
```diff
- {dayMeals.length === 0 ? (
-   <AddMealControl dateKey={key} mealType={mealType} />
- ) : (
+ {dayMeals.length > 0 && (
    <ul className="space-y-1">
      {dayMeals.map((meal) => (
        <MealItem key={meal.id} meal={meal} recipes={recipes} />
      ))}
    </ul>
- )}
+ )}
+ <AddMealControl dateKey={key} mealType={mealType} />
```

---

## How This Fixes the Issue

### Before (Broken Flow):
1. User types "O" in breakfast slot for Tuesday
2. User selects "Oatmeal"
3. `add` function runs with `weekStartsOn: 0` (Sunday)
4. Creates/finds plan for week starting Sunday
5. Adds "Oatmeal" to that plan
6. **But user is viewing week starting Monday**
7. Meal appears in wrong week (or not at all)

### After (Fixed Flow):
1. User types "O" in breakfast slot for Tuesday
2. User selects "Oatmeal"
3. `add` function runs with `weekStartsOn: 1` (Monday) ✅
4. Creates/finds plan for week starting Monday ✅
5. Adds "Oatmeal" to that plan ✅
6. User IS viewing week starting Monday ✅
7. **Meal appears immediately in correct slot** ✅

---

## Testing Steps

### Test 1: Add Single Meal
1. Go to Meal Planning page
2. Type "O" in any meal slot
3. Select "Oatmeal" from dropdown
4. **Verify**: "Oatmeal" appears immediately in the grid
5. Refresh page
6. **Verify**: "Oatmeal" is still there

### Test 2: Add Multiple Meals to Same Slot
1. Add "Oatmeal" to Tuesday breakfast
2. **Verify**: Input field is still visible
3. Type "B" and select "Bagel"
4. **Verify**: Both "Oatmeal" and "Bagel" appear
5. **Verify**: Input is still there for adding more

### Test 3: Week Start Setting (Critical!)
1. Check your week start setting (Settings or check calendar)
2. Note if weeks start on Sunday (0) or Monday (1)
3. Add a meal to current week
4. **Verify**: Meal appears in current week (not previous/next)
5. Change week start setting
6. **Verify**: Meal plan re-organizes correctly

### Test 4: Cross-Week Meals
1. Set week start to Monday
2. Add meal to Sunday slot
3. **Verify**: Meal appears in correct week
4. Switch to previous week
5. **Verify**: Sunday meal is there (not in wrong week)

---

## Technical Details

### Date Key Flow
```
User clicks slot → dateKey = "2025-01-14" (Tuesday)
                 ↓
        parseLocalDateKey(dateKey)
                 ↓
        Date object: 2025-01-14T00:00:00
                 ↓
        startOfWeek(date, { weekStartsOn })
                 ↓
        If weekStartsOn=1 (Mon): 2025-01-13 (Monday)
        If weekStartsOn=0 (Sun): 2025-01-12 (Sunday)
                 ↓
        Find/create meal plan for that week
                 ↓
        Add meal to plan
                 ↓
        Store updates → React re-renders
                 ↓
        Meal appears in grid
```

### Why Hardcoded `0` Was Wrong
- Different users have different week start preferences
- International: Monday is standard (ISO 8601)
- US: Sunday is common
- App respects user preference via `weekStartsOn` setting
- Hardcoding `0` forced Sunday for everyone
- Caused week boundary mismatches

---

## Related Files
- `src/pages/MealPlanning.tsx` - Main file with all 4 fixes
- `src/stores/useRealAppStore.ts` - No changes (already correct)
- `src/services/supabaseAdapter.ts` - No changes (already correct)

---

## No Database Migration Required
All fixes are client-side UI/state management fixes. No database schema changes needed.

---

## Rollback Instructions
If issues occur:
```bash
git checkout HEAD -- src/pages/MealPlanning.tsx
```

Then restart dev server:
```bash
npm run dev
```
