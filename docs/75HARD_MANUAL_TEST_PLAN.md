# 75 Hard - Manual Test Plan

**Purpose:** Verify all fixes work correctly in real-world usage
**Time Required:** 10-15 minutes
**Prerequisites:** Active 75 Hard challenge

---

## Test 1: Task Duplication on Reload ⚠️ CRITICAL

**What we're testing:** Ensure reload doesn't create duplicate tasks

### Steps:
1. Open the app (make sure you have an active 75 Hard challenge)
2. Go to Dashboard and note the number of 75 Hard tasks visible
   - **Expected:** 3-5 tasks (depending on your challenge setup)
3. **Rapidly reload the page 5 times** (press Cmd+R or Ctrl+R repeatedly)
4. After reloads complete, count the tasks again
5. Open browser console and look for these logs:
   ```
   [75Hard→Todo] 🔍 ensureSFHTodosForToday() called
   [75Hard→Todo] ⏸️  Execution already in progress...
   OR
   [75Hard→Todo] ⏭️  Skipping - called Xms ago...
   ```

### Expected Result:
✅ **PASS:** Same number of tasks as before (no duplicates created)
✅ **PASS:** Console shows guard messages (⏸️ or ⏭️)

❌ **FAIL:** More tasks appear after reload

---

## Test 2: 75 Hard Tasks Not in Tasks Tab ⚠️ CRITICAL

**What we're testing:** Ensure 75 Hard tasks don't appear in Tasks tab

### Steps:
1. Go to **Tasks** tab (TickTick view)
2. Look through all tasks in the list
3. Check specifically for tasks with 🔥 emoji (these are 75 Hard tasks)
4. Switch to **Kanban view**
5. Check the "To Do" and "Done" columns
6. Look for any 75 Hard tasks (🔥 Follow a Diet, 🔥 Workout, etc.)

### Expected Result:
✅ **PASS:** No 75 Hard tasks (with 🔥 emoji) visible anywhere
✅ **PASS:** Only regular todos are shown

❌ **FAIL:** 75 Hard tasks appear in any view

---

## Test 3: Motivational Quotes

**What we're testing:** Ensure motivational quotes appear correctly

### Steps:
1. Go to **Dashboard**
2. If all 75 Hard tasks for today are NOT complete:
   - Complete all remaining tasks (check them off)
3. Look at the 75 Hard widget on Dashboard
4. You should see a green card with a motivational quote

### Expected Result:
✅ **PASS:** Green card appears with motivational quote
✅ **PASS:** Quote is appropriate and readable
✅ **PASS:** Quote matches the current day number

❌ **FAIL:** Quote doesn't appear or shows "All Done!" instead

---

## Test 4: Dashboard Stats Accuracy

**What we're testing:** Ensure week's progress doesn't count 75 Hard tasks

### Steps:
1. Go to **Dashboard**
2. Look at the "Week's Progress" stat card
3. Note the number shown
4. Go to **Tasks** tab → click **Kanban** view
5. Manually count tasks in the "Done" column
6. Compare the count

### Expected Result:
✅ **PASS:** Dashboard count matches Kanban "Done" count
✅ **PASS:** 75 Hard tasks are NOT included in the count

❌ **FAIL:** Counts don't match or 75 Hard tasks are counted

---

## Test 5: Task Toggle Reliability

**What we're testing:** Ensure task toggling works reliably

### Steps:
1. Go to **Dashboard** or **75 Hard** page
2. Pick any uncompleted task
3. Click to complete it
4. Wait for UI to update
5. **Rapidly click the same task on/off 5 times**
6. Stop clicking and wait 2 seconds
7. Check the final state

### Expected Result:
✅ **PASS:** Task state stabilizes (either on or off)
✅ **PASS:** No errors in console
✅ **PASS:** State persists after page reload

❌ **FAIL:** Task state is incorrect or errors appear

---

## Test 6: Network Failure Handling (Optional)

