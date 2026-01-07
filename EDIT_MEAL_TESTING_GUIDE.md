# 🧪 Testing Meal Editing Feature

## 🎯 What Was Fixed

I've enhanced the meal editing functionality with:
1. ✅ **Better logging** - Console shows what's happening
2. ✅ **State synchronization** - Edited name updates when meal changes
3. ✅ **Loading states** - Buttons disabled while saving
4. ✅ **Visual feedback** - Fade-in animation for edit mode

---

## 🚀 How to Test Editing

### **Step 1: Refresh Browser**
- Press **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)
- Open **Developer Console** (F12 → Console tab)

### **Step 2: Add a Test Meal**
1. Click "+ Add breakfast"
2. Type "Test Meal"
3. Press Enter
4. ✅ Meal should appear in the grid

### **Step 3: Edit the Meal**

**Method 1: Click on meal name**
1. Click directly on "Test Meal" text
2. ✅ Should enter edit mode (input field appears)
3. Type "Scrambled Eggs"
4. Press **Enter**
5. ✅ Should save and show "Scrambled Eggs"

**Method 2: Use edit button**
1. Hover over the meal
2. Click the **pencil icon** (✏️)
3. ✅ Should enter edit mode
4. Type "Pancakes"
5. Click the **green checkmark** (✓)
6. ✅ Should save and show "Pancakes"

### **Step 4: Check Console Logs**

You should see:
```
[MealItem] Saving meal: {
  mealId: "...",
  oldName: "Test Meal",
  newName: "Scrambled Eggs",
  customMeal: "Test Meal",
  recipeId: undefined
}
[MealItem] Meal updated successfully!
```

---

## ❌ Troubleshooting

### **Issue 1: Edit mode opens but doesn't save**

**Symptoms:**
- Click on meal name → input appears
- Type new name → press Enter
- Nothing happens or reverts to old name

**Check Console for:**
```
[MealItem] Failed to update meal: Error: ...
```

**Possible causes:**
1. **RLS policies blocking update** - Run RLS fix script
2. **Network error** - Check internet connection
3. **Invalid meal ID** - Check if meal exists in database

**Fix:**
```sql
-- Go to Supabase SQL Editor
-- Run the RLS policies from: scripts/fix-meal-planning-rls.sql
```

### **Issue 2: Edit mode doesn't open**

**Symptoms:**
- Click on meal name → nothing happens
- Click edit button → nothing happens

**Check Console for:**
- Any JavaScript errors
- React errors

**Fix:**
- Hard refresh (Cmd+Shift+R)
- Check if React is rendering properly

### **Issue 3: Meal name doesn't update after save**

**Symptoms:**
- Edit mode closes
- Console shows "Meal updated successfully!"
- But meal name stays the same

**Possible causes:**
1. **React Query cache not updating** - Should auto-update
2. **Database update failed silently**

**Fix:**
1. Refresh the page (Cmd+R)
2. Check Supabase database directly:
   ```sql
   SELECT * FROM planned_meals ORDER BY created_at DESC LIMIT 5;
   ```

---

## 🎨 Visual States

### **Default State**
```
┌─────────────────────────────────────┐
│  Scrambled Eggs                     │
└─────────────────────────────────────┘
```

### **Hover State**
```
┌─────────────────────────────────────┐
│  Scrambled Eggs    🔥150  📊  ✏️  🗑️│
└─────────────────────────────────────┘
```

### **Editing State**
```
┌─────────────────────────────────────┐
│  [Scrambled Eggs_____]  ✓  ✗        │
└─────────────────────────────────────┘
```

### **Saving State** (buttons disabled)
```
┌─────────────────────────────────────┐
│  [Scrambled Eggs_____]  ✓  ✗        │
│  (input disabled, buttons grayed)   │
└─────────────────────────────────────┘
```

---

## 🔍 Console Messages to Look For

### **✅ Success Flow:**
```
[MealItem] Saving meal: {...}
[MealItem] Meal updated successfully!
```

### **❌ Error Flow:**
```
[MealItem] Saving meal: {...}
[MealItem] Failed to update meal: Error: permission denied
```

### **❌ Empty Name:**
```
(No console message - just closes edit mode)
```

---

## 🧪 Test Scenarios

### **Test 1: Basic Edit**
1. Add meal "Test"
2. Edit to "Breakfast"
3. ✅ Should save as "Breakfast"

### **Test 2: Long Name**
1. Add meal "Short"
2. Edit to "Very Long Meal Name That Wraps To Two Lines"
3. ✅ Should save and display on 2 lines

### **Test 3: Special Characters**
1. Add meal "Test"
2. Edit to "Eggs & Bacon (with cheese)"
3. ✅ Should save with special characters

### **Test 4: Empty Name**
1. Add meal "Test"
2. Edit and delete all text
3. Press Enter
4. ✅ Should cancel and keep "Test"

### **Test 5: Cancel Edit**
1. Add meal "Original"
2. Click to edit
3. Type "Changed"
4. Press **Esc** (or click ✗)
5. ✅ Should cancel and keep "Original"

### **Test 6: Edit Multiple Meals**
1. Add 3 meals: "Breakfast", "Lunch", "Dinner"
2. Edit each one to different names
3. ✅ All should save independently

---

## 📊 Expected Behavior

| Action | Expected Result |
|--------|----------------|
| Click meal name | Enter edit mode |
| Click edit button (✏️) | Enter edit mode |
| Type new name + Enter | Save and exit edit mode |
| Type new name + click ✓ | Save and exit edit mode |
| Press Esc | Cancel and exit edit mode |
| Click ✗ | Cancel and exit edit mode |
| Click outside | Auto-save and exit edit mode |
| Empty name + Enter | Cancel (don't save) |
| While saving | Buttons disabled |

---

## 🎯 What to Report

If editing doesn't work, please share:

1. **Console messages** - Copy-paste from browser console
2. **What you clicked** - Meal name or edit button?
3. **What happened** - Did edit mode open? Did it save?
4. **Any errors** - Red errors in console?

Example:
```
I clicked on "Test Meal" and the input appeared.
I typed "Scrambled Eggs" and pressed Enter.
The input closed but the name didn't change.

Console shows:
[MealItem] Saving meal: {...}
[MealItem] Failed to update meal: Error: permission denied
```

---

## 🚀 Quick Test

**30-second test:**
1. Refresh browser (Cmd+Shift+R)
2. Add meal "Test"
3. Click on "Test"
4. Type "Works!"
5. Press Enter
6. ✅ Should show "Works!"

**If this works, editing is working! 🎉**

**If not, check console and share the error message.**

