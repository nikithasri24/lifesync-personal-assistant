# 🔧 Bug Fix Plan - Automated Test Failures
## LifeSync Personal Assistant
## Systematic Bug Resolution

**Total Failures**: 97 tests
**Goal**: Fix all automated test failures
**Strategy**: Prioritize by impact and ease of fix

---

## 📊 Failure Analysis

### By Category

| Category | Count | Avg Time | Type |
|----------|-------|----------|------|
| **Drag & Drop** | 8 | 30s | ⏱️ Timeout |
| **Finance Merged Mode** | 9 | 30s | ⏱️ Timeout |
| **Habits** | 10 | 20s | ⏱️ Timeout/Selector |
| **Offline/Sync** | 7 | 5s | ❌ Feature Missing |
| **Dashboard UI** | 13 | 10s | ❌ Selector Issues |
| **Tasks CRUD** | 8 | 30s | ⏱️ Timeout |
| **Notes/Journal** | 3 | 30s | ⏱️ Timeout |
| **Retirement** | 7 | 30s | ⏱️ Timeout |
| **Calendar** | 3 | 10s | ❌ Display Issues |
| **Authentication** | 3 | 10s | ❌ Edge Cases |
| **Focus** | 1 | 10s | ❌ Selector |
| **Todos** | 3 | 2s | ❌ Selector |
| **App General** | 5 | 8s | ❌ Various |
| **Visual/A11y** | 6 | 10s | ⚠️ Test Config |
| **Other** | 10 | 15s | ❌ Various |

### By Failure Pattern

**Timeouts (30s) - 51 tests**: Element selectors not finding elements
**Quick Fails (<5s) - 20 tests**: Assertion failures, missing features
**Medium Fails (5-15s) - 26 tests**: Selector issues, timing issues

---

## 🎯 Fix Priority Strategy

### Priority 1: Quick Wins (High Impact, Easy Fix)
**Target**: 20 tests, ~2-3 hours

1. **Todos Page Display** (3 tests, ~5 min)
   - Simple selector issues
   - Should display tasks page
   - Should filter tasks
   - Should delete a task

2. **Focus Timer Mode Options** (1 test, ~10 min)
   - Timer mode selector issue
   - Low complexity

3. **Calendar Display** (3 tests, ~30 min)
   - Page display issues
   - View options selector
   - Date indicator

4. **App General Issues** (5 tests, ~1 hour)
   - Console errors
   - Accessibility landmarks
   - Responsive design
   - Network error handling

### Priority 2: Dashboard & Quick Actions (High Impact, Medium Effort)
**Target**: 13 tests, ~3-4 hours

1. **Dashboard UI Elements** (5 tests, ~2 hours)
   - Main navigation display
   - Stats cards
   - Section navigation
   - Sidebar collapse

2. **Quick Actions** (8 tests, ~2 hours)
   - Add Task modal (backdrop, validation, draft save)
   - New Note modal
   - Journal navigation
   - Integration tests

### Priority 3: Habits Module (High Impact, Complex)
**Target**: 10 tests, ~4-5 hours

- FAB button functionality
- Mark complete
- Edit modal
- Progress tracking
- Category/frequency display
- Add habit flow
- Multi-target habits
- Custom frequency

### Priority 4: CRUD Operations (Medium Impact, Timeouts)
**Target**: 11 tests, ~3-4 hours

- Create task/note/journal
- Delete operations
- Tag operations
- Project filtering
- Search functionality
- Task renaming

### Priority 5: Drag & Drop (Low Priority, Complex)
**Target**: 8 tests, ~6-8 hours

- Drag to calendar
- Drag to project
- Drag to Today/Upcoming
- Drag to Waiting/Scheduled/Starred
- Persistence after reload
- Reorder tasks

### Priority 6: Finance Features (Low Priority, Complex)
**Target**: 16 tests, ~6-8 hours

**Merged Mode** (9 tests):
- Owner filter
- Add transaction for partner
- Filter by owner
- Shared goals
- Owner badges
- Split metrics

**Retirement** (7 tests):
- 401k accounts
- Roth IRA
- HSA
- Account configuration
- Dashboard display

### Priority 7: Offline/Sync (Low Priority, Feature Implementation)
**Target**: 7 tests, ~8-10 hours

- Offline mode
- Queue changes
- Cache data
- Sync status
- Service worker
- Network recovery

### Priority 8: Visual & Accessibility (Low Priority, Test Config)
**Target**: 6 tests, ~2-3 hours

- Visual regression (may need baseline images)
- Keyboard navigation
- Semantic HTML
- ARIA labels

---

## 🚀 Execution Plan

### Phase 1: Quick Wins (Day 1 - 3 hours)
**Fix 20 easy bugs, boost pass rate to ~86%**

**Morning (2 hours)**:
1. ✅ Todos page (3 tests) - 30 min
2. ✅ Focus timer (1 test) - 15 min
3. ✅ Calendar display (3 tests) - 45 min
4. ✅ App general (2 tests) - 30 min

**Afternoon (1 hour)**:
5. ✅ App general (3 tests) - 1 hour

**Expected**: 450 → 470 passing (86%)

### Phase 2: Dashboard & Quick Actions (Day 2 - 4 hours)
**Fix 13 dashboard bugs, boost pass rate to ~88%**

