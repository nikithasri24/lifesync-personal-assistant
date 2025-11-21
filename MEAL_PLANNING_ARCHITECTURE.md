# Meal Planning - Production-Grade Architecture

## Analysis Summary
- **Current**: 4,197 lines, 23 exported items, 94 hook calls, massive state management
- **Issues**: No separation of concerns, business logic mixed with UI, hard to test, no reusability
- **Goal**: Production-grade modular architecture following Domain-Driven Design + Clean Architecture

## Architectural Principles

### 1. **Layered Architecture**
```
┌─────────────────────────────────────┐
│     Presentation Layer (UI)         │ ← React components, hooks
├─────────────────────────────────────┤
│     Application Layer (Features)    │ ← Business logic, use cases
├─────────────────────────────────────┤
│     Domain Layer (Core)              │ ← Entities, value objects
├─────────────────────────────────────┤
│     Infrastructure Layer (Services) │ ← API, Storage, External services
└─────────────────────────────────────┘
```

### 2. **Separation of Concerns**
- UI components only render and handle events
- Business logic in hooks and services
- Data fetching in React Query hooks
- Utilities are pure functions
- Types define contracts

## Directory Structure

```
src/mealPlanning/
├── domain/                          # Core business entities
│   ├── recipe/
│   │   ├── types.ts                 # Recipe, RecipeCategory, etc.
│   │   ├── validation.ts            # Recipe validation logic
│   │   └── constants.ts             # Recipe-related constants
│   ├── mealPlan/
│   │   ├── types.ts                 # PlannedMeal, MealPlanWeek, etc.
│   │   ├── validation.ts            # Meal planning rules
│   │   └── constants.ts             # MEAL_TYPES, etc.
│   └── pantry/
│       ├── types.ts                 # PantryItem, etc.
│       └── validation.ts            # Pantry validation
│
├── services/                        # Infrastructure & external services
│   ├── api/
│   │   ├── recipeApi.ts            # Recipe CRUD operations
│   │   ├── mealPlanApi.ts          # Meal plan operations
│   │   └── pantryApi.ts            # Pantry operations
│   ├── parsers/
│   │   ├── youtubeParser.ts        # YouTube video parsing
│   │   ├── urlParser.ts            # Website recipe extraction
│   │   ├── textParser.ts           # Text/markdown parsing
│   │   └── recipeNormalizer.ts     # Normalize different formats
│   ├── storage/
│   │   ├── draftStorage.ts         # LocalStorage for drafts
│   │   └── groceryStorage.ts       # Grocery list persistence
│   └── external/
│       └── youtubeApi.ts           # YouTube Data API integration
│
├── hooks/                           # React Query & custom hooks
│   ├── queries/
│   │   ├── useRecipes.ts           # Recipe queries (list, get, search)
│   │   ├── useMealPlans.ts         # Meal plan queries
│   │   └── usePantry.ts            # Pantry queries
│   ├── mutations/
│   │   ├── useRecipeMutations.ts   # Recipe CUD operations
│   │   ├── useMealPlanMutations.ts # Meal plan mutations
│   │   └── usePantryMutations.ts   # Pantry mutations
│   ├── features/
│   │   ├── useRecipeImport.ts      # Import recipe from URL/video/text
│   │   ├── useMealPlanner.ts       # Meal planning logic (add, move, copy)
│   │   ├── useGroceryList.ts       # Generate grocery list from week
│   │   ├── useWeekNavigation.ts    # Navigate weeks, handle week start
│   │   └── useMultiSelect.ts       # Multi-cell selection logic
│   └── ui/
│       ├── useRecipeModal.ts       # Recipe modal state management
│       ├── useMealCellDraft.ts     # Meal cell draft with localStorage
│       └── useDragAndDrop.ts       # Drag & drop for meal planning
│
├── components/                      # Presentation layer
│   ├── ui/                          # Generic reusable UI components
│   │   ├── Modal.tsx               # Base modal component
│   │   ├── Card.tsx                # Base card component
│   │   ├── Button.tsx              # Consistent button styles
│   │   ├── Input.tsx               # Form inputs
│   │   ├── Select.tsx              # Dropdowns
│   │   ├── Tabs.tsx                # Tab navigation
│   │   └── EmptyState.tsx          # Empty state placeholder
│   │
│   ├── recipe/                      # Recipe-specific components
│   │   ├── RecipeCard/
│   │   │   ├── RecipeCard.tsx      # Main card component
│   │   │   ├── RecipeCardImage.tsx # Image with fallback
│   │   │   ├── RecipeCardMeta.tsx  # Time, servings, etc.
│   │   │   └── RecipeCardActions.tsx # Edit, delete, favorite buttons
│   │   ├── RecipeList/
│   │   │   ├── RecipeList.tsx      # Grid/list of recipes
│   │   │   ├── RecipeFilters.tsx   # Search, filter, sort
│   │   │   └── RecipeListItem.tsx  # Individual list item
│   │   ├── RecipeModal/
│   │   │   ├── RecipeModal.tsx     # View recipe details
│   │   │   ├── RecipeIngredients.tsx # Ingredients section
│   │   │   ├── RecipeInstructions.tsx # Instructions section
│   │   │   └── RecipeNutrition.tsx  # Nutrition info
│   │   ├── RecipeEditor/
│   │   │   ├── RecipeEditor.tsx    # Full recipe editor modal
│   │   │   ├── BasicInfoForm.tsx   # Name, servings, time
│   │   │   ├── IngredientsEditor.tsx # Editable ingredient list
│   │   │   ├── InstructionsEditor.tsx # Editable steps
│   │   │   └── ImageUpload.tsx     # Image upload/URL
│   │   └── RecipeImporter/
│   │       ├── RecipeImporter.tsx  # Tabbed import interface
│   │       ├── UrlImportForm.tsx   # Import from URL
│   │       ├── VideoImportForm.tsx # YouTube import
│   │       ├── TextImportForm.tsx  # Paste text
│   │       └── ImportPreview.tsx   # Preview before save
│   │
│   ├── mealPlan/                    # Meal planning components
│   │   ├── WeeklyGrid/
│   │   │   ├── WeeklyGrid.tsx      # Main grid container
│   │   │   ├── WeekHeader.tsx      # Week navigation & controls
│   │   │   ├── DayColumn.tsx       # Single day column
│   │   │   ├── MealCell.tsx        # Individual meal cell
│   │   │   └── GridControls.tsx    # Copy week, settings
│   │   ├── MealCell/
│   │   │   ├── MealCellContent.tsx # Cell with meals
│   │   │   ├── MealItem.tsx        # Single planned meal
│   │   │   ├── AddMealButton.tsx   # Add meal trigger
│   │   │   ├── MealSelector.tsx    # Recipe dropdown
│   │   │   └── MealCellMenu.tsx    # Context menu
│   │   ├── WeekActions/
│   │   │   ├── CopyWeekModal.tsx   # Copy meals to another week
│   │   │   ├── ClearWeekConfirm.tsx # Clear all meals confirmation
│   │   │   └── WeekSummary.tsx     # Week overview stats
│   │   └── MultiSelect/
│   │       ├── MultiSelectToolbar.tsx # Batch action toolbar
│   │       ├── BulkAddModal.tsx    # Add same meal to multiple cells
│   │       └── SelectionOverlay.tsx # Visual selection feedback
│   │
│   ├── pantry/                      # Pantry management
│   │   ├── PantryList/
│   │   │   ├── PantryList.tsx      # List of pantry items
│   │   │   ├── PantryItem.tsx      # Individual item
│   │   │   └── PantryFilters.tsx   # Filter/search pantry
│   │   └── PantryEditor/
│   │       ├── AddPantryItem.tsx   # Quick add form
│   │       └── PantryItemForm.tsx  # Full item form
│   │
│   ├── grocery/                     # Grocery list
│   │   ├── GroceryList/
│   │   │   ├── GroceryList.tsx     # Generated grocery list
│   │   │   ├── GroceryByCategory.tsx # Grouped by category
│   │   │   ├── GroceryItem.tsx     # Single item with checkbox
│   │   │   └── GroceryExport.tsx   # Export/print options
│   │   └── GroceryModal.tsx        # Grocery list modal
│   │
│   └── shared/                      # Shared meal planning components
│       ├── MealTypeIcon.tsx        # Icon for breakfast/lunch/dinner
│       ├── ServingsSelector.tsx    # Servings adjustment
│       ├── DatePicker.tsx          # Date selection
│       └── TimeDisplay.tsx         # Format prep/cook time
│
├── utils/                           # Pure utility functions
│   ├── dateHelpers.ts              # Date manipulation (toKey, parseKey, etc.)
│   ├── recipeHelpers.ts            # Recipe calculations (scale, etc.)
│   ├── mealPlanHelpers.ts          # Meal plan utilities
│   ├── formatters.ts               # Display formatting
│   └── validators.ts               # Input validation
│
├── pages/                           # Page-level components
│   └── MealPlanningPage.tsx        # Main page orchestrator
│
└── index.ts                         # Public API exports
```

