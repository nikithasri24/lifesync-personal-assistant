# React Query Migration Example - Notes Component

**Component**: `src/pages/Notes.tsx`
**Status**: ✅ Migrated
**Date**: November 20, 2025

---

## Overview

Successfully migrated the Notes component from Zustand store to React Query hooks, demonstrating the complete migration pattern.

## Before (Zustand Store)

```typescript
import { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';

const Notes: React.FC = () => {
  const {
    notes,
    addNote,
    deleteNote,
    loadNotes,
    notesLoaded,
    notesLoading
  } = useAppStore();

  // Manual loading with useEffect
  useEffect(() => {
    if (loadNotes && !notesLoaded && !notesLoading) {
      loadNotes();
    }
  }, [loadNotes, notesLoaded, notesLoading]);

  // Manual loading state check
  if (notesLoading && !notesLoaded) {
    return <LoadingSpinner />;
  }

  // No automatic error handling
  // No pending states for mutations
  // Manual form clearing after success

  return (
    <div>
      {notes.map(note => <NoteCard note={note} />)}
    </div>
  );
};
```

**Problems**:
- ❌ Manual loading logic with useEffect
- ❌ Complex loading state checks
- ❌ No error handling
- ❌ No pending states for create/delete
- ❌ Manual form state management after mutations

## After (React Query)

```typescript
import { useState } from 'react';
import {
  useNotes,
  useCreateNote,
  useDeleteNote
} from '../hooks/useNotesQuery';

const Notes: React.FC = () => {
  // Automatic loading, caching, error handling
  const { data: notes, isLoading, error } = useNotes();
  const createMutation = useCreateNote();
  const deleteMutation = useDeleteNote();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    createMutation.mutate(
      { title, content },
      {
        onSuccess: () => {
          setTitle('');
          setContent('');
        },
      }
    );
  };

  // Built-in error handling
  if (error) {
    return <ErrorMessage error={error} />;
  }

  // Simple loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={createMutation.isPending}
        />
        <button
          type="submit"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Saving...' : 'Save'}
        </button>
        {createMutation.isError && (
          <p>Error creating note</p>
        )}
      </form>

      {notes?.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={() => deleteMutation.mutate(note.id)}
          isDeleting={deleteMutation.isPending}
        />
      ))}
    </div>
  );
};
```

**Benefits**:
- ✅ No useEffect needed - automatic loading
- ✅ Simple loading/error states
- ✅ Built-in error handling
- ✅ Mutation pending states (isPending)
- ✅ Automatic cache updates
- ✅ Cleaner, more readable code

---

## Side-by-Side Comparison

### Data Fetching

| Aspect | Zustand (Before) | React Query (After) |
|--------|------------------|---------------------|
| **Hook** | `useAppStore()` | `useNotes()` |
| **Loading** | `useEffect` + manual flags | Automatic |
| **State** | `notes, notesLoaded, notesLoading` | `data, isLoading` |
| **Error** | Try/catch in component | Built-in `error` |
| **Cache** | Manual `notesLoaded` check | Automatic staleTime |
| **Refetch** | Call `loadNotes()` again | Automatic on mount/refocus |

### Mutations (Create/Update/Delete)

| Aspect | Zustand (Before) | React Query (After) |
|--------|------------------|---------------------|
| **Create** | `addNote(input)` | `createMutation.mutate(input)` |
| **Pending** | No built-in state | `createMutation.isPending` |
| **Error** | Try/catch | `createMutation.isError` |
| **Success** | Manual callback | `onSuccess` callback |
| **Cache Update** | Manual store update | Automatic invalidation |

---

## Code Changes Summary

### Removed ❌

- `useEffect` for loading notes
- Manual loading state management (`notesLoaded`, `notesLoading`)
- Manual error handling in component
- Direct store import (`useAppStore`)

### Added ✅

- React Query hooks (`useNotes`, `useCreateNote`, `useDeleteNote`)
- Automatic error UI
- Mutation pending states in UI
- Disabled inputs during mutations
- Error messages for failed mutations

### Lines of Code

- **Before**: 131 lines
- **After**: 199 lines
- **Difference**: +68 lines (+52%)

**Why more lines?**
- Better error handling (error UI)
- Better UX (pending states, disabled inputs)
- Better user feedback (loading indicators, error messages)
- More robust and production-ready

**Net benefit**: Much better UX and maintainability despite more lines

---

## Benefits Realized

### 1. No Manual Loading Logic ✅

**Before**:
```typescript
useEffect(() => {
  if (loadNotes && !notesLoaded && !notesLoading) {
    loadNotes();
  }
}, [loadNotes, notesLoaded, notesLoading]);
```

**After**:
```typescript
const { data: notes, isLoading } = useNotes();
// That's it! Automatic loading
```

### 2. Built-in Error Handling ✅

**Before**:
```typescript
// No error handling - silent failures possible
```

**After**:
```typescript
if (error) {
  return <ErrorMessage error={error} />;
}
```

### 3. Mutation States ✅

**Before**:
```typescript
<button type="submit">Save note</button>
// No way to show "Saving..." state
```

**After**:
```typescript
<button
  type="submit"
  disabled={createMutation.isPending}
>
  {createMutation.isPending ? 'Saving...' : 'Save note'}
</button>
```

