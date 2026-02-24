# LifeSync QA Testing Plan

## Test Accounts
- **Account 1**: test1@lifesync.app / TestAccount123!
- **Account 2**: test2@lifesync.app / TestAccount456!

## Testing Scope Overview
- **Total Routes**: 23+ main routes
- **Total Pages**: 22 main feature pages
- **Total Modals**: 35+ modal types
- **Total CRUD Entities**: 20+ data types
- **Multi-user Testing**: Partner/merged mode across 6+ modules

---

## 1. AUTHENTICATION & SESSION TESTING

### Sign In/Sign Up Flow
- [ ] Sign up new account (validation)
- [ ] Sign in with test1@lifesync.app
- [ ] Sign in with test2@lifesync.app
- [ ] Invalid credentials handling
- [ ] Session persistence (refresh page)
- [ ] Sign out functionality
- [ ] Auto-redirect after sign in

---

## 2. DASHBOARD TESTING

### Dashboard Components
- [ ] Quick task creation
- [ ] Quick note creation
- [ ] Quick journal entry
- [ ] Today's tasks display
- [ ] Today's habits display (incomplete only)
- [ ] Recent notes preview
- [ ] AI Briefing card
- [ ] Navigation to feature pages
- [ ] Empty states

---

## 3. TASKS/TODOS MODULE (Priority: HIGH)

### Task Creation
- [ ] Create task from FAB (+)
- [ ] Create task from Dashboard quick add
- [ ] Quick add modal (minimal fields)
- [ ] Full form modal (all fields)
- [ ] Voice input for task creation
- [ ] Auto-save draft to localStorage
- [ ] Required field validation
- [ ] Date/time pickers

### Task Properties Testing
- [ ] Title field
- [ ] Description field
- [ ] Status dropdown (todo/in-progress/done)
- [ ] Priority levels (low/medium/high)
- [ ] Category assignment
- [ ] Due date selection
- [ ] Scheduled start time
- [ ] Project association
- [ ] Star/unstar toggle
- [ ] Tags input

### Task View Modes (6 Views)
- [ ] All view - complete task list
- [ ] Today view - due today filter
- [ ] Upcoming view - future due dates
- [ ] Inbox view - unscheduled tasks
- [ ] Kanban board - drag and drop
- [ ] Priority matrix - 2x2 grid

### Task Operations
- [ ] Edit task (click card)
- [ ] Complete task (checkbox)
- [ ] Delete task (soft delete)
- [ ] Permanently delete task
- [ ] Restore deleted task
- [ ] Star/unstar task
- [ ] Bulk select tasks
- [ ] Bulk delete
- [ ] Bulk status change

### Task Filters
- [ ] Filter by status
- [ ] Filter by priority
- [ ] Filter by category
- [ ] Filter by project
- [ ] Filter by starred
- [ ] Search tasks
- [ ] Owner filter (merged mode)

### Task Integration
- [ ] Tasks appear on Calendar
- [ ] Tasks appear on Dashboard
- [ ] Task reminders
- [ ] Scheduled task notifications

### Task Merged Mode (Multi-user)
- [ ] Enable merged mode
- [ ] View partner's tasks
- [ ] Owner filtering (Me/Partner/Both)
- [ ] Create task as partner
- [ ] Edit partner's task
- [ ] Permission handling

---

## 4. HABITS MODULE (Priority: HIGH)

### Habit Creation
- [ ] Create habit from FAB
- [ ] Habit form modal fields
- [ ] Name, description, category
- [ ] Color picker
- [ ] Frequency settings
- [ ] Target count
- [ ] Goal mode (daily-target vs total-goal)
- [ ] Form validation
- [ ] Draft auto-save

### Habit View Modes
- [ ] Today view - today's habits
- [ ] Weekly grid - 7-day view

### Habit Operations
- [ ] Mark habit complete (+ button)
- [ ] View streak count
- [ ] Edit habit
- [ ] Delete habit
- [ ] Toggle active/inactive
- [ ] Undo completion (remove entry)

