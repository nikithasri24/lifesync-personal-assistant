# Tasks Merged Mode - Testing Checklist

## Pre-Testing Setup

### ✅ Migration Applied
- [ ] SQL migration run in Supabase Dashboard
- [ ] No errors reported
- [ ] Policies visible in Authentication > Policies

### ✅ Code Deployed
- [ ] Latest code is running (npm run dev or deployed)
- [ ] No console errors on page load
- [ ] Tasks page loads successfully

---

## Test Scenario 1: Personal Mode (No Connection)

**Setup:** You are NOT connected to a partner

### Expected Behavior
- [ ] See only YOUR tasks
- [ ] NO owner badges visible on tasks
- [ ] NO owner filter dropdown visible
- [ ] Can create tasks
- [ ] Can edit your tasks
- [ ] Can delete your tasks

### How to Test
1. Navigate to Tasks/Todos page
2. Check the tasks list
3. Look for owner badges (should NOT be there)
4. Look for "Show: All/Mine/Partner" dropdown (should NOT be there)
5. Create a new task - should work normally
6. Edit a task - should work normally
7. Delete a task - should work normally

### ✅ Results
- [ ] PASS: No owner UI elements visible
- [ ] PASS: All CRUD operations work
- [ ] FAIL: _________________ (describe issue)

---

## Test Scenario 2: Connected But Not Merged

**Setup:** You ARE connected to a partner, but 'todos' module is NOT set to 'merged'

### Expected Behavior
- [ ] See only YOUR tasks
- [ ] NO owner badges visible
- [ ] NO owner filter dropdown visible
- [ ] Can create/edit/delete your tasks

### How to Test
1. Check connection status in Shared settings
2. Verify 'todos' permission is NOT 'merged' (should be 'none' or 'view')
3. Navigate to Tasks page
4. Verify only your tasks appear
5. Verify no owner UI elements

### ✅ Results
- [ ] PASS: Only my tasks visible
- [ ] PASS: No owner UI visible
- [ ] FAIL: _________________ (describe issue)

---

## Test Scenario 3: Merged Mode Active ⭐ (Main Test)

**Setup:** Both you AND your partner have set 'todos' module to 'merged'

### Expected Behavior
- [ ] See BOTH users' tasks in the list
- [ ] Owner badges visible (Blue="Me", Purple=Partner name)
- [ ] Owner filter dropdown visible ("Show: All/Mine/Partner")
- [ ] Can create tasks (owned by you)
- [ ] Can edit ONLY your tasks
- [ ] Can delete ONLY your tasks

### How to Test

#### 3a. Verify Merged Mode is Active
1. Go to Shared settings
2. Check 'todos' module permission = 'merged' for both users
3. Navigate to Tasks page
4. Open browser console (F12)
5. Look for log: `[getMergedConnectionId] MERGED mode enabled!`

#### 3b. Verify Tasks Display
1. Count total tasks visible
2. Verify you see both your tasks AND partner's tasks
3. Check each task has an owner badge
   - Your tasks: Blue badge with "Me"
   - Partner's tasks: Purple badge with partner's name
4. Verify badges appear next to priority flags

#### 3c. Verify Owner Filter
1. Look for "Show: All/Mine/Partner" dropdown (below header)
2. Select "All" - should show all tasks
3. Select "Mine" - should show only your tasks
4. Select "Partner" - should show only partner's tasks
5. Verify filtering works instantly (no loading)

#### 3d. Verify CRUD Operations
1. **Create:** Add a new task
   - [ ] Task created successfully
   - [ ] New task has blue "Me" badge
   - [ ] Task appears in "Mine" filter

2. **Edit YOUR task:**
   - [ ] Click to edit your own task
   - [ ] Can modify title
   - [ ] Can toggle status
   - [ ] Changes save successfully

3. **Try to Edit PARTNER's task:**
   - [ ] Click partner's task
   - [ ] Can you edit it? (Should NOT be able to)
   - [ ] Verify it's read-only or shows error

4. **Delete YOUR task:**
   - [ ] Can delete your own task
   - [ ] Task removed from list

5. **Try to Delete PARTNER's task:**
   - [ ] Try to delete partner's task
   - [ ] Should fail or show error

#### 3e. Verify Real-Time Sync
1. Have partner create a task
2. Refresh your page or wait for sync
3. Verify partner's new task appears with purple badge

