# 🚀 How to Apply Database Migrations

## Quick Steps

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

