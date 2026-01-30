# Supabase Stale Tables Analysis

**Date:** 2026-01-30  
**Total Tables Found:** 89  
**Potentially Stale:** 7 tables

---

## 🔴 Stale Tables Identified

### Legacy Finance Tables (5 tables)

These appear to be from a finance module refactoring where tables were renamed with `finance_*` prefix:

| Old Table | Replacement | Status |
|-----------|-------------|--------|
| `transactions` | `finance_transactions` | 🔴 Duplicate |
| `accounts` | `finance_accounts` | 🔴 Duplicate |
| `categories` | `finance_categories` | 🔴 Duplicate |
| `financial_accounts` | `finance_accounts` | 🔴 Duplicate |
| `financial_transactions` | `finance_transactions` | 🔴 Duplicate |

### Unclear Purpose (2 tables)

| Table | Issue |
|-------|-------|
| `achievements` | Possible duplicate of `achievement_definitions` |
| `_sql` | Unknown purpose - likely migration artifact |

---

## 📋 How to Clean Up

### Step 1: Verify Tables Exist and Check Data

Run the verification script in Supabase SQL Editor:

```bash
# Copy the file content
cat supabase/migrations_archive/VERIFY_stale_tables.sql
```

Then paste and run in **Supabase Dashboard → SQL Editor**

This will show you:
- Which tables actually exist
- How many rows each table has
- Whether it's safe to drop them

### Step 2: Drop Stale Tables

If verification shows tables are empty or duplicates, run the cleanup migration:

```bash
# Copy the file content
cat supabase/migrations_archive/20260130_drop_stale_tables.sql
```

Then paste and run in **Supabase Dashboard → SQL Editor**

---

## ✅ Active Tables (Keep These - 82 tables)

### Core Productivity (13)
- tasks, projects, project_tasks, project_milestones
- habits, habit_entries
- life_goals, life_goal_checkins, life_goal_milestones, life_goal_streak_history, life_goal_templates, life_dreams
- goal_progress_tracking

### Content & Notes (4)
- notes, list_items, journal_entries, inbox_items

### Calendar (3)
- calendar_events, schedule_blocks, important_dates

### Meal Planning (9)
- recipes, meal_plans, planned_meals, meal_tracking, meal_backlog
- pantry_items, food_items, food_log, nutrition_goals

### Shopping (4)
- shopping_items, shopping_lists, stores, merchant_database

### Finance - Active (19)
- finance_transactions, finance_accounts, finance_institutions
- finance_budgets, finance_budget_templates, finance_categories
- finance_goals, finance_goal_progress
- finance_loans, finance_loans_with_stats, finance_loan_payments
- finance_card_benefits, finance_card_category_bonuses, finance_card_offers, finance_welcome_bonuses
- recurring_bills, bill_payments, categorization_rules

### Travel (6)
- visited_locations, visited_parks, user_passports, user_visas, travel_journal_entries

### Personal Care (9)
- skincare_products, skincare_weekly_routines, skin_condition_logs
- personal_care_categories, personal_care_items, personal_care_products
- personal_care_item_products, personal_care_logs, personal_care_schedule

### Focus (1)
- focus_sessions

### Gamification (6)
- user_gamification, user_achievements, achievement_definitions
- xp_transactions, point_transactions, user_progress

### Collaboration (4)
- profile_connections, connection_invitations, pending_email_invitations, module_permissions

### User & Settings (3)
- user_preferences, user_settings, push_subscriptions

### AI & Automation (4)
- conversations, automation_rules, automation_log, notification_queue

### Analytics (1)
- analytics_daily

---

## 🎯 Expected Outcome

After running the cleanup migration:
- **7 stale tables removed**
- **82 active tables remain**
- **Cleaner database schema**
- **No duplicate finance tables**

---

## ⚠️ Important Notes

1. **Backup First**: Always backup your database before dropping tables
2. **Verify Data**: Run VERIFY script first to check for data
3. **Test After**: Test your application after cleanup to ensure nothing breaks
4. **RLS Policies**: CASCADE will drop related RLS policies automatically

---

## 📝 Files Created

1. `supabase/migrations_archive/VERIFY_stale_tables.sql` - Verification script
2. `supabase/migrations_archive/20260130_drop_stale_tables.sql` - Cleanup migration
3. `STALE_TABLES_ANALYSIS.md` - This document