### ✅ Results
- [ ] PASS: See both users' tasks
- [ ] PASS: Owner badges correct (Me=blue, Partner=purple)
- [ ] PASS: Owner filter works (All/Mine/Partner)
- [ ] PASS: Can create tasks (owned by me)
- [ ] PASS: Can edit only my tasks
- [ ] PASS: Cannot edit partner's tasks
- [ ] PASS: Can delete only my tasks
- [ ] PASS: Cannot delete partner's tasks
- [ ] FAIL: _________________ (describe issue)

---

## Test Scenario 4: Mobile UI

**Setup:** Access on mobile device or responsive view

### Expected Behavior
- [ ] Owner badges display correctly (not cut off)
- [ ] Owner filter accessible and usable
- [ ] Layout doesn't break
- [ ] Touch interactions work

### How to Test
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone 12 Pro" or similar
4. Navigate to Tasks page
5. Check owner badges fit properly
6. Check owner filter dropdown is accessible
7. Try creating/filtering tasks

### ✅ Results
- [ ] PASS: Owner badges display properly on mobile
- [ ] PASS: Owner filter accessible on mobile
- [ ] PASS: Layout looks good
- [ ] FAIL: _________________ (describe issue)

---

## Test Scenario 5: Database Security (RLS)

**Setup:** Test RLS policies directly in Supabase

### How to Test
1. Go to Supabase Dashboard → SQL Editor
2. Run these queries as your user:

```sql
-- Should see YOUR tasks + PARTNER's tasks (if merged)
SELECT id, title, user_id FROM tasks;

-- Try to insert a task with partner's user_id (should FAIL)
INSERT INTO tasks (user_id, title, status, priority)
VALUES ('<partners-user-id>', 'Hacked task', 'todo', 'high');

-- Should FAIL - cannot insert with someone else's user_id
```

### ✅ Results
- [ ] PASS: SELECT shows both users' tasks when merged
- [ ] PASS: INSERT with partner's user_id fails
- [ ] PASS: Can only create tasks with my user_id
- [ ] FAIL: _________________ (describe issue)

---

## Common Issues & Troubleshooting

### Issue: "I don't see partner's tasks in merged mode"

**Check:**
1. Is migration applied? (Check in Supabase → Authentication → Policies)
2. Is connection active? (Check profile_connections table)
3. Is 'todos' set to 'merged' for BOTH users? (Check module_permissions table)
4. Browser console errors?

**Debug SQL:**
```sql
-- Check your connection
SELECT * FROM profile_connections
WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
AND status = 'active';

-- Check todos permissions
SELECT * FROM module_permissions
WHERE module = 'todos' AND permission_level = 'merged';
```

### Issue: "Owner badges not showing"

**Check:**
1. Is merged mode active? (Check console for log)
2. Are you in merged mode? (Check if `mergedConnection` is not null)
3. Do tasks have `user_id`? (Check browser DevTools → Components)

### Issue: "Can edit partner's tasks (should not be able to)"

**Problem:** RLS UPDATE policy not applied correctly

**Fix:** Re-run migration, specifically the UPDATE policy section

### Issue: "Filter dropdown not appearing"

**Check:**
1. Is `mergedConnection` truthy?
2. Browser console for errors
3. React DevTools - check component state

---

## Performance Checks

### API Calls
- [ ] Only ONE API call to fetch tasks (not two separate calls)
- [ ] Merged connection cached (check React Query DevTools)
- [ ] No excessive re-renders

### Database
- [ ] RLS policies don't slow down queries significantly
- [ ] Queries complete in < 500ms

### UI
- [ ] Owner filter changes are instant (client-side)
- [ ] No flickering or layout shifts
- [ ] Smooth task list rendering

---

## Sign-Off

### Before Committing to Main
- [ ] All Test Scenario 1 tests pass
- [ ] All Test Scenario 3 tests pass (merged mode)
- [ ] All Test Scenario 5 tests pass (security)
- [ ] Mobile UI works (Scenario 4)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Performance is acceptable

### Ready to Proceed?
- [ ] YES - Merged mode for tasks works perfectly!
- [ ] NO - Issues found: _________________

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Commit the changes to git
2. Deploy to production (if applicable)
3. Move to next feature:
   - `/complete-feature-merged projects`
   - `/complete-feature-merged calendar`

### If Tests Fail ❌
1. Document the issue in this file
2. Ask Claude for help troubleshooting
3. Fix the issue
4. Re-test

---

**Testing Date:** __________
**Tested By:** __________
**Overall Result:** [ ] PASS / [ ] FAIL
**Notes:** _________________________________
