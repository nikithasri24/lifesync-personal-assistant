# Creating Test Accounts for LifeSync

This guide explains how to create test accounts for the LifeSync application.

## Prerequisites

1. **Supabase Service Role Key**: You need the service role key from your Supabase project.

### Getting the Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your LifeSync project
3. Navigate to **Settings** → **API**
4. Under **Project API keys**, find and copy the **service_role** key
   - ⚠️ **Important**: This is different from the `anon` key
   - ⚠️ **Security**: Never expose this key in client-side code

### Adding the Key to .env.local

Open `.env.local` in the root directory and replace the placeholder:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

## Running the Script

Once you have the service role key configured:

```bash
npm run create-test-accounts
```

## Test Account Credentials

The script creates 2 test accounts with the following credentials:

### Account 1
- **Email**: test1@lifesync.app
- **Password**: TestAccount123!

### Account 2
- **Email**: test2@lifesync.app
- **Password**: TestAccount456!

## What the Script Does

1. Connects to Supabase using the admin service role key
2. Creates 2 test user accounts with auto-confirmed emails
3. Sets user metadata (display names)
4. Prints a summary of created accounts

## Using the Test Accounts

After creating the accounts:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:5173

3. Sign in using one of the test account credentials

## Troubleshooting

### "Missing required environment variables"
- Make sure `.env.local` contains `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### "Account already exists"
- The script will notify you if accounts already exist
- You can still use the existing accounts with the credentials above

### "Failed to create account"
- Check that your service role key is correct
- Ensure you have admin permissions on the Supabase project
- Verify your Supabase project is active

## Security Notes

⚠️ **Important Security Reminders**:

1. **Never commit** `.env.local` to version control (it's already in `.gitignore`)
2. **Never expose** the service role key in client-side code
3. **Only use** the service role key for admin scripts and migrations
4. Test accounts should **only be used** in development/staging environments
5. Consider using different passwords for production test accounts

## Customizing Test Accounts

To create different test accounts, edit `scripts/create-test-accounts.ts`:

```typescript
const testAccounts = [
  {
    email: 'your-email@example.com',
    password: 'YourPassword123!',
    metadata: {
      full_name: 'Your Name',
      display_name: 'Display Name',
    },
  },
  // Add more accounts as needed
];
```

Then run `npm run create-test-accounts` again.