## Component Responsibilities

### 1. **Domain Layer** (No dependencies on UI/React)
**Purpose**: Pure business logic, type definitions, validation rules

**Files**:
- `domain/recipe/types.ts`: `Recipe`, `RecipeCategory`, `Ingredient`, `Instruction`
- `domain/recipe/validation.ts`: `validateRecipe()`, `validateIngredient()`
- `domain/recipe/constants.ts`: `DEFAULT_SERVINGS = 4`, `MAX_PREP_TIME`, etc.
- `domain/mealPlan/types.ts`: `PlannedMeal`, `MealPlanWeek`, `MealType`
- `domain/mealPlan/constants.ts`: `MEAL_TYPES`, `DEFAULT_WEEK_START`
- `domain/pantry/types.ts`: `PantryItem`, `PantryCategory`

**Benefits**:
- Can be tested without React
- Reusable across different UIs (web, mobile, CLI)
- Clear contracts via TypeScript

### 2. **Services Layer** (Infrastructure)
**Purpose**: External integrations, data access, parsing logic

**Key Services**:

**`services/parsers/youtubeParser.ts`**:
```typescript
export class YouTubeParser {
  extractVideoId(url: string): string | null
  parseDescription(description: string): ParsedRecipe
  parseTranscript(transcript: Transcript[]): ParsedRecipe
  extractTimestamps(text: string): Timestamp[]
}
```

