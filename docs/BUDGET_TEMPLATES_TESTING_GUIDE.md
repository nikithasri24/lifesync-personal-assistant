# Budget Templates - Step-by-Step Testing Guide

## Purpose
This guide walks you through verifying that the Budget Templates feature is working correctly in your application.

---

## Prerequisites

✅ **Before you start:**
1. Migration has been applied to database
2. Dev server is running (`npm run dev`)
3. You are signed in to the application
4. You have some categories set up

---

## Test Plan

### Test 1: Access the Budgets Page

**Steps:**
1. Open http://localhost:5173/
2. Navigate to **Finance** section
3. Click on **Budgets** tab

**Expected Result:**
- ✅ Page loads without errors
- ✅ You see either existing budgets OR an empty state message
- ✅ Header shows "Budgets" with month picker
- ✅ You see a "Manage Templates" button (gear icon)
- ✅ You see a "Create Budget" button

**Debug if failing:**
- Open browser console (F12)
- Look for error messages
- Check Network tab for failed API calls

---

### Test 2: Open Template Manager

**Steps:**
1. On the Budgets page
2. Click the **"Manage Templates"** button (gear icon)

**Expected Result:**
- ✅ Modal opens with title "Budget Templates"
- ✅ Modal shows all your categories
- ✅ Each category has an input field for amount
- ✅ Modal scrolls if you have many categories
- ✅ Footer shows "0 templates configured"

**Debug if failing:**
- Console: Check for component rendering errors
- Check if modal CSS is loading
- Verify `templateManagerOpen` state changes

---

### Test 3: Create Templates

**Steps:**
1. In the Template Manager modal
2. Enter amounts for 3-5 categories:
   - Example: Groceries: 600
   - Example: Gas: 150
   - Example: Entertainment: 100
3. Click **"Save Templates"**

**Expected Result:**
- ✅ Save button shows "Saving..." state
- ✅ Modal closes after save
- ✅ No error messages

**Debug if failing:**
- Console: Check for API call errors
- Network tab: Verify POST requests succeed
- Check if user is authenticated

---

### Test 4: Verify Templates Persisted

**Steps:**
1. Click **"Manage Templates"** again
2. Look at the categories you set amounts for

**Expected Result:**
- ✅ Categories with templates have blue highlight
- ✅ Amounts you entered are still there
- ✅ Footer shows "3 templates configured" (or your count)
- ✅ Delete buttons (trash icon) appear next to amounts

**Debug if failing:**
- Check database: `SELECT * FROM budget_templates;`
- Verify RLS policies allow reading
- Check API listBudgetTemplates() call

---

### Test 5: Delete a Template

**Steps:**
1. In Template Manager
2. Click the trash icon next to one template
3. Close modal
4. Reopen Template Manager

**Expected Result:**
- ✅ Template is removed immediately
- ✅ Count decreases
- ✅ Still gone after reopening

**Debug if failing:**
- Network tab: Check DELETE request
- Database: Verify row was deleted
- Check deleteBudgetTemplate() API call

---

### Test 6: Auto-Initialize Budgets (Main Feature!)

**Steps:**
1. Close Template Manager
2. Note the current month (e.g., "November 2025")
3. Change month picker to a future month with NO budgets (e.g., "January 2026")
4. Wait for page to reload data

**Expected Result:**
- ✅ Console shows: "No budgets found for [month] - initializing from templates"
- ✅ Console shows: "Initialized X budgets from templates"
- ✅ Budget cards appear automatically!
- ✅ Budget amounts match your template amounts
- ✅ No manual creation needed!

**Debug if failing:**
- Console: Check initialization logic
- Verify database function exists: `\df initialize_budgets_from_templates`
- Check that templates exist for the user
- Network: Verify RPC call succeeds

---

### Test 7: Month Navigation

**Steps:**
1. Navigate to another future month
2. Then back to the month where budgets were auto-created

**Expected Result:**
- ✅ Auto-created budgets are still there
- ✅ Auto-initialization only happens once per month
- ✅ Console shows budgets loaded, not re-initialized

---

### Test 8: Manual Budget Override

**Steps:**
1. On a month with auto-created budgets
2. Click Edit on one budget
3. Change the amount
4. Save

