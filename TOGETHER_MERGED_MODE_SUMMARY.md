# Together Feature - Merged Mode Implementation

## Overview

Merged mode for the Together feature enables couples to view each other's relationship milestones, messages, and challenges in unified views. This follows the same pattern used in other LifeSync features (Habits, Goals, Tasks, etc.).

## Implementation Status

### ✅ Completed

1. **Merged Mode Infrastructure**
   - Created `useTogetherMergedMode.ts` with connection checking hooks
   - Implemented caching to avoid repeated database calls
   - Added module-specific hooks:
     - `useMergedMilestonesConnection()`
     - `useMergedMessagesConnection()`
     - `useMergedChallengesConnection()`

2. **Milestones API - Merged Mode Support**
   - Updated `milestonesAPI.ts` to fetch both users' milestones when merged mode is active
   - Uses `.or()` query to get milestones for current user AND partner
   - Logged merged mode status for debugging

3. **Exports and Integration**
   - Exported merged mode hooks from `hooks/index.ts`
   - Documented implementation in this file

### 🔧 Current Limitation

The Together feature modules (`milestones`, `messages`, `challenges`) are **not yet in the `ShareableModule` enum** in the Shared feature. This means:

- Users cannot currently configure Together permissions in the Shared settings UI
- The implementation uses a **proxy approach**: checks if `'goals'` module has merged permission as a workaround
- This works for couples who have set Goals to merged mode, but isn't ideal

### 📋 Future Work Needed

To fully enable Together merged mode:

1. **Add Together to ShareableModule Enum**
   ```typescript
   // src/shared/types/connections.ts
   export type ShareableModule =
     | 'visa'
     | 'finances'
     // ... existing modules
     | 'together';  // ADD THIS
   ```

2. **Add Together Module Configuration**
   ```typescript
   // src/shared/types/connections.ts
   export const MODULE_CONFIGS: Record<ShareableModule, ModulePermissionConfig> = {
     // ... existing configs
     together: {
       module: 'together',
       label: 'Together',
       description: 'Relationship milestones, messages, and challenges',
       icon: 'Heart',
       defaultLevel: 'none',
       supportedLevels: ['none', 'view', 'merged'],
       hasSettings: false,
     },
   };
   ```

3. **Update Permission Check**
   ```typescript
   // src/together/hooks/useTogetherMergedMode.ts
   // CHANGE FROM:
   const connection = await getMergedConnectionId('goals');
   // TO:
   const connection = await getMergedConnectionId('together');
   ```

4. **Database Migration (if needed)**
   - Check if `module_permissions` table needs schema changes
   - Add Together module to any relevant constraints

5. **Apply Merged Mode to All Together APIs**
   - Partner Messages API - fetch both sent and received messages in unified view
   - Achievement Rewards API - show challenges created by both users

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Together Page                                               │
│ ┌─────────────────┐ ┌───────────────────┐ ┌──────────────┐ │
│ │ Milestones View │ │ Messages View     │ │ Challenges   │ │
│ └────────┬────────┘ └─────────┬─────────┘ └──────┬───────┘ │
│          │                     │                   │         │
└──────────┼─────────────────────┼───────────────────┼─────────┘
           │                     │                   │
           │                     │                   │
    ┌──────▼─────────────────────▼───────────────────▼──────┐
    │ React Query Hooks                                      │
    │ • useMilestones()                                      │
    │ • usePartnerMessages()                                 │
    │ • useAchievementRewards()                              │
    └─────────────────────┬──────────────────────────────────┘
                          │
    ┌─────────────────────▼──────────────────────────────────┐
    │ Merged Mode Checks                                     │
    │ • useMergedMilestonesConnection()                      │
    │ • useMergedMessagesConnection()                        │
    │ • useMergedChallengesConnection()                      │
    └─────────────────────┬──────────────────────────────────┘
                          │
    ┌─────────────────────▼──────────────────────────────────┐
    │ Together API Layer                                     │
    │ • getMilestones() - Checks merged mode, fetches both  │
    │ • getPartnerMessages() - (to be implemented)          │
    │ • getAchievementRewards() - (to be implemented)       │
    └─────────────────────┬──────────────────────────────────┘
                          │
    ┌─────────────────────▼──────────────────────────────────┐
    │ Supabase Database                                      │
    │ • milestones table (user_id filter expanded)          │
    │ • partner_messages table                               │
    │ • achievement_rewards table                            │
    └────────────────────────────────────────────────────────┘
```

### Query Logic

**Without Merged Mode:**
```sql
SELECT * FROM milestones
WHERE user_id = current_user_id
ORDER BY milestone_date;
```

**With Merged Mode:**
```sql
SELECT * FROM milestones
WHERE user_id = current_user_id
   OR user_id = partner_user_id
ORDER BY milestone_date;
```

### Benefits

1. **Unified Timeline** - See all relationship events (both users' birthdays, anniversaries, etc.) in one place
2. **Better Planning** - Couples can coordinate around each other's important dates
3. **Shared Context** - Both partners have visibility into upcoming milestones
4. **Consistent Pattern** - Follows the same merged mode pattern as other features

## Example Usage

```typescript
// In a component
import { useMilestones, useMergedMilestonesConnection } from '@/together/hooks';

function MilestonesView() {
  const { data: mergedConnection } = useMergedMilestonesConnection();
  const { data: milestones } = useMilestones({ upcoming_only: true });

  return (
    <div>
      {mergedConnection && (
        <div className="badge">
          Viewing milestones for you and {mergedConnection.partnerName}
        </div>
      )}

      {milestones?.map(milestone => (
        <MilestoneCard
          key={milestone.id}
          milestone={milestone}
          showOwner={!!mergedConnection} // Show who owns this milestone
        />
      ))}
    </div>
  );
}
```

## Files Created/Modified

### Created
- `src/together/hooks/useTogetherMergedMode.ts` - Merged mode connection hooks
- `src/together/api/milestonesAPI.ts` - API layer with merged mode support
- `TOGETHER_MERGED_MODE_SUMMARY.md` - This documentation

### Modified
- `src/together/hooks/index.ts` - Added merged mode exports

## Testing Considerations

To test merged mode:

1. Have two users create a connection in /shared
2. Both users set "Goals" (proxy module) to "merged" permission
3. Each user creates different milestones
4. Both users should see all milestones in Together > Milestones view
5. Owner badge should distinguish whose milestone it is

## Next Steps

See "Future Work Needed" section above for completing the full implementation.