**`services/parsers/textParser.ts`**:
```typescript
export class TextParser {
  parseMarkdown(text: string): ParsedRecipe
  parseMarkdownTable(rows: string[]): Ingredient[]
  normalizeFractions(text: string): string
  detectServings(text: string): number | null
}
```

**`services/storage/draftStorage.ts`**:
```typescript
export class DraftStorage {
  saveMealDraft(dateKey: string, mealType: string, value: string): void
  getMealDraft(dateKey: string, mealType: string): string | null
  clearMealDraft(dateKey: string, mealType: string): void
  cleanupOldDrafts(daysOld: number = 7): void
}
```

**Benefits**:
- Testable in isolation
- Can be mocked for unit tests
- Swappable implementations (e.g., different parsing strategies)

### 3. **Hooks Layer** (Application Logic)
**Purpose**: Business logic, state management, API orchestration

**Feature Hooks**:

**`hooks/features/useRecipeImport.ts`**:
```typescript
export function useRecipeImport() {
  return {
    importFromUrl: async (url: string) => ParsedRecipe
    importFromVideo: async (url: string, lang: string) => ParsedRecipe
    importFromText: async (text: string, title: string) => ParsedRecipe
    isImporting: boolean
    error: Error | null
  }
}
```

**`hooks/features/useMealPlanner.ts`**:
```typescript
export function useMealPlanner(weekStart: Date) {
  return {
    addMeal: (date: Date, mealType: string, recipeId: string) => Promise<void>
    removeMeal: (mealId: string) => Promise<void>
    moveMeal: (mealId: string, toDate: Date, toType: string) => Promise<void>
    copyWeek: (targetWeek: Date) => Promise<void>
    clearWeek: () => Promise<void>
    meals: PlannedMeal[]
    isLoading: boolean
  }
}
```

**`hooks/features/useGroceryList.ts`**:
```typescript
export function useGroceryList(weekStart: Date) {
  return {
    groceryItems: GroceryItem[] // Aggregated from week's meals
    toggleItem: (id: string) => void
    clearChecked: () => void
    exportToText: () => string
    exportToPDF: () => void
  }
}
```

**Benefits**:
- Encapsulates complex logic
- Reusable across components
- Easy to test
- Follows React best practices

### 4. **Components Layer** (Presentation)
**Purpose**: Pure presentation, minimal logic, event delegation

**Design Principles**:
- **Single Responsibility**: Each component does one thing well
- **Composition**: Build complex UIs from simple components
- **Controlled Components**: State managed by parent/hooks
- **Accessibility**: ARIA labels, keyboard navigation
- **Performance**: React.memo where appropriate

