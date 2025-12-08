# Implementation Plans for Feature Standardization

**Generated:** 2025-12-07
**Purpose:** Detailed step-by-step implementation plans for bringing all features to Tier 1 quality

---

## Table of Contents

- [Tier 2 Features (Good → Excellent)](#tier-2-features)
  - [Goals](#goals-95---needs-tests)
  - [Journal](#journal-95---needs-tests)
  - [Notes](#notes-80---needs-ai-tools)
  - [Meal Planning](#meal-planning-85---needs-tests--api-refactor)
  - [Finances](#finances-85---needs-supabase-migration)
- [Tier 3 Features (Partial → Complete)](#tier-3-features)
  - [Projects](#projects-70---needs-state-api-ai)
  - [Focus](#focus-70---needs-state-ai-tests)
  - [75 Hard](#75-hard-75---needs-state-api-ai)
  - [Task Scheduler](#task-scheduler-60---needs-full-stack)
  - [Analytics](#analytics-60---needs-enhancement)
  - [Life Goals](#life-goals-50---needs-full-stack)
  - [Calendar](#calendar-50---needs-full-stack)
- [Tier 4 Features (Minimal → Complete)](#tier-4-features)
  - [Skincare](#skincare-30---needs-complete-rebuild)
  - [Travel](#travel-40---needs-full-stack)

---

# Tier 2 Features

## Goals (95% → 100%) - Needs Tests

### Current State
✅ Zustand slice: `src/stores/slices/goalsSlice.ts`
✅ API layer: `src/api/goalsAPI.ts`
✅ AI tools: `src/goals/tools.ts` (4 tools)
✅ Page: `src/pages/Goals.tsx`
✅ Types: Strong TypeScript
✅ Supabase: Yes
❌ Tests: None

### Implementation Plan

#### Step 1: Create Test Structure (2 hours)
```bash
mkdir -p src/pages/__tests__/Goals
touch src/pages/__tests__/Goals.test.tsx
touch src/pages/__tests__/Goals.create.test.tsx
touch src/pages/__tests__/Goals.progress.test.tsx
touch src/pages/__tests__/Goals.milestones.test.tsx
touch src/pages/__tests__/Goals.filtering.test.tsx
```

#### Step 2: Write Basic Component Tests (4 hours)
**File:** `src/pages/__tests__/Goals.test.tsx`
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import Goals from '../Goals';
import { useAppStore } from '@/stores/useAppStore';

describe('Goals Page', () => {
  beforeEach(() => {
    useAppStore.getState().resetGoals();
  });

  it('renders goals page with header', () => {
    render(<Goals />);
    expect(screen.getByText(/goals/i)).toBeInTheDocument();
  });

  it('shows empty state when no goals', () => {
    render(<Goals />);
    expect(screen.getByText(/no goals yet/i)).toBeInTheDocument();
  });

  it('displays loading state', async () => {
    render(<Goals />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

#### Step 3: Test Goal Creation (3 hours)
**File:** `src/pages/__tests__/Goals.create.test.tsx`
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Goals from '../Goals';
import { useAppStore } from '@/stores/useAppStore';

describe('Goal Creation', () => {
  it('opens create goal modal', async () => {
    render(<Goals />);
    const createButton = screen.getByRole('button', { name: /add goal/i });
    await userEvent.click(createButton);
    expect(screen.getByText(/new goal/i)).toBeInTheDocument();
  });

  it('creates a new goal with valid data', async () => {
    render(<Goals />);
    // Open modal
    await userEvent.click(screen.getByRole('button', { name: /add goal/i }));

    // Fill form
    await userEvent.type(screen.getByLabelText(/title/i), 'Learn Spanish');
    await userEvent.type(screen.getByLabelText(/description/i), 'Become fluent');
    await userEvent.selectOptions(screen.getByLabelText(/category/i), 'learning');

    // Submit
    await userEvent.click(screen.getByRole('button', { name: /create/i }));

    // Verify
    await waitFor(() => {
      expect(screen.getByText('Learn Spanish')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<Goals />);
    await userEvent.click(screen.getByRole('button', { name: /add goal/i }));
    await userEvent.click(screen.getByRole('button', { name: /create/i }));

    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
  });
});
```

#### Step 4: Test Progress Tracking (3 hours)
**File:** `src/pages/__tests__/Goals.progress.test.tsx`
```typescript
describe('Goal Progress', () => {
  it('updates progress percentage', async () => {
    // Test progress slider/input
  });

  it('shows visual progress indicator', () => {
    // Test progress bar rendering
  });

  it('marks goal as completed at 100%', async () => {
    // Test completion logic
  });

  it('tracks milestone completion', async () => {
    // Test milestone checkboxes
  });
});
```

#### Step 5: Test Filtering & Sorting (2 hours)
**File:** `src/pages/__tests__/Goals.filtering.test.tsx`

#### Step 6: Test Edge Cases (2 hours)
- API errors
- Network failures
- Concurrent updates
- Optimistic updates

**Total Time:** ~16 hours (2 days)

---

## Journal (95% → 100%) - Needs Tests

### Current State
✅ Zustand slice: `src/stores/slices/journalSlice.ts`
✅ API layer: `src/api/journalAPI.ts`
✅ AI tools: `src/journal/tools.ts` (4 tools)
✅ Page: `src/pages/Journal.tsx`
✅ Types: Strong TypeScript
✅ Supabase: Yes
❌ Tests: None

### Implementation Plan

#### Step 1: Create Test Structure (1 hour)
```bash
mkdir -p src/pages/__tests__/Journal
touch src/pages/__tests__/Journal.test.tsx
touch src/pages/__tests__/Journal.entries.test.tsx
touch src/pages/__tests__/Journal.mood.test.tsx
touch src/pages/__tests__/Journal.search.test.tsx
```

#### Step 2: Test Journal Entries (6 hours)
```typescript
describe('Journal Entries', () => {
  it('creates new entry with text', async () => {
    // Test text entry creation
  });

  it('creates entry with mood', async () => {
    // Test mood selection
  });

  it('edits existing entry', async () => {
    // Test entry editing
  });

  it('deletes entry with confirmation', async () => {
    // Test deletion flow
  });

  it('supports markdown formatting', () => {
    // Test markdown preview
  });
});
```

#### Step 3: Test Mood Tracking (4 hours)
```typescript
describe('Mood Tracking', () => {
  it('logs mood for today', async () => {
    // Test mood logging
  });

  it('shows mood trends chart', () => {
    // Test mood visualization
  });

  it('filters entries by mood', async () => {
    // Test mood filtering
  });
});
```

#### Step 4: Test Search & Filtering (3 hours)
```typescript
describe('Journal Search', () => {
  it('searches entries by text', async () => {
    // Test search functionality
  });

  it('filters by date range', async () => {
    // Test date filtering
  });

  it('filters by tags', async () => {
    // Test tag filtering
  });
});
```

#### Step 5: Test Edge Cases (2 hours)

**Total Time:** ~16 hours (2 days)

---

## Notes (80% → 100%) - Needs AI Tools

### Current State
✅ Zustand slice: `src/stores/slices/notesSlice.ts`
✅ API layer: `src/api/notesAPI.ts`
✅ Page: `src/pages/Notes.tsx`
✅ Types: Strong TypeScript
✅ Supabase: Yes
❌ AI tools: None
❌ Tests: None

### Implementation Plan

#### Step 1: Create AI Tools File (4 hours)
**File:** `src/notes/tools.ts`
```typescript
import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import { createNote, getNotes, updateNote, deleteNote, searchNotes } from '@/api/notesAPI';

// Tool 1: Create Note
const createNoteDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'create_note',
    description: 'Create a new note. Requires title (string) and content (string). Optional: tags (array), folder (string), is_favorite (boolean).',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Note title - required'
        },
        content: {
          type: 'string',
          description: 'Note content/body - required'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization - optional'
        },
        folder: {
          type: 'string',
          description: 'Folder name for organization - optional'
        },
        is_favorite: {
          type: 'boolean',
          description: 'Mark as favorite - optional'
        }
      },
      required: ['title', 'content']
    }
  }
};

async function executeCreateNote(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const title = args.title as string;
    const content = args.content as string;
    const tags = (args.tags as string[]) || [];
    const folder = args.folder as string | undefined;
    const isFavorite = (args.is_favorite as boolean) || false;

    const note = await createNote({
      title,
      content,
      tags,
      folder,
      is_favorite: isFavorite
    });

    return {
      success: true,
      message: `Created note: "${title}"`,
      data: note
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create note'
    };
  }
}

// Tool 2: Get Notes
const getNotesDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_notes',
    description: 'Get all notes. Optional filters: folder (string), tag (string), favorites_only (boolean), search_query (string).',
    parameters: {
      type: 'object',
      properties: {
        folder: {
          type: 'string',
          description: 'Filter by folder - optional'
        },
        tag: {
          type: 'string',
          description: 'Filter by tag - optional'
        },
        favorites_only: {
          type: 'boolean',
          description: 'Show only favorites - optional'
        },
        search_query: {
          type: 'string',
          description: 'Search in title/content - optional'
        }
      }
    }
  }
};

async function executeGetNotes(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const filters = {
      folder: args.folder as string | undefined,
      tag: args.tag as string | undefined,
      favoritesOnly: args.favorites_only as boolean | undefined,
      searchQuery: args.search_query as string | undefined
    };

    const notes = await getNotes(filters);

    return {
      success: true,
      message: `Found ${notes.length} note(s)`,
      data: notes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get notes'
    };
  }
}

// Tool 3: Update Note
const updateNoteDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'update_note',
    description: 'Update an existing note. Requires note_title or note_id. Optional: title, content, tags, folder, is_favorite.',
    parameters: {
      type: 'object',
      properties: {
        note_title: {
          type: 'string',
          description: 'Current title of note to update'
        },
        note_id: {
          type: 'string',
          description: 'ID of note to update'
        },
        title: {
          type: 'string',
          description: 'New title'
        },
        content: {
          type: 'string',
          description: 'New content'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New tags'
        },
        folder: {
          type: 'string',
          description: 'New folder'
        },
        is_favorite: {
          type: 'boolean',
          description: 'Mark as favorite'
        }
      }
    }
  }
};

// Tool 4: Delete Note
const deleteNoteDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'delete_note',
    description: 'Delete a note by title or ID. Requires note_title or note_id.',
    parameters: {
      type: 'object',
      properties: {
        note_title: {
          type: 'string',
          description: 'Title of note to delete'
        },
        note_id: {
          type: 'string',
          description: 'ID of note to delete'
        }
      }
    }
  }
};

// Tool 5: Search Notes
const searchNotesDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'search_notes',
    description: 'Search notes by keywords. Requires query (string). Searches in title and content.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query - required'
        }
      },
      required: ['query']
    }
  }
};

// Tool 6: Organize Notes by Tags
const organizeByTagsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'organize_notes_by_tags',
    description: 'Get notes grouped by tags. Returns all notes organized by their tags.',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
};

// Export tools
export const noteTools: Tool[] = [
  { definition: createNoteDefinition, execute: executeCreateNote },
  { definition: getNotesDefinition, execute: executeGetNotes },
  { definition: updateNoteDefinition, execute: executeUpdateNote },
  { definition: deleteNoteDefinition, execute: executeDeleteNote },
  { definition: searchNotesDefinition, execute: executeSearchNotes },
  { definition: organizeByTagsDefinition, execute: executeOrganizeByTags }
];
```

#### Step 2: Register Tools in Registry (1 hour)
**File:** `src/services/conversationEngine.ts`
```typescript
import { noteTools } from '@/notes/tools';

// Add to imports and registration
toolRegistry.register([
  ...taskTools,
  ...financeTools,
  ...habitTools,
  ...goalTools,
  ...shoppingTools,
  ...mealTools,
  ...journalTools,
  ...noteTools  // ADD THIS
]);
```

#### Step 3: Implement Missing Tool Executions (2 hours)
- Implement `executeUpdateNote`
- Implement `executeDeleteNote`
- Implement `executeSearchNotes`
- Implement `executeOrganizeByTags`

#### Step 4: Add Tests for Tools (3 hours)
**File:** `src/notes/__tests__/tools.test.ts`

#### Step 5: Add Component Tests (8 hours)
- Create note tests
- Edit note tests
- Search/filter tests
- Tag organization tests

**Total Time:** ~18 hours (2-3 days)

---

## Meal Planning (85% → 100%) - Needs Tests & API Refactor

### Current State
✅ Zustand slice: `src/stores/slices/mealsSlice.ts`
✅ AI tools: `src/mealPlanning/tools.ts` (5 tools)
✅ Page: `src/pages/MealPlanning.tsx`
✅ Types: Strong TypeScript
✅ Supabase: Yes (direct in slice)
🟡 API layer: None (Supabase calls in slice)
❌ Tests: None

### Implementation Plan

#### Step 1: Extract API Layer (4 hours)
**File:** `src/api/mealsAPI.ts`
```typescript
import { supabase } from '../lib/supabase';
import type { MealPlan, Recipe, GroceryList } from '../services/types';

// Create meal plan
export async function createMealPlan(
  mealPlan: Omit<MealPlan, 'id' | 'user_id' | 'created_at'>
): Promise<MealPlan> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('meal_plans')
    .insert({ ...mealPlan, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as MealPlan;
}

// Get meal plans
export async function getMealPlans(filters?: {
  week?: string;
  startDate?: string;
  endDate?: string;
}): Promise<MealPlan[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (filters?.week) {
    query = query.eq('week', filters.week);
  }
  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as MealPlan[];
}

// Create recipe
export async function createRecipe(
  recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at'>
): Promise<Recipe> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('recipes')
    .insert({ ...recipe, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Recipe;
}

// Get recipes
export async function getRecipes(filters?: {
  category?: string;
  cuisine?: string;
  tags?: string[];
}): Promise<Recipe[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('recipes')
    .select('*')
    .eq('user_id', user.id);

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.cuisine) {
    query = query.eq('cuisine', filters.cuisine);
  }
  if (filters?.tags) {
    query = query.contains('tags', filters.tags);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Recipe[];
}

// Update meal plan
export async function updateMealPlan(
  id: string,
  updates: Partial<MealPlan>
): Promise<MealPlan> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('meal_plans')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as MealPlan;
}

// Delete meal plan
export async function deleteMealPlan(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

// Generate grocery list from meal plans
export async function generateGroceryList(
  mealPlanIds: string[]
): Promise<GroceryList> {
  // Implementation to aggregate ingredients from multiple meal plans
  // This would query the meal plans and their recipes
  // Then combine all ingredients
}
```

#### Step 2: Refactor Slice to Use API Layer (2 hours)
**File:** `src/stores/slices/mealsSlice.ts`
```typescript
import { createMealPlan, getMealPlans, createRecipe, getRecipes } from '@/api/mealsAPI';

// Replace direct Supabase calls with API calls
loadMealPlans: async () => {
  set({ loading: true });
  try {
    const plans = await getMealPlans();
    set({ mealPlans: plans, loading: false });
  } catch (error) {
    set({ error: error.message, loading: false });
  }
}
```

#### Step 3: Add Comprehensive Tests (10 hours)
- Meal plan creation tests
- Recipe management tests
- Grocery list generation tests
- Calendar view tests
- Filtering tests

**Total Time:** ~16 hours (2 days)

---

## Finances (85% → 100%) - Needs Supabase Migration

### Current State
✅ Zustand slice: `src/stores/slices/financeSlice.ts`
✅ AI tools: `src/finance/tools.ts` (6 tools)
✅ Page: `src/pages/Finances.tsx`
✅ Types: Strong TypeScript
🟡 API layer: `src/finance/data.ts` (Local storage)
❌ Tests: None
❌ Supabase: No (uses localStorage)

### Implementation Plan

#### Step 1: Create Supabase Tables (2 hours)

**SQL Migration:** `supabase/migrations/YYYYMMDD_create_finance_tables.sql`
```sql
-- Accounts table
CREATE TABLE finance_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'checking', 'savings', 'credit', 'investment'
  balance DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE finance_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'expense', 'income'
  color TEXT,
  icon TEXT,
  budget_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE finance_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES finance_accounts(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL, -- 'debit', 'credit'
  description TEXT,
  date DATE NOT NULL,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets table
CREATE TABLE finance_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES finance_categories(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  period TEXT NOT NULL, -- 'monthly', 'weekly', 'yearly'
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_user_date ON finance_transactions(user_id, date DESC);
CREATE INDEX idx_transactions_account ON finance_transactions(account_id);
CREATE INDEX idx_transactions_category ON finance_transactions(category_id);
CREATE INDEX idx_accounts_user ON finance_accounts(user_id);
CREATE INDEX idx_categories_user ON finance_categories(user_id);
CREATE INDEX idx_budgets_user ON finance_budgets(user_id);

-- Row Level Security
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_budgets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own accounts" ON finance_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own accounts" ON finance_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own accounts" ON finance_accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own accounts" ON finance_accounts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own categories" ON finance_categories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own categories" ON finance_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON finance_categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON finance_categories
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" ON finance_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON finance_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON finance_transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON finance_transactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own budgets" ON finance_budgets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own budgets" ON finance_budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON finance_budgets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON finance_budgets
  FOR DELETE USING (auth.uid() = user_id);
```

#### Step 2: Create API Layer (6 hours)
**File:** `src/api/financeAPI.ts`
```typescript
import { supabase } from '../lib/supabase';
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
  FinanceBudget
} from '../services/types';

// ============= ACCOUNTS =============

export async function getAccounts(): Promise<FinanceAccount[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('finance_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('name');

  if (error) throw error;
  return data as FinanceAccount[];
}

export async function createAccount(
  account: Omit<FinanceAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<FinanceAccount> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('finance_accounts')
    .insert({ ...account, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as FinanceAccount;
}

export async function updateAccount(
  id: string,
  updates: Partial<FinanceAccount>
): Promise<FinanceAccount> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('finance_accounts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as FinanceAccount;
}

export async function deleteAccount(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('finance_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

// ============= CATEGORIES =============

export async function getCategories(): Promise<FinanceCategory[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('finance_categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name');

  if (error) throw error;
  return data as FinanceCategory[];
}

export async function createCategory(
  category: Omit<FinanceCategory, 'id' | 'user_id' | 'created_at'>
): Promise<FinanceCategory> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('finance_categories')
    .insert({ ...category, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as FinanceCategory;
}

// ============= TRANSACTIONS =============

export async function getTransactions(filters?: {
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  type?: 'debit' | 'credit';
}): Promise<FinanceTransaction[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('finance_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (filters?.accountId) {
    query = query.eq('account_id', filters.accountId);
  }
  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as FinanceTransaction[];
}

export async function createTransaction(
  transaction: Omit<FinanceTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<FinanceTransaction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('finance_transactions')
    .insert({ ...transaction, user_id: user.id })
    .select()
    .single();

  if (error) throw error;

  // Update account balance
  await updateAccountBalance(transaction.account_id);

  return data as FinanceTransaction;
}

export async function updateTransaction(
  id: string,
  updates: Partial<FinanceTransaction>
): Promise<FinanceTransaction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get original transaction to update account balance
  const { data: original } = await supabase
    .from('finance_transactions')
    .select('*')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('finance_transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  // Update account balance
  if (original) {
    await updateAccountBalance(original.account_id);
  }

  return data as FinanceTransaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get transaction to update account balance
  const { data: transaction } = await supabase
    .from('finance_transactions')
    .select('*')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('finance_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;

  // Update account balance
  if (transaction) {
    await updateAccountBalance((transaction as FinanceTransaction).account_id);
  }
}

// Helper to recalculate account balance
async function updateAccountBalance(accountId: string): Promise<void> {
  const { data: transactions } = await supabase
    .from('finance_transactions')
    .select('amount, type')
    .eq('account_id', accountId);

  if (!transactions) return;

  const balance = transactions.reduce((sum, txn) => {
    return sum + (txn.type === 'credit' ? txn.amount : -txn.amount);
  }, 0);

  await supabase
    .from('finance_accounts')
    .update({ balance })
    .eq('id', accountId);
}

// ============= BUDGETS =============

export async function getBudgets(): Promise<FinanceBudget[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('finance_budgets')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;
  return data as FinanceBudget[];
}

export async function createBudget(
  budget: Omit<FinanceBudget, 'id' | 'user_id' | 'created_at'>
): Promise<FinanceBudget> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('finance_budgets')
    .insert({ ...budget, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as FinanceBudget;
}

// Get spending summary
export async function getSpendingSummary(filters?: {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
}): Promise<{
  total: number;
  byCategory: Record<string, number>;
  byAccount: Record<string, number>;
}> {
  const transactions = await getTransactions(filters);

  const total = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const byCategory = transactions
    .filter(t => t.type === 'debit' && t.category_id)
    .reduce((acc, t) => {
      acc[t.category_id!] = (acc[t.category_id!] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const byAccount = transactions
    .filter(t => t.type === 'debit')
    .reduce((acc, t) => {
      acc[t.account_id] = (acc[t.account_id] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  return { total, byCategory, byAccount };
}
```

#### Step 3: Create Data Migration Script (4 hours)
**File:** `src/scripts/migrateFinanceToSupabase.ts`
```typescript
import { supabase } from '../lib/supabase';
import { getFinanceAPI } from '../finance/data';

async function migrateFinanceData() {
  console.log('Starting finance data migration...');

  // Get data from localStorage
  const localAPI = await getFinanceAPI();
  const accounts = await localAPI.listAccounts();
  const categories = await localAPI.listCategories();
  const transactions = await localAPI.listTransactions();

  // Migrate accounts
  for (const account of accounts) {
    await supabase.from('finance_accounts').insert({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency || 'USD',
      is_active: account.isActive ?? true
    });
  }

  // Migrate categories
  for (const category of categories) {
    await supabase.from('finance_categories').insert({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      budget_amount: category.budgetAmount
    });
  }

  // Migrate transactions
  for (const transaction of transactions) {
    await supabase.from('finance_transactions').insert({
      account_id: transaction.accountId,
      category_id: transaction.categoryId,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      date: transaction.date,
      notes: transaction.notes,
      tags: transaction.tags
    });
  }

  console.log('Migration complete!');
}
```

#### Step 4: Update Slice to Use New API (3 hours)
**File:** `src/stores/slices/financeSlice.ts`
```typescript
import {
  getAccounts,
  getCategories,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '@/api/financeAPI';

// Replace all localStorage calls with API calls
```

#### Step 5: Update AI Tools (2 hours)
Update `src/finance/tools.ts` to use new API

#### Step 6: Add Tests (8 hours)
- Account management tests
- Transaction CRUD tests
- Budget tracking tests
- Spending analytics tests
- Category management tests

**Total Time:** ~25 hours (3-4 days)

---

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create implementation plans for Tier 2 features (Goals, Journal, Notes, Meal Planning, Finances)", "activeForm": "Creating implementation plans for Tier 2 features", "status": "completed"}, {"content": "Create implementation plans for Tier 3 features (Projects, Focus, 75 Hard, Task Scheduler, Analytics, Life Goals, Calendar)", "activeForm": "Creating implementation plans for Tier 3 features", "status": "in_progress"}, {"content": "Create implementation plans for Tier 4 features (Skincare, Travel)", "activeForm": "Creating implementation plans for Tier 4 features", "status": "pending"}]