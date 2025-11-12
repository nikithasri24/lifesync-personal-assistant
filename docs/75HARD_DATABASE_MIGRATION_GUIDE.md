# 75 Hard - Database Migration Guide

## Current Issue

**Error:**
```
Could not find the 'status' column of 'sfh_challenges' in the schema cache
```

**Cause:** The database schema is missing the `status` column that the new service layer architecture requires.

**Solution:** Run a simple SQL migration to add the missing column.

---

## Quick Fix (5 minutes)

### Option 1: Run Quick Fix SQL (Recommended)

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

2. **Copy and paste this SQL:**

```sql
-- Quick Fix: Add status column to sfh_challenges table
-- This adds the critical missing column needed for the new architecture

-- Add status column
ALTER TABLE sfh_challenges
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add check constraint for valid statuses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'sfh_challenges_status_check'
        AND conrelid = 'sfh_challenges'::regclass
    ) THEN
        ALTER TABLE sfh_challenges
        ADD CONSTRAINT sfh_challenges_status_check
        CHECK (status IN ('active', 'paused', 'completed', 'failed'));
    END IF;
END $$;

-- Update existing records to have correct status
UPDATE sfh_challenges
SET status = CASE
    WHEN is_active = true THEN 'active'
    WHEN is_active = false AND paused_at IS NOT NULL THEN 'paused'
    ELSE 'active'
END
WHERE status IS NULL OR status = '';

-- Verify the column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sfh_challenges'
        AND column_name = 'status'
    ) THEN
        RAISE NOTICE '✅ Status column added successfully!';
    ELSE
        RAISE EXCEPTION '❌ Failed to add status column';
    END IF;
END $$;
```

3. **Click "Run"** (or press Cmd/Ctrl + Enter)

4. **Verify success:**
   - You should see: `✅ Status column added successfully!`
   - If you see any errors, check the "Errors" tab

5. **Refresh your browser** and test pause/resume

---

### Option 2: Run Full Migration (Complete Solution)

For a complete schema update with all optimizations, indexes, and constraints:

1. **Open Supabase Dashboard SQL Editor**

2. **Copy the contents of:**
   ```
   supabase/migrations/202511120003_improve_75hard_schema.sql
   ```

3. **Paste into SQL Editor and Run**

This adds:
- ✅ `status` column with constraints
- ✅ `completed_at`, `failed_at`, `failure_reason` columns
- ✅ Unique constraints to prevent duplicates
- ✅ Check constraints for data validation
- ✅ Performance indexes
- ✅ Audit trail table
- ✅ Auto-update triggers
- ✅ Statistics functions
- ✅ Optimized views

**Note:** This is more comprehensive but takes longer to review and understand.

---

## What the Quick Fix Does

### 1. Adds the `status` Column
```sql
ALTER TABLE sfh_challenges
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
```

- **Type:** VARCHAR(20)
- **Default:** 'active'
- **Purpose:** Discriminated union support for type-safe state management

### 2. Adds Validation Constraint
```sql
CHECK (status IN ('active', 'paused', 'completed', 'failed'))
```

Ensures only valid status values can be stored.

### 3. Migrates Existing Data
```sql
UPDATE sfh_challenges
SET status = CASE
    WHEN is_active = true THEN 'active'
    WHEN is_active = false AND paused_at IS NOT NULL THEN 'paused'
    ELSE 'active'
END
```

Updates all existing challenges to have the correct status based on their current state.

### 4. Verifies Success
```sql
DO $$
BEGIN
    IF EXISTS (...) THEN
        RAISE NOTICE '✅ Status column added successfully!';
    END IF;
END $$;
```

Confirms the column was added correctly.

---

## After Running the Migration

### 1. Test the Application

Refresh your browser and check console for:

**Expected Logs:**
```
✅ [useChallengeService] User ID fetched: 86a4967b-...
✅ [useChallengeService] Service initialized successfully
✅ [75Hard] Tasks already ensured for today: 2025-11-12
```

### 2. Test Pause Functionality

Click "Pause Challenge" button:

**Expected:**
```
✅ [75Hard] Using new service layer for pause
✅ [StoreAdapter] Pausing challenge: <id>
✅ [ChallengeService] Pausing challenge: <name>
✅ Toast: "Challenge paused at Day X"
✅ Button changes from "Pause" → "Resume"
```

