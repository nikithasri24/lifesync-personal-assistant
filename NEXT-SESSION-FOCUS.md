# 🎯 Next Testing Session - Focus Module
## Quick 15-Minute Test
## LifeSync Personal Assistant

**Module**: Focus (Pomodoro Timer)
**Time Required**: 15 minutes
**Complexity**: MEDIUM
**Priority**: P1 - Next to test after Shopping verification

---

## 📋 Pre-Session Checklist

Before starting, ensure:
- [ ] Dev server is running (`npm run dev`)
- [ ] Shopping fixes verified (or documented)
- [ ] Browser DevTools open (F12 → Console)
- [ ] Ready to take 5 screenshots
- [ ] 15 minutes available

---

## 🚀 Focus Module Test Plan

### Module Overview

**Purpose**: Pomodoro timer for productivity
**Location**: `/focus`
**Features**:
- 4 timer presets (Pomodoro, Short Break, Deep Work, Long Break)
- Start/Pause/Reset controls
- Circular timer display
- Session tracking

**Expected Behavior**:
- Timer counts down smoothly
- Presets change timer duration
- Sessions save to database
- Clean, minimal UI

---

## ✅ Testing Checklist (15 Minutes)

### Part 1: Page Load & UI (3 minutes)

**Steps**:
1. Navigate to: `http://localhost:5173/focus`
2. Wait for page to load

**Verify** - Visual Elements:
- [ ] Page loads without errors
- [ ] Terracotta gradient header visible
- [ ] ⏱️ emoji in header
- [ ] "Focus" title visible
- [ ] 4 preset cards visible and labeled:
  - [ ] 🍅 Pomodoro (25 min)
  - [ ] ☕ Short Break (5 min)
  - [ ] 🎯 Deep Work (90 min)
  - [ ] 🌙 Long Break (15 min)
- [ ] Circular timer visible in center
- [ ] Timer shows default: 25:00
- [ ] Subtitle shows: "Ready to focus"

**Screenshot #1**: Full page view (all presets + timer)

**Check Console**:
- [ ] No red errors
- [ ] No warnings

---

### Part 2: Timer Presets (3 minutes)

Test each preset changes the timer:

**Pomodoro Preset**:
- [ ] Click "Pomodoro" card
- [ ] Timer shows: 25:00
- [ ] Card highlights/becomes active
- [ ] No errors in console

**Short Break Preset**:
- [ ] Click "Short Break" card
- [ ] Timer shows: 5:00
- [ ] Card highlights/becomes active
- [ ] No errors in console

**Deep Work Preset**:
- [ ] Click "Deep Work" card
- [ ] Timer shows: 1:30:00 (90 minutes)
- [ ] Card highlights/becomes active
- [ ] No errors in console

**Screenshot #2**: Deep Work preset selected (shows 1:30:00)

**Long Break Preset**:
- [ ] Click "Long Break" card
- [ ] Timer shows: 15:00
- [ ] Card highlights/becomes active
- [ ] No errors in console

**Verify**:
- [ ] All 4 presets change timer correctly
- [ ] Only one preset active at a time
- [ ] Smooth transitions between presets

---

### Part 3: Timer Controls (5 minutes)

**Start Timer** (Pomodoro - 25:00):
1. [ ] Select Pomodoro preset (25:00)
2. [ ] Click Play ▶️ button
3. [ ] Timer starts counting down
4. [ ] Subtitle changes to: "Stay focused" or similar
5. [ ] Play button changes to Pause ⏸️
6. [ ] Timer decrements: 25:00 → 24:59 → 24:58...
7. [ ] No lag or freezing
8. [ ] No console errors

**Screenshot #3**: Active timer running (24:5X)

**Pause Timer**:
9. [ ] Click Pause ⏸️ button
10. [ ] Timer stops counting
11. [ ] Subtitle changes to: "Paused" or similar
12. [ ] Pause button changes back to Play ▶️
13. [ ] Timer value stays frozen
14. [ ] No console errors

**Screenshot #4**: Paused state

**Resume Timer**:
15. [ ] Click Play ▶️ button again
16. [ ] Timer resumes from paused time
17. [ ] Continues counting down
18. [ ] No console errors

**Reset Timer**:
19. [ ] Click Reset 🔄 button (or stop button)
20. [ ] Timer returns to preset value (25:00)
21. [ ] Subtitle returns to: "Ready to focus"
22. [ ] Play button visible
23. [ ] No console errors

---

### Part 4: Timer Completion (2 minutes - Optional)

**Quick Completion Test**:

*Note: Instead of waiting 25 minutes, we'll test with Short Break (5 min) or manually set a 1-second timer if possible.*

**Option A - Quick Test (if configurable)**:
1. [ ] If you can set custom time, set to 5 seconds
2. [ ] Start timer
3. [ ] Wait for completion
4. [ ] Verify: Completion sound/notification (if implemented)
5. [ ] Verify: Timer resets or shows 00:00
6. [ ] Verify: Session saved to database (check network tab)

**Option B - Skip for now**:
- [ ] Mark as "Tested partially - completion not verified"
- [ ] Document: "Timer completion test skipped (would take 5+ minutes)"

---

### Part 5: Edge Cases (2 minutes)

**Rapid Switching**:
1. [ ] Click Pomodoro → Short Break → Deep Work → Long Break rapidly
2. [ ] Verify: Timer updates correctly each time
3. [ ] Verify: No crashes or freezing
4. [ ] Verify: No console errors

