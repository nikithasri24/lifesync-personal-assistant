# Merged Mode Automation Guide

**Date:** 2026-02-04
**Status:** Ready to use

---

## Your New Superpowers 🚀

You now have **3 powerful skills** to accelerate merged mode implementation:

### 1. `/audit-merged-mode` ✅ Already Used
- **What it does:** Analyzes all features and generates comprehensive audit report
- **Time:** 2-3 minutes
- **Output:** Detailed status report with priorities
- **When to use:** Start of project, quarterly reviews, before planning sprints

### 2. `/add-merged-mode [feature]` ⚡ NEW
- **What it does:** Step-by-step guide to add merged mode to existing feature
- **Time saved:** 3 hours → 15-30 minutes
- **Output:** Detailed instructions with code examples
- **When to use:** When you want to implement merged mode yourself with guidance

### 3. `/complete-feature-merged [feature]` 🤖 NEW
- **What it does:** FULLY AUTOMATED implementation from analysis to testing
- **Time saved:** 3-4 hours → 5-10 minutes
- **Output:** Complete implementation + summary report
- **When to use:** When you want maximum automation and speed

---

## Quick Start: Implement All Priority 1 Features in 1 Day

### Original Timeline (Manual): ~10 hours
1. Tasks: 3 hours
2. Projects: 3-4 hours
3. Calendar: 2-3 hours

### New Timeline (Automated): ~30 minutes
1. Tasks: 10 minutes
2. Projects: 10 minutes
3. Calendar: 10 minutes

---

## Recommended Workflow

### Option A: Fully Automated (Fastest)

```bash
# Morning: Run all 3 features
/complete-feature-merged tasks
# Review changes, test, commit

/complete-feature-merged projects
# Review changes, test, commit

/complete-feature-merged calendar
# Review changes, test, commit

# Afternoon: Polish and deploy
# Total time: ~1 hour including testing
```

### Option B: Guided Implementation (More Control)

```bash
# For each feature:
/add-merged-mode tasks
# Follow the step-by-step instructions
# Implement each phase manually
# More learning, more control

# Repeat for projects, calendar, etc.
# Total time: ~3-4 hours (still 6 hours saved!)
```

### Option C: Hybrid Approach (Recommended)

```bash
# Use automation for simple features:
/complete-feature-merged tasks
/complete-feature-merged calendar
/complete-feature-merged habits

# Use guided approach for complex features:
/add-merged-mode projects  # Has milestones, more complex
# Implement manually with full understanding

# Total time: ~2-3 hours
```

---

## Your Priority 1 Implementation Plan

Based on the audit report, here's your optimized plan:

### Week 1 - Day 1: Tasks (Most Important)

**Why first:** Essential for daily shared to-do lists

**Execute:**
```bash
/complete-feature-merged tasks
```

**Expected changes:**
- `src/api/tasksAPI.ts` - Add merged connection
- `supabase/migrations/[timestamp]_add_tasks_merged_mode.sql` - RLS policies
- `src/hooks/useTasksQuery.ts` - Merged connection hook (create if missing)
- `src/components/tasks/TaskCard.tsx` - Add OwnerBadge (find and update)
- `src/pages/Todos.tsx` - Add OwnerFilter

**Test checklist:**
- [ ] Personal mode works (no connection)
- [ ] Merged mode shows both users' tasks
- [ ] Owner badges appear (Me = blue, Partner = purple)
- [ ] Owner filter works (All/Mine/Partner)
- [ ] Can create tasks (owned by me)
- [ ] Cannot edit partner's tasks

