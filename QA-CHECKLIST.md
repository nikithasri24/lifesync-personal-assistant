# QA Testing Checklist
## LifeSync Personal Assistant
## Track Your Progress Here

**Instructions**: Mark items with `[x]` as you complete them.

---

## 🎯 Phase 1: Verify Bug Fixes (5 minutes)

**Priority**: P0 - DO THIS FIRST!

- [ ] **Shopping Manual Entry Fix**
  - [ ] Start dev server: `npm run dev`
  - [ ] Navigate to `/shopping`
  - [ ] Click FAB → "Manual Entry"
  - [ ] Modal opens without error ✓
  - [ ] Add test item: "Test - Manual Entry Fixed"
  - [ ] Item appears in shopping list ✓
  - [ ] No console errors ✓

- [ ] **Shopping Edit Item Fix**
  - [ ] Click any existing shopping item
  - [ ] Edit modal opens without error ✓
  - [ ] Change item name or quantity
  - [ ] Click "Save Changes"
  - [ ] Changes save successfully ✓
  - [ ] No console errors ✓

**When complete**: Push to production or continue testing ✅

---

## 🔍 Phase 2: Test Untested Modules (2 hours)

### Module 1: Focus (15 minutes)
- [ ] Navigate to `/focus`
- [ ] Page loads with terracotta header ✓
- [ ] 4 preset cards visible (Pomodoro, Short Break, Deep Work, Long Break) ✓
- [ ] Click Pomodoro → timer shows 25:00 ✓
- [ ] Click Short Break → timer shows 5:00 ✓
- [ ] Click Deep Work → timer shows 1:30:00 ✓
- [ ] Click Long Break → timer shows 15:00 ✓
- [ ] Click Play → timer starts counting down ✓
- [ ] Click Pause → timer stops ✓
- [ ] Click Reset → timer returns to preset ✓
- [ ] No console errors ✓
- [ ] **Screenshots captured**: 5/5

### Module 2: Shared (20 minutes)
- [ ] Navigate to `/shared`
- [ ] Page loads with 👥 header ✓
- [ ] Stats grid visible (4 stats) ✓
- [ ] 3 tabs visible (Partner, Invites, Activity) ✓
- [ ] Partner tab shows content or empty state ✓
- [ ] Click Invites tab → switches view ✓
- [ ] Click Activity tab → switches view ✓
- [ ] FAB button visible (if no connections) ✓
- [ ] Click FAB → Invite Partner modal opens ✓
- [ ] Modal has email input, message textarea, module checkboxes ✓
- [ ] Close modal → no errors ✓
- [ ] No console errors ✓
- [ ] **Screenshots captured**: 7/7

### Module 3: Travel (30 minutes)
- [ ] Navigate to `/travel`
- [ ] Page loads ✓
- [ ] Category tabs (Mine/Partner) visible ✓
- [ ] 5 location filter buttons visible ✓
- [ ] Stats bar shows 4 counts ✓
- [ ] 2x2 location cards grid visible ✓
- [ ] Map loads (OpenStreetMap) ✓
- [ ] Can zoom in/out on map ✓
- [ ] Can pan around map ✓
- [ ] Click a country on map (try USA) ✓
- [ ] Country changes color or shows marked ✓
- [ ] Click "Add Trip" button → modal opens ✓
- [ ] Fill trip form (Name, Dates, Status, Budget) ✓
- [ ] Click Save → trip appears in grid ✓
- [ ] 4 location list columns visible (scrollable) ✓
- [ ] No console errors ✓
- [ ] **Screenshots captured**: 7/7

### Module 4: Nutrition (30 minutes)
- [ ] Navigate to `/nutrition`
- [ ] Page loads with terracotta header ✓
- [ ] 🍽️ emoji visible ✓
- [ ] Date navigation (← Today →) ✓
- [ ] Calorie summary card visible ✓
- [ ] 3 macro progress bars (Protein/Carbs/Fat) ✓
- [ ] 4 meal sections (Breakfast, Lunch, Dinner, Snacks) ✓
- [ ] Click "Add breakfast" button → modal/interface opens ✓
- [ ] Test Photo Upload (may show "not implemented" - OK) ✓
- [ ] Test Food Search (search for "banana") ✓
- [ ] Test Manual Entry ✓
  - [ ] Fill: Banana, 100 calories, 1g protein, 25g carbs, 0g fat
  - [ ] Select: Breakfast
  - [ ] Click Save
  - [ ] Item appears in Breakfast section ✓
