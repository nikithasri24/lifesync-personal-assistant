# Recurring Transactions Migration

This directory contains the SQL migration files to add recurring transactions functionality to the Finance module.

## Migration Files

### 1. `20240215000001_create_recurring_transactions.sql`
Creates the core tables and indexes:
- **`recurring_transactions`** - Templates for recurring transactions
- **`pending_transactions`** - Pending transactions awaiting review/approval
- Indexes for performance optimization
- Constraints for data integrity
- Triggers for auto-updating timestamps

### 2. `20240215000002_recurring_transactions_rls.sql`
Sets up Row Level Security (RLS) policies:
- Users can only access their own recurring transactions
- Users can only access their own pending transactions
- Proper permissions for authenticated users

## Prerequisites

Ensure these tables exist before running the migrations:
- `auth.users` (Supabase auth table)
- `finance_categories`
- `finance_accounts`
- `finance_transactions`

## Running the Migrations

### Option 1: Supabase CLI
```bash
# Navigate to project root
cd /path/to/lifesync-personal-assistant

# Run migrations
supabase db push

# Or run specific migration
supabase migration up
```

### Option 2: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each migration file in order
4. Execute each SQL script

### Option 3: Manual SQL
Connect to your database and run:
```bash
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20240215000001_create_recurring_transactions.sql
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20240215000002_recurring_transactions_rls.sql
```

## Verifying the Migration

After running the migrations, verify the tables were created:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('recurring_transactions', 'pending_transactions');

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('recurring_transactions', 'pending_transactions');

-- Check policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('recurring_transactions', 'pending_transactions');
```

## Sample Data (Optional)

To test the functionality, you can insert sample data:

```sql
-- Insert a sample recurring transaction (monthly rent)
INSERT INTO recurring_transactions (
  user_id,
  description,
  amount,
  type,
  frequency,
  start_date,
  day_of_month,
  auto_create,
  require_approval,
  days_before,
  active
) VALUES (
  auth.uid(), -- Your user ID
  'Monthly Rent',
  1500.00,
  'debit',
  'monthly',
  '2024-01-01',
  1, -- First day of month
  false,
  true,
  3, -- Notify 3 days before
  true
);

-- Insert a sample recurring transaction (weekly grocery budget)
INSERT INTO recurring_transactions (
  user_id,
  description,
  amount,
  type,
  frequency,
  start_date,
  day_of_week,
  auto_create,
  require_approval,
  days_before,
  active
) VALUES (
  auth.uid(),
  'Weekly Groceries',
  150.00,
  'debit',
  'weekly',
  '2024-01-01',
  0, -- Sunday
  false,
  true,
  1,
  true
);
```

## Rollback

If you need to rollback the migration:

```sql
-- Drop tables (will cascade delete all data)
DROP TABLE IF EXISTS pending_transactions CASCADE;
DROP TABLE IF EXISTS recurring_transactions CASCADE;

-- Drop trigger function if no longer needed
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## Scheduled Job Setup

To automatically generate pending transactions, set up a scheduled job:

### Option 1: Supabase Edge Functions (Recommended)
Create a daily cron job using Supabase Edge Functions:

```typescript
// supabase/functions/generate-pending-transactions/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Call your generatePendingTransactions logic here
  // This would need to be adapted to run server-side

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

Then schedule it:
```bash
# Deploy the function
supabase functions deploy generate-pending-transactions

# Set up cron (in Supabase dashboard)
# Schedule: 0 0 * * * (daily at midnight UTC)
```

### Option 2: Database Cron (pg_cron extension)
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily job at midnight UTC
SELECT cron.schedule(
  'generate-pending-transactions',
  '0 0 * * *',
  $$
  -- Your generation logic here
  -- Note: This would require implementing the generation logic in SQL
  $$
);
```

### Option 3: External Cron Job
Set up a cron job on your server to call the API endpoint:
```bash
# crontab -e
0 0 * * * curl -X POST https://your-app.com/api/finance/generate-pending-transactions
```

## Troubleshooting

### Foreign Key Errors
If you get foreign key constraint errors, ensure the referenced tables exist:
- `finance_categories`
- `finance_accounts`
- `finance_transactions`

### Permission Errors
If users can't access their data, verify RLS policies:
```sql
SELECT * FROM pg_policies
WHERE tablename = 'recurring_transactions';
```

### Timezone Issues
All timestamps use UTC. The application should handle timezone conversion on the frontend.

## Next Steps

1. ✅ Run migrations
2. ✅ Verify tables and RLS policies
3. ⏭️ Wire up UI components in `/src/finance/components/recurring/`
4. ⏭️ Set up scheduled job for `generatePendingTransactions()`
5. ⏭️ Test the full workflow in the app

## Support

For issues or questions, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- Project GitHub issues
