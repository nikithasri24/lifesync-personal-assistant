# Calendar Feature Enhancement Plan

## Overview

The Calendar feature is **well-implemented** with V2 components that largely match the design specification. This plan focuses on **refinements and code quality improvements** to fully align with CLAUDE.md standards.

**Current State:**
- Page exists at `src/pages/Calendar.tsx` with V2 components
- V2 components: CalendarHeaderV2, MonthViewV2, DayViewV2, EventCardV2
- Uses SegmentedControlV2 for view toggle
- Has date navigation, "Today" button, event dots
- Integrates tasks from Tasks feature
- Has drag-and-drop support

**Goal:**
- Ensure design spec compliance (check event dot sizing, layout, etc.)
- Update to standard centered 900px container pattern
- Verify React Query usage (check if Zustand needs replacement)
- Apply code quality improvements

**Why This Matters:**
- Calendar aggregates data from multiple features (Tasks, Habits, Events)
- Complex UI with month/week/day views
- Critical for time management and scheduling

---

## Critical Files to Modify

### Primary Files (Must Update)
1. `src/pages/Calendar.tsx` - Main page (verify layout)
2. `src/calendar/components/v2/MonthViewV2.tsx` - Event dot sizing
3. `src/calendar/components/v2/DayViewV2.tsx` - Verify design spec match
4. `src/calendar/components/v2/CalendarHeaderV2.tsx` - Minor refinements (if needed)
5. `src/calendar/components/v2/EventCardV2.tsx` - Verify styling

### Files to Verify/Delete (After checking usage)
1. `src/calendar/components/layout/*` - Old layout components
2. `src/stores/slices/calendarSlice.ts` - Zustand slice (check if used)

### Reference Files (Do NOT Modify)
- `calendar-design-spec.html` - Design specification
- `CLAUDE.md` - UI/UX standards

---

## Implementation Plan

### Phase 1: Verify and Update Page Layout

**File:** `src/pages/Calendar.tsx`

**Check:** Is it using the standard centered 900px pattern?

**Current:**
```typescript
<div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
  {/* No max-width container */}
</div>
```

**Expected (if needed):**
```typescript
<div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
  <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '5rem' }}>
    {/* All content */}
  </div>
</div>
```

**Note:** Calendar might intentionally use full width for better grid visibility. Verify against design spec before changing.

---

### Phase 2: Fix Event Dot Sizing in MonthViewV2

**File:** `src/calendar/components/v2/MonthViewV2.tsx`

**Current Issue:** Event dots are 1px (`w-1 h-1`), design spec shows 4px

**Changes:**
```typescript
// ❌ BEFORE
<div
  className="w-1 h-1 rounded-full"
  style={{ backgroundColor: '#A855F7' }}
/>

// ✅ AFTER - Match design spec (4px dots)
<div
  className="w-1 h-1 rounded-full"
  style={{ backgroundColor: '#D4A574', width: '4px', height: '4px' }}
/>
```

**Color mapping per design spec:**
- Events: `#D4A574` (Terracotta)
- Tasks: `#3B82F6` (Blue) ✅ Already correct
- Habits: `#10B981` (Green)

---

### Phase 3: Verify DayViewV2 Matches Design Spec

**File:** `src/calendar/components/v2/DayViewV2.tsx`

**Check against design spec:**
- Hour rows (6 AM - 5 PM minimum, extendable to 24 hours)
- Hour label on left (60px wide)
- Event blocks with proper colors:
  - Indigo (`#E0E7FF` bg, `#4F46E5` border): Calendar events
  - Blue (`#DBEAFE` bg, `#3B82F6` border): Tasks
  - Green (`#D1FAE5` bg, `#10B981` border): Habits
  - Red (`#FEE2E2` bg, `#DC2626` border): Time blocks

**Expected structure:**
```typescript
<div className="hour-row">
  <div className="hour-label">9 AM</div>
  <div className="hour-content">
    <div
      className="calendar-event"
      style={{
        backgroundColor: '#E0E7FF',
        borderLeft: '3px solid #4F46E5',
        padding: '4px',
        margin: '2px',
        borderRadius: '4px',
      }}
    >
      <div className="event-time">9:00 - 10:00 AM</div>
      <div className="event-title">Team Standup</div>
    </div>
  </div>
</div>
```

---

### Phase 4: Verify React Query vs Zustand

**Files to check:**
- `src/calendar/hooks/useCalendarEvents.ts`
- `src/calendar/hooks/useCalendarTasks.ts`
- `src/stores/slices/calendarSlice.ts`

**Check:**
1. Are calendar events fetched via React Query?
2. Is `calendarSlice.ts` still used?
3. If using Zustand, plan migration to React Query

**If migration needed:**
Create `src/calendar/hooks/useCalendarQuery.ts`:
```typescript
export function useCalendarEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: queryKeys.calendar.events(filters),
    queryFn: () => fetchCalendarEvents(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCalendarEventsByDate(date: Date) {
  const dateKey = format(date, 'yyyy-MM-dd');
  return useQuery({
    queryKey: queryKeys.calendar.eventsByDate(dateKey),
    queryFn: () => fetchEventsByDate(dateKey),
  });
}
```

