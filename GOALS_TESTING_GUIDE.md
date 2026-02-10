# Goals & Dreams - Testing Guide

**Last Updated:** 2026-02-10
**Version:** 1.0
**Modules:** Life Goals, Life Dreams

---

## Table of Contents
1. [Testing Modes](#testing-modes)
2. [Goals - All Actions](#goals---all-actions)
3. [Dreams - All Actions](#dreams---all-actions)
4. [Filtering - All Actions](#filtering---all-actions)
5. [Edge Cases & Error Scenarios](#edge-cases--error-scenarios)

---

## Testing Modes

### Personal Mode
- **Setup:** Single user, no partner connection
- **Access:** User sees only their own goals/dreams

### Merged Mode
- **Setup:** Two users with active connection, both have enabled merged mode for goals
- **Access:** Both users can see:
  - Their own personal goals/dreams (no `connection_id`)
  - Partner's personal goals/dreams (no `connection_id`)
  - Shared goals/dreams (has `connection_id`)

---

## Goals - All Actions

### 1. CREATE PERSONAL GOAL

**Action:** User A clicks "New Goal" → Fills form → Leaves "Share with partner" unchecked → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Creator)** | New goal appears in their goal list with "My goal" badge (merged mode) | `user_id = A`, `connection_id = NULL`, `status = 'not-started'`, `progress = 0` |
| **User B (Partner)** | Goal appears in their list with "[Partner Name]'s goal" badge (merged mode) | Same record visible via merged query |

**Filters:**
- Status: All ✓, Active ✓
- Show (merged mode): All ✓, Mine (User A) ✓, Partner (User B) ✓

---

### 2. CREATE SHARED GOAL

**Action:** User A clicks "New Goal" → Fills form → Checks "Share with partner" → Selects tracking mode (Combined/Individual) → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Creator)** | New goal appears with "Shared" badge | `user_id = A`, `connection_id = <merged_connection_id>`, `tracking_mode = 'combined' or 'individual'` |
| **User B (Partner)** | Same goal appears with "Shared" badge | Same record visible via merged query |

**Tracking Modes:**
- **Combined:** Progress is averaged between both users' personal progress
- **Individual:** Each user tracks their own progress separately

**Filters:**
- Status: All ✓, Active ✓
- Show (merged mode): All ✓, Shared ✓

---

### 3. EDIT GOAL (Personal Goal - Owner)

**Action:** User A clicks Edit icon on their personal goal → Modifies title/description/category/priority/date → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Owner)** | Goal updates immediately with new values | Record updated with new values, `updated_at` timestamp refreshed |
| **User B (Partner)** | Goal updates immediately (if in merged mode) | Same record, changes reflected via query |

**Permissions:**
- ✅ Owner can edit
- ✅ Partner can view changes (merged mode)
- ❌ Partner cannot edit (no edit button shown)

---

### 4. EDIT GOAL (Shared Goal - Either User)

**Action:** User A or User B clicks Edit icon on shared goal → Modifies fields → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A** | Goal updates immediately | Record updated, `updated_at` timestamp refreshed |
| **User B** | Goal updates immediately | Same changes visible via merged query |

**Permissions:**
- ✅ Either user can edit shared goals
- ✅ Changes visible to both users immediately

---

### 5. MARK GOAL AS COMPLETE

**Action:** User clicks "Complete" button on a goal

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Completer)** | "Complete" button changes to "Reopen" button, goal moves to "Completed" filter | `status = 'completed'`, `progress = 100`, `completed_date = NOW()` |
| **User B (Partner)** | Same changes (for shared/partner goals in merged mode) | Same record state |

**Filters:**
- Goal disappears from "Active" filter
- Goal appears in "Completed" filter
- Still visible in ownership filters (Mine/Partner/Shared)

**Permissions:**
- ✅ Owner can complete their personal goals
- ✅ Either user can complete shared goals
- ❌ Partner cannot complete other's personal goals

---

### 6. REOPEN COMPLETED GOAL

**Action:** User clicks "Reopen" button on a completed goal

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Reopener)** | "Reopen" button changes to "Complete" button, goal moves to "Active" filter | `status = 'in-progress'`, `completed_date = NULL`, progress unchanged |
| **User B (Partner)** | Same changes (for shared/partner goals in merged mode) | Same record state |

