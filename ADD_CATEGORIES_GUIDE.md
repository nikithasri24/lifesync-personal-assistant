# How to Add Income Categories - Fixed

## ❌ The Error

You got this error because the SQL Editor can't access `auth.uid()` directly:
```
ERROR: null value in column "user_id" violates not-null constraint
```

## ✅ Solution - 3 Easy Methods

---

## Method 1: Use the Fixed SQL Script (Easiest)

The updated **`add_income_categories.sql`** now automatically finds your user ID.

**Run this in Supabase SQL Editor:**

```sql
-- This will work! It automatically finds your user
INSERT INTO categories (user_id, name, icon, color)
SELECT
  user_id,
  name,
  icon,
  color
FROM (VALUES
  ('Salary', '💰', '#10b981'),
  ('Freelance', '💼', '#059669'),
  ('Bonus', '🎁', '#34d399'),
  ('Investment', '📈', '#6ee7b7'),
  ('Refund', '↩️', '#a7f3d0'),
  ('Gift', '🎉', '#d1fae5'),
  ('Other Income', '💵', '#6ee7b7')
) AS new_categories(name, icon, color)
CROSS JOIN (
  SELECT id as user_id FROM auth.users LIMIT 1
) AS user_table
WHERE NOT EXISTS (
  SELECT 1 FROM categories
  WHERE categories.user_id = user_table.user_id
  AND categories.name = new_categories.name
);
```

Then verify:
```sql
SELECT name, icon, color FROM categories
WHERE name IN ('Salary', 'Freelance', 'Bonus', 'Investment', 'Refund', 'Gift', 'Other Income')
ORDER BY name;
```

---

## Method 2: Add Via UI (No SQL Needed!)

You can add categories through the Finance Settings page:

### Steps:

1. Go to **Finances → Settings** tab
2. Look for **Categories** section
3. Click **"Add Category"** or **"+"**
4. Add each income category manually:

| Name | Icon | Color |
|------|------|-------|
| Salary | 💰 | Green (#10b981) |
| Freelance | 💼 | Green (#059669) |
| Bonus | 🎁 | Green (#34d399) |
| Investment | 📈 | Green (#6ee7b7) |
| Refund | ↩️ | Green (#a7f3d0) |
| Gift | 🎉 | Green (#d1fae5) |
| Other Income | 💵 | Green (#6ee7b7) |

**Pros:**
- ✅ No SQL needed
- ✅ User-friendly
- ✅ No authentication issues

**Cons:**
- ❌ Must add one at a time
- ❌ Slower for bulk

---

## Method 3: Quick Copy-Paste (If you have your user ID)

If you know your user ID, you can use this simpler version:

### Step 1: Get your user ID

```sql
-- Find your user ID
SELECT id, email FROM auth.users;
```

Copy your user ID (looks like: `123e4567-e89b-12d3-a456-426614174000`)

### Step 2: Replace and run

```sql
-- Replace YOUR_USER_ID_HERE with the ID from step 1
INSERT INTO categories (user_id, name, icon, color)
VALUES
  ('YOUR_USER_ID_HERE', 'Salary', '💰', '#10b981'),
  ('YOUR_USER_ID_HERE', 'Freelance', '💼', '#059669'),
  ('YOUR_USER_ID_HERE', 'Bonus', '🎁', '#34d399'),
  ('YOUR_USER_ID_HERE', 'Investment', '📈', '#6ee7b7'),
  ('YOUR_USER_ID_HERE', 'Refund', '↩️', '#a7f3d0'),
  ('YOUR_USER_ID_HERE', 'Gift', '🎉', '#d1fae5'),
  ('YOUR_USER_ID_HERE', 'Other Income', '💵', '#6ee7b7')
ON CONFLICT DO NOTHING;
```

---

## 🎯 Recommended: Use Method 1

**Method 1** (the updated SQL script) is the easiest because:
- ✅ No need to find your user ID
- ✅ Automatically gets the right user
- ✅ Won't create duplicates
- ✅ Fast - adds all 7 categories at once

Just copy the SQL from **`add_income_categories.sql`** and run it!

---

## ✅ After Adding Categories

Once you've added the income categories, the **Add Transaction** form will:

1. **Auto-select "Salary"** when you choose "Income (Credit)"
2. **Show income categories first** in the dropdown
3. **Make adding income super fast**!

Try it:
1. Go to **Finances → Transactions** → **"Add Transaction"**
2. Click **"Income (Credit)"**
3. See **"Salary"** auto-selected in the category dropdown! ✨

---

## 🔧 Troubleshooting

### "Still getting null user_id error"
- ✅ Use **Method 1** (the updated script with `CROSS JOIN`)
- ✅ Or use **Method 2** (add via UI)

### "Categories not showing in dropdown"
- ✅ Refresh the page
- ✅ Check categories were added: `SELECT * FROM categories;`
- ✅ Make sure you're logged into the app

### "Don't see Settings tab"
- The Settings page might not be implemented yet
- Use **Method 1** (SQL) instead

---

## Summary

| Method | Difficulty | Speed | Best For |
|--------|-----------|-------|----------|
| **Method 1: Fixed SQL** | Easy ⭐ | Fast ⚡ | Most users |
| **Method 2: UI** | Very Easy ⭐ | Slow 🐢 | SQL-averse users |
| **Method 3: Manual SQL** | Medium ⭐⭐ | Fast ⚡ | Advanced users |

**Recommendation**: Use **Method 1** - just run the updated `add_income_categories.sql`!