**Example Component Structure**:

**`components/recipe/RecipeCard/RecipeCard.tsx`**:
```typescript
interface RecipeCardProps {
  recipe: Recipe
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onToggleFavorite?: () => void
  compact?: boolean
  showActions?: boolean
}

export const RecipeCard: React.FC<RecipeCardProps> = React.memo(({
  recipe,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
  compact = false,
  showActions = true,
}) => {
  return (
    <Card>
      <RecipeCardImage src={recipe.imageUrl} alt={recipe.name} />
      <RecipeCardMeta
        prepTime={recipe.prepTime}
        cookTime={recipe.cookTime}
        servings={recipe.servings}
      />
      {showActions && (
        <RecipeCardActions
          isFavorite={recipe.isFavorite}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </Card>
  )
})
```

**Benefits**:
- Easy to understand and maintain
- Highly reusable
- Easy to test (just props in, JSX out)
- Can be visually tested with Storybook

## State Management Strategy

### 1. **Server State** (React Query)
- All data from API (recipes, meal plans, pantry)
- Automatic caching, refetching, optimistic updates
- Handled in hooks layer

### 2. **UI State** (React.useState)
- Modal open/closed
- Form inputs
- Selected items
- Filters
- Managed in components

### 3. **Global UI State** (Zustand - existing)
- Week start preference (Sunday vs Monday)
- Theme
- User preferences
- Keep existing `useAppStore` for these

### 4. **Draft State** (LocalStorage)
- Unsaved meal cell inputs
- Form drafts
- Handled by `draftStorage` service

## Migration Strategy

### Phase 1: Foundation (Week 1)
1. Create domain types and constants
2. Extract parsers to services layer
3. Create storage services
4. Create base UI components (Modal, Card, etc.)

### Phase 2: Core Features (Week 2)
5. Create hooks for queries and mutations
6. Implement feature hooks (useRecipeImport, useMealPlanner)
7. Build Recipe components
8. Build Meal Plan grid components

### Phase 3: Polish (Week 3)
9. Build Pantry and Grocery components
10. Create main MealPlanningPage orchestrator
11. Comprehensive testing
12. Performance optimization

## Testing Strategy

### 1. **Unit Tests**
- Domain validation: `validateRecipe.test.ts`
- Utilities: `dateHelpers.test.ts`
- Parsers: `youtubeParser.test.ts`
- Use Vitest

### 2. **Integration Tests**
- Hooks: `useRecipeImport.test.ts`
- API services: `recipeApi.test.ts`
- Mock external dependencies

### 3. **Component Tests**
- React Testing Library
- Test user interactions
- Test accessibility

### 4. **E2E Tests**
- Playwright
- Critical user flows:
  - Import recipe from YouTube
  - Plan a week of meals
  - Generate grocery list

## Performance Optimizations

1. **Code Splitting**
   - Lazy load modals: `const RecipeEditor = lazy(() => import('./RecipeEditor'))`
   - Lazy load parsers (only when needed)

2. **Memoization**
   - `React.memo()` for pure components
   - `useMemo()` for expensive calculations
   - `useCallback()` for stable function references

3. **Virtualization**
   - Use `react-virtual` for long recipe lists
   - Virtualize weekly grid if needed

4. **Optimistic Updates**
   - React Query optimistic updates for instant feedback
   - Rollback on error

## Developer Experience

### 1. **Type Safety**
- Strict TypeScript
- No `any` types
- Proper error handling with Result types

### 2. **Documentation**
- JSDoc for all public functions
- README in each major directory
- Architecture Decision Records (ADRs)

### 3. **Code Quality**
- ESLint + Prettier
- Husky pre-commit hooks
- Test coverage > 80%

## Success Metrics

### Before Refactor:
- 4,197 lines in one file
- 94 hook calls in single component
- 23 mixed concerns in one file
- Hard to test, maintain, or extend

### After Refactor:
- ~40 focused files averaging 100-150 lines each
- Separation of concerns: Domain, Services, Hooks, UI
- 80%+ test coverage
- Easy to add new features (e.g., meal plan templates)
- Performance improvements from code splitting
- Better developer experience

## Next Steps

1. Get approval on architecture
2. Create detailed implementation plan for Phase 1
3. Set up directory structure
4. Start with domain layer (pure, no dependencies)
5. Incremental migration - keep old code working while building new
