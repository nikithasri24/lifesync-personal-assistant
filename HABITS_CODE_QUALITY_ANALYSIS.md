# Habits Module - Code Quality Analysis

**Date:** 2026-02-17
**Module:** Habits
**Files Analyzed:** 14 files (5 V2 components, 7 legacy components, 2 pages/hooks)

---

## Summary

| Category | Status | Details |
|----------|--------|---------|
| **Dead Code** | 🔴 Issues Found | 5 legacy components (~500+ lines) |
| **Error Boundary** | 🔴 Missing | No FeatureErrorBoundary in Habits.tsx |
| **DRY Violations** | ✅ Clean | No duplicate date formatting functions |
| **Performance** | ⚠️ Minor Issues | Framer Motion in HabitCardV2 |
| **Theme Consistency** | 🔴 Issues Found | Hardcoded colors in 3 V2 components |

---

## Issues Found

### 1. Dead Code (5 legacy components, ~500+ lines)

#### Components to Delete:
```
src/habits/components/
├── HabitCard.tsx              # 222 lines - NOT imported anywhere
├── HabitForm.tsx              # 134 lines - NOT imported anywhere
├── HabitEditForm.tsx          # 130 lines - NOT imported anywhere
└── layout/
    ├── HabitsHeader.tsx       # 13 lines - NOT imported anywhere
    └── HabitsList.tsx         # 131 lines - NOT imported anywhere

Total: ~630 lines of dead code
```

#### Components to KEEP (actively used):
```
src/habits/components/layout/
├── HabitsLoadingState.tsx     # Used in Habits.tsx line 35
└── HabitsErrorState.tsx       # Used in Habits.tsx line 36
```

**Verification:**
```bash
# Confirmed NOT imported anywhere
grep -r "from.*habits/components/(HabitCard|HabitForm|HabitEditForm)" src/
grep -r "from.*habits/components/layout/(HabitsList|HabitsHeader)" src/
# Both return: No matches found
```

**Recommendation:** Delete all 5 unused legacy components.

---

### 2. Missing Error Boundary

**File:** `src/pages/Habits.tsx`

**Issue:** No `FeatureErrorBoundary` wrapper to prevent app crashes.

**Current:** Component exported directly
```typescript
const Habits: React.FC = () => {
  // ... 530 lines
};

export default Habits;
```

**Should be:**
```typescript
import { FeatureErrorBoundary } from '../components/FeatureErrorBoundary';

const HabitsContent: React.FC = () => {
  // ... existing logic
};

const Habits: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Habits">
      <HabitsContent />
    </FeatureErrorBoundary>
  );
};

export default Habits;
```

**Impact:** Errors in Habits module will crash entire app instead of showing graceful error UI.

---

### 3. Hardcoded Colors (Not Using Theme System)

#### File: `src/habits/components/v2/HabitCardV2.tsx`

**Issue:** Uses 12+ hardcoded colors instead of `useThemeColors()` hook.

**Hardcoded colors found:**
- `#5C4A3A` (text primary)
- `#9B8B7A` (text secondary)
- `#4CAF50` (success green)
- `#388E3C` (success green dark)
- `#E8DCC8` (border light)
- `#F5F0EA` (background light)
- `#6B5847` (text tertiary)
- `#C18B5E` (terracotta)
- `#D4A574` (terracotta light)
- `#F57C00` (streak orange)
- `rgba(255, 152, 0, 0.15)` (streak bg)
- `rgba(245, 124, 0, 0.15)` (streak bg dark)

**Compare with HabitsHeaderV2.tsx (line 42):** ✅ Uses `useThemeColors()` correctly

**Fix:** Import and use `useThemeColors()` hook, replace all hardcoded colors with theme references.

#### File: `src/habits/components/v2/HabitWeeklyGridV2.tsx`

**Issue:** Uses 10+ hardcoded colors.

**Hardcoded colors found:**
- `#C18B5E`, `#9B8B7A`, `#5C4A3A` (text colors)
- `#D4A574` (terracotta)
- `#4CAF50`, `#388E3C` (success green)
- `#F5F0EA` (background)
- `rgba(139, 111, 71, 0.06)` (shadow)
- `rgba(139, 111, 71, 0.08)` (shadow)