**Commit:**
```bash
git add .
git commit -m "feat: Add merged mode support for tasks

- Add merged connection logic to tasksAPI
- Create RLS policies for merged access
- Add useMergedTasksConnectionQuery hook
- Update UI with OwnerBadge and OwnerFilter
- Add owner filtering on Todos page

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Week 1 - Day 2: Projects

**Why second:** High collaboration value for couples

**Execute:**
```bash
/complete-feature-merged projects
```

**Expected changes:**
- `src/api/projectsAPI.ts` - Add merged connection
- `supabase/migrations/[timestamp]_add_projects_merged_mode.sql` - RLS policies
- `src/hooks/useProjectsQuery.ts` - Merged connection hook
- Components in `src/components/projects/` or similar - Add OwnerBadge
- `src/pages/ProjectTracking.tsx` - Add OwnerFilter

**Special considerations:**
- Projects have milestones (sub-items)
- May need to add OwnerBadge to milestone cards too
- Consider shared projects (optional: add `connection_id` field)

**Test checklist:**
- [ ] Personal projects visible
- [ ] Partner's projects visible in merged mode
- [ ] Milestones show correct ownership
- [ ] Owner filter works
- [ ] Can create projects (owned by me)

---

### Week 1 - Day 3: Calendar

**Why third:** Essential for schedule coordination

**Execute:**
```bash
/complete-feature-merged calendar
```

**Expected changes:**
- `src/api/calendarAPI.ts` - Add merged connection
- `supabase/migrations/[timestamp]_add_calendar_merged_mode.sql` - RLS policies
- `src/hooks/useCalendarQuery.ts` - Merged connection hook (if exists)
- Calendar components - Color-code events by owner
- `src/pages/Calendar.tsx` - Add owner toggle/filter

**Special considerations:**
- Calendar events should be color-coded (blue=me, purple=partner)
- Consider adding toggle to show/hide partner's calendar
- Might want shared events (optional: `connection_id` field)

**Test checklist:**
- [ ] Personal events visible
- [ ] Partner's events visible in merged mode
- [ ] Events color-coded correctly
- [ ] Can filter by owner
- [ ] Can create events (owned by me)

---

### Week 1 - Day 4-5: Bonus Features (If Time Permits)

**Execute:**
```bash
/complete-feature-merged habits
/complete-feature-merged notes