### Habit Tracking
- [ ] Daily completion tracking
- [ ] Streak calculation
- [ ] Habit entries creation
- [ ] Multiple completions per day
- [ ] Habit card display

### Habit Filters
- [ ] Category filter
- [ ] Active/inactive filter
- [ ] Owner filter (merged mode)

### Habit Merged Mode
- [ ] View partner's habits
- [ ] Owner filtering
- [ ] Complete partner's habit
- [ ] Edit partner's habit

### Habit Reminders
- [ ] Habit reminder notifications
- [ ] Streak protection alerts

---

## 5. NOTES MODULE (Priority: MEDIUM)

### Note Creation
- [ ] Create text note
- [ ] Create checklist
- [ ] Note form modal
- [ ] Title, content, tags, category
- [ ] Draft auto-save
- [ ] Validation

### Note View Modes
- [ ] Grid view
- [ ] List view

### Checklist Operations
- [ ] Add list item
- [ ] Edit list item
- [ ] Delete list item
- [ ] Toggle item complete
- [ ] Reorder items
- [ ] Add due date to item
- [ ] Add URL to item

### Note Operations
- [ ] Edit note
- [ ] Delete note
- [ ] Search notes
- [ ] Tag filtering

### Notes Merged Mode
- [ ] View partner's notes
- [ ] Owner filtering
- [ ] Create note as partner
- [ ] Edit partner's note

---

## 6. JOURNAL MODULE (Priority: MEDIUM)

### Journal Entry Creation
- [ ] Create entry from FAB
- [ ] Entry form modal
- [ ] Title, content fields
- [ ] Tags input
- [ ] Attachments (images, files, links)
- [ ] Date selection
- [ ] Draft auto-save

### Journal Operations
- [ ] View entry list
- [ ] View entry detail page
- [ ] Edit entry
- [ ] Delete entry
- [ ] Search entries

### Journal Merged Mode
- [ ] View partner's entries
- [ ] Owner filtering
- [ ] Shared journal entries

---

## 7. LIFE GOALS MODULE (Priority: MEDIUM)

### Goals Tab
- [ ] Create goal
- [ ] Goal form (title, description, category, target date, priority)
- [ ] View goals list
- [ ] Stats cards (total, in-progress, completed)
- [ ] Edit goal
- [ ] Delete goal
- [ ] Mark goal complete
- [ ] Add milestones
- [ ] Progress tracking

### Dreams Tab
- [ ] Create dream
- [ ] Dream form (title, description, target date)
- [ ] View dreams list
- [ ] Edit dream
- [ ] Delete dream
- [ ] Wishlist status

### Goals Filters
- [ ] Status filter (active/completed/on-hold)
- [ ] Owner filter (merged mode)

### Goals Merged Mode
- [ ] View partner's goals
- [ ] View partner's dreams
- [ ] Owner filtering
- [ ] Shared goal creation

---

## 8. SHOPPING MODULE (Priority: MEDIUM)

### Shopping Views (4 Views)
- [ ] Master list view
- [ ] Pantry view
- [ ] Stores view
- [ ] History view

### Shopping Item Creation (Multiple Methods)
- [ ] Manual add (form modal)
- [ ] Voice input
- [ ] Barcode scanner
- [ ] Receipt scanner (OCR)

### Shopping Item Operations
- [ ] Edit item
- [ ] Delete item
- [ ] Mark as purchased (checkbox)
- [ ] Assign to store
- [ ] Add notes to item
- [ ] Set priority
- [ ] Set estimated price

### Store Management
- [ ] Create store
- [ ] Edit store
- [ ] Delete store
- [ ] View store details
- [ ] Store-specific shopping list
- [ ] Smart distribution to stores
- [ ] Geolocation store suggestions

### Pantry Management
- [ ] Add pantry item
- [ ] Edit pantry item
- [ ] Delete pantry item
- [ ] Set expiration date
- [ ] Quantity tracking
- [ ] Replenish suggestions
- [ ] Convert shopping item to pantry

