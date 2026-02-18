# Together Feature - Phase 2 Progress

**Date:** 2026-02-17
**Status:** In Progress

---

## ✅ Completed Tasks

### Task #11: Fix RLS Policy Gaps ✅
**Status:** COMPLETE
**Files:**
- `/supabase/migrations/20260217_fix_together_rls_security.sql`

**Changes:**
- Enhanced SELECT policy to validate `partner_id` matches actual partner
- Enhanced INSERT policy to prevent arbitrary `partner_id` values
- Applied to `milestones`, `partner_messages`, and `achievement_rewards` tables

---

### Task #12: Input Validation & Sanitization ✅
**Status:** COMPLETE
**Files:**
- `/src/together/utils/validation.ts` (NEW)

**Changes:**
- File upload validation (images, videos, audio)
- XSS sanitization with DOMPurify
- Form validation functions for all Together forms
- URL validation to prevent javascript: attacks

**Dependencies Added:**
- `isomorphic-dompurify`

---

### Task #18: Add Type Guards ✅
**Status:** COMPLETE
**Files:**
- `/src/together/types/guards.ts` (NEW)
- `/src/together/types.ts` (MODIFIED - re-export guards)
- `/src/together/components/MessagesView.tsx` (MODIFIED - uses type guards)

**Changes:**
- Created comprehensive type guards for all Together types
- Object guards: `isMilestone`, `isPartnerMessage`, `isAchievementReward`, `isPartnerLink`
- Array guards: `isMilestoneArray`, `isPartnerMessageArray`, etc.
- Enum guards: `isMilestoneType`, `isMessageStatus`, `isChallengeStatus`, etc.
- Helper guards: `isUpcomingMilestone`, `shouldRevealMessage`, `isActiveChallenge`
- Updated MessagesView to use type guard for safer null checks

---

### Task #16: Refactor Modal State ✅
**Status:** COMPLETE
**Files:**
- `/src/together/components/MilestonesView.tsx` (MODIFIED)
- `/src/together/components/MessagesView.tsx` (MODIFIED)
- `/src/together/components/ChallengesView.tsx` (MODIFIED)

**Changes:**
- Replaced manual `useState` with `useModalState` hook
- Reduced boilerplate by ~30 lines per component
- Used `modals.open()`, `modals.close()`, `modals.set()`, `modals.batch()`
- Cleaner, more maintainable code

**Before:**
```typescript
const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
const openAddMilestone = () => setAddMilestoneOpen(true);
const closeAddMilestone = () => setAddMilestoneOpen(false);
// ... repeat for each modal
```

**After:**
```typescript
const modals = useModalState({
  addMilestone: false,
  editingMilestone: null as string | null,
});

modals.open('addMilestone');
modals.close('editingMilestone');
```

---

---

### Task #17: Standardize Error Handling ✅
**Status:** COMPLETE
**Files:**
- `/src/together/hooks/useMilestonesQuery.ts` (MODIFIED)
- `/src/together/hooks/usePartnerMessagesQuery.ts` (MODIFIED)
- `/src/together/hooks/useAchievementRewardsQuery.ts` (MODIFIED)

**Changes:**
- Added `useToast` and `getUserErrorMessage` imports to all query hooks
- Applied consistent error handling pattern to ALL mutations:
  - **useMilestonesQuery.ts**: create, update, delete (3 mutations)
  - **usePartnerMessagesQuery.ts**: create, update, reveal, markAsRead, delete (5 mutations)
  - **useAchievementRewardsQuery.ts**: create, update, delete (3 mutations)
- Total: 11 mutations now have standardized error handling

**Pattern Applied:**
```typescript
export function useCreateMilestone() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (milestone: CreateMilestoneRequest): Promise<Milestone> => {
      // ... mutation logic
    },
    onSuccess: () => {
      showToast('Milestone created successfully!', 'success');
      void queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
    },
    onError: (error) => {
      const message = getUserErrorMessage(error);
      showToast(message, 'error');
      logger.error('Together', error as Error, { operation: 'createMilestone' });
    },
  });
}
```