**Filters:**
- Goal disappears from "Completed" filter
- Goal appears in "Active" filter
- Still visible in ownership filters

**Permissions:**
- ✅ Owner can reopen their personal goals
- ✅ Either user can reopen shared goals
- ❌ Partner cannot reopen other's personal goals

---

### 7. UPDATE GOAL PROGRESS (Non-Shared Goal)

**Action:** User clicks "Update progress" → Drags slider to new percentage → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Updater)** | Progress bar updates immediately to new value | `progress = <new_value>`, `updated_at = NOW()` |
| **User B (Partner)** | Progress updates immediately (merged mode) | Same record |

**Progress Levels:**
- 0-24%: Early progress
- 25-49%: Making progress
- 50-74%: Over halfway
- 75-99%: Almost there
- 100%: Completed (triggers status change)

---

### 8. UPDATE PERSONAL PROGRESS (Shared Goal - Individual Tracking)

**Action:** User A clicks "Update my progress" on shared goal with individual tracking → Sets their progress → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Updater)** | Personal progress bar (green) updates, shared progress bar recalculates | `goal_progress_tracking` record: `user_id = A`, `personal_progress = <new_value>` |
| **User B (Partner)** | User A's progress bar updates, shared progress recalculates (average) | Same; separate record for User B if they set their progress |

**Calculation (Combined Tracking):**
- Shared Progress = Average of both users' personal progress
- Example: User A = 60%, User B = 40% → Shared = 50%

---

### 9. UPDATE SHARED PROGRESS (Shared Goal - Combined Tracking)

**Action:** User clicks "Update shared progress" on shared goal → Sets overall progress → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Updater)** | Shared progress bar updates | `progress = <new_value>`, `updated_at = NOW()` |
| **User B (Partner)** | Same shared progress bar updates | Same record |

**Note:** This updates the overall goal progress, not individual progress tracking.

---

### 10. DELETE GOAL

**Action:** User clicks Delete (trash icon) → Confirms deletion (if confirmation dialog exists)

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Deleter)** | Goal disappears from all lists | Record deleted from `life_goals` table |
| **User B (Partner)** | Goal disappears from all lists (merged mode) | Same record deleted |

**Permissions:**
- ✅ Owner can delete their personal goals
- ✅ Either user can delete shared goals
- ❌ Partner cannot delete other's personal goals (no delete button shown)

**Cascade Behavior:**
- ✅ Milestones deleted (if any)
- ✅ Check-ins deleted (if any)
- ✅ Progress tracking deleted (if any)

---

### 11. ADD MILESTONE TO GOAL

**Action:** User expands goal details → Clicks "Add Milestone" → Fills title/description/target date → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Creator)** | New milestone appears in goal's milestone list | New record in `life_goal_milestones`: `goal_id = <goal_id>`, `is_completed = false` |
| **User B (Partner)** | Same milestone appears (merged mode) | Same record visible |

**Permissions:**
- ✅ Owner can add milestones to personal goals
- ✅ Either user can add milestones to shared goals
- ❌ Partner cannot add milestones to other's personal goals

---

### 12. COMPLETE MILESTONE

**Action:** User clicks checkbox next to milestone

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Completer)** | Milestone shows as checked/completed with strikethrough | `is_completed = true`, `completed_date = NOW()` |
| **User B (Partner)** | Same milestone state updates | Same record |

**Permissions:**
- ✅ Owner can complete milestones on personal goals
- ✅ Either user can complete milestones on shared goals
- ❌ Partner cannot complete milestones on other's personal goals

---

### 13. DELETE MILESTONE

**Action:** User clicks delete icon on milestone

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Deleter)** | Milestone disappears from list | Record deleted from `life_goal_milestones` |
| **User B (Partner)** | Milestone disappears | Same record deleted |

**Permissions:**
- ✅ Owner can delete milestones from personal goals
- ✅ Either user can delete milestones from shared goals
- ❌ Partner cannot delete milestones from other's personal goals

---

### 14. ADD CHECK-IN TO GOAL