### 4. Automatic Cache Updates ✅

**Before**:
```typescript
// Manual store update after create
addNote({ title, content });
// Hope it updates correctly
```

**After**:
```typescript
createMutation.mutate({ title, content });
// React Query automatically invalidates and refetches
// Cache always in sync
```

### 5. Better UX ✅

- Loading indicators
- Disabled inputs during mutations
- Error messages for failures
- Instant feedback
- No stale data

---

## Migration Checklist

### ✅ Step 1: Create Query Hooks

Created `src/hooks/useNotesQuery.ts` with:
- `useNotes()` - Query hook
- `useCreateNote()` - Create mutation
- `useDeleteNote()` - Delete mutation

### ✅ Step 2: Update Component Imports

```typescript
// Removed
import { useAppStore } from '../stores/useAppStore';

// Added
import {
  useNotes,
  useCreateNote,
  useDeleteNote
} from '../hooks/useNotesQuery';
```

### ✅ Step 3: Replace Store Hooks

```typescript
// Removed
const { notes, addNote, deleteNote, loadNotes } = useAppStore();

// Added
const { data: notes, isLoading, error } = useNotes();
const createMutation = useCreateNote();
const deleteMutation = useDeleteNote();
```

### ✅ Step 4: Remove useEffect

```typescript
// Removed entire useEffect block
// React Query handles loading automatically
```

### ✅ Step 5: Update Loading State

```typescript
// Changed from
if (notesLoading && !notesLoaded)

// To
if (isLoading)
```

### ✅ Step 6: Add Error Handling

```typescript
// Added
if (error) {
  return <ErrorMessage />;
}
```

### ✅ Step 7: Update Mutations

```typescript
// Changed from
addNote({ title, content });

// To
createMutation.mutate(
  { title, content },
  { onSuccess: () => { /* clear form */ } }
);
```

### ✅ Step 8: Add Pending States

```typescript
// Added to inputs
disabled={createMutation.isPending}

// Added to button
{createMutation.isPending ? 'Saving...' : 'Save'}
```

### ✅ Step 9: Add Error Feedback

```typescript
// Added
{createMutation.isError && (
  <p className="text-red-600">Error creating note</p>
)}
```

### ✅ Step 10: Wrap App with QueryProvider

```typescript
// In main.tsx
<QueryProvider>
  <AuthProvider>
    <App />
  </AuthProvider>
</QueryProvider>
```

---

## Testing Checklist

### ✅ Functionality

- [x] Component loads notes on mount
- [x] Loading skeleton shows during initial load
- [x] Notes display correctly after loading
- [x] Can create new note
- [x] Form clears after successful create
- [x] Can delete note
- [x] Error message shows if mutation fails
- [x] Inputs disable during mutations
- [x] Button shows "Saving..." during create

### ✅ React Query Features

- [x] Automatic caching works
- [x] Cache invalidation after mutations
- [x] No duplicate requests
- [x] DevTools show queries/mutations
- [x] Stale data refetches automatically

### ✅ User Experience

- [x] Loading states clear
- [x] Error states informative
- [x] No jarring UI changes
- [x] Smooth transitions
- [x] Instant feedback

---

## Performance Impact

### Before (Zustand)

- Manual cache check on every render
- No request deduplication
- No background refetching
- Re-renders on any store change

### After (React Query)

- ✅ Automatic cache management
- ✅ Request deduplication
- ✅ Background refetching
- ✅ Only re-renders on notes changes
- ✅ Stale-while-revalidate pattern

---

## Next Steps

### Migrate Remaining Components

Following the same pattern:

1. **Journal Components**
   - Create useJournalQuery hooks
   - Migrate Journal.tsx
   - Test thoroughly

2. **Goals Components**
   - Create useGoalsQuery hooks
   - Migrate Goals.tsx
   - Test thoroughly

3. **Other Domains**
   - Tasks, Habits, Meals, Shopping, etc.
   - Follow established pattern
   - Document any unique cases

### Remove from Zustand Store

After all components migrated:
- Remove notes state from useRealAppStore
- Remove notes actions (loadNotes, addNote, etc.)
- Keep UI state in Zustand
- Server state fully in React Query

---

## Lessons Learned

### What Went Well ✅

1. **Pattern is clear** - Easy to follow for other domains
2. **Better UX** - Loading and error states improve experience
3. **Less code** - No manual useEffect logic needed
4. **Type-safe** - TypeScript works great with React Query

### Challenges ⚠️

1. **Data shape differences** - Note types differ between Zustand and API
   - Solution: Transform data in query hooks
2. **Form state** - Still need useState for form inputs
   - This is correct - form state is client-only

### Best Practices 💡

1. **One component at a time** - Don't rush
2. **Test thoroughly** - Verify all functionality works
3. **Document** - Note any unique patterns
4. **Commit frequently** - Easy to revert if needed

---

## Conclusion

✅ **Success!** Notes component fully migrated to React Query.

**Benefits Realized**:
- Cleaner code (no manual useEffect)
- Better UX (loading/error states)
- Automatic caching
- Production-ready error handling

**Template established** for migrating remaining components.

**Next**: Apply same pattern to Journal, Goals, and other domains.
