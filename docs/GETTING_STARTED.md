# Getting Started with LifeSync

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- Git

## Initial Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd lifesync-personal-assistant
npm install
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Project Settings → API
3. Create `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Alternatively, copy the SQL from `supabase/migrations/` and run manually in Supabase SQL Editor.

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## First Steps

### Create an Account

1. Navigate to the app
2. Click "Sign Up"
3. Enter email and password
4. Verify email if required

### Explore Features

**Recommended order:**

1. **Dashboard** - Get overview of all features
2. **Tasks** - Add your first task
3. **Habits** - Track daily habits
4. **Notes** - Capture quick thoughts
5. **Goals** - Set long-term objectives
6. **Finance** - Track accounts and transactions (optional)

## Common Tasks

### Adding a Task

1. Navigate to Tasks page
2. Click "+" or use quick-add input
3. Type: `Buy milk @tomorrow #shopping !high`
4. Press Enter

### Tracking a Habit

1. Go to Habits page
2. Click "Add Habit"
3. Set name, frequency, and category
4. Mark as complete daily

### Taking Notes

1. Open Notes page
2. Click "Add Note"
3. Enter title and content
4. Add tags for organization

### Setting a Goal

1. Navigate to Goals page
2. Click "New Goal"
3. Choose category, set target date
4. Track progress over time

## Development Workflow

### Watch Mode (Recommended)

```bash
# Run type checking + tests in watch mode
npm run guard
```

This catches errors as you code.

### Manual Testing

```bash
# Type check
npm run typecheck

# Run tests
npm test

# Build for production
npm run build
```

### Making Changes

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes
3. Run `npm run guard` to ensure tests pass
4. Commit: `git commit -m "feat: add my feature"`
5. Push and create PR

## Database Changes

### Creating a Migration

1. Create file: `supabase/migrations/YYYYMMDD_description.sql`
2. Write SQL changes
3. Test locally: `supabase db reset`
4. Apply to production: `supabase db push`

### Example Migration

```sql
-- supabase/migrations/20251119_add_notes_category.sql

-- Add category column to notes table
ALTER TABLE notes
ADD COLUMN category TEXT;

-- Create index for faster queries
CREATE INDEX idx_notes_category ON notes(category);
```

## Troubleshooting

### "Supabase not configured"

- Check `.env.local` exists and has correct values
- Restart dev server after changing env variables

### Data not loading

- Check browser console for errors
- Verify Supabase RLS policies allow your user to read data
- Ensure you're logged in

### Tests failing

- Clear test database: Delete test user data in Supabase
- Check mock data is valid
- Verify async operations use `await` properly

### Build errors

- Run `npm run typecheck` to see all TypeScript errors
- Clear build cache: `rm -rf dist node_modules/.vite`
- Reinstall dependencies: `npm install`

## Next Steps

- Read [Architecture Documentation](./ARCHITECTURE.md)
- Review [Testing Guide](./TESTING.md)
- Check [CHANGELOG](../CHANGELOG.md) for recent changes

## Getting Help

- Check existing [GitHub Issues](https://github.com/your-repo/issues)
- Review documentation in `docs/` folder
- Search codebase for examples

## Key Files to Know

- `src/App.tsx` - Main app component and routing
- `src/stores/useRealAppStore.ts` - Main state store
- `src/lib/supabase.ts` - Supabase client
- `supabase/migrations/` - Database schema

Happy coding! 🚀