# Polish existing partial implementations
/add-merged-mode travel  # Just UI needed
```

---

## Feature Module Reference

Use this when running the skills:

| Feature Name | Command | Module | Table |
|-------------|---------|--------|-------|
| Tasks | `/complete-feature-merged tasks` | todos | tasks |
| Projects | `/complete-feature-merged projects` | projects | projects |
| Calendar | `/complete-feature-merged calendar` | calendar | calendar_events |
| Habits | `/complete-feature-merged habits` | habits | habits |
| Notes | `/complete-feature-merged notes` | notes | notes |
| Journal | `/complete-feature-merged journal` | journal | journal_entries |
| Focus | `/complete-feature-merged focus` | focus | focus_sessions |
| Nutrition | `/complete-feature-merged nutrition` | nutrition | food_log |
| Skincare | `/complete-feature-merged skincare` | skincare | skincare_products |

---

## Testing Strategy

After each implementation, test these scenarios:

### Scenario 1: Personal Mode (No Connection)
- [ ] Only see your data
- [ ] No owner badges visible
- [ ] No owner filter visible
- [ ] Can perform all CRUD operations

### Scenario 2: Connected but Not Merged
- [ ] Only see your data
- [ ] No owner badges visible
- [ ] No owner filter visible

### Scenario 3: Merged Mode Enabled
- [ ] See both users' data
- [ ] Owner badges visible and correct (Me=blue, Partner=purple)
- [ ] Owner filter visible and functional (All/Mine/Partner)
- [ ] Filtering works correctly
- [ ] Can create items (owned by me)
- [ ] Cannot edit partner's items
- [ ] Cannot delete partner's items

### Scenario 4: Mobile Testing
- [ ] Owner badges display correctly on mobile
- [ ] Owner filter accessible on mobile
- [ ] Layout doesn't break

---

## Troubleshooting

### Issue: "getMergedConnectionId is not defined"
**Fix:** Check import in API file:
```typescript
import { getMergedConnectionId, type MergedConnectionResult } from '../shared/api/SharedDataProvider';
```

### Issue: "Still only seeing my data in merged mode"
**Fixes:**
1. Check RLS policies are applied in Supabase
2. Verify both users have set module to 'merged' in module_permissions
3. Check connection is 'active' in profile_connections
4. Check API is using `.or()` query instead of `.eq('user_id', user.id)`

### Issue: "Owner badges not appearing"
**Fixes:**
1. Check `mergedConnection` is not null
2. Check `currentUserId` is defined
3. Verify component is rendering conditionally: `{mergedConnection && ...}`
4. Check imports are correct

### Issue: "Migration failed"
**Fixes:**
1. Check table name is correct
2. Verify existing policies don't conflict
3. Check module name matches ShareableModule type
4. Run migration manually in Supabase SQL editor

### Issue: "TypeScript errors"
**Fixes:**
1. Run `npm run type-check` to see all errors
2. Check imports are correct
3. Verify types are defined in `src/services/types.ts`
4. Add types if missing

---

## Performance Optimization

After implementing merged mode for all features:

1. **Unified OwnerBadge Component**
   - Currently: Finance and Shopping have separate OwnerBadge components
   - TODO: Create single shared component at `src/components/common/OwnerBadge.tsx`
   - Use everywhere for consistency

2. **Unified Owner Utilities**
   - Currently: Different utils in finance and shopping folders
   - TODO: Create `src/utils/ownerUtils.ts` with shared hooks
   - Import in all features

3. **Centralized Cache Management**
   - Currently: Each feature caches its own merged connection
   - Consider: Centralize in SharedDataProvider or React Query

4. **Bundle Size**
   - Monitor bundle size after adding merged mode to all features
   - Ensure lazy loading is working
   - Check that owner utilities are tree-shakeable

---

## Next Steps After Priority 1 Complete

### Week 2: Priority 2 Features
- Habits (2-3 hours → 10 min with automation)
- Travel/Visa UI Polish (2 hours → 10 min)
- Notes (2 hours → 10 min)
- Meals UI Polish (1 hour → 5 min)

### Week 3-4: Priority 3 Features (Optional)
- Journal (with privacy controls)
- Focus
- National Parks
- Nutrition
- Skincare

### Cleanup & Polish
- Unify OwnerBadge components
- Unify owner utilities
- Create shared UI patterns
- Update documentation
- Write tests
- Performance optimization

### Future Enhancements
- Shared items (with `connection_id` field)
- Collaboration mode (edit partner's data)
- Activity feed (see what partner added/changed)
- Notifications (partner completed a task, etc.)
- Analytics (contribution metrics, charts)

---

## Success Metrics

Track your progress:

- [x] Audit complete (✅ Done - MERGED_MODE_AUDIT_REPORT_2026-02-04.md)
- [ ] Tasks merged mode complete
- [ ] Projects merged mode complete
- [ ] Calendar merged mode complete
- [ ] Habits merged mode complete
- [ ] Notes merged mode complete
- [ ] Travel/Visa UI polished
- [ ] Meals UI polished
- [ ] All Priority 1 features deployed
- [ ] All Priority 2 features deployed
- [ ] User testing complete
- [ ] Documentation updated

**Target:** Priority 1 complete in Week 1 (3 features in 1 day with automation)

---

## Resources

- **Audit Report:** `MERGED_MODE_AUDIT_REPORT_2026-02-04.md` - Full status analysis
- **Skills:**
  - `.claude/commands/audit-merged-mode.md`
  - `.claude/commands/add-merged-mode.md`
  - `.claude/commands/complete-feature-merged.md`
- **Reference Implementation:**
  - Finance: `src/finance/` (best example)
  - Shopping: `src/shopping/` (good example)
  - Meals: `src/api/mealPlanningAPI.ts` (API example)
- **Infrastructure:**
  - `src/shared/api/SharedDataProvider.ts` - Core merged mode logic
  - Finance OwnerBadge: `src/finance/components/OwnerBadge.tsx`
  - Shopping OwnerBadge: `src/shopping/components/common/OwnerBadge.tsx`

---

## Tips for Success

1. **Start with Tasks** - Simplest feature, good learning experience
2. **Review before committing** - Automation is fast but review changes
3. **Test thoroughly** - Both merged and non-merged states
4. **One feature at a time** - Don't rush, ensure quality
5. **Git commits** - Commit after each feature for easy rollback
6. **Mobile testing** - Don't forget to test on mobile
7. **RLS verification** - Manually test RLS policies in Supabase
8. **User feedback** - Have your partner test with you

---

## Celebrate! 🎉

When you complete Priority 1 (Tasks, Projects, Calendar):
- You'll have saved ~9 hours of implementation time
- The most collaborative features will be fully functional
- You and your partner can start using merged mode daily
- You'll have a proven automation workflow for remaining features

**From 10 hours of work → 1 hour with automation!**

---

**Ready to start?**

Run this command to begin:
```
/complete-feature-merged tasks
```

Good luck! 🚀
