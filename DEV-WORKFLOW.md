# LifeSync Development Workflow

## 🚀 **Pre-Development Checklist**

Before making ANY changes to the codebase:

```bash
# 1. Run regression tests to establish baseline
./regression-test.sh

# 2. Run full test suite for comprehensive check
./test-suite.sh

# 3. Verify current feature state
./health-check.sh
```

If any tests fail, fix them BEFORE making changes.

---

## 🔄 **Development Workflow**

### 1. **Feature Planning**
- [ ] Document the change in this file
- [ ] Identify affected components/pages
- [ ] List features that might be impacted
- [ ] Plan testing strategy

### 2. **Environment Setup**
```bash
# Ensure clean environment
./fix-api-connection.sh

# Verify everything works
./regression-test.sh
```

### 3. **Make Changes**
- [ ] Follow existing code patterns
- [ ] Update TypeScript types if needed
- [ ] Test changes locally as you go

### 4. **Testing During Development**
```bash
# Quick test after each major change
./regression-test.sh

# Check specific functionality
curl http://10.247.209.223:3001/api/health
```

### 5. **Pre-Commit Testing**
```bash
# Comprehensive testing before finalizing
./test-suite.sh

# Manual testing checklist
# - Drag & drop still works
# - CRUD operations persist
# - UI responsive on mobile
# - Theme switching works
# - No console errors
```

### 6. **Post-Change Verification**
- [ ] All automated tests pass
- [ ] Manual testing of affected features
- [ ] Browser console shows no errors
- [ ] App works on mobile view
- [ ] Database operations persist

---

## 🎯 **Critical Features Protection**

### **NEVER BREAK THESE** (Test immediately after changes):

1. **Task Drag & Drop** - `src/pages/TodosWorkingFollowUp.tsx`
   ```bash
   # Test: Can you drag tasks between columns?
   # Test: Does order persist after refresh?
   ```

2. **Database CRUD Operations**
   ```bash
   # Test: Create, edit, delete tasks/habits
   # Test: Do changes persist after page refresh?
   curl http://10.247.209.223:3001/api/tasks
   ```

3. **API Connectivity**
   ```bash
   # Test: All API endpoints respond
   ./regression-test.sh | grep "API"
   ```

4. **Theme Switching**
   ```bash
   # Test: Dark/light mode toggle works
   # Test: Theme persists across page navigation
   ```

5. **Real-time Data Sync**
   ```bash
   # Test: Changes appear immediately in UI
   # Test: Data syncs to database
   ```

---

## 🛡️ **Component-Specific Testing**

### When modifying `TodosWorkingFollowUp.tsx`:
```bash
# Critical tests:
# 1. Drag & drop between columns
# 2. Task creation/editing
# 3. Status changes persist
# 4. Project assignment works
# 5. Search/filter functions
```

### When modifying `Habits.tsx`:
```bash
# Critical tests:
# 1. Habit creation with all frequencies
# 2. Daily check-ins save
# 3. Progress visualization
# 4. Calendar view accuracy
# 5. Streak counting
```

### When modifying API services:
```bash
# Critical tests:
./test-suite.sh  # Full API endpoint testing
curl http://10.247.209.223:3001/api/health
```

### When modifying CSS/styling:
```bash
# Critical tests:
# 1. Responsive design on mobile
# 2. Theme switching works
# 3. Drag handles still visible
# 4. No layout breaks
```

---

## 🚨 **Emergency Rollback Procedure**

If you break something critical:

```bash
# 1. Stop all servers
pkill -f "vite"
pkill -f "node.*3001"

# 2. Reset environment
./fix-api-connection.sh

# 3. Check git status
git status

# 4. If needed, revert changes
git checkout -- problematic-file.tsx

# 5. Restart and test
./regression-test.sh
```

---

## 📋 **Change Documentation Template**

For each change, document:

```markdown
## Change: [Brief Description]
**Date:** [YYYY-MM-DD]
**Files Modified:** 
- path/to/file1.tsx
- path/to/file2.ts

**Features Affected:**
- [ ] Task Management
- [ ] Habit Tracking  
- [ ] Financial Management
- [ ] Drag & Drop
- [ ] Database Operations
- [ ] Theme/UI

**Testing Completed:**
- [ ] Regression tests pass
- [ ] Manual testing of affected features
- [ ] Mobile responsive check
- [ ] Theme switching works
- [ ] No console errors

**Rollback Plan:**
[How to undo this change if needed]
```

---

## 🔧 **Development Tools**

### Quick Commands
```bash
# Health check
./health-check.sh

# Quick regression test (30 seconds)
./regression-test.sh

# Full test suite (2 minutes)
./test-suite.sh

# Fix common issues
./fix-api-connection.sh

# View feature inventory
cat FEATURE-INVENTORY.md

# Check testing guide
cat TESTING-GUIDE.md
```

### Development Server Management
```bash
# Start development environment
npm run dev &
node start-with-db.js &

# Stop everything
pkill -f "vite"
pkill -f "node.*3001"

# Restart everything cleanly
./fix-api-connection.sh
```

---

## 🎨 **Code Standards**

### TypeScript
- Always use proper types
- No `any` types unless absolutely necessary
- Update interfaces when adding new fields

### React Components
- Follow existing patterns
- Use existing hooks and stores
- Maintain consistent naming

### Database Operations
- Always handle errors gracefully
- Use the existing API client patterns
- Test with real database operations

### CSS/Styling
- Follow existing utility class patterns
- Test in both light and dark themes
- Ensure mobile responsiveness

---

## 📊 **Feature Impact Matrix**

When changing these files, test these features:

| File Changed | Features to Test |
|-------------|------------------|
| `TodosWorkingFollowUp.tsx` | Drag & Drop, Task CRUD, Project Assignment, Search |
| `Habits.tsx` | Habit CRUD, Check-ins, Calendar View, Progress |
| `apiClient.ts` | ALL features (core API changes) |
| `Layout.tsx` | Navigation, Theme, All Pages |
| `App.tsx` | Page Routing, Initialization, All Features |
| CSS files | Theme Switching, Responsive Design, All UI |

---

## ✅ **Definition of Done**

A change is complete when:
- [ ] All automated tests pass (`./test-suite.sh`)
- [ ] Manual testing confirms affected features work
- [ ] No new browser console errors
- [ ] Mobile responsive design maintained
- [ ] Theme switching still works
- [ ] Database operations persist correctly
- [ ] Drag & drop functionality preserved (if applicable)
- [ ] Change documented in this file

---

## 🎯 **Success Metrics**

Track these to ensure code quality:
- Regression test pass rate: Should be 100%
- Feature availability: All features remain functional
- Performance: No significant slowdowns
- User experience: No broken workflows

---

**Remember: It's easier to prevent bugs than to fix them. Test early, test often, test everything!**