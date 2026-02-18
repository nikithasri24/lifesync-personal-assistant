# Together Feature API Refactor - Technical Debt

## Status: Partial Implementation

### Completed
✅ Created `/src/together/api/milestonesAPI.ts` with proper API wrapper pattern
✅ Established foundation following best practices from other features

### Remaining Work

The Together feature currently has Supabase calls embedded directly in React Query hooks. While this works functionally, it violates the separation of concerns pattern used in other features.

#### Files Needing API Extraction

1. **usePartnerMessagesQuery.ts** → Create `partnerMessagesAPI.ts`
   - Extract `getPartnerMessages()`
   - Extract `getPendingMessageReveals()`
   - Extract `createPartnerMessage()`
   - Extract `updatePartnerMessage()`
   - Extract `deletePartnerMessage()`
   - Extract `revealMessage()`
   - Extract `markMessageAsRead()`

2. **useAchievementRewardsQuery.ts** → Create `achievementRewardsAPI.ts`
   - Extract `getAchievementRewards()`
   - Extract `createAchievementReward()`
   - Extract `updateAchievementReward()`
   - Extract `deleteAchievementReward()`
   - Extract `updateProgress()`

3. **useMilestonesQuery.ts** → Update to use `milestonesAPI.ts`
   - Replace direct Supabase calls with API functions
   - Keep React Query logic (query keys, invalidation, etc.)

### Pattern to Follow

```typescript
// ❌ CURRENT (hooks with embedded Supabase)
export function useMilestones(filters?: MilestoneFilters) {
  return useQuery({
    queryKey: milestoneKeys.list(filters),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // ... direct Supabase queries
    },
  });
}

// ✅ TARGET (API function + hook)
// src/together/api/milestonesAPI.ts
export async function getMilestones(filters?: MilestoneFilters): Promise<Milestone[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      // ... Supabase logic
    },
    { domain: 'Together', operation: 'getMilestones' }
  );
}

// src/together/hooks/useMilestonesQuery.ts
import { getMilestones } from '../api/milestonesAPI';

export function useMilestones(filters?: MilestoneFilters) {
  return useQuery({
    queryKey: milestoneKeys.list(filters),
    queryFn: () => getMilestones(filters),
  });
}
```

### Benefits of Completing This Refactor

1. **Separation of Concerns** - API logic separated from React Query logic
2. **Testability** - API functions can be unit tested independently
3. **Reusability** - API functions can be used outside of React components
4. **Error Handling** - Centralized error handling via `apiCall` wrapper
5. **Logging** - Consistent logging across all API operations
6. **Maintainability** - Follows established codebase patterns

### Priority

**Low-Medium** - This is a code quality/maintainability improvement. The current implementation works correctly but doesn't follow best practices.

### Estimated Effort

- 2-3 hours to complete all API files and update hooks
- Low risk (straightforward refactor with no behavioral changes)
