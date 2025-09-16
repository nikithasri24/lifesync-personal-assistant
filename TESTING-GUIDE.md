# LifeSync Testing Guide

## 🧪 **Automated Testing**

### Quick Health Check
```bash
# Run automated test suite
./test-suite.sh

# Quick health verification
./health-check.sh

# Fix common issues
./fix-api-connection.sh
```

---

## ✅ **Manual Testing Checklist**

### 🔧 **Pre-Testing Setup**
- [ ] Run `./test-suite.sh` to verify system health
- [ ] Access app at `http://10.247.209.223:5173`
- [ ] Verify API server responds at `http://10.247.209.223:3001/api/health`
- [ ] Check browser console for errors (F12)

---

### 📋 **Todo Management Testing**

#### Basic CRUD Operations
- [ ] **Create Task**
  1. Click "+" button in todos
  2. Fill in task title and description
  3. Set priority (low/medium/high/urgent)
  4. Choose category (work/personal/learning/etc.)
  5. Add tags (comma-separated)
  6. Set due date
  7. Save task
  8. ✅ Verify task appears in list

- [ ] **Edit Task**
  1. Click edit icon on existing task
  2. Modify any field (title, description, priority, etc.)
  3. Save changes
  4. ✅ Verify changes persist after page refresh

- [ ] **Delete Task**
  1. Click delete icon on task
  2. Confirm deletion
  3. ✅ Verify task is removed from list

- [ ] **Complete Task**
  1. Click checkbox to mark task as done
  2. ✅ Verify task moves to completed section
  3. ✅ Verify completion time is recorded

#### Drag & Drop Testing
- [ ] **Reorder Tasks**
  1. Grab task by drag handle (⋮⋮)
  2. Drag to new position
  3. Drop task
  4. ✅ Verify new order persists
  5. ✅ Verify order maintained after refresh

- [ ] **Move Between Status Columns**
  1. Drag task from "Todo" to "In Progress"
  2. Drag task from "In Progress" to "Done"
  3. ✅ Verify status updates correctly
  4. ✅ Verify database reflects status change

#### Advanced Features
- [ ] **Task Filtering**
  1. Use filter dropdown
  2. Filter by priority, category, status
  3. ✅ Verify only matching tasks show

- [ ] **Task Search**
  1. Use search bar
  2. Search by title, description, tags
  3. ✅ Verify results are accurate

- [ ] **Project Assignment**
  1. Create a new project
  2. Assign tasks to project
  3. ✅ Verify project association

---

### 🎯 **Habit Tracking Testing**

#### Habit Management
- [ ] **Create Habit**
  1. Click "+" in habits section
  2. Set habit name and description
  3. Choose frequency (daily/weekly/monthly)
  4. Set target count
  5. Choose color
  6. Save habit
  7. ✅ Verify habit appears in list

- [ ] **Edit Habit**
  1. Click edit on existing habit
  2. Modify properties
  3. Save changes
  4. ✅ Verify changes persist

- [ ] **Delete Habit**
  1. Delete habit
  2. Confirm deletion
  3. ✅ Verify habit removed

#### Habit Tracking
- [ ] **Daily Check-in**
  1. Click habit to mark as completed
  2. Enter value if numeric (reps, minutes, etc.)
  3. Add notes if desired
  4. ✅ Verify check-in recorded
  5. ✅ Verify progress updates

- [ ] **Streak Tracking**
  1. Complete habit multiple days
  2. ✅ Verify streak counter increases
  3. Miss a day
  4. ✅ Verify streak resets appropriately

- [ ] **Calendar View**
  1. Switch to calendar view
  2. ✅ Verify completed days are marked
  3. ✅ Verify data persists across months

---

### 🧘 **Focus Session Testing**

#### Session Management
- [ ] **Start Focus Session**
  1. Choose focus duration
  2. Optionally link to task
  3. Start timer
  4. ✅ Verify timer counts down
  5. ✅ Verify session saves to history

- [ ] **Pause/Resume Session**
  1. Start session
  2. Pause timer
  3. Resume timer
  4. ✅ Verify time tracking accuracy

- [ ] **Complete Session**
  1. Let timer complete naturally
  2. ✅ Verify completion notification
  3. ✅ Verify session logged in history

---

### 💰 **Financial Management Testing**

#### Transaction Management
- [ ] **Add Transaction**
  1. Click "Add Transaction"
  2. Enter amount, category, description
  3. Set date
  4. Save transaction
  5. ✅ Verify transaction appears in list

- [ ] **Edit Transaction**
  1. Click edit on transaction
  2. Modify details
  3. Save changes
  4. ✅ Verify changes persist

- [ ] **Delete Transaction**
  1. Delete transaction
  2. Confirm deletion
  3. ✅ Verify transaction removed

#### Financial Dashboard
- [ ] **View Dashboard**
  1. Navigate to financial dashboard
  2. ✅ Verify charts load properly
  3. ✅ Verify calculations are accurate
  4. ✅ Verify real-time updates

---

### 🛒 **Shopping List Testing**

#### List Management
- [ ] **Create Shopping List**
  1. Create new shopping list
  2. Add name and description
  3. Save list
  4. ✅ Verify list appears

- [ ] **Add Items**
  1. Click "Add Item"
  2. Enter item name, quantity, price
  3. Save item
  4. ✅ Verify item appears in list