**Expected Result:**
- ✅ Budget updates for THIS month only
- ✅ Template remains unchanged
- ✅ Future months still use template amount
- ✅ Can verify by checking Template Manager

---

### Test 9: Empty State Messages

**Steps:**
1. Go to Budgets page
2. Navigate to a month with no budgets
3. Before: Should see message about templates
4. Delete all templates in Template Manager
5. Return to empty month

**Expected Result:**
- ✅ With templates: "Your budget templates are set up! Navigate to a new month..."
- ✅ Without templates: "Set up budget templates once and they'll automatically apply..."
- ✅ Message changes based on template existence

---

### Test 10: Scrolling in Modals

**Steps:**
1. Open Template Manager with many categories (10+)
2. Scroll through the category list
3. Try same with Create Budget modal

**Expected Result:**
- ✅ Content scrolls smoothly
- ✅ Header stays fixed at top
- ✅ Footer stays fixed at bottom
- ✅ Only middle section scrolls

---

## Console Verification

**Helpful Console Commands:**

```javascript
// In browser console while on Budgets page:

// 1. Check loaded data
console.table(budgets)
console.table(templates)
console.table(categories)

// 2. Force reload
window.location.reload()

// 3. Check state (if using React DevTools)
// Find BudgetsPage component
// Inspect hooks -> templates, budgets, etc.
```

---

## Database Verification

**Helpful SQL Queries:**

```sql
-- Check your templates
SELECT
  bt.id,
  bt.default_amount,
  c.name as category_name
FROM budget_templates bt
JOIN categories c ON c.id = bt.category_id
WHERE bt.user_id = '<your-user-id>';

-- Check auto-created budgets
SELECT
  b.month,
  c.name as category_name,
  b.limit_amount
FROM budgets b
JOIN categories c ON c.id = b.category_id
WHERE b.user_id = '<your-user-id>'
ORDER BY b.month DESC, c.name;

-- Verify function exists
\df initialize_budgets_from_templates

-- Test function manually
SELECT initialize_budgets_from_templates(
  '<your-user-id>'::uuid,
  '2026-12'
);
```

---

## Common Issues & Solutions

### Issue: "Manage Templates" button not visible
**Solution:**
- Check if Finance page loaded
- Inspect element - button should be in DOM
- Check CSS - might be hidden by theme
- Try different browser

### Issue: Modal doesn't open
**Solution:**
- Console: Look for JS errors
- Check if `templateManagerOpen` state updates
- Verify modal component imported
- Check z-index CSS conflicts

### Issue: Templates don't save
**Solution:**
- Network tab: Check for 401 (auth) or 403 (permissions)
- Verify RLS policies in database
- Check user is logged in
- Console: Look for API errors

### Issue: Auto-initialization doesn't work
**Solution:**
- Verify database function exists
- Check function has correct permissions
- Templates must exist first
- Month must have zero budgets
- Console logs should show the flow

### Issue: Wrong amounts appear
**Solution:**
- Clear browser cache
- Verify database has correct values
- Check if old budgets exist (won't overwrite)
- Re-save templates

---

## Success Criteria

✅ **Feature is working if:**
1. Can open Template Manager
2. Can create/edit/delete templates
3. Templates persist across page reloads
4. Navigating to new month auto-creates budgets
5. Budget amounts match template amounts
6. Can still manually create/edit budgets
7. No console errors
8. Scrolling works in all modals

---

## Reporting Issues

**If tests fail, collect:**
1. Screenshot of the issue
2. Browser console errors
3. Network tab (failed requests)
4. Steps to reproduce
5. Expected vs actual behavior

**Check:**
- [ ] Migration was applied
- [ ] User is authenticated
- [ ] Categories exist
- [ ] No browser console errors
- [ ] Network requests succeed

---

## Next Steps After Testing

✅ **If all tests pass:**
1. Feature is ready to use!
2. Start using templates for your budgets
3. Share feedback on UX
4. Suggest improvements

❌ **If tests fail:**
1. Review error messages
2. Check database migration
3. Verify authentication
4. Review implementation guide
5. Contact support with details

---

**Happy Testing! 🚀**