- [ ] Calorie summary updates ✓
- [ ] Macro bars update ✓
- [ ] No critical errors (AI features may not work - OK) ✓
- [ ] **Screenshots captured**: 7/7

### Module 5: Assistant (30 minutes)
- [ ] Navigate to `/assistant`
- [ ] Page loads with chat interface ✓
- [ ] Empty state visible or existing conversation ✓
- [ ] Input bar at bottom (fixed) ✓
- [ ] Type: "Hello, can you help me?" ✓
- [ ] Press Enter or click Send ✓
- [ ] User message appears (right-aligned) ✓
- [ ] Typing indicator appears ✓
- [ ] AI response appears after 2 seconds (simulated) ✓
- [ ] Response is left-aligned ✓
- [ ] Can send multiple messages ✓
- [ ] Click "New Chat" → new conversation starts ✓
- [ ] Auto-scroll to bottom works ✓
- [ ] No critical errors ✓
- [ ] Note: AI responses are simulated (expected) ✓
- [ ] **Screenshots captured**: 6/6

**Phase 2 Complete**: 100% browser coverage achieved! ✅

---

## 🔧 Phase 3: Complete Partial Modules (3.5 hours)

### Shopping - Complete Testing (15 minutes)
- [ ] Test Voice Input (may not work - document) ✓
- [ ] Test Barcode Scanner (may not work - document) ✓
- [ ] Test History tab ✓
- [ ] Edit existing item (already verified in Phase 1) ✓
- [ ] Delete item ✓
- [ ] **Screenshots captured**: 2/2

### Meals - Complete Testing (30 minutes)
- [ ] Navigate to `/meals`
- [ ] Click Week tab → week view loads ✓
- [ ] Click Recipes tab → recipes view loads ✓
- [ ] Click Grocery tab → grocery view loads ✓
- [ ] Click "Add breakfast" → modal opens ✓
- [ ] Test meal creation workflow ✓
- [ ] Verify meal appears after adding ✓
- [ ] **Screenshots captured**: 3/3

### Journal - Complete Testing (20 minutes)
- [ ] Navigate to `/journal`
- [ ] Click Calendar view → switches to calendar ✓
- [ ] Click "Create" or + button → modal opens ✓
- [ ] Fill entry ✓
  - [ ] Title: "Test Entry"
  - [ ] Content: "Testing journal entry creation"
- [ ] Click Save → entry appears in list ✓
- [ ] Click entry → edit modal opens ✓
- [ ] Test search box (type any text) ✓
- [ ] **Screenshots captured**: 2/2

### Self Care - Complete Testing (20 minutes)
- [ ] Navigate to `/self-care`
- [ ] Click Schedule tab → loads ✓
- [ ] Click Products tab → loads ✓
- [ ] Click Setup tab → loads ✓
- [ ] Click any routine cell → edit interface appears ✓
- [ ] Test editing routine (if possible) ✓
- [ ] **Screenshots captured**: 3/3

### Finance - Complete Testing (120 minutes)
- [ ] Navigate to `/finances`

**14 Tabs to Test** (10 min each):
1. [ ] Dashboard (already tested) ✅
2. [ ] Accounts ✓
3. [ ] Transactions ✓
4. [ ] Budgets ✓
5. [ ] Recurring ✓
6. [ ] Net Worth ✓
7. [ ] Goals ✓
8. [ ] Loans ✓
9. [ ] Retirement ✓
10. [ ] Projections ✓
11. [ ] Calculators ✓
12. [ ] Credit Cards ✓
13. [ ] Insurance ✓
14. [ ] Settings ✓

**For Each Tab**:
- Click tab → loads without error ✓
- Main content visible ✓
- At least one button/action works ✓
- Capture screenshot ✓

- [ ] **Screenshots captured**: 13/13

**Phase 3 Complete**: All modules 100% tested! ✅

