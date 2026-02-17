# Pre-Coding Checklist - Critical Fixes Added

**Date:** 2026-02-17
**File Updated:** `.claude/PRE_CODING_CHECKLIST.md`
**Reason:** Prevent runtime errors from validation imports and database field mismatches

---

## 🔴 New Issues Added to Checklist

### Issue 1: Function Import Errors (Runtime Bugs)

**Problem:** Importing functions with wrong names causes runtime errors
- Guessing `validateMilestoneForm` when actual export is `validateMilestone`
- Using `{ toast }` when should use `{ showToast }`
- Accessing `validation.error` when should use `validation.errors`

**Impact:**
- ❌ TypeScript doesn't catch these (imports exist, wrong names)
- ❌ Breaks at runtime when function is called
- ❌ Hard to debug (no compile-time error)

**Prevention Added:**

1. **New Section 6: Import Verification**
   - Mandatory check: `grep "^export function"` before importing
   - Hook destructuring verification
   - Validation result structure check
   - Common mistakes with examples

2. **Enhanced Code Review Checklist**
   - Verify all imports with grep
   - Check hook return types
   - Verify validation response structure

3. **Updated Anti-Patterns**
   - ❌ Guess import names → ✅ Verify with grep
   - ❌ `{ toast }` from useToast → ✅ `{ showToast }`
   - ❌ `validation.error` → ✅ `Object.values(validation.errors)[0]`

---

### Issue 2: Database Field Name Mismatches (Feature Breaking)

**Problem:** Using wrong field names breaks features silently
- Using `target_count` when database has `target_value`
- Using `user_id` when table has `creator_id` or `sender_id`
- Using `scheduled_for` when table has `reveal_date`

**Impact:**
- ❌ Features fail silently (undefined values)
- ❌ Optimistic updates don't work
- ❌ TypeScript doesn't catch (uses optional/any types)

**Prevention Added:**

1. **Enhanced Section 3: Database Schema Verification**
   - Mandatory field reference table creation
   - Common field name mistakes highlighted
   - Verification commands added
   - Examples of wrong vs. correct field names

2. **New Verification Commands**
   ```bash
   # Extract column names from table
   awk '/CREATE TABLE.*your_table/,/\);/' migrations/*.sql

   # Verify specific field exists
   grep "target_value\|target_count" migrations/*.sql
   ```

3. **Field Reference Pattern**
   - Create TypeScript interface from schema BEFORE coding
   - Verify each field exists in migration
   - Document field mappings

---

### Issue 3: RLS Policy Column Verification (Security)

**Problem:** RLS policies referencing non-existent columns fail silently
- Policy uses `partner_id` but table doesn't have it
- Policy uses `user_id` but should use `creator_id`
- No error until policy executes at runtime

**Impact:**
- ❌ Security policies fail to apply
- ❌ Users may access unauthorized data
- ❌ Hard to debug (database-level error)

**Prevention Added:**

1. **RLS Verification Steps**
   - Verify all column names before writing policy
   - Test with `information_schema.columns` query
   - Check foreign key relationships exist

2. **Verification Commands**
   ```bash
   # Verify columns in RLS policy exist in table
   grep -A 30 "CREATE TABLE.*your_table" migrations/*.sql

   # Check for field name
   grep "column_name" migrations/*.sql
   ```

---

## 📋 Checklist Sections Added/Updated

### NEW: Section 6 - Import Verification

**Added:**
- Function import verification process
- Hook destructuring checks
- Validation response structure
- Common import mistakes with examples
- Grep commands to verify exports

**Why Critical:**
These cause RUNTIME errors that TypeScript won't catch!

### ENHANCED: Section 3 - Database Schema Verification

**Added:**
- Mandatory field reference table
- Common field name mistakes (target_count, user_id, etc.)
- Verification bash commands
- RLS policy column verification steps

**Why Critical:**
Wrong field names break features silently!

### ENHANCED: Section 7 - Code Review Self-Check

**Added:**
- Import & usage verification subsection
- Database field name verification
- Hook destructuring checks

### ENHANCED: Anti-Patterns Section

**Added:**
- Import & Usage Errors subsection
- Specific examples of wrong imports
- Database field name mistakes

### ENHANCED: Correct Patterns Section

**Added:**
- Import verification commands
- Correct hook usage
- Validation error extraction

### ENHANCED: Quick Copy-Paste Patterns

**Added:**
- Import verification bash commands
- Correct import examples
- Database field verification pattern
- Field reference template

---

## 🎯 Impact