### Shopping Features
- [ ] Category filtering
- [ ] Search items
- [ ] Bulk operations
- [ ] Item history tracking
- [ ] Price tracking

---

## 9. MEALS MODULE (Priority: MEDIUM)

### Meal Planning Views (4 Views)
- [ ] Today view
- [ ] Week view (7-day grid)
- [ ] Recipes view
- [ ] Grocery list view

### Meal Planning Operations
- [ ] Add meal to cell
- [ ] Edit meal
- [ ] Remove meal
- [ ] Copy week
- [ ] Navigate weeks (prev/next)
- [ ] Multi-cell selection
- [ ] Meal swap

### Recipe Management
- [ ] Create custom recipe
- [ ] Import recipe from URL
- [ ] Edit recipe
- [ ] Delete recipe
- [ ] Recipe properties (ingredients, steps, nutrition, serves, time)
- [ ] Search recipes
- [ ] Filter recipes (category/diet)
- [ ] Scale recipe (serving size)

### Meal Features
- [ ] Auto-generate grocery list from week
- [ ] Nutrition summary
- [ ] Meal type assignment (breakfast/lunch/dinner/snack)
- [ ] Serving size adjustment
- [ ] Notes per meal

### Meal Form
- [ ] Date selection
- [ ] Meal type dropdown
- [ ] Recipe selection
- [ ] Draft auto-save

---

## 10. FINANCES MODULE (Priority: LOW)

### Finance Sub-Pages (14 pages)
- [ ] Dashboard - overview, net worth
- [ ] Accounts - bank/investment accounts
- [ ] Transactions - income/expense tracking
- [ ] Budgets - budget creation and tracking
- [ ] Recurring - recurring transactions
- [ ] Net Worth - assets and liabilities
- [ ] Goals - financial goals
- [ ] Loans - loan management
- [ ] Retirement - retirement planning
- [ ] Projections - financial forecasting
- [ ] Calculators - debt payoff, compound interest
- [ ] Credit Cards - card benefits tracking
- [ ] Insurance - policy tracking
- [ ] Settings - module settings

### Finance Features (Sample Testing)
- [ ] Create account
- [ ] Add transaction
- [ ] Transaction categorization
- [ ] Create budget
- [ ] Budget tracking
- [ ] Recurring transaction setup
- [ ] Net worth calculation
- [ ] Debt payoff calculator

---

## 11. CALENDAR MODULE (Priority: MEDIUM)

### Calendar Views (3 Views)
- [ ] Month view
- [ ] Week view
- [ ] Day view (hourly timeline)

### Calendar Operations
- [ ] Add event
- [ ] Edit event
- [ ] Delete event
- [ ] Event types (event/meeting/reminder/birthday/holiday)
- [ ] Color coding
- [ ] View navigation (prev/next)
- [ ] Date selection

### Calendar Integration
- [ ] Tasks appear on calendar
- [ ] View preference persistence
- [ ] Event detail display

---

## 12. TOGETHER MODULE (Priority: HIGH for multi-user)

### Together Tabs (3 Tabs)
- [ ] Milestones tab
- [ ] Messages tab
- [ ] Challenges tab

### Milestones
- [ ] Create milestone
- [ ] Edit milestone
- [ ] Delete milestone
- [ ] Milestone properties (name, date, description, type)
- [ ] View all milestones
- [ ] Milestone reminders

### Messages
- [ ] Compose message
- [ ] Edit message
- [ ] Delete message
- [ ] View message history
- [ ] Message detail modal
- [ ] Message reveals (gamification)
- [ ] Real-time message subscriptions
- [ ] Toast notifications for incoming messages

### Challenges
- [ ] Create challenge
- [ ] Edit challenge
- [ ] Delete challenge
- [ ] Challenge properties (description, difficulty, reward)
- [ ] Mark challenge complete
- [ ] View challenge details