**What we're testing:** Ensure graceful handling when network fails

### Steps:
1. Open browser DevTools → Network tab
2. Toggle "Offline" mode in Network tab
3. Try to complete a 75 Hard task
4. Look for toast error message

### Expected Result:
✅ **PASS:** Error toast appears ("Failed to update task...")
✅ **PASS:** Task reverts to original state
✅ **PASS:** No console errors

❌ **FAIL:** App crashes or no error message

---

## Test 7: Cleanup of Old Tasks

**What we're testing:** Ensure yesterday's tasks are cleaned up

### Steps:
1. Check current day number in 75 Hard
2. Go to **Tasks** tab
3. Look for any 75 Hard tasks from previous days
4. Check console logs for:
   ```
   [75Hard→Todo] 🧹 Cleanup: current day=X
   [75Hard→Todo] Found Y old todos to delete
   ```

### Expected Result:
✅ **PASS:** No old 75 Hard tasks visible
✅ **PASS:** Only today's 75 Hard tasks exist
✅ **PASS:** Console shows cleanup ran successfully

❌ **FAIL:** Old tasks from previous days are still visible

---

## Console Monitoring

### Good Logs (What You Want to See):

```
[75Hard→Todo] 🔍 ensureSFHTodosForToday() called
[75Hard→Todo] ⏸️  Execution already in progress, waiting...
```
OR
```
[75Hard→Todo] 🔍 ensureSFHTodosForToday() called
[75Hard→Todo] ⏭️  Skipping - called 500ms ago (debounce: 1000ms)
```
OR
```
[75Hard→Todo] 🔍 ensureSFHTodosForToday() called
[75Hard→Todo] ▶️  Starting execution...
[75Hard→Todo]   Processing task: "Follow a Diet" (day 1)
[75Hard→Todo]   ✓ Found existing todo (id: abc12345)
[75Hard→Todo]   ✅ Updated "Follow a Diet"
[75Hard→Todo] ✅ Execution complete
```

### Bad Logs (Report These):

```
[75Hard→Todo] ❌ Error during execution: [error]
```
OR
```
Multiple [75Hard→Todo] ▶️  Starting execution... within 1 second
```
OR
```
[75Hard→Todo]   ✅ Created "Follow a Diet"  ← (should say "Updated" if task exists)
```

---

## Result Summary

Fill this out after testing:

| Test | Status | Notes |
|------|--------|-------|
| 1. Reload Duplication | ☐ Pass ☐ Fail | |
| 2. Tasks Tab Filter | ☐ Pass ☐ Fail | |
| 3. Motivational Quotes | ☐ Pass ☐ Fail | |
| 4. Dashboard Stats | ☐ Pass ☐ Fail | |
| 5. Task Toggle | ☐ Pass ☐ Fail | |
| 6. Network Failure | ☐ Pass ☐ Fail | |
| 7. Task Cleanup | ☐ Pass ☐ Fail | |

---

## If Tests Fail

1. **Note the specific test that failed**
2. **Copy console logs** (all [75Hard] messages)
3. **Take screenshots** if relevant
4. **Note the steps to reproduce**
5. **Share with developer** for debugging

---

## Expected Outcome

If all tests pass:
- ✅ No task duplicates
- ✅ Clean Tasks tab (no 75 Hard tasks)
- ✅ Motivational quotes working
- ✅ Accurate stats
- ✅ Reliable task toggling
- ✅ Graceful error handling
- ✅ Old tasks cleaned up

**This means the implementation is production-ready!** 🎉

---

## Quick Smoke Test (30 seconds)

If you don't have time for full testing:

1. **Reload page 3 times** → Check for duplicate tasks
2. **Go to Tasks tab** → Should see NO 75 Hard tasks
3. **Complete all 75 Hard tasks** → Should see motivational quote
4. **Reload again** → Everything should still work

If all 4 steps pass, the implementation is likely solid! ✅
