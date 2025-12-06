# Budget Templates Feature

## Overview
Budget templates allow you to set up your budget categories once and have them automatically apply to new months. No more manual copying!

## How It Works

### 1. Set Up Templates (One Time)
- Navigate to the Budgets page
- Click **"Manage Templates"** button in the header
- Set default amounts for each category you want to budget for
- Click **"Save Templates"**

### 2. Auto-Apply to New Months
When you navigate to a new month that has no budgets:
- The system automatically creates budgets from your templates
- All your template amounts are copied to the new month
- You can then adjust individual budgets for that month if needed

### 3. Manage Templates Anytime
- Click **"Manage Templates"** to view/edit your templates
- Add new category templates
- Update existing template amounts
- Delete templates you no longer need

## Key Features

### Database Schema
New `budget_templates` table:
- `id`: unique identifier
- `user_id`: user ownership
- `category_id`: references categories table
- `default_amount`: the template budget amount
- Unique constraint on (user_id, category_id)

### API Methods
New methods in `FinanceAPI`:
- `listBudgetTemplates()`: Get all user's templates
- `upsertBudgetTemplate()`: Create/update a template
- `deleteBudgetTemplate()`: Remove a template
- `initializeBudgetsFromTemplates()`: Auto-create budgets for a month

### Auto-Initialization Logic
Location: `src/finance/pages/BudgetsPage.tsx:38-53`

When loading budgets for a month:
```typescript
if (budgets.length === 0) {
  const initialized = await api.initializeBudgetsFromTemplates(month);
  // Reload budgets if templates were applied
}
```

### Template Manager UI
Component: `src/finance/components/budgets/BudgetTemplateManager.tsx`

Features:
- Visual template editor with all categories
- Highlights categories with templates set
- Easy amount editing
- Delete individual templates
- Shows template count

## Migration

File: `supabase/migrations/20251117_add_budget_templates.sql`

### To Apply Migration

**Option 1: Via Supabase CLI**
```bash
npx supabase db push
```

**Option 2: Direct Database Execution**
Execute the migration file directly on your Supabase database through the Supabase dashboard SQL editor.

### What the Migration Does
1. Creates `budget_templates` table
2. Adds indexes for performance
3. Sets up Row Level Security (RLS) policies
4. Creates `initialize_budgets_from_templates()` database function
5. Migrates existing budgets to templates (most recent budget per category)

## User Flow

### First Time Setup
1. User navigates to Budgets page
2. Sees empty state with message: "Set up budget templates once and they'll automatically apply to every new month"
3. Clicks **"Set Up Templates"**
4. Enters default amounts for their categories
5. Saves templates

### Monthly Usage
1. User navigates to a new month (e.g., December 2025)
2. System automatically creates budgets from templates
3. User sees all their budgets pre-filled
4. User can adjust specific budgets for that month if needed
5. Template amounts remain unchanged for future months

### Editing Templates
1. User clicks **"Manage Templates"**
2. Updates template amounts
3. Saves changes
4. Future months will use the new template amounts
5. Past months remain unchanged

## Benefits

### Before (Manual Copying)
- Had to click "Copy Last Month" every month
- Tedious and error-prone
- Easy to forget categories
- No consistent baseline

### After (Templates)
- Set up once, works forever
- Automatic application to new months
- Consistent budgeting baseline
- Can still customize per month

## Technical Details

### Database Function
The `initialize_budgets_from_templates()` function:
- Takes user_id and month as parameters
- Inserts budgets from templates if they don't exist
- Returns count of budgets created
- Prevents duplicates with EXISTS check

### Row Level Security
All template operations are protected by RLS:
- Users can only see their own templates
- Users can only modify their own templates
- Enforced at database level

### Type Safety
Full TypeScript support:
- `BudgetTemplate` type
- `BudgetTemplateInput` type
- API interface methods

## Future Enhancements

Potential improvements:
1. Template groups (e.g., "Tight Month", "Normal", "Generous")
2. Seasonal templates (different amounts for different months)
3. Template sharing between users
4. Import/export templates
5. Template recommendations based on spending history

## Testing Checklist

- [x] TypeScript compilation successful
- [ ] Database migration applied
- [ ] Templates CRUD operations work
- [ ] Auto-initialization works on month change
- [ ] Template manager UI functional
- [ ] RLS policies enforce user isolation
- [ ] Existing budgets not affected