---

## ⏳ Remaining Tasks

---

### Task #13: Granular Query Invalidation ✅
**Status:** COMPLETE
**Files:**
- `/src/together/hooks/useMilestonesQuery.ts` (MODIFIED)
- `/src/together/hooks/usePartnerMessagesQuery.ts` (MODIFIED)
- `/src/together/hooks/useAchievementRewardsQuery.ts` (MODIFIED)

**Changes:**
- Replaced broad `queryKey: ...Keys.all` invalidation with granular strategies
- **Create mutations**: Invalidate lists only (not detail queries)
- **Update mutations**: Update specific item in cache with `setQueryData()` + invalidate lists
- **Delete mutations**: Remove from cache with `removeQueries()` + invalidate lists
- Total: 11 mutations optimized across all 3 query hooks

**Pattern Applied:**
```typescript
// CREATE - Invalidate lists only
onSuccess: () => {
  void queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: milestoneKeys.upcoming() });
}

// UPDATE - Update cache + invalidate lists
onSuccess: (data) => {
  queryClient.setQueryData(milestoneKeys.detail(data.id), data);
  void queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
}

// DELETE - Remove from cache + invalidate lists
onSuccess: (_, id) => {
  queryClient.removeQueries({ queryKey: milestoneKeys.detail(id) });
  void queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
}
```

**Benefits:**
- Reduces unnecessary refetches of detail queries
- Improves performance by only updating what changed
- Maintains consistency across all mutation hooks

---

### Task #14: Optimistic Updates ✅
**Status:** COMPLETE
**Files:**
- `/src/together/hooks/usePartnerMessagesQuery.ts` (MODIFIED)
- `/src/together/hooks/useMilestonesQuery.ts` (MODIFIED)
- `/src/together/hooks/useAchievementRewardsQuery.ts` (MODIFIED)

**Changes:**
- Added optimistic updates to **4 key mutations** for instant UI feedback
- **useMarkMessageRead**: Instantly mark message as read in UI
- **useRevealMessage**: Instantly reveal message and update pending list
- **useUpdateMilestone**: Instantly update milestone details in all queries
- **useUpdateAchievementReward**: Instantly update challenge progress with auto-complete logic

**Pattern Applied:**
```typescript
useMutation({
  mutationFn: async (messageId: string) => { /* ... */ },
  onMutate: async (messageId: string) => {
    // 1. Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: partnerMessageKeys.detail(messageId) });
    await queryClient.cancelQueries({ queryKey: partnerMessageKeys.lists() });

    // 2. Snapshot previous value
    const previousMessage = queryClient.getQueryData<PartnerMessage>(
      partnerMessageKeys.detail(messageId)
    );

    // 3. Optimistically update cache
    if (previousMessage) {
      queryClient.setQueryData(partnerMessageKeys.detail(messageId), {
        ...previousMessage,
        status: 'read',
        read_at: new Date().toISOString(),
      });
    }

    return { previousMessage };
  },
  onError: (error, messageId, context) => {
    // 4. Rollback on error
    if (context?.previousMessage) {
      queryClient.setQueryData(
        partnerMessageKeys.detail(messageId),
        context.previousMessage
      );
    }
  },
})
```

**Benefits:**
- Instant UI feedback for user actions
- Improved perceived performance
- Automatic rollback on errors
- Maintains data consistency

---

### Task #15: Pagination ✅
**Status:** COMPLETE
**Files:**
- `/src/together/hooks/usePartnerMessagesQuery.ts` (MODIFIED)
- `/src/together/hooks/useMilestonesQuery.ts` (MODIFIED)

**Changes:**
- Added **2 infinite query hooks** for pagination support
- **useInfinitePartnerMessages**: Paginated message fetching with filters
- **useInfiniteMilestones**: Paginated milestone fetching with filters
- Updated query keys to include `infinite` key
- Updated all mutations to invalidate infinite queries when data changes
- Page size: 20 items per page
- Uses offset-based pagination with `range()` in Supabase

