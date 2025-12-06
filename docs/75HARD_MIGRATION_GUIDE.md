# 75 Hard Data Migration Guide

## Overview

This guide covers migrating from the old complex 75 Hard schema to the new simplified architecture.

### What's Changing

**OLD ARCHITECTURE (Complex)**
- Multiple challenges per user
- Pause/Resume functionality
- Tasks created in general Todos system
- 4 states: active, paused, completed, failed
- Complex service layer with adapters
- ~5000 lines of code

**NEW ARCHITECTURE (Simple)**
- ONE challenge per user (active or completed)
- Auto-reset on missed day (no pause)
- Self-contained check-ins (not in Todos)
- 2 states: active, completed
- Direct store methods (no service layer)
- ~800 lines of code

### Database Changes

**Old Tables:**
- `sfh_challenges` (plural) - multiple challenges
- `sfh_entries` - daily entries
- `sfh_challenge_audit` - audit trail

**New Tables:**
- `sfh_challenge` (singular) - one active challenge
- `sfh_daily_checkins` - daily check-ins

## Migration Steps

### 1. Run Database Migration

First, apply the new schema (creates new tables alongside old ones):

```bash
# Using Supabase CLI
supabase db push

# Or manually run the migration file
# Run: supabase/migrations/202511130001_simplify_75hard_schema.sql
```

This creates:
- `sfh_challenge` table with unique constraint (one active per user)
- `sfh_daily_checkins` table
- Helper functions for queries
- Indexes for performance

**IMPORTANT:** Old tables remain intact until you manually drop them.

### 2. Run Data Migration Script

This migrates existing data from old tables to new tables:

```bash
# Set environment variables (if not already in .env)
export VITE_SUPABASE_URL="your-supabase-url"
export VITE_SUPABASE_ANON_KEY="your-anon-key"

# Run migration
npm run migrate:75hard
```

**What the script does:**
1. Fetches all challenges from `sfh_challenges`
2. Groups by user
3. For each user:
   - Finds most recent **ACTIVE** challenge
   - Converts old rules → new tasks format
   - Creates new challenge in `sfh_challenge`
   - Migrates all entries → check-ins
4. Skips paused/failed challenges (fresh start)
5. Logs detailed progress and errors

**Migration Output:**
```
🚀 Starting 75 Hard Data Migration
====================================

📥 Fetching old challenges...
📊 Found 45 total challenges

👥 Found 12 users with challenges

👤 Migrating user: a1b2c3d4...
   Challenges: 3
   ✅ Found active challenge: "My 75 Hard Journey"
      Start date: 2025-01-10
      Current day: 15
      Tasks: 5 (from rules)
   ✅ Created new challenge: e5f6g7h8...
   📝 Migrating entries...
      Found 14 entries
      ✅ Migrated 14 check-ins

... (more users) ...

====================================
📊 Migration Summary
====================================

Total users: 12
Users processed: 12
Challenges migrated: 10
Challenges skipped: 35
Entries migrated: 142
Errors: 0

✅ Migration completed successfully!
```

### 3. Verify Migration

Check that data migrated correctly:

```sql
-- Count migrated challenges
SELECT COUNT(*) FROM sfh_challenge;

-- View migrated challenges
SELECT
  id,
  user_id,
  start_date,
  current_day,
  status,
  jsonb_array_length(tasks) as task_count,
  created_at
FROM sfh_challenge
ORDER BY created_at DESC;

-- Count check-ins
SELECT COUNT(*) FROM sfh_daily_checkins;

-- View sample check-ins
SELECT
  c.id,
  c.date,
  c.day_number,
  jsonb_array_length(c.task_completions) as tasks,
  c.photo,
  c.notes
FROM sfh_daily_checkins c
ORDER BY c.date DESC
LIMIT 10;

-- Check for users with multiple active challenges (should be 0!)
SELECT user_id, COUNT(*)
FROM sfh_challenge
WHERE status = 'active'
GROUP BY user_id
HAVING COUNT(*) > 1;
```

### 4. Test Application

1. Start the dev server:
```bash
npm run dev
```

