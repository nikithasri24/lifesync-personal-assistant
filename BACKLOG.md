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

### Notification System Enhancements
**Priority:** Medium
**Status:** Not Started
**Created:** 2026-02-17

**Problem:**
The Together feature currently only uses toast notifications for milestone reminders and message reveals. This limits user engagement and makes it easy to miss important relationship moments.

**Current Behavior:**
- `useMilestoneReminders.ts:71` only shows toast notifications
- No push notifications for mobile devices
- No email reminders for important dates
- No desktop/system notifications
- Users must have the app open to see notifications

**Proposed Solution:**
Implement a multi-channel notification system with user preferences:

**Phase 1: Desktop/System Notifications**
- Add browser Notification API integration
- Request permission on first milestone/message creation
- Show system notifications for:
  - Milestone reminders (30d, 7d, 1d, day-of)
  - New message reveals
  - Challenge completions
  - Partner activity updates

**Phase 2: Email Notifications**
- Integrate with existing email system
- Send email reminders for milestones (configurable)
- Daily/weekly digest option for partner activity
- "Your partner sent you a message" emails

**Phase 3: Push Notifications (Mobile)**
- Implement web push notifications
- Mobile app push notifications (future)
- Real-time alerts for partner interactions

**Technical Requirements:**
- Add notification preferences to user settings
- Create `src/together/services/notificationService.ts`
- Implement notification permission handling
- Add email templates for Together notifications
- Create notification preferences UI in Together settings
- Integrate with Supabase Edge Functions for email delivery

**User Preference Options:**
- Toast (browser) - on/off
- Desktop notifications - on/off
- Email notifications - on/off/digest
- Notification frequency settings
- Quiet hours configuration

**Files Affected:**
- `src/together/hooks/useMilestoneReminders.ts` - Add multi-channel support
- `src/together/services/notificationService.ts` - New file
- `src/together/components/NotificationSettings.tsx` - New preferences UI
- Supabase Edge Functions - Email notification handlers

---

### Analytics and Insights Dashboard
**Priority:** Low-Medium
**Status:** Not Started
**Created:** 2026-02-17

**Problem:**
The Together feature lacks analytics and historical insights, making it difficult for users to:
- Reflect on relationship milestones over time
- See patterns in communication
- Track challenge engagement
- Visualize relationship timeline

**Current Behavior:**
- No historical views for past milestones
- No message statistics
- No challenge completion analytics
- No relationship timeline visualization
- Data exists but isn't surfaced to users

**Proposed Features:**

**1. Milestone History View**
- Calendar view of past celebrations
- "On This Day" feature (anniversaries from previous years)
- Photo gallery of milestone celebrations
- Milestone completion statistics

**2. Message Statistics**
- Total messages sent/received
- Most common reveal triggers
- Message frequency over time
- Average message length
- Sentiment analysis (optional)

**3. Challenge Analytics**
- Completion rate percentage
- Most common challenge types
- Streak tracking for completed challenges
- Reward type preferences
- Time-to-completion averages

**4. Relationship Timeline**
- Visual timeline from relationship start date
- Major milestones plotted chronologically
- Message history integrated
- Challenge achievements highlighted
- Photo memories integration

**5. Insights Dashboard**
- "Your Relationship in Numbers" summary card
- "{X} days together" prominently displayed
- "{X} messages exchanged"
- "{X} challenges completed"
- "{X} milestones celebrated"
- Comparison to previous periods (optional)

**Technical Requirements:**
- Create analytics queries/views in Supabase
- Add `src/together/components/InsightsDashboard.tsx`
- Implement chart components (recharts or similar)
- Create timeline visualization component
- Add "Insights" tab to Together page
- Optimize queries for performance (indexed views)

**UI Components Needed:**
- StatCard - Quick stats display
- TimelineView - Chronological relationship events
- ChallengeStatsChart - Completion rate visualization
- MessageFrequencyGraph - Communication patterns
- MilestoneCalendar - Interactive calendar view

**Files Affected:**
- `src/together/components/InsightsDashboard.tsx` - New dashboard
- `src/together/components/TimelineView.tsx` - New timeline
- `src/together/hooks/useTogetherAnalytics.ts` - New analytics hooks
- `src/pages/Together.tsx` - Add "Insights" tab
- Supabase migrations - Create analytics views

**Data Privacy Considerations:**
- Analytics should only show current user's perspective
- Respect partner's privacy (don't expose their unrevealed messages)
- Allow users to opt-out of certain analytics
- No third-party analytics tracking

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
