# LifeSync Backlog

This document tracks future enhancements, improvements, and known issues that are not currently blocking but should be addressed.

---

## Together Feature

### Challenges - Automatic Progress Tracking
**Priority:** Medium
**Status:** Not Started
**Created:** 2026-02-17

**Problem:**
Currently, challenges require manual progress tracking. The `linked_type` and `linked_id` fields exist in the database but are not properly utilized during challenge creation.

**Current Behavior:**
- When creating a challenge, `linked_type` is hardcoded to `'habit'`
- `linked_id` is incorrectly set to `partnerLink.id` (connection ID) instead of an actual habit/goal/task ID
- Progress must be manually updated by clicking Edit Challenge and changing the "Current Progress" field

**Proposed Solutions:**

**Option A: Manual Only (Quick Fix)**
- Remove `linked_type` and `linked_id` fields from creation flow
- Keep manual progress tracking only
- Simplest implementation, no integration required

**Option B: Full Automatic Tracking**
- Add dropdown/selection in Create Challenge modal to choose a habit/goal/task
- Fetch partner's habits/goals/tasks and let creator select which one to track
- Automatically update `current_progress` when partner completes the linked activity
- Requires integration with habits/goals/tasks completion events

**Option C: Hybrid Approach (Recommended)**
- Make linked entity optional during creation
- If linked entity selected → auto-track progress
- If no linked entity → manual tracking only
- Provides flexibility for both use cases

**Technical Requirements:**
- Add habit/goal/task selection dropdown to `CreateChallengeModal.tsx`
- Create hooks to fetch partner's habits/goals/tasks
- Implement event listeners or database triggers to update challenge progress
- Update challenge status to 'unlocked' when progress reaches target

**Files Affected:**
- `src/together/components/modals/CreateChallengeModal.tsx`
- `src/together/hooks/useAchievementRewardsQuery.ts`
- Potentially: habits/goals/tasks completion hooks

---

## Future Sections

### Messages Feature
<!-- Add message-related backlog items here -->

### Milestones Feature
<!-- Add milestone-related backlog items here -->

### General/Shared
<!-- Add cross-feature backlog items here -->

---

## Template for New Items

```markdown
### [Feature Name] - [Issue Title]
**Priority:** High/Medium/Low
**Status:** Not Started/In Progress/Blocked
**Created:** YYYY-MM-DD

**Problem:**
[Description of the issue or enhancement need]

**Current Behavior:**
[What happens now]

**Proposed Solution:**
[How to fix or implement]

**Technical Requirements:**
- [Requirement 1]
- [Requirement 2]

**Files Affected:**
- [File path 1]
- [File path 2]
```