2. Test these flows:
   - [ ] View active challenge
   - [ ] Check/uncheck tasks
   - [ ] Upload photo
   - [ ] Add notes
   - [ ] Complete all tasks (success message appears)
   - [ ] Login next day (yesterday's tasks gone)
   - [ ] Failure detection (if applicable)

3. Check console for errors

### 5. Deploy Code Changes

Once migration verified:

```bash
# Update types, store, and UI components
# (These will be created in subsequent phases)

# Commit changes
git add .
git commit -m "feat(75hard): migrate to simplified architecture"

# Deploy
git push origin main
```

### 6. Clean Up Old Tables (AFTER VERIFICATION!)

⚠️ **DANGER ZONE** - Only run this after confirming everything works!

```sql
-- Backup old data first (export to JSON or CSV)

-- Drop old tables
DROP TABLE IF EXISTS sfh_challenge_audit CASCADE;
DROP TABLE IF EXISTS sfh_entries CASCADE;
DROP TABLE IF EXISTS sfh_challenges CASCADE;

-- Drop old views and functions
DROP VIEW IF EXISTS v_active_challenges CASCADE;
DROP FUNCTION IF EXISTS get_user_75hard_stats CASCADE;
DROP FUNCTION IF EXISTS sync_sfh_challenge_status CASCADE;
DROP FUNCTION IF EXISTS validate_sfh_entry_date CASCADE;
```

## Rollback Plan

If migration fails or issues found:

### Option 1: Revert Database

```sql
-- Drop new tables
DROP TABLE IF EXISTS sfh_daily_checkins CASCADE;
DROP TABLE IF EXISTS sfh_challenge CASCADE;

-- Old tables remain intact, app will continue using them
```

### Option 2: Revert Code

```bash
# Checkout previous version
git checkout <previous-commit-hash>

# Redeploy
npm run build
```

## Migration Statistics

Expected metrics:
- **Challenge reduction:** ~70-80% (only active challenges migrated)
- **Data loss:** Paused/failed challenges not migrated (intentional)
- **Photo preservation:** All photo URLs preserved
- **Entry preservation:** All entries for active challenges preserved

## Troubleshooting

### Error: "Duplicate key value violates unique constraint"

**Cause:** User already has migrated challenge in new table

**Solution:**
```sql
-- Check existing challenges
SELECT * FROM sfh_challenge WHERE user_id = '<user-id>';

-- If safe to delete, remove and retry
DELETE FROM sfh_challenge WHERE user_id = '<user-id>';
```

### Error: "Cannot read property 'rules' of undefined"

**Cause:** Old challenge missing rules field

**Solution:** Script uses DEFAULT_TASKS if no rules present (handled automatically)

### Error: "Task completions don't match tasks"

**Cause:** Mismatch between rule_completions and rules

**Solution:** Script creates empty task_completions for missing rules (handled automatically)

### Migration takes too long

**Cause:** Large number of entries

**Solution:** Script uses batched inserts (100 at a time). Just let it run.

## FAQ

**Q: Will I lose my paused challenges?**
A: Yes, only active challenges are migrated. Paused/failed challenges are intentionally skipped for a fresh start.

**Q: Will my photos be lost?**
A: No, all photo URLs are preserved and migrated.

**Q: Can I still see my history?**
A: Yes, all check-ins for the migrated active challenge are preserved.

**Q: What if I have multiple active challenges?**
A: Only the most recent active challenge is migrated. Others are skipped.

**Q: Can I run the migration multiple times?**
A: Yes, script checks for existing challenges and skips if already migrated.

**Q: How long does migration take?**
A: Depends on data volume. Typically:
- 10 users: ~30 seconds
- 100 users: ~5 minutes
- 1000 users: ~30 minutes

## Support

If you encounter issues:

1. Check migration logs for specific errors
2. Verify environment variables are set correctly
3. Ensure Supabase is accessible
4. Check old tables still exist (rollback option)
5. Review this guide for troubleshooting steps

## Next Steps

After successful migration:

1. ✅ Database migrated
2. ⏭️ Update type definitions (Phase 2)
3. ⏭️ Implement simplified store (Phase 3)
4. ⏭️ Create new UI components (Phase 4)
5. ⏭️ Delete old service layer (Phase 6)
6. ⏭️ Test all flows (Phase 7)

See main implementation plan for details.