- [ ] **Mark Items Purchased**
  1. Check off items as purchased
  2. ✅ Verify items move to purchased section
  3. ✅ Verify total cost updates

---

### 📅 **Calendar Integration Testing**

#### Calendar Views
- [ ] **Day View**
  1. Switch to day view
  2. ✅ Verify tasks for selected day show
  3. ✅ Verify due dates display correctly

- [ ] **Week View**
  1. Switch to week view
  2. ✅ Verify tasks spread across week
  3. ✅ Verify navigation works

- [ ] **Month View**
  1. Switch to month view
  2. ✅ Verify full month displays
  3. ✅ Verify task indicators show

---

### 🎨 **UI/UX Testing**

#### Theme & Responsiveness
- [ ] **Theme Switching**
  1. Toggle dark/light mode
  2. ✅ Verify theme persists across pages
  3. ✅ Verify all components update

- [ ] **Responsive Design**
  1. Test on mobile screen size
  2. Test on tablet screen size
  3. Test on desktop screen size
  4. ✅ Verify layout adapts properly

- [ ] **Navigation**
  1. Test all sidebar menu items
  2. ✅ Verify all pages load
  3. ✅ Verify active page highlighting

#### Accessibility
- [ ] **Keyboard Navigation**
  1. Navigate using Tab key
  2. ✅ Verify focus indicators
  3. ✅ Verify all elements reachable

- [ ] **Screen Reader Compatibility**
  1. Test with screen reader (if available)
  2. ✅ Verify alt text on images
  3. ✅ Verify form labels

---

### 🔄 **Data Persistence Testing**

#### Database Integration
- [ ] **Data Persistence**
  1. Create/edit/delete items
  2. Refresh page
  3. ✅ Verify all changes persist

- [ ] **Real-time Updates**
  1. Make changes
  2. ✅ Verify immediate UI updates
  3. ✅ Verify database synchronization

- [ ] **Offline Handling**
  1. Disconnect from internet
  2. Try to use app
  3. ✅ Verify graceful error handling
  4. Reconnect internet
  5. ✅ Verify data syncs properly

---

### 🔍 **Search & Filter Testing**

#### Global Search
- [ ] **Cross-Module Search**
  1. Use global search bar
  2. Search for terms across tasks, habits, etc.
  3. ✅ Verify results from all modules

- [ ] **Filter Combinations**
  1. Apply multiple filters
  2. ✅ Verify filters work together
  3. Clear filters
  4. ✅ Verify all items return

---

### 🚨 **Error Handling Testing**

#### Network Errors
- [ ] **API Unavailable**
  1. Stop API server temporarily
  2. Try to use app
  3. ✅ Verify graceful error messages
  4. ✅ Verify app doesn't crash

- [ ] **Database Connection Loss**
  1. Stop database temporarily
  2. Try to save data
  3. ✅ Verify error handling
  4. ✅ Verify recovery when restored

#### Input Validation
- [ ] **Invalid Data Entry**
  1. Try to submit empty required fields
  2. Try to enter invalid dates
  3. Try to enter negative numbers where inappropriate
  4. ✅ Verify validation messages
  5. ✅ Verify data integrity

---

## 🏃‍♂️ **Performance Testing**

### Load Testing
- [ ] **Large Data Sets**
  1. Create 100+ tasks
  2. Create 50+ habits
  3. ✅ Verify app remains responsive
  4. ✅ Verify searches are fast

- [ ] **Memory Usage**
  1. Use app for extended period
  2. Monitor browser memory usage
  3. ✅ Verify no memory leaks

---

## 📊 **Regression Testing Script**

```bash
#!/bin/bash
# Quick regression test
echo "Running regression tests..."

# 1. System health
./test-suite.sh

# 2. API endpoints
curl -s http://10.247.209.223:3001/api/tasks > /dev/null && echo "✅ Tasks API" || echo "❌ Tasks API"
curl -s http://10.247.209.223:3001/api/habits > /dev/null && echo "✅ Habits API" || echo "❌ Habits API"

# 3. Frontend accessibility
curl -s http://10.247.209.223:5173 > /dev/null && echo "✅ Frontend" || echo "❌ Frontend"

echo "Regression tests complete!"
```

---

## 🎯 **Critical Path Testing Priority**

### High Priority (Test First)
1. Task CRUD operations
2. Drag & drop functionality
3. Database persistence
4. API connectivity
5. Theme switching

### Medium Priority
1. Habit tracking
2. Financial transactions
3. Search functionality
4. Calendar views
5. Shopping lists

### Low Priority
1. Advanced analytics
2. Specialized features
3. Edge case scenarios
4. Performance optimizations

---

## 📝 **Bug Reporting Template**

```markdown
## Bug Report

**Component:** [Todo/Habits/Finance/etc.]
**Feature:** [Specific feature that failed]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**

**Actual Behavior:**

**Browser:** [Chrome/Firefox/Safari/etc.]
**Screen Size:** [Desktop/Mobile/Tablet]
**Console Errors:** [Any JavaScript errors]

**Environment Check:**
- [ ] Ran ./test-suite.sh
- [ ] Checked ./health-check.sh
- [ ] Verified API connectivity
```

---

**Remember:** Always run `./test-suite.sh` before and after making changes to catch regressions early!