### Together Multi-user
- [ ] Partner connection status
- [ ] Send partner request
- [ ] Accept partner request
- [ ] Real-time updates from partner
- [ ] Notification on partner action

---

## 13. FOCUS MODULE (Priority: LOW)

### Focus Features
- [ ] Start focus session
- [ ] Pomodoro timer
- [ ] Task association
- [ ] Focus analytics
- [ ] Session tracking

---

## 14. AI ASSISTANT MODULE (Priority: LOW)

### Assistant Features
- [ ] Create new conversation
- [ ] Send message
- [ ] View conversation history
- [ ] Conversation list (last 10)
- [ ] Typing indicator
- [ ] Empty state with suggestions
- [ ] Auto-scroll to latest

---

## 15. TRAVEL MODULE (Priority: LOW)

### Travel Features
- [ ] Map of visited locations
- [ ] Add visited location
- [ ] Bucket list items
- [ ] Trip planning
- [ ] Visa requirements tracker
- [ ] Visa score calculator

---

## 16. SELF CARE MODULE (Priority: LOW)

### Self Care Features
- [ ] Skincare routine tracking
- [ ] Product management
- [ ] Skin condition logging
- [ ] Wellness activities

---

## 17. NUTRITION MODULE (Priority: LOW)

### Nutrition Features
- [ ] Nutrition tracking
- [ ] Diet type settings
- [ ] Nutritional goals
- [ ] Integration with meal planning

---

## 18. SHARED MODULE (Priority: LOW)

### Shared Features
- [ ] View shared connections
- [ ] Invite partner
- [ ] Shared list management

---

## 19. GLOBAL UI/UX TESTING

### Theme & Styling
- [ ] Light mode display
- [ ] Dark mode display
- [ ] Theme toggle switch
- [ ] Terracotta gradient buttons
- [ ] Consistent spacing (900px centered layout)
- [ ] Modal styling (backdrop blur, rounded corners)
- [ ] Mobile responsiveness

### Modal Behavior (All Modals)
- [ ] ESC key closes modal
- [ ] Backdrop click closes modal
- [ ] Mobile drag handle visible
- [ ] Desktop centered layout
- [ ] Mobile bottom-aligned layout
- [ ] Scrollable content area
- [ ] Fixed header/footer
- [ ] Safe area insets (mobile notches)

### Forms (All Forms)
- [ ] Auto-save to localStorage
- [ ] Draft recovery on modal reopen
- [ ] Clear draft on successful submit
- [ ] Validation messages
- [ ] Error display
- [ ] Loading states
- [ ] Disabled states
- [ ] Required field indicators

### Toast Notifications
- [ ] Success toasts (with emoji)
- [ ] Error toasts
- [ ] Info toasts
- [ ] Toast positioning
- [ ] Toast auto-dismiss

### Navigation
- [ ] Bottom tab navigation (mobile)
- [ ] Sidebar navigation (desktop)
- [ ] Page routing
- [ ] Active tab highlight
- [ ] Navigation persistence

### Loading States
- [ ] Skeleton screens
- [ ] Loading spinners
- [ ] Button loading states
- [ ] Progress indicators

### Empty States
- [ ] Empty state messaging
- [ ] Empty state icons
- [ ] CTA buttons on empty states

### Error Handling
- [ ] Network error display
- [ ] Form validation errors
- [ ] API error messages
- [ ] 404 pages
- [ ] Permission errors

---

## 20. ACCESSIBILITY TESTING

### Keyboard Navigation
- [ ] Tab navigation through forms
- [ ] ESC key behavior
- [ ] Enter key submit
- [ ] Arrow key navigation (where applicable)

### ARIA Labels
- [ ] All icon buttons have aria-label
- [ ] Form inputs have labels
- [ ] Dynamic aria-labels (state-dependent)
- [ ] Screen reader compatibility

---

## 21. INTEGRATION TESTING

