# Apply Budget Templates Migration

The migration is ready but needs to be applied to your database. Here's the easiest way:

## Option 1: Supabase Dashboard (Recommended - 2 minutes)

1. **Open SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/rfwaiijodrowakcpayoa/sql
   - Click **"New Query"**

2. **Copy the migration SQL:**
   ```bash
   cat supabase/migrations/20251117_add_budget_templates.sql
   ```

   Or open the file: `supabase/migrations/20251117_add_budget_templates.sql`

3. **Paste and Run:**
   - Paste the entire SQL into the editor
   - Click **"Run"** (or Cmd/Ctrl + Enter)

4. **Verify Success:**
   You should see messages like:
   ```
   ✅ Budget templates table created successfully
   📊 Migrated X budget templates from existing budgets
   ```

## Option 2: Command Line (If you have db password)

If you have the database password, you can apply directly:

```bash
psql "postgresql://postgres:[YOUR_PASSWORD]@db.rfwaiijodrowakcpayoa.supabase.co:5432/postgres" \
  -f supabase/migrations/20251117_add_budget_templates.sql
```

## What the Migration Does

- ✅ Creates `budget_templates` table
- ✅ Sets up Row Level Security policies
- ✅ Creates auto-initialization function
- ✅ Migrates your existing budgets to templates (most recent budget per category)
- ✅ Adds indexes for performance

## After Migration

Once applied, the budget templates feature will be immediately available:

1. Go to Finance → Budgets
2. Click **"Manage Templates"**
3. Set your default budget amounts
4. Navigate to a new month - budgets auto-appear!

---

**Stuck?** The migration SQL is in:
`supabase/migrations/20251117_add_budget_templates.sql`

Just copy-paste it into the Supabase SQL Editor and click Run!