---

## 📱 Phase 4: Final Validation (2 hours)

### Mobile Testing - iPhone (30 minutes)
- [ ] Open on iPhone Safari
- [ ] Test Dashboard ✓
- [ ] Test FAB positioning (bottom-right with safe areas) ✓
- [ ] Test modal behavior (slides from bottom) ✓
- [ ] Test Shopping Manual Entry ✓
- [ ] Test Shopping Edit Item ✓
- [ ] Test touch interactions (tap, swipe) ✓
- [ ] Test bottom navigation ✓
- [ ] Verify responsive layout ✓
- [ ] No critical mobile-specific issues ✓

### Mobile Testing - Android (30 minutes)
- [ ] Open on Android Chrome
- [ ] Test Dashboard ✓
- [ ] Test FAB positioning ✓
- [ ] Test modal behavior ✓
- [ ] Test Shopping Manual Entry ✓
- [ ] Test Shopping Edit Item ✓
- [ ] Test touch interactions ✓
- [ ] Test bottom navigation ✓
- [ ] Verify responsive layout ✓
- [ ] No critical mobile-specific issues ✓

### Cross-Browser Testing (30 minutes)
- [ ] **Chrome** (primary browser) ✅ Already tested
- [ ] **Safari** (macOS)
  - [ ] Open all modules
  - [ ] Test critical workflows
  - [ ] Verify no Safari-specific issues ✓
- [ ] **Firefox** (macOS)
  - [ ] Open all modules
  - [ ] Test critical workflows
  - [ ] Verify no Firefox-specific issues ✓

### Security Review (30 minutes)
- [ ] Verify RLS policies active ✓
- [ ] Test authentication flows ✓
  - [ ] Login works ✓
  - [ ] Logout works ✓
  - [ ] Session persistence ✓
- [ ] Test user permissions ✓
  - [ ] Can only see own data ✓
  - [ ] Cannot access other users' data ✓
- [ ] Test partner access (if applicable) ✓
  - [ ] Shared data visible ✓
  - [ ] Private data hidden ✓
- [ ] Verify data isolation ✓
- [ ] No security issues found ✓

**Phase 4 Complete**: Production ready! 🚀

---

## ✅ Final Pre-Deployment Checklist

- [ ] All P0 bugs fixed ✅
- [ ] All P0 fixes manually verified
- [ ] All 17 modules browser tested (100%)
- [ ] No active P1 bugs
- [ ] Mobile testing complete (iPhone + Android)
- [ ] Cross-browser testing complete (Safari, Firefox)
- [ ] Security review complete
- [ ] 45 screenshots captured
- [ ] All documentation up-to-date
- [ ] Performance spot-checked (no major issues)

**When all checked**: Deploy to production! 🎊

---

## 📊 Summary Statistics

**Track your progress**:

- **Modules Tested**: ___/17 (Target: 17/17)
- **Screenshots Captured**: ___/45 (Target: 45/45)
- **Bugs Found**: ___ (All should be documented)
- **Time Spent**: ___ hours (Estimate: 7 hours)

**Status**:
- [ ] Phase 1 Complete (Bug fixes verified)
- [ ] Phase 2 Complete (100% browser coverage)
- [ ] Phase 3 Complete (All features tested)
- [ ] Phase 4 Complete (Mobile + Security)
- [ ] **PRODUCTION DEPLOYMENT COMPLETE** 🎉

---

## 📝 Notes & Issues

**Use this section to track any issues you find during testing**:

### Bugs Found
```
Example:
- Bug #4: [Module] - [Description]
  Severity: P0/P1/P2/P3
  Steps to reproduce: ...
  Screenshot: ...
```

### Questions
```
Example:
- Is [feature] supposed to work this way?
- Should [behavior] happen?
```

### Observations
```
Example:
- [Module] loads slowly on mobile
- [Feature] could be more intuitive
- AI feature returns simulated data (as expected)
```

---

**Last Updated**: February 24, 2026
**Quick Start**: Open `START-HERE.md` for instructions
**Detailed Checklists**: See `QA-COMPLETE-CODE-REVIEW.md`
**Visual Dashboard**: Open `qa-progress-tracker.html` in browser