**Fix:** Import and use `useThemeColors()` hook.

#### File: `src/habits/components/v2/StreakIndicatorV2.tsx`

**Issue:** Uses hardcoded orange colors for streak indicator.

**Line 52, 55, 69:** `#F57C00` hardcoded

**Partially correct:** Line 40 uses `useThemeColors()` but only for `colors.text.tertiary` (line 62).

**Fix:** Define streak colors in theme system or use theme colors consistently.

---

### 4. Framer Motion Usage (Minor Performance)

#### File: `src/habits/components/v2/HabitCardV2.tsx`

**Line 7:** `import { motion } from 'framer-motion';`
**Line 67-72:** Uses `motion.div` for simple animations

**Pattern from Notes/Journal:** Replace with CSS transitions for simple hover/active effects.

**Before:**
```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.2 }}
>
```

**After:**
```typescript
<div className="transition-all duration-200 animate-fadeInUp">
```

**Impact:** Minor bundle size reduction, simpler code.

---

## Component Architecture

### V2 Components (Active - 5 files)
```
src/habits/components/v2/
├── HabitsHeaderV2.tsx         # ✅ Uses theme colors
├── HabitCardV2.tsx            # ❌ Hardcoded colors + Framer Motion
├── HabitFormModalV2.tsx       # ✅ Clean, follows standards
├── HabitWeeklyGridV2.tsx      # ❌ Hardcoded colors
└── StreakIndicatorV2.tsx      # ⚠️ Partial theme usage
```

### Legacy Components (7 files)
- 5 files are dead code (delete)
- 2 files actively used (HabitsLoadingState, HabitsErrorState - keep)

### Query Hook
- `src/hooks/useHabitsQuery.ts` (444 lines) - ✅ No issues, has merged mode support

---

## Recommendations

### Priority 1 (Critical)
1. ✅ **Add FeatureErrorBoundary** - Prevent app crashes
2. ✅ **Delete dead code** - Remove 5 legacy components (~630 lines)

### Priority 2 (Code Quality)
3. ✅ **Fix hardcoded colors in HabitCardV2** - Use `useThemeColors()` hook
4. ✅ **Fix hardcoded colors in HabitWeeklyGridV2** - Use `useThemeColors()` hook
5. ✅ **Fix hardcoded colors in StreakIndicatorV2** - Consistent theme usage

### Priority 3 (Performance)
6. ✅ **Replace Framer Motion in HabitCardV2** - Use CSS transitions

---

## Before/After Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Total Files** | 14 | 9 | -5 files |
| **Lines of Code** | ~2,200 | ~1,570 | -630 lines (29% reduction) |
| **Dead Code** | 630 lines | 0 lines | 100% removed |
| **Components with Error Boundary** | 0 | 1 | ✅ Protected |
| **Components using Theme** | 1/5 V2 | 5/5 V2 | 100% compliance |
| **Components using Framer Motion** | 1 | 0 | Bundle size ↓ |

---

## Commands for Investigation

```bash
# Find all V2 components
find src/habits/components/v2 -name "*.tsx"

# Check for legacy component usage
grep -r "from.*habits/components/HabitCard" src/
grep -r "from.*habits/components/HabitForm" src/
grep -r "from.*habits/components/HabitEditForm" src/

# Check for layout component usage
grep -r "from.*habits/components/layout" src/

# Find hardcoded colors
grep -n "#[0-9A-F]\{6\}" src/habits/components/v2/*.tsx
grep -n "rgba(" src/habits/components/v2/*.tsx

# Check for error boundary
grep "FeatureErrorBoundary" src/pages/Habits.tsx

# Count lines in legacy components
find src/habits/components -name "*.tsx" -not -path "*/v2/*" -exec wc -l {} +
```

---

## Related Documentation

- **Pattern Reference:** `src/pages/Together.tsx` (reference implementation)
- **Coding Standards:** `CLAUDE.md` (UI/UX standards, error handling)
- **Previous Modules:** `MODULE_QUALITY_IMPROVEMENTS_CHECKLIST.md` (Notes & Journal fixes)
- **Theme System:** `src/hooks/useThemeColors.ts`
- **Error Boundary:** `src/components/FeatureErrorBoundary.tsx`