**Start/Pause Multiple Times**:
1. [ ] Select any preset
2. [ ] Click Play → Pause → Play → Pause → Play (5 times)
3. [ ] Verify: Timer responds correctly each time
4. [ ] Verify: No lag or errors

**Page Refresh**:
1. [ ] Start a timer (any preset)
2. [ ] Let it run for a few seconds
3. [ ] Refresh page (Cmd+R / Ctrl+R)
4. [ ] Verify: Page reloads cleanly
5. [ ] Verify: Timer resets (or persists if that's the design)
6. [ ] No console errors

**Screenshot #5**: Edge case test or final state

---

## 📸 Screenshot Checklist

Capture these 5 screenshots:

1. ✅ Full page view (all presets + timer at 25:00)
2. ✅ Deep Work preset selected (timer shows 1:30:00)
3. ✅ Active timer running (shows 24:5X)
4. ✅ Paused state (timer frozen)
5. ✅ Edge case or final state

**Save to**: `qa-screenshots/`
**Naming**: `focus-01-overview.png`, `focus-02-deepwork.png`, etc.

---

## ✅ Success Criteria

**All tests pass if**:
- ✅ Page loads without errors
- ✅ All 4 presets visible and functional
- ✅ Timer changes correctly for each preset
- ✅ Play/Pause/Reset controls work
- ✅ Timer counts down smoothly
- ✅ No console errors
- ✅ No crashes or freezing
- ✅ Responsive to user interactions

---

## 🐛 Known Issues / Expected Behaviors

**Not Bugs** (Expected):
- Timer completion may not have sound (feature may not be implemented)
- Session tracking may be basic or not visible in UI
- Timer may reset on page refresh (by design)

**Potential Issues to Watch For**:
- Timer skipping seconds
- Timer freezing
- Presets not changing timer
- Controls not responding
- Console errors

---

## 📝 Test Results Template

**Copy this to document your results**:

```markdown
# Focus Module Test Results
Date: [Fill in]
Time Spent: ___ minutes

## Page Load
Status: [ ] PASS [ ] FAIL
Notes:

## Timer Presets
Status: [ ] PASS [ ] FAIL
- Pomodoro (25:00): [ ] Works
- Short Break (5:00): [ ] Works
- Deep Work (90:00): [ ] Works
- Long Break (15:00): [ ] Works
Notes:

## Timer Controls
Status: [ ] PASS [ ] FAIL
- Start: [ ] Works
- Pause: [ ] Works
- Resume: [ ] Works
- Reset: [ ] Works
Notes:

## Edge Cases
Status: [ ] PASS [ ] FAIL
Notes:

## Console Errors
Any errors: [ ] Yes [ ] No
Details:

## Screenshots
Captured: ___/5
Saved to: qa-screenshots/

## Overall Result
[ ] ✅ PASS - Focus module works correctly
[ ] 🟡 PARTIAL - Minor issues found
[ ] ❌ FAIL - Critical issues found

## Issues Found
1. [Issue description]
2. [Issue description]

## Next Steps
[ ] Continue to Shared module
[ ] Fix issues found
[ ] Document in QA report
```

---

## ⏭️ After Completion

### If All Tests Pass ✅

**Great job!** Focus module is verified.

**Next steps**:
1. Mark Focus as complete in `QA-CHECKLIST.md`
2. Update progress in `qa-progress-tracker.html` (mentally note 47% → 53%)
3. Take a 5-minute break
4. Continue to next module: **Shared** (20 minutes)

**Progress Update**:
- Modules tested: 8/17 (47% → 53%)
- Time spent: 15 minutes
- Remaining: 4 untested modules (95 minutes)

### If Issues Found ❌

**Document issues**:
1. Note exact error messages
2. Capture screenshots
3. Check console for details
4. Try to reproduce

**Categorize severity**:
- P0 (Critical): Module completely broken
- P1 (High): Major feature not working
- P2 (Medium): Minor feature issue
- P3 (Low): Cosmetic issue

**Then**:
- Continue to next module (don't get blocked)
- Document all issues for later review
- Share findings after testing session

---

## 💡 Pro Tips

**Time Management**:
- Set a 15-minute timer
- Stick to the checklist
- Don't over-test edge cases
- Document quickly, test thoroughly

**Testing Efficiency**:
- Keep DevTools open
- Take screenshots as you go
- Mark checklist items immediately
- Note issues but keep moving

**What to Focus On**:
- Does it work? (functionality)
- Does it break? (errors)
- Is it usable? (UX)
- Does it crash? (stability)

**What to Skip**:
- Pixel-perfect design review
- Performance optimization
- Code quality analysis
- Minor styling issues

---

## 🎯 Quick Reference

**URL**: `http://localhost:5173/focus`

**Expected Presets**:
- Pomodoro: 25 minutes
- Short Break: 5 minutes
- Deep Work: 90 minutes (1:30:00)
- Long Break: 15 minutes

**Key Interactions**:
- Click preset → Timer changes
- Click Play → Timer starts
- Click Pause → Timer stops
- Click Reset → Timer returns to preset

**Success Indicators**:
- Smooth countdown
- Responsive controls
- No console errors
- All presets functional

---

## 📚 Detailed Reference

For more detailed test cases, see:
- `QA-COMPLETE-CODE-REVIEW.md` (lines 315-415)
- `MANUAL-TESTING-GUIDE.md` (Focus section)

---

**Created**: February 24, 2026
**Module**: Focus (Pomodoro Timer)
**Estimated Time**: 15 minutes
**Complexity**: Medium
**Priority**: Next after Shopping verification

🎯 **Ready to test Focus module? Let's go!**