**Morning (2 hours)**:
1. ✅ Dashboard UI (5 tests) - 2 hours

**Afternoon (2 hours)**:
2. ✅ Quick Actions (8 tests) - 2 hours

**Expected**: 470 → 483 passing (88%)

### Phase 3: Habits Module (Day 3 - 5 hours)
**Fix 10 habits bugs, boost pass rate to ~90%**

**Full Day**:
1. ✅ Habits FAB & create (3 tests) - 2 hours
2. ✅ Habits complete & edit (2 tests) - 1 hour
3. ✅ Habits display & progress (5 tests) - 2 hours

**Expected**: 483 → 493 passing (90%)

### Phase 4: CRUD Operations (Day 4 - 4 hours)
**Fix 11 CRUD bugs, boost pass rate to ~92%**

**Morning (2 hours)**:
1. ✅ Create operations (4 tests) - 2 hours

**Afternoon (2 hours)**:
2. ✅ Delete/filter/search (7 tests) - 2 hours

**Expected**: 493 → 504 passing (92%)

### Phase 5: Advanced Features (Day 5+ - Optional)
**Fix remaining 43 bugs for 100% pass rate**

**If time permits**:
- Drag & Drop (8 tests) - Day 5-6
- Finance features (16 tests) - Day 7-8
- Offline/Sync (7 tests) - Day 9-10
- Visual/A11y (6 tests) - Day 11
- Other (6 tests) - Day 12

**Expected**: 504 → 548 passing (100%)

---

## 💡 Fix Strategy by Type

### Timeout Fixes (51 tests)

**Common Causes**:
1. Element selector changed/incorrect
2. Element not rendering
3. Waiting for element that never appears
4. Modal/page not loading

**Fix Approach**:
1. Run failing test individually
2. Check test screenshot/video in `test-results/`
3. Inspect actual DOM vs. expected selector
4. Update selector or fix rendering issue
5. Re-run test to verify

### Quick Fail Fixes (20 tests)

**Common Causes**:
1. Wrong selector
2. Missing element
3. Incorrect assertion

**Fix Approach**:
1. Read error message
2. Check actual vs. expected
3. Update selector/assertion
4. Re-run test

### Feature Missing Fixes (7 tests)

**Common Causes**:
1. Feature not implemented (offline mode)
2. Feature disabled
3. Feature gated behind flag

**Fix Approach**:
1. Implement feature OR
2. Skip test with `.skip()` until ready OR
3. Mark as known issue

---

## 🛠️ Tools & Commands

### Run Specific Test
```bash
npm run test:e2e -- <test-file>.spec.ts --project=chromium
```

### Run Single Test by Name
```bash
npm run test:e2e -- -g "should display tasks page" --project=chromium
```

### Debug Mode (Headed Browser)
```bash
npm run test:e2e:debug -- <test-file>.spec.ts
```

### Check Test Results
```bash
# View HTML report
npx playwright show-report

# View screenshot
open test-results/<test-name>/test-failed-1.png

# View video
open test-results/<test-name>/video.webm
```

### Re-run Failures Only
```bash
npm run test:e2e -- --only-failed --project=chromium
```

---

## 📋 Tracking Progress

### Daily Goals

| Day | Tests Fixed | Cumulative | Pass Rate | Time |
|-----|-------------|------------|-----------|------|
| **Baseline** | - | 450/548 | 82.3% | - |
| **Day 1** | 20 | 470/548 | 85.8% | 3h |
| **Day 2** | 13 | 483/548 | 88.1% | 4h |
| **Day 3** | 10 | 493/548 | 90.0% | 5h |
| **Day 4** | 11 | 504/548 | 92.0% | 4h |
| **Day 5+** | 44 | 548/548 | 100% | ~40h |

**Realistic Target**: 90% pass rate in 4 days (16 hours of work)
**Stretch Goal**: 100% pass rate in 2-3 weeks

---

## 🎯 Success Criteria

### Minimum Viable (90% pass rate)
- ✅ All quick wins fixed (Priority 1-2)
- ✅ Habits module working (Priority 3)
- ✅ Basic CRUD working (Priority 4)
- ⏭️ Drag & drop still broken (acceptable)
- ⏭️ Advanced features still broken (acceptable)

### Ideal (95% pass rate)
- ✅ Everything above
- ✅ Most CRUD operations working
- ✅ Finance core features working
- ⏭️ Drag & drop still broken (acceptable)
- ⏭️ Offline mode still broken (acceptable)

### Perfect (100% pass rate)
- ✅ Everything working
- ✅ All features implemented
- ✅ All tests passing
- ✅ Zero known bugs

---

## 🚦 Start Point

**Current Status**: 82.3% pass rate (450/548)
**Next Step**: Start Phase 1 - Quick Wins
**First Test**: Todos page display

**Ready to begin?**

Commands to run first failing test:
```bash
npm run test:e2e:debug -- todos.spec.ts
```

This will open a browser and show exactly what's failing.

---

**Created**: February 24, 2026
**Total Failures**: 97 tests
**Estimated Fix Time**: 16 hours (90%), 40+ hours (100%)
**Priority**: Phase 1 Quick Wins (20 tests, 3 hours)