**Implementation:**
```typescript
// useInfinitePartnerMessages hook
export function useInfinitePartnerMessages(filters?: MessageFilters) {
  const PAGE_SIZE = 20;

  return useInfiniteQuery({
    queryKey: partnerMessageKeys.infinite(filters),
    queryFn: async ({ pageParam = 0 }): Promise<PartnerMessage[]> => {
      const { data, error } = await supabase
        .from('partner_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      // Apply filters...
      return data || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    staleTime: 2 * 60 * 1000,
  });
}
```

**Benefits:**
- Improves performance by loading data in chunks
- Reduces initial load time
- Scales well with years of data
- Supports infinite scroll or "Load More" UX patterns

---

## 📊 Progress Summary

| Task | Status | Priority | Effort |
|------|--------|----------|--------|
| #11 RLS Security | ✅ COMPLETE | CRITICAL | - |
| #12 Input Validation | ✅ COMPLETE | CRITICAL | - |
| #18 Type Guards | ✅ COMPLETE | LOW | - |
| #16 Modal Refactor | ✅ COMPLETE | LOW | - |
| #17 Error Handling | ✅ COMPLETE | MEDIUM | - |
| #13 Query Invalidation | ✅ COMPLETE | MEDIUM | - |
| #14 Optimistic Updates | ✅ COMPLETE | MEDIUM | - |
| #15 Pagination | ✅ COMPLETE | MEDIUM | - |

**Total Completed:** 8/8 tasks (100%) 🎉
**Total Remaining:** 0/8 tasks

---

## 📁 Files Created/Modified

### New Files Created
1. `/supabase/migrations/20260217_fix_together_rls_security.sql` - Security fixes
2. `/src/together/utils/validation.ts` - Validation & sanitization
3. `/src/together/types/guards.ts` - Type guards
4. `/src/together/hooks/useTogetherRealtime.ts` - Real-time subscriptions (from Phase 1)
5. `/src/together/hooks/useTogetherMergedMode.ts` - Merged mode (from Phase 1)
6. `/src/together/api/milestonesAPI.ts` - API layer foundation (from Phase 1)

### Modified Files
7. `/src/together/types.ts` - Re-export type guards
8. `/src/together/components/MilestonesView.tsx` - useModalState
9. `/src/together/components/MessagesView.tsx` - useModalState + type guards
10. `/src/together/components/ChallengesView.tsx` - useModalState
11. `/src/pages/Together.tsx` - Error boundary + real-time (from Phase 1)
12. `/src/together/hooks/usePartnerLinkQuery.ts` - relationship_start_date (from Phase 1)
13. `/src/shared/types/connections.ts` - relationshipStartDate field (from Phase 1)
14. `/src/shared/api/connectionsAPI.ts` - Map relationship_start_date (from Phase 1)

---

## 🎯 Next Steps

1. ✅ ~~Complete Task #17~~ - Standardize error handling (DONE)
2. ✅ ~~Complete Task #13~~ - Granular query invalidation (DONE)
3. ✅ ~~Complete Task #14~~ - Optimistic updates (DONE)
4. ✅ ~~Complete Task #15~~ - Pagination (DONE)
5. ✅ ~~Apply validation~~ - Use validation functions in all Together forms (DONE)
6. ✅ ~~Install dependency~~ - `npm install isomorphic-dompurify` (DONE)
7. ✅ ~~Update checklist~~ - Add all Phase 2 patterns to PRE_CODING_CHECKLIST.md (DONE)
8. **Run migration** - Apply RLS security fixes: `psql -d lifesync -f supabase/migrations/20260217_fix_together_rls_security.sql`
9. **Update UI** - Add "Load More" buttons or infinite scroll to use new pagination hooks
10. **Test** - Security tests, performance tests, UX tests

---

**Status:** 100% complete + cleanup finished! 🎉

All 8 core tasks complete. Validation applied to forms. Dependency installed. **PRE_CODING_CHECKLIST.md updated** with all new patterns to prevent these issues in future features. Ready for migration, UI updates, and testing.