### Cross-Feature Integration
- [ ] Dashboard shows data from all modules
- [ ] Tasks appear on Calendar
- [ ] Habits appear on Dashboard
- [ ] Notes appear on Dashboard
- [ ] Meals generate shopping list
- [ ] Shopping items link to pantry
- [ ] Finance transactions link to budgets

### Real-time Features
- [ ] Together message subscriptions
- [ ] Partner action notifications
- [ ] Live updates across tabs

### Data Persistence
- [ ] localStorage draft recovery
- [ ] Session persistence on refresh
- [ ] Data sync after CRUD operations
- [ ] Cache invalidation

---

## 22. MULTI-USER (MERGED MODE) TESTING

### Partner Connection
- [ ] Send partner request
- [ ] Accept partner request
- [ ] Connection status display
- [ ] Disconnect partner

### Merged Mode Per Module
- [ ] Tasks merged mode
- [ ] Habits merged mode
- [ ] Notes merged mode
- [ ] Journal merged mode
- [ ] Goals merged mode
- [ ] Meals merged mode

### Owner Filtering
- [ ] Filter by "Me"
- [ ] Filter by "Partner"
- [ ] Filter by "Both"
- [ ] Owner display on cards
- [ ] Permission-based editing

---

## 23. PERFORMANCE TESTING

### Page Load
- [ ] Initial page load time
- [ ] Navigation speed
- [ ] Modal open speed
- [ ] Data fetch latency

### Optimization
- [ ] React Query caching
- [ ] Lazy loading (recipes, nutrition)
- [ ] Image optimization
- [ ] Bundle size

---

## 24. SECURITY TESTING

### Authentication
- [ ] Token validation
- [ ] Session expiry
- [ ] Auto logout on token expire
- [ ] Protected routes

### Data Privacy
- [ ] Row-level security (RLS)
- [ ] User data isolation
- [ ] Permission checks
- [ ] Partner data access control

---

## 25. REGRESSION TESTING

### Known Issues Check
- [ ] Check git commit history for recent bug fixes
- [ ] Verify fixed issues stay fixed
- [ ] Test edge cases

### Browser Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

---

## TESTING METHODOLOGY

### Test Execution Order
1. **Phase 1: Authentication** (Sign in/out)
2. **Phase 2: Dashboard** (Quick overview)
3. **Phase 3: High Priority** (Tasks, Habits, Together)
4. **Phase 4: Medium Priority** (Notes, Goals, Shopping, Meals, Calendar, Journal)
5. **Phase 5: Low Priority** (Finance, Focus, Assistant, Travel, Self Care, Nutrition)
6. **Phase 6: Global UI/UX** (Modals, forms, theme, navigation)
7. **Phase 7: Multi-user** (Merged mode, partner features)
8. **Phase 8: Integration** (Cross-feature, real-time)

### Test Result Documentation
For each test:
- ✅ **PASS**: Feature works as expected
- ⚠️ **MINOR ISSUE**: Works but has cosmetic/UX issues
- ❌ **FAIL**: Feature broken or major bug
- 🚫 **BLOCKER**: Critical issue preventing further testing

### Issue Tracking
Each issue will be documented with:
- **Severity**: Critical, High, Medium, Low
- **Type**: Bug, UI/UX, Performance, Accessibility
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **Browser/environment**
- **Workaround** (if any)

---

## FINAL DELIVERABLE

After testing completion, will provide:

1. **QA-TEST-RESULTS.md** - Detailed test results with pass/fail status
2. **QA-ISSUES-FOUND.md** - Comprehensive issue list with severity ratings
3. **QA-OBSERVATIONS.md** - General observations, UX feedback, recommendations
4. **QA-SCREENSHOTS/** - Screenshot evidence for issues (if needed)

---

**Estimated Testing Time**: 4-6 hours for comprehensive testing
**Test Accounts Used**: test1@lifesync.app, test2@lifesync.app
**Testing Ports**: localhost:5173 (Account 1), localhost:5174 (Account 2)
