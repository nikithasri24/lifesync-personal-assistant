# Data Persistence Schizophrenia - Migration Analysis

## Problem Summary

The app runs **THREE migration functions on EVERY login** (App.tsx:78-94):
```typescript
const journalMigration = await migrateJournalEntries();
const notesMigration = await migrateNotes();
const goalsMigration = await migrateGoals();
```

While these functions have early-exit checks, they're still being called unnecessarily on every single login.

## Current Implementation Analysis

### How Migrations Work Now

Each migration function follows this pattern:

1. **Check localStorage flag**: `localStorage.getItem('journal_entries_migrated') === 'true'`
2. **Early exit if already migrated**: Returns `{ success: true, migrated: 0, errors: 0 }`
3. **Read from localStorage**: Checks `app-storage` key for data
4. **Insert into Supabase**: Migrates each item
5. **Mark as complete**: Sets localStorage flag

### Migration Keys Used

- `migrateJournalEntries()` → `'journal_entries_migrated'`
- `migrateNotes()` → `'notes_migrated'`
- `migrateGoals()` → `'goals_dreams_migrated'`

## The Problems

### 1. **Performance Waste**
Even with early exit, we're still:
- Calling 3 async functions
- Checking localStorage 3 times
- Logging "Already completed, skipping" 3 times
- Running this on **EVERY SINGLE LOGIN**

### 2. **localStorage Dependency**
Migration state is stored in localStorage, which means:
- **Not user-specific**: If user logs in on different device, migrations run again
- **Not persistent**: User clears browser data → migrations run again
- **Not multi-device friendly**: Each browser/device has separate migration state
- **No audit trail**: Can't see when migration happened or what was migrated

### 3. **No Rollback/Recovery**
If a migration partially fails:
- We mark it as complete anyway (line 129 in migrateJournalEntries.ts)
- No way to retry failed items
- No way to know which items failed

### 4. **Schema Assumptions**
Migrations assume localStorage schema hasn't changed:
```typescript
const parsed: LocalStorageState = JSON.parse(stored);
const entries = parsed.state?.journalEntries || [];
```
If Zustand persist structure changes, migrations break silently.

## Recommended Solution

### **Track Migration State in Supabase**

Create a `user_migrations` table:

```sql
CREATE TABLE user_migrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  migration_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  items_migrated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, migration_key)
);

CREATE INDEX idx_user_migrations_user_id ON user_migrations(user_id);
CREATE INDEX idx_user_migrations_status ON user_migrations(status);
```

### **Update Migration Functions**

```typescript
// Check if migration needed (query Supabase, not localStorage)
async function isMigrationComplete(userId: string, migrationKey: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_migrations')
    .select('status')
    .eq('user_id', userId)
    .eq('migration_key', migrationKey)
    .single();

  return data?.status === 'completed';
}

// Record migration start
async function startMigration(userId: string, migrationKey: string): Promise<void> {
  await supabase
    .from('user_migrations')
    .upsert({
      user_id: userId,
      migration_key: migrationKey,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });
}

// Record migration completion
async function completeMigration(
  userId: string,
  migrationKey: string,
  migrated: number,
  errors: number
): Promise<void> {
  await supabase
    .from('user_migrations')
    .update({
      status: errors > 0 ? 'failed' : 'completed',
      completed_at: new Date().toISOString(),
      items_migrated: migrated,
      items_failed: errors,
    })
    .eq('user_id', userId)
    .eq('migration_key', migrationKey);
}
```

### **Update App.tsx**

Instead of running migrations on every login:

```typescript
// BEFORE - runs on every login
const journalMigration = await migrateJournalEntries();
const notesMigration = await migrateNotes();
const goalsMigration = await migrateGoals();

// AFTER - check once, run if needed
const user_id = user.id;

// Check which migrations are needed (single query)
const { data: migrations } = await supabase
  .from('user_migrations')
  .select('migration_key, status')
  .eq('user_id', user_id)
  .in('migration_key', ['journal_entries', 'notes', 'goals_dreams']);

const completed = new Set(
  migrations?.filter(m => m.status === 'completed').map(m => m.migration_key) || []
);

// Only run migrations that haven't completed
if (!completed.has('journal_entries')) {
  await migrateJournalEntries(user_id);
}
if (!completed.has('notes')) {
  await migrateNotes(user_id);
}
if (!completed.has('goals_dreams')) {
  await migrateGoals(user_id);
}
```

## Benefits of Supabase-Based Migration Tracking

1. **Single Query Check**: One query to check all migrations instead of 3 localStorage checks
2. **User-Specific**: Migrations tracked per user, works across devices
3. **Audit Trail**: Know when migrations ran, how many items migrated, any errors
4. **Retry Failed Migrations**: Can identify and retry failed migrations
5. **Admin Visibility**: Can query which users have/haven't migrated
6. **No localStorage Pollution**: Don't rely on client-side storage for server-side state

## Migration Path

1. Create `user_migrations` table
2. Update migration utilities to use Supabase
3. For existing users with localStorage flags, create migration records in Supabase
4. Remove localStorage dependency
5. Update App.tsx to check Supabase first

## Performance Impact

**Current (Every Login):**
- 3 async function calls
- 3 localStorage reads
- 3 console.logs

**Proposed (Every Login):**
- 1 Supabase query (checks all migrations at once)
- Only run migrations if needed (rare after initial migration)

**Result**: 66% fewer operations on every login, better multi-device support, proper audit trail.