### Before Updates
- ❌ No guidance on verifying function exports
- ❌ No requirement to check database schema
- ❌ No examples of common import mistakes
- ❌ Runtime errors from wrong imports
- ❌ Silent failures from wrong field names

### After Updates
- ✅ Mandatory import verification step
- ✅ Required field reference table from schema
- ✅ Explicit examples of common mistakes
- ✅ Grep commands to verify exports
- ✅ Field verification before coding
- ✅ RLS policy column validation

---

## 📊 Coverage Summary

| Issue Type | Before | After | Prevention |
|------------|--------|-------|------------|
| **Function Import Errors** | Not covered | ✅ Section 6 | Grep verification |
| **Database Field Mismatches** | Basic mention | ✅ Enhanced Section 3 | Field reference table |
| **RLS Policy Columns** | Not covered | ✅ Enhanced Section 3 | Schema verification |
| **Hook Destructuring** | Not covered | ✅ Section 6 | Return type check |
| **Validation Response** | Not covered | ✅ Section 6 | Structure examples |

---

## 🔍 Real Examples Added

### Function Import Example
```typescript
// ❌ WRONG (Runtime error)
import { validateMilestoneForm } from './validation';
const validation = validateMilestoneForm(data);  // Error: not a function

// ✅ CORRECT (Verify first)
// Run: grep "^export function" validation.ts
import { validateMilestone } from './validation';
const validation = validateMilestone(data);  // Works!
```

### Database Field Example
```typescript
// ❌ WRONG (Silent failure)
if (challenge.target_count > 0)  // undefined! Table has target_value

// ✅ CORRECT (Verify schema first)
// Run: grep "target_" migrations/*.sql
if (challenge.target_value > 0)  // Works!
```

### Hook Usage Example
```typescript
// ❌ WRONG (Runtime error)
const { toast } = useToast();
toast('Success!');  // Error: toast is not a function

// ✅ CORRECT (Verify return type)
const { showToast } = useToast();
showToast('Success!');  // Works!
```

---

## 📚 Verification Commands Added

```bash
# Verify function exports
grep "^export function" src/together/utils/validation.ts

# Verify hook return type
grep -A 5 "export.*useToast" src/hooks/useToast.ts

# Verify database field exists
grep "target_value\|target_count" supabase/migrations/*.sql

# Extract all columns from table
awk '/CREATE TABLE.*your_table/,/\);/' migrations/*.sql | grep -E "^\s+\w+"

# Verify RLS policy columns
grep -A 30 "CREATE TABLE.*your_table" migrations/*.sql
```

---

## ✅ Checklist Updates Summary

1. **Section 3 (Database)** - Enhanced with field verification requirements
2. **Section 6 (NEW)** - Import verification before using any function
3. **Section 7** - Added import/usage verification checklist
4. **Anti-Patterns** - Added import & usage errors
5. **Correct Patterns** - Added verification commands
6. **Quick Patterns** - Added import verification templates

---

## 🎓 Key Lessons

### Always Verify Before Importing
```bash
# BEFORE writing this:
import { validateMilestoneForm } from './validation';

# RUN this:
grep "^export function" src/together/utils/validation.ts

# THEN write this:
import { validateMilestone } from './validation';  # ✅ Matches actual export
```

### Always Create Field Reference
```typescript
// BEFORE writing any code using a table:

// 1. Extract schema
awk '/CREATE TABLE.*achievement_rewards/,/\);/' migrations/*.sql

// 2. Create TypeScript interface matching EXACT field names
interface AchievementReward {
  target_value: number;  // ✅ From schema, NOT target_count
  creator_id: string;    // ✅ From schema, NOT user_id
  // ... all other fields
}

// 3. NOW write code using verified field names
```

### Always Check Hook Return Types
```typescript
// BEFORE destructuring:
grep -A 5 "export.*useToast" src/hooks/useToast.ts
// See: showToast: (message: string, ...) => void

// THEN destructure correctly:
const { showToast } = useToast();  // ✅ Matches return type
```

---

## 🚀 Expected Outcomes

With these updates, future features will:
- ✅ Verify all imports before use
- ✅ Create field reference tables from schema
- ✅ Check hook return types before destructuring
- ✅ Verify RLS policy columns exist
- ✅ Eliminate runtime import errors
- ✅ Eliminate silent field name failures

---

**Time Investment:** +5 minutes of verification saves hours of debugging!

**Total Checklist Time:** 25 minutes (was 20 minutes)

**Bugs Prevented:** 3 critical issue types now covered ✅
