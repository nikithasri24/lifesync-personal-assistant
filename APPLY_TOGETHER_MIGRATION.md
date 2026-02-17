# Apply Together Feature Migration

The Together feature database schema has been created in:
`supabase/migrations/20260218_000000_add_together_feature.sql`

## Quick Apply (Recommended)

Run this command to apply the migration to your Supabase database:

```bash
# Using Supabase CLI (if linked)
supabase db push --include-all

# OR manually via SQL Editor in Supabase Dashboard
# 1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql
# 2. Copy the contents of supabase/migrations/20260218_000000_add_together_feature.sql
# 3. Paste and run the SQL
```

## What This Migration Creates

### Tables:
- **partner_links** - Link two user accounts as partners
- **milestones** - Track birthdays, anniversaries, important dates
- **partner_messages** - Personal letters with reveal triggers
- **achievement_rewards** - Gamified challenges with unlockable rewards

### Views:
- `active_partner_links` - Active partner connections with days together
- `upcoming_milestones` - Next 30 days of milestones
- `pending_message_reveals` - Messages awaiting reveal
- `active_challenges` - Active challenges with progress

### Security:
- Row Level Security (RLS) policies on all tables
- Users can only see their own data and their partner's data
- Proper authorization checks for all operations

## Test the Feature

Once migrated, test the Together feature:

1. **Link Partner Accounts**
   ```
   - Navigate to /together
   - Click "Link Partner"
   - Enter partner email: srinikithakalidindi@gmail.com
   - Set anniversary date (optional)
   - Send request
   ```

2. **Create Birthday Milestone**
   ```
   - Go to Milestones tab
   - Click "+ Add"
   - Select "Birthday"
   - Enter: Feb 18, 1991
   - Set for "Partner"
   - Enable reminders
   - Add notes: "Gift ideas, plans..."
   ```

3. **View Upcoming Milestones**
   ```
   - See countdown ("In 2 days")
   - View milestone details
   - Check reminders scheduled
   ```

## Troubleshooting

If migration fails:
1. Check Supabase project connection
2. Verify you have database permissions
3. Look for conflicting table names
4. Check SQL Editor for error details

## Next Steps

After migration:
- ✅ Link with partner account (srinikithakalidindi@gmail.com)
- ✅ Create husband's birthday milestone (Feb 18)
- 🚧 Create birthday message (Phase 2 - Coming soon)
- 🚧 Set up achievement challenges (Phase 3 - Coming soon)