**Action:** User expands goal → Clicks "Add Check-in" → Fills progress update/notes/blockers/wins/next actions → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Creator)** | New check-in appears in goal's check-in list | New record in `life_goal_checkins`: `goal_id = <goal_id>`, `check_in_date = NOW()` |
| **User B (Partner)** | Same check-in appears (merged mode) | Same record visible |

**Permissions:**
- ✅ Owner can add check-ins to personal goals
- ✅ Either user can add check-ins to shared goals
- ❌ Partner cannot add check-ins to other's personal goals

---

### 15. CREATE GOAL FROM TEMPLATE

**Action:** User clicks "Browse Templates" → Selects template → Clicks "Create Goal from Template"

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Creator)** | New goal created with pre-filled values from template, including default milestones | New `life_goals` record + milestone records, `template_id = <template_id>` |
| **User B (Partner)** | Goal appears as User A's personal goal (merged mode) | Same records |

**Template Includes:**
- Pre-filled title, description, category
- Estimated duration (sets target date)
- Default milestones (auto-created)
- Suggested tags

**Note:** Template usage count increments by 1

---

### 16. EXPAND/COLLAPSE GOAL DETAILS

**Action:** User clicks "▶ Show details" or "▼ Hide details"

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A** | Goal details section expands/collapses (milestones, check-ins) | No database change (UI state only) |
| **User B** | No change (expansion state is per-user, not synced) | No database change |

**Shows When Expanded:**
- Milestones list
- Check-ins list
- Progress update controls

---

### 17. CONVERT PERSONAL GOAL TO SHARED

**Action:** User A edits their personal goal → Checks "Share with partner" → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Owner)** | Goal badge changes from "My goal" to "Shared" | `connection_id = <merged_connection_id>` (was NULL) |
| **User B (Partner)** | Goal appears in their list with "Shared" badge (previously showed as partner's goal) | Same record updated |

**Filters:**
- Moves from "Mine" to "Shared" filter

---

### 18. CONVERT SHARED GOAL TO PERSONAL

**Action:** User A edits shared goal → Unchecks "Share with partner" → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Owner)** | Goal badge changes from "Shared" to "My goal" | `connection_id = NULL` (was <merged_connection_id>) |
| **User B (Partner)** | Goal disappears from their list OR shows as partner's goal | Same record updated |

**Filters:**
- Moves from "Shared" to "Mine" filter

**Warning:** Partner loses edit access!

---

## Dreams - All Actions

### 19. CREATE PERSONAL DREAM

**Action:** User A clicks "New Dream" → Fills form → Leaves "Share with partner" unchecked → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Creator)** | New dream appears in their dream list with "My dream" badge (merged mode) | `user_id = A`, `connection_id = NULL`, `status = 'dreaming'` |
| **User B (Partner)** | Dream appears in their list with "[Partner Name]'s dream" badge (merged mode) | Same record visible via merged query |

**Filters:**
- Status: All ✓, Active ✓
- Show (merged mode): All ✓, Mine (User A) ✓, Partner (User B) ✓

---

### 20. CREATE SHARED DREAM

**Action:** User A clicks "New Dream" → Fills form → Checks "Share with partner" → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Creator)** | New dream appears with "Shared" badge | `user_id = A`, `connection_id = <merged_connection_id>` |
| **User B (Partner)** | Same dream appears with "Shared" badge | Same record visible via merged query |

**Filters:**
- Status: All ✓, Active ✓
- Show (merged mode): All ✓, Shared ✓

---

### 21. EDIT DREAM (Personal Dream - Owner)

**Action:** User A clicks Edit icon on their personal dream → Modifies fields → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Owner)** | Dream updates immediately with new values | Record updated, `updated_at = NOW()` |
| **User B (Partner)** | Dream updates immediately (merged mode) | Same record, changes reflected |

**Permissions:**
- ✅ Owner can edit
- ✅ Partner can view changes (merged mode)
- ❌ Partner cannot edit (no edit button shown)

---

### 22. EDIT DREAM (Shared Dream - Either User)

**Action:** User A or User B clicks Edit icon on shared dream → Modifies fields → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A** | Dream updates immediately | Record updated, `updated_at = NOW()` |
| **User B** | Dream updates immediately | Same changes visible |