---

### Phase 5: Code Quality Improvements

**5.1: Error Boundary**
- Check App.tsx route for FeatureErrorBoundary
- Should be: `<RouteErrorBoundary feature="Calendar"><Calendar /></RouteErrorBoundary>`

**5.2: Remove Dead Code**
- Check if `src/calendar/components/layout/*` components are used
- Check if `calendarSlice.ts` is still referenced
- Delete if replaced by V2 components

**5.3: Clean Up Imports**
```bash
npm run lint -- --fix src/calendar/
```

**5.4: Verify Theme Colors**
- All components should use `useThemeColors()`
- Replace hardcoded colors where possible

**5.5: Event Rendering Performance**
- Month view: Limit event dots displayed (currently shows max 3)
- Day view: Virtual scrolling if many events

---

### Phase 6: Verification & Testing

**Visual Comparison:**
- Month view matches `calendar-design-spec.html` exactly
- Day view matches design spec exactly
- Event dots are 4px (not 1px)
- Colors match spec

**Functionality Testing:**
- Switch between Month/Week/Day views ✓
- Navigate prev/next month/week/day ✓
- "Today" button works ✓
- Click day in month view → opens day view ✓
- Click event → shows event details ✓
- Drag task to calendar → updates date ✓

**Responsive Testing:**
- Mobile: Calendar grid readable
- Desktop: Centered layout (if applied)

---

## Success Criteria

✅ Calendar matches `calendar-design-spec.html` exactly
✅ Event dots are 4px (design spec compliance)
✅ Day view hour rows and event blocks match design
✅ Uses React Query for data fetching (not Zustand)
✅ Has FeatureErrorBoundary
✅ Standard layout pattern applied (if appropriate)
✅ Code quality improvements applied
✅ No console errors or warnings

---

## Files Summary

### Files to Update (3-5)
- `src/pages/Calendar.tsx` - Layout verification
- `src/calendar/components/v2/MonthViewV2.tsx` - Event dot sizing
- `src/calendar/components/v2/DayViewV2.tsx` - Design spec compliance
- `src/calendar/hooks/*` - React Query migration (if needed)

### Files to Delete (TBD based on verification)
- `src/calendar/components/layout/*` - If replaced by V2
- `src/stores/slices/calendarSlice.ts` - If replaced by React Query

---

## Commit Message Template

```
feat: Refine Calendar feature and ensure design spec compliance

Polish Calendar feature to fully align with CLAUDE.md standards:
- Fix event dot sizing (4px per design spec, was 1px)
- Verify DayViewV2 matches design spec (hour rows, event blocks)
- Migrate to React Query (if using Zustand)
- Standard layout pattern (if applicable)
- Code quality improvements (remove dead code, clean imports)

Changes:
- MonthViewV2: Event dots now 4px (terracotta, blue, green)
- DayViewV2: Event blocks with correct colors and borders
- React Query hooks for calendar events (if migrated)
- Error boundary verified in App.tsx route

Features maintained:
- Month/Week/Day/Agenda views
- Date navigation (prev/next, today)
- Event dots on month view
- Task integration
- Drag-and-drop support
- Terracotta theme

Technical:
- React Query for server state (if migrated)
- date-fns for date manipulation
- FeatureErrorBoundary for crash isolation
- useThemeColors() for consistent theming

Files: 3-5 updated, TBD deleted

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Estimated Complexity

**Low-Medium** - Calendar is already well-implemented:
- Main changes are minor refinements (event dot sizing)
- Design spec compliance checks
- Possible Zustand → React Query migration
- Code quality improvements

**Risk Level:** Low
- Existing functionality is solid
- Changes are mostly cosmetic
- Clear design spec to follow

---

## Implementation Notes

### Key Advantages

1. **Already 95% Complete:**
   - V2 components match design spec closely
   - Terracotta theme applied
   - Multiple views implemented
   - Task integration works

2. **Minor Refinements Only:**
   - Event dot sizing (4px vs 1px)
   - Color verification
   - Layout pattern check

3. **Well-Structured:**
   - Clear separation: hooks, components, utils
   - V2 components already exist
   - Good use of date-fns

### Calendar-Specific Considerations

1. **Data Aggregation:**
   - Shows tasks with due dates
   - Shows habits with schedules (if applicable)
   - Shows calendar events
   - Shows time blocks

2. **Performance:**
   - Month view: 35-42 day cells
   - Day view: 24 hour rows
   - Efficient event filtering needed

3. **Drag and Drop:**
   - Tasks can be dragged to calendar
   - Updates task due date
   - Visual feedback during drag

4. **View Persistence:**
   - Remember last selected view
   - Remember current date when navigating away

---

## Conclusion

This plan provides a focused roadmap for **polishing** the Calendar feature. The implementation is already excellent - this plan ensures:

1. **Design Compliance:** Event dots sized correctly (4px)
2. **Standards Alignment:** React Query, error boundary, layout pattern
3. **Code Quality:** Remove dead code, clean imports, consistent theming
4. **Performance:** Efficient event rendering and filtering

The Calendar feature will remain a powerful scheduling tool that aggregates data from multiple features while maintaining performance and visual consistency.
