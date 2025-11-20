# React Query Migration Guide

## Overview

We're migrating from **Zustand for server state** to **React Query for server state**, while keeping Zustand for client-only UI state.

## Why Migrate?

### Current Problems (Zustand for Everything)

```typescript
// useRealAppStore.ts - Managing server state manually
const useAppStore = create((set, get) => ({
  notes: [],
  notesLoaded: false,
  notesLoading: false,

  // Manual cache management
  loadNotes: async () => {
    if (get().notesLoaded) return; // Manual cache check
    set({ notesLoading: true });
    const notes = await getNotes();
    set({ notes, notesLoading: false, notesLoaded: true });
  },

  // Manual cache invalidation
  addNote: async (input) => {
    const note = await createNote(input);
    set((state) => ({ notes: [...state.notes, note] }));
  },
}));
```

**Problems**:
- ❌ Manual cache management
- ❌ No automatic refetching
- ❌ No request deduplication
- ❌ No background updates
- ❌ Complex loading states
- ❌ No optimistic updates built-in
- ❌ Server state mixed with UI state

### Solution (React Query + Zustand)

**React Query**: Server state (data from Supabase)
**Zustand**: Client state (UI preferences, sidebar state, etc.)

## Architecture

```
┌─────────────────────────────────────┐
│         React Components            │
├─────────────────────────────────────┤
│                                     │
│  Server State        Client State   │
│  (React Query)       (Zustand)      │
│  ↓                   ↓              │
│  useNotes()          useUIStore()   │
│  useJournal()        - activeView   │
│  useGoals()          - sidebar      │
│                      - theme        │
└─────────────────────────────────────┘
```

## Setup

### 1. Install Packages

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### 2. Create Query Client

**File**: `src/lib/react-query.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  notes: {
    all: ['notes'] as const,
    lists: () => [...queryKeys.notes.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.notes.all, 'detail', id] as const,
  },
  // ... other domains
};
```

### 3. Wrap App with Provider

**File**: `src/main.tsx`

```typescript
import { QueryProvider } from '@/providers';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
);
```

## Migration Pattern

### Step 1: Create Query Hooks

**File**: `src/hooks/useNotesQuery.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { getNotes, createNote, updateNote, deleteNote } from '@/api/notesAPI';

// Query: Get all notes
export function useNotes() {
  return useQuery({
    queryKey: queryKeys.notes.lists(),
    queryFn: getNotes,
  });
}

// Mutation: Create note
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
    },
  });
}

// Mutation: Update note
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => updateNote(id, updates),
    onSuccess: (updatedNote) => {
      queryClient.setQueryData(queryKeys.notes.lists(), (old) =>
        old.map((note) => (note.id === updatedNote.id ? updatedNote : note))
      );
    },
  });
}

// Mutation: Delete note
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData(queryKeys.notes.lists(), (old) =>
        old.filter((note) => note.id !== deletedId)
      );
    },
  });
}
```

### Step 2: Update Components

#### Before (Zustand)

```typescript
import { useAppStore } from '@/stores/useRealAppStore';

function NotesList() {
  const {
    notes,
    notesLoaded,
    notesLoading,
    loadNotes,
    addNote,
    deleteNote,
  } = useAppStore();

  useEffect(() => {
    if (!notesLoaded && !notesLoading) {
      loadNotes();
    }
  }, [loadNotes, notesLoaded, notesLoading]);

  const handleCreate = async (input) => {
    await addNote(input);
  };

  if (notesLoading) return <Spinner />;
  if (!notesLoaded) return null;

  return (
    <div>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={() => deleteNote(note.id)}
        />
      ))}
    </div>
  );
}
```

#### After (React Query)

```typescript
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/useNotesQuery';

function NotesList() {
  const { data: notes, isLoading, error } = useNotes();
  const createMutation = useCreateNote();
  const deleteMutation = useDeleteNote();

  const handleCreate = (input) => {
    createMutation.mutate(input);
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) return <Spinner />;
  if (error) return <Error error={error} />;
  if (!notes) return null;

  return (
    <div>
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onDelete={() => handleDelete(note.id)} />
      ))}
      <CreateButton
        onClick={() => handleCreate({ title: 'New', content: '' })}
        disabled={createMutation.isPending}
      />
    </div>
  );
}
```

## Key Differences

| Aspect | Zustand (Before) | React Query (After) |
|--------|------------------|---------------------|
| **Loading state** | Manual (`notesLoading`) | Automatic (`isLoading`) |
| **Error handling** | Try/catch everywhere | Built-in `error` |
| **Cache management** | Manual (`notesLoaded`) | Automatic (staleTime) |
| **Refetching** | Manual (`loadNotes()`) | Automatic (on mount, refocus) |
| **Mutations** | Manual state updates | Automatic with `invalidateQueries` |
| **Request deduplication** | None | Automatic |
| **Background refetching** | None | Automatic |
| **Optimistic updates** | Manual | Built-in support |
| **DevTools** | Zustand DevTools | React Query DevTools |

## Advanced Patterns

### Optimistic Updates

