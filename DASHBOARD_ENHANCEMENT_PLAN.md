# Dashboard Feature Enhancement Plan

## Overview

Dashboard is the home screen aggregating data from all features. Update to match `dashboard-design-spec.html` and apply CLAUDE.md standards.

**Current State:** Needs verification - may exist as Home page
**Goal:** Match design spec with stats cards, briefing, quick actions, task/habit previews

---

## Key Components (from Design Spec)

### 1. Header
- Greeting: "Good morning, [Name]" (time-based)
- Date display
- Terracotta gradient background

### 2. Stats Grid (2x2)
- Goals (terracotta border)
- Tasks (blue border)
- Habits (green border)
- Notes/Journal (purple/amber border)
- Large number + label

### 3. Briefing Card
- Today's summary bullets
- Terracotta bullet points
- "View Details" link

### 4. Quick Actions Grid (2x2)
- Add Task
- Add Goal
- Add Habit
- Add Note
- Icon + label, hover effect

### 5. Today's Tasks Preview
- Top 3-5 tasks with checkboxes
- "View All" link

### 6. Upcoming Habits Preview
- Top 3-5 habits with checkboxes
- "View All" link

---

## Implementation Phases

### Phase 1: Create Dashboard Page Structure
- Centered 900px layout
- Terracotta gradient header
- Time-based greeting (morning/afternoon/evening)
- Current date display

### Phase 2: Stats Grid
- Query counts from each feature
- 4 stat cards with colored borders
- Click cards → navigate to feature

### Phase 3: Daily Briefing
- Aggregate today's data:
  - Tasks due today
  - Habits scheduled today
  - Calendar events today
  - Journal prompt
- Bullet list with terracotta bullets

### Phase 4: Quick Actions
- 4 action buttons:
  - Add Task → opens task modal
  - Add Goal → opens goal modal
  - Add Habit → opens habit modal
  - Add Note → opens note modal
- Use modals from respective features

### Phase 5: Task/Habit Previews
- Today's tasks (top 5)
- Upcoming habits (top 5)
- Checkbox interaction updates data
- "View All" links to full pages

### Phase 6: Code Quality
- React Query for data fetching
- Error boundary
- Loading states
- useThemeColors()

---

## Success Criteria

✅ Matches `dashboard-design-spec.html` exactly
✅ Stats display correct counts
✅ Briefing shows relevant data
✅ Quick actions open modals
✅ Task/habit previews functional
✅ Responsive layout
✅ Fast performance (cached queries)

---

## Files to Create
- `src/pages/Dashboard.tsx` (or update existing Home.tsx)
- `src/dashboard/components/v2/StatsGridV2.tsx`
- `src/dashboard/components/v2/BriefingCardV2.tsx`
- `src/dashboard/components/v2/QuickActionsV2.tsx`
- `src/dashboard/hooks/useDashboardData.ts`

---

## Commit Message

```
feat: Create/enhance Dashboard as aggregated home screen

Implement Dashboard matching design spec:
- Time-based greeting header
- Stats grid (Goals, Tasks, Habits, Notes)
- Daily briefing card
- Quick actions (Add Task/Goal/Habit/Note)
- Today's tasks preview
- Upcoming habits preview

Features:
- Aggregates data from all features
- Quick access to common actions
- At-a-glance daily overview
- Terracotta theme throughout

Files: 5+ created/updated

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

**Complexity:** Medium - Requires data aggregation from multiple features
**Risk:** Low - Readonly display mostly, uses existing modals for actions