**Permissions:**
- ✅ Either user can edit shared dreams

---

### 23. MARK DREAM AS ACHIEVED

**Action:** User clicks "Mark as Achieved" button on a dream

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Achiever)** | "Mark as Achieved" button changes to "Undo Achieved", dream moves to "Achieved" filter | `status = 'achieved'`, `achieved_at = NOW()` |
| **User B (Partner)** | Same changes (for shared/partner dreams in merged mode) | Same record state |

**Filters:**
- Dream disappears from "Active" filter
- Dream appears in "Achieved" filter
- Still visible in ownership filters

**Permissions:**
- ✅ Owner can mark their personal dreams as achieved
- ✅ Either user can mark shared dreams as achieved
- ❌ Partner cannot mark other's personal dreams as achieved

---

### 24. UNDO ACHIEVED DREAM

**Action:** User clicks "Undo Achieved" button on an achieved dream

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Undoer)** | "Undo Achieved" button changes to "Mark as Achieved", dream moves to "Active" filter | `status = 'dreaming'`, `achieved_at = NULL` |
| **User B (Partner)** | Same changes (for shared/partner dreams in merged mode) | Same record state |

**Filters:**
- Dream disappears from "Achieved" filter
- Dream appears in "Active" filter

**Permissions:**
- ✅ Owner can undo their personal dreams
- ✅ Either user can undo shared dreams
- ❌ Partner cannot undo other's personal dreams

---

### 25. DELETE DREAM

**Action:** User clicks Delete (trash icon) on dream

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Deleter)** | Dream disappears from all lists | Record deleted from `life_dreams` table |
| **User B (Partner)** | Dream disappears from all lists (merged mode) | Same record deleted |

**Permissions:**
- ✅ Owner can delete their personal dreams
- ✅ Either user can delete shared dreams
- ❌ Partner cannot delete other's personal dreams (no delete button shown)

---

### 26. CONVERT PERSONAL DREAM TO SHARED

**Action:** User A edits their personal dream → Checks "Share with partner" → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Owner)** | Dream badge changes from "My dream" to "Shared" | `connection_id = <merged_connection_id>` (was NULL) |
| **User B (Partner)** | Dream appears in their list with "Shared" badge | Same record updated |

**Filters:**
- Moves from "Mine" to "Shared" filter

---

### 27. CONVERT SHARED DREAM TO PERSONAL

**Action:** User A edits shared dream → Unchecks "Share with partner" → Saves

**Expected Outcome:**

| User | What They See | Database State |
|------|--------------|----------------|
| **User A (Owner)** | Dream badge changes from "Shared" to "My dream" | `connection_id = NULL` (was <merged_connection_id>) |
| **User B (Partner)** | Dream disappears from their list OR shows as partner's dream | Same record updated |

**Filters:**
- Moves from "Shared" to "Mine" filter

**Warning:** Partner loses edit access!

---

## Filtering - All Actions

### 28. FILTER BY STATUS - ALL

**Action:** User clicks "All" in Status filter

**Expected Outcome:**

| What Shows | Goals/Dreams Included |
|------------|----------------------|
| **All goals/dreams** | All statuses: not-started, in-progress, on-hold, completed (goals) / dreaming, planning, in-progress, achieved (dreams) |

---

### 29. FILTER BY STATUS - ACTIVE

**Action:** User clicks "Active" in Status filter

**Expected Outcome:**

| What Shows | Goals/Dreams Included |
|------------|----------------------|
| **Active goals/dreams only** | Goals: NOT completed (includes not-started, in-progress, on-hold) / Dreams: NOT achieved (includes dreaming, planning, in-progress) |

---

### 30. FILTER BY STATUS - COMPLETED/ACHIEVED

**Action:** User clicks "Completed" (goals) or "Achieved" (dreams) in Status filter

**Expected Outcome:**

| What Shows | Goals/Dreams Included |
|------------|----------------------|
| **Completed/achieved only** | Goals: status = 'completed' / Dreams: status = 'achieved' |

---

### 31. FILTER BY OWNERSHIP - ALL (Merged Mode Only)

