# 🚀 How to Apply Database Migrations

## 🆕 LATEST: Meal Substitution & Backlog Feature (2025-12-27)

### Apply This Migration Now! ⚡

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your LifeSync project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy the Migration File**
   - Open: `supabase/migrations/20251227000001_meal_substitution_and_backlog.sql`
   - Copy the entire contents (Cmd+A, Cmd+C)

4. **Paste and Run**
   - Paste into the SQL Editor
   - Click "Run" button (or press Cmd+Enter)

5. **Check Results**
   - You should see verification results at the bottom
   - Should show 6 rows (5 new columns in planned_meals + 1 in food_log)

6. **Done!** 🎉
   - Refresh your app (Cmd+Shift+R)
   - Test the new Swap Meal feature!

---

## What This Migration Adds

### ✅ New Features:
- **Swap Meal** - Log what you actually ate instead of planned meal
- **Postpone to Backlog** - Keep meals for later
- **Nutrition Integration** - Auto-log substitutions to food tracker
- **Backlog View** - See all postponed meals in one place

### ✅ Database Changes:
- Adds 5 new columns to `planned_meals` table
- Adds 1 new column to `food_log` table
- Updates status enum to include 'substituted' and 'postponed'
- Creates indexes for fast queries

---

## Testing the New Feature

1. **Refresh your browser** (Cmd+Shift+R)
2. **Go to Meal Planning** page
3. **Hover over any meal** → See the 🔄 Swap button
4. **Click Swap** → Modal opens
5. **Enter what you ate** (e.g., "Restaurant burger")
6. **Choose "Postpone to backlog"**
7. **Click "Save Changes"**
8. **Scroll down** → See the meal in the Backlog section!

---

## Previous Migrations (For Reference)

### Option 1: Supabase Dashboard (Recommended - Easy!)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your LifeSync project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy the Migration File**
   - Open: `supabase/migrations/APPLY_THIS_20251226_combined_migrations.sql`
   - Copy the entire contents (Cmd+A, Cmd+C)

4. **Paste and Run**
   - Paste into the SQL Editor
   - Click "Run" button (or press Cmd+Enter)

5. **Check Results**
   - You should see success messages:
     ```
     ✅ SUCCESS: pending_email_invitations table created
     ✅ SUCCESS: lookup_user_by_email function created
     ✅ SUCCESS: process_pending_invitations_on_signup function created
     ```

6. **Done!** 🎉
   - The migrations are now applied
   - You can now invite users who don't have accounts

---

### Option 2: Supabase CLI (If you have it set up)

```bash
# Make sure you're in the project directory
cd /Users/sri.nikitha/Documents/GenAI/lifesync-personal-assistant

# Link to your Supabase project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations to remote database
npx supabase db push
```

---

## What These Migrations Do

### 1. **lookup_user_by_email Function**
   - Allows the app to search for users by email
   - Returns user profile info if they exist
   - Used to check if someone has an account

### 2. **pending_email_invitations Table**
   - Stores invitations to people who don't have accounts yet
   - Tracks: who invited, email, relationship, message, permissions
   - Auto-expires after 30 days

### 3. **Auto-Process Trigger**
   - When someone signs up with an email that has pending invitations
   - Automatically converts them to real connections
   - They'll see the invitations in their "Received" tab

---

## Testing After Migration

1. **Go to your app**: http://localhost:5173
2. **Navigate to**: Shared → Add New Connection
3. **Try inviting**: someone@newdomain.com (an email that doesn't exist)
4. **Expected result**: 
   - ✅ No more 400 error!
   - ✅ Shows "Invitation Sent"
   - ✅ Appears in your "Sent Invitations"

---

## Troubleshooting

### If you see errors about "profiles table doesn't exist":
The migration uses the `profiles` table. Make sure you have the profiles table migration applied first.

### If you see "permission denied":
Make sure you're running this as a database admin in the Supabase dashboard.

### If the trigger doesn't work:
Check that the `auth.users` table is accessible. The trigger runs on INSERT to `auth.users`.

---

## Need Help?

If you encounter any issues:
1. Check the Supabase Dashboard → Database → Tables
2. Verify `pending_email_invitations` table exists
3. Check SQL Editor → Functions
4. Verify `lookup_user_by_email` function exists

---

## Summary

**Before Migration:**
- ❌ 400 error when inviting new emails
- ❌ Could only invite existing users

**After Migration:**
- ✅ Can invite anyone by email
- ✅ Pending invitations for new users
- ✅ Auto-converts when they sign up
- ✅ Clean invitation flow

**Ready to go!** 🚀