**No longer see:**
```
❌ Could not find the 'status' column
```

### 3. Test Resume Functionality

Click "Resume Challenge" button:

**Expected:**
```
✅ [75Hard] Using new service layer for resume
✅ [StoreAdapter] Resuming challenge: <id>
✅ Toast: "Challenge resumed"
✅ Button changes from "Resume" → "Pause"
```

---

## Verification Queries

After migration, you can verify the schema in Supabase SQL Editor:

### Check if `status` column exists:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'sfh_challenges'
AND column_name = 'status';
```

**Expected Result:**
| column_name | data_type | column_default |
|-------------|-----------|----------------|
| status      | character varying | 'active'::character varying |

### Check existing challenges have correct status:
```sql
SELECT id, name, is_active, paused_at, status
FROM sfh_challenges
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** All rows should have a `status` value ('active', 'paused', 'completed', or 'failed').

### Verify check constraint exists:
```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'sfh_challenges'
AND constraint_name LIKE '%status%';
```

**Expected:**
| constraint_name | constraint_type |
|-----------------|----------------|
| sfh_challenges_status_check | CHECK |

---

## Troubleshooting

### Error: "permission denied for table sfh_challenges"

**Solution:** Make sure you're logged in with a user that has database admin permissions (service_role key).

### Error: "column status already exists"

**Solution:** The column already exists! Check if it has the correct type:
```sql
SELECT data_type FROM information_schema.columns
WHERE table_name = 'sfh_challenges' AND column_name = 'status';
```

If it's already VARCHAR(20), you're good to go. Just refresh the browser.

### Migration runs but pause still fails

**Solutions:**
1. Clear browser cache (Cmd/Ctrl + Shift + R)
2. Check Supabase schema cache: Go to Settings → Database → "Reset schema cache"
3. Verify the column exists (see verification queries above)

---

## Understanding the Schema

### Status Column Values

| Status | is_active | paused_at | completed_at | failed_at | Meaning |
|--------|-----------|-----------|--------------|-----------|---------|
| `'active'` | `true` | `NULL` | `NULL` | `NULL` | Currently in progress |
| `'paused'` | `false` | `<timestamp>` | `NULL` | `NULL` | Temporarily paused |
| `'completed'` | `false` | `NULL` | `<timestamp>` | `NULL` | Successfully finished |
| `'failed'` | `false` | `NULL` | `NULL` | `<timestamp>` | Failed/abandoned |

### Why This Architecture?

**Discriminated Unions** in TypeScript:
```typescript
type SeventyFiveHardChallenge =
  | { status: 'active'; isActive: true; pausedAt?: never }
  | { status: 'paused'; isActive: false; pausedAt: Date }
  | { status: 'completed'; isActive: false; completedAt: Date }
  | { status: 'failed'; isActive: false; failedAt: Date; failureReason?: string };
```

This provides **compile-time type safety** - TypeScript knows which fields are available based on the status.

---

## Next Steps

After the migration succeeds:

1. ✅ Test pause/resume functionality thoroughly
2. ✅ Verify database updates in Supabase Dashboard
3. ✅ Monitor console for any other errors
4. ⏳ Consider running the full migration (Option 2) for complete schema optimizations
5. ⏳ Set up automatic migrations using Supabase CLI (optional)

---

## Summary

**Current State:** Database missing `status` column → Pause/resume broken ❌

**After Quick Fix:** Database has `status` column → Pause/resume working ✅

**Time Required:** ~5 minutes to run quick fix

**Impact:** Enables new clean architecture service layer

---

## File Locations

- **Quick Fix SQL:** `supabase/migrations/QUICK_FIX_add_status_column.sql`
- **Full Migration:** `supabase/migrations/202511120003_improve_75hard_schema.sql`
- **Migration Runner:** `scripts/runMigration.mjs`
- **This Guide:** `docs/75HARD_DATABASE_MIGRATION_GUIDE.md`

---

**Status:** 🟡 Waiting for user to run SQL migration

**Action Required:** Copy the Quick Fix SQL into Supabase Dashboard SQL Editor and click "Run"