**Action:** User clicks "All" in Show filter

**Expected Outcome:**

| What Shows | Goals/Dreams Included |
|------------|----------------------|
| **All goals/dreams** | Personal (mine), personal (partner's), and shared |

---

### 32. FILTER BY OWNERSHIP - MINE (Merged Mode Only)

**Action:** User clicks "Mine" in Show filter

**Expected Outcome:**

| What Shows | Goals/Dreams Included |
|------------|----------------------|
| **User's personal goals/dreams** | `user_id = current_user` AND `connection_id = NULL` |

---

### 33. FILTER BY OWNERSHIP - PARTNER (Merged Mode Only)

**Action:** User clicks "[Partner Name]" in Show filter

**Expected Outcome:**

| What Shows | Goals/Dreams Included |
|------------|----------------------|
| **Partner's personal goals/dreams** | `user_id = partner_id` AND `connection_id = NULL` |

---

### 34. FILTER BY OWNERSHIP - SHARED (Merged Mode Only)

**Action:** User clicks "Shared" in Show filter

**Expected Outcome:**

| What Shows | Goals/Dreams Included |
|------------|----------------------|
| **Shared goals/dreams** | `connection_id = <merged_connection_id>` |

---

### 35. COMBINE FILTERS

**Action:** User selects Status: "Active" AND Show: "Mine"

**Expected Outcome:**

| What Shows | Goals/Dreams Included |
|------------|----------------------|
| **Active personal goals/dreams** | Filters are combined with AND logic: Active status AND user's personal items |

**Examples:**
- Status: "Completed" + Show: "Shared" = Completed shared goals
- Status: "Active" + Show: "Partner" = Partner's active goals
- Status: "All" + Show: "All" = Everything

---

## Edge Cases & Error Scenarios

### 36. NO GOALS/DREAMS EXIST

**Expected Outcome:**
- Empty state message: "No goals yet. Start by creating one." (with icon)
- "New Goal" / "New Dream" button still functional

---

### 37. NO GOALS/DREAMS MATCH FILTERS

**Expected Outcome:**
- Empty state message: "No goals match your filters."
- Filters remain active (user can clear them)

---

### 38. PARTNER NOT IN MERGED MODE

**Expected Outcome:**
- "Share with partner" option disabled/hidden
- Only "Mine" filter available (no ownership filter shown)
- User sees only their own goals/dreams

---

### 39. NETWORK ERROR DURING SAVE

**Expected Outcome:**
- Error toast/notification shown
- Changes NOT saved to database
- Form remains open with user's input intact
- User can retry save

---

### 40. CONCURRENT EDIT BY BOTH PARTNERS

**Scenario:** User A and User B edit same shared goal simultaneously

**Expected Outcome:**
- Last write wins (whichever save completes last)
- Both users see final state after refresh/sync
- **Potential:** Show conflict warning if detected

---

### 41. DELETE MERGED CONNECTION

**Scenario:** Users disconnect their merged mode while having shared goals

**Expected Outcome:**
- Shared goals become personal goals for creator (User A who created them)
- Partner (User B) loses access to previously shared goals
- Personal goals remain unchanged

---

### 42. TEMPLATE WITH NO MILESTONES

**Expected Outcome:**
- Goal created without milestones
- User can add milestones manually later

---

### 43. VERY LONG GOAL/DREAM TITLE

**Expected Outcome:**
- Text truncates with ellipsis (...) in list view
- Full text visible in edit form and detail view

---

### 44. SPECIAL CHARACTERS IN FIELDS

**Test Input:** Title with emojis, quotes, apostrophes, etc.

**Expected Outcome:**
- Characters saved correctly
- Display correctly in UI
- No SQL injection or XSS vulnerabilities

---

### 45. DATE IN THE PAST

**Scenario:** User sets target date in the past

**Expected Outcome:**
- **Option A:** Allow (maybe goal was supposed to be done)
- **Option B:** Show warning but allow
- **Option C:** Prevent (validation error)

**Current Behavior:** [TO BE VERIFIED]

---

## Statistics & Counters

### 46. GOAL STATISTICS

**Location:** Stats cards at top of page

**Expected Display:**

| Stat | Calculation |
|------|-------------|
| **Total Goals** | Count of all goals (active + completed) |
| **Completed** | Count where `status = 'completed'` |
| **In Progress** | Count where `status = 'in-progress'` |

**Updates:** Real-time when goals are created/completed/deleted

---

### 47. DREAM STATISTICS

**Location:** Stats cards at top of page

**Expected Display:**

| Stat | Calculation |
|------|-------------|
| **Total Dreams** | Count of all dreams (active + achieved) |
| **Achieved** | Count where `status = 'achieved'` |

**Updates:** Real-time when dreams are created/achieved/deleted

---

## Permissions Matrix

### Personal Goals/Dreams

| Action | Owner | Partner (Merged Mode) |
|--------|-------|----------------------|
| View | ✅ | ✅ |
| Edit | ✅ | ❌ |
| Delete | ✅ | ❌ |
| Mark Complete/Achieved | ✅ | ❌ |
| Reopen/Undo | ✅ | ❌ |
| Update Progress | ✅ | ❌ |
| Add Milestone | ✅ | ❌ |
| Add Check-in | ✅ | ❌ |
| Convert to Shared | ✅ | ❌ |

### Shared Goals/Dreams

| Action | Either User |
|--------|-------------|
| View | ✅ |
| Edit | ✅ |
| Delete | ✅ |
| Mark Complete/Achieved | ✅ |
| Reopen/Undo | ✅ |
| Update Progress | ✅ |
| Update Personal Progress | ✅ (own progress only) |
| Add Milestone | ✅ |
| Add Check-in | ✅ |
| Convert to Personal | ✅ (becomes their personal item) |

---

## Testing Checklist

### Pre-requisites
- [ ] Test user A account created
- [ ] Test user B account created
- [ ] Users connected as partners
- [ ] Both users enabled merged mode for goals
- [ ] Database reset to clean state

### Personal Mode Tests (User A only)
- [ ] Test Actions 1, 3, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16, 19, 21, 23, 24, 25
- [ ] Test Filters 28-30
- [ ] Test Statistics 46-47
- [ ] Test Edge Cases 36-39, 42-45

### Merged Mode Tests (User A + User B)
- [ ] Test Actions 2, 4, 8, 9, 17, 18, 20, 22, 26, 27
- [ ] Test Filters 28-35
- [ ] Test Concurrent Edits 40
- [ ] Test Connection Loss 41
- [ ] Verify both users see same data
- [ ] Verify permission boundaries (permissions matrix)

### Mobile/Responsive Tests
- [ ] All actions work on mobile viewport
- [ ] Filters accessible and usable on small screens
- [ ] Forms scrollable and submittable on mobile

### Performance Tests
- [ ] Load page with 100+ goals
- [ ] Filter performance with large dataset
- [ ] Real-time sync delay between users

---

## Known Issues / Notes

1. **Real-time Sync:** Changes may take a few seconds to appear for partner (depends on React Query refetch interval)
2. **Optimistic Updates:** UI updates immediately, but may revert if save fails
3. **Filter State:** Filter selections are NOT synced between users (per-user UI state)
4. **Expansion State:** Expanded/collapsed goal details are NOT synced between users

---

## Test Data Examples

### Sample Personal Goal (User A)
```json
{
  "title": "Learn Spanish",
  "description": "Complete Duolingo course",
  "category": "personal",
  "priority": "medium",
  "targetDate": "2026-06-01",
  "status": "in-progress",
  "progress": 30
}
```

### Sample Shared Goal
```json
{
  "title": "Save $10,000 for vacation",
  "description": "Monthly savings goal",
  "category": "financial",
  "priority": "high",
  "targetDate": "2026-12-31",
  "isShared": true,
  "trackingMode": "combined"
}
```

### Sample Dream
```json
{
  "title": "Visit Japan",
  "description": "Two-week trip to Tokyo and Kyoto",
  "category": "travel",
  "estimatedCost": "5000",
  "estimatedTimeframe": "2027",
  "isShared": true
}
```

---

## Contact

**Questions or Issues?** Contact the development team.

**Last Updated By:** Claude Sonnet 4.5
**Date:** 2026-02-10