```typescript
export function useUpdateNoteOptimistic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => updateNote(id, updates),

    onMutate: async ({ id, updates }) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.lists() });

      // Snapshot current value
      const previousNotes = queryClient.getQueryData(queryKeys.notes.lists());

      // Optimistically update
      queryClient.setQueryData(queryKeys.notes.lists(), (old) =>
        old.map((note) => (note.id === id ? { ...note, ...updates } : note))
      );

      return { previousNotes };
    },

    // Rollback on error
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKeys.notes.lists(), context.previousNotes);
    },

    // Refetch on settle
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
    },
  });
}
```

### Pagination

```typescript
export function useNotesPaginated(page: number, pageSize: number = 20) {
  return useQuery({
    queryKey: queryKeys.notes.list({ page, pageSize }),
    queryFn: () => getNotes({ page, pageSize }),
    keepPreviousData: true, // Keep old data while fetching new
  });
}
```

### Infinite Scroll

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

export function useNotesInfinite() {
  return useInfiniteQuery({
    queryKey: queryKeys.notes.lists(),
    queryFn: ({ pageParam = 0 }) => getNotes({ page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
  });
}
```

### Dependent Queries

```typescript
export function useNoteWithAuthor(noteId: string) {
  // First, get the note
  const { data: note } = useNote(noteId);

  // Then, get the author (only if note exists)
  const { data: author } = useQuery({
    queryKey: ['users', note?.authorId],
    queryFn: () => getUser(note!.authorId),
    enabled: !!note?.authorId, // Only run if note has authorId
  });

  return { note, author };
}
```

### Prefetching

```typescript
export function usePrefetchNote(id: string) {
  const queryClient = useQueryClient();

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.notes.detail(id),
      queryFn: () => getNote(id),
    });
  };

  return prefetch;
}

// Usage in component
<NoteCard
  note={note}
  onMouseEnter={() => prefetchNote(note.id)}
/>
```

## Migration Checklist

### For Each Domain (Notes, Journal, Goals, etc.)

- [ ] 1. Create query hooks file (`hooks/use{Domain}Query.ts`)
  - [ ] `use{Domain}()` - Get all items
  - [ ] `use{Item}(id)` - Get single item
  - [ ] `useCreate{Item}()` - Create mutation
  - [ ] `useUpdate{Item}()` - Update mutation
  - [ ] `useDelete{Item}()` - Delete mutation

- [ ] 2. Update components
  - [ ] Replace `useAppStore()` with query hooks
  - [ ] Remove manual `useEffect` for loading
  - [ ] Replace `loading` with `isLoading`
  - [ ] Replace try/catch with `error` handling
  - [ ] Use `mutate()` for mutations

- [ ] 3. Remove from Zustand store
  - [ ] Delete `{items}` state
  - [ ] Delete `{items}Loaded` flag
  - [ ] Delete `{items}Loading` flag
  - [ ] Delete `load{Items}()` action
  - [ ] Delete `add{Item}()` action
  - [ ] Delete `update{Item}()` action
  - [ ] Delete `delete{Item}()` action

- [ ] 4. Test
  - [ ] Loading states work
  - [ ] Error states work
  - [ ] CRUD operations work
  - [ ] Cache updates correctly
  - [ ] No regressions

## Best Practices

### 1. Query Key Structure

```typescript
// ✅ Good: Hierarchical keys
['notes']                       // All notes-related queries
['notes', 'list']              // All note lists
['notes', 'list', { filter }]  // Specific filtered list
['notes', 'detail', id]        // Single note

// ❌ Bad: Flat keys
['notes']
['notesFiltered']
['note-123']
```

### 2. Invalidation Strategy

```typescript
// ✅ Good: Invalidate specific queries
queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });

// ❌ Bad: Invalidate everything
queryClient.invalidateQueries();
```

### 3. Error Handling

```typescript
// ✅ Good: Handle errors in UI
const { data, error, isLoading } = useNotes();

if (error) return <Error error={error} />;

// ❌ Bad: Silent failures
const { data } = useNotes();
if (!data) return null; // Could be error or loading!
```

### 4. Loading States

```typescript
// ✅ Good: Differentiate loading states
const { data, isLoading, isFetching } = useNotes();

if (isLoading) return <Spinner />; // Initial load
if (isFetching) return <div>Refreshing... {data.map(...)}</div>; // Background fetch

// ❌ Bad: Block UI on background refetch
if (isLoading || isFetching) return <Spinner />;
```

## Migration Order

1. ✅ **Notes** (example implementation complete)
2. ⏳ **Journal** (next)
3. ⏳ **Goals** (next)
4. ⏳ **Dreams** (next)
5. ⏳ **Tasks**
6. ⏳ **Habits**
7. ⏳ **Meals**
8. ⏳ **Shopping**
9. ⏳ **Finance**
10. ⏳ **Travel**

## Benefits Realized

After full migration:

- ✅ **90% less boilerplate** (no manual loading states)
- ✅ **Automatic caching** (no `{domain}Loaded` flags)
- ✅ **Automatic refetching** (stale data updates automatically)
- ✅ **Request deduplication** (multiple components, one request)
- ✅ **Background updates** (seamless UX)
- ✅ **Optimistic updates** (instant UI feedback)
- ✅ **Better DevTools** (inspect queries, mutations, cache)
- ✅ **Type-safe** (full TypeScript support)
- ✅ **Smaller bundle** (Zustand only for UI state)

## Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Query Keys Guide](https://tkdodo.eu/blog/effective-react-query-keys)
- [Practical React Query](https://tkdodo.eu/blog/practical-react-query)
- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
