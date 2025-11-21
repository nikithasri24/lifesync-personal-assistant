# Meal Planning Refactor Plan

## Current State
- Single file: `src/pages/MealPlanning.tsx` (4,197 lines)
- Contains: UI components, business logic, utilities, parsers, modals
- Similar to old Finance module before refactor

## Target Architecture (Following Finance Pattern)

### Directory Structure
```
src/mealPlanning/
├── components/
│   ├── recipes/
│   │   ├── RecipeCard.tsx           # Display recipe in card format
│   │   ├── RecipeEditor.tsx         # Edit/create recipe modal
│   │   ├── RecipeViewer.tsx         # View recipe details modal
│   │   └── SavedRecipesList.tsx     # List of all saved recipes
│   ├── mealPlan/
│   │   ├── WeeklyGrid.tsx           # Weekly meal planning calendar grid
│   │   ├── MealCell.tsx             # Individual day/meal-type cell
│   │   ├── AddMealControl.tsx       # Add meal dropdown/selector
│   │   └── MealItem.tsx             # Display single planned meal
│   ├── pantry/
│   │   └── PantryManager.tsx        # Pantry items CRUD
│   └── import/
│       └── RecipeImporter.tsx       # Import from URL/YouTube/text
├── utils/
│   ├── recipeParser.ts              # Parse recipes from various sources
│   ├── youtubeParser.ts             # YouTube-specific parsing
│   ├── mealPlanHelpers.ts          # Date/key utilities (DONE)
│   └── draftStorage.ts              # LocalStorage draft management
├── hooks/
│   └── useMealPlanningQuery.ts      # React Query hooks (EXISTS)
└── pages/
    └── MealPlanningPage.tsx         # Main orchestration page
```

## Component Breakdown

### 1. RecipeCard.tsx (~100 lines)
**Purpose**: Display a single recipe in card format
**Props**:
- `recipe: Recipe`
- `onView: () => void`
- `onEdit: () => void`
- `onDelete: () => void`

**Extract from**: Lines 3819-3900 (RecipeCard function)

### 2. RecipeEditor.tsx (~250 lines)
**Purpose**: Modal for creating/editing recipes
**Props**:
- `recipe?: Recipe` (undefined for create)
- `onSave: (recipe) => void`
- `onClose: () => void`

**Extract from**: Lines 1863-2152 (RecipeEditModal function)

### 3. RecipeViewer.tsx (~180 lines)
**Purpose**: Modal for viewing recipe details
**Props**:
- `recipe: Recipe`
- `onClose: () => void`
- `onEdit: () => void`

**Extract from**: Lines 4042-4197 (RecipeViewModal function)

### 4. SavedRecipesList.tsx (~80 lines)
**Purpose**: Grid/list of all saved recipes
**Props**:
- `recipes: Recipe[]`
- `onRecipeView: (recipe) => void`
- `onRecipeEdit: (recipe) => void`
- `onRecipeDelete: (id) => void`

**Extract from**: Lines 3791-3818 (SavedRecipesList function)

### 5. WeeklyGrid.tsx (~400 lines)
**Purpose**: Main weekly meal planning calendar
**Props**:
- `weekStart: Date`
- `meals: PlannedMeal[]`
- `recipes: Recipe[]`
- `onMealAdd: (date, type, recipe) => void`
- `onMealRemove: (mealId) => void`

**Extract from**: Lines 3150-3550 (main grid rendering logic)

### 6. MealCell.tsx (~150 lines)
**Purpose**: Single cell in the grid (one day + meal type)
**Props**:
- `dateKey: string`
- `mealType: MealType`
- `meals: PlannedMeal[]`
- `recipes: Recipe[]`
- `onMealAdd: () => void`

**Extract from**: Lines 1146-1193 (CellWithMeals function)

### 7. AddMealControl.tsx (~100 lines)
**Purpose**: Dropdown/control to add a meal
**Props**:
- `dateKey: string`
- `mealType: MealType`
- `recipes: Recipe[]`
- `onMealAdded: (recipeId) => void`

**Extract from**: Lines 1194-1640 (AddMealControl function)

### 8. MealItem.tsx (~80 lines)
**Purpose**: Display a single planned meal with actions
**Props**:
- `meal: PlannedMeal`
- `recipe?: Recipe`
- `onRemove: () => void`

**Extract from**: Lines 463-830 (MealItem function)

### 9. PantryManager.tsx (~200 lines)
**Purpose**: Manage pantry items
**Props**: None (uses hooks directly)

**Extract from**: Lines 3600-3790 (pantry section)

### 10. RecipeImporter.tsx (~300 lines)
**Purpose**: Import recipes from URL, YouTube, or text
**Props**:
- `onRecipeImported: (recipe) => void`

**Extract from**: Lines 3054-3350 (video/URL import forms)

## Utilities Breakdown

### recipeParser.ts (~400 lines)
**Functions**:
- `parseTextToRecipe(text, title?)`
- `parseDescriptionToLists(description)`
- `normalizeFractions(text)`

**Extract from**: Lines 141-297, 298-310

### youtubeParser.ts (~250 lines)
**Functions**:
- `extractYoutubeId(url)`
- `parseTimecodeToSeconds(text)`
- `extractFlowFromDescription(description)`
- `parseTranscriptToLists(transcript)`
- `fetchClippedRecipe(url)` (if using Clip service)

**Extract from**: Lines 66-457

### draftStorage.ts (~50 lines)
**Functions**:
- `saveMealDraft(dateKey, mealType, value)`
- `getMealDraft(dateKey, mealType)`
- `cleanupOldDrafts()`

**Extract from**: Lines 34-63

## Migration Steps

1. ✅ Create directory structure
2. ✅ Create `mealPlanHelpers.ts`
3. ⏳ Create utility files (recipeParser, youtubeParser, draftStorage)
4. ⏳ Create Recipe components (Card, Editor, Viewer, List)
5. ⏳ Create MealPlan components (Grid, Cell, AddControl, Item)
6. ⏳ Create Pantry and Importer components
7. ⏳ Create new MealPlanningPage.tsx that orchestrates all components
8. ⏳ Test thoroughly
9. ⏳ Remove old MealPlanning.tsx
10. ⏳ Commit changes

## Benefits

1. **Maintainability**: Each component has single responsibility
2. **Reusability**: Components can be reused in different contexts
3. **Testability**: Smaller components are easier to unit test
4. **Performance**: Can lazy load components as needed
5. **Code Quality**: Follows established Finance pattern
6. **Developer Experience**: Easier to navigate and understand

## Estimated Effort
- Utility files: 2 hours
- Recipe components: 3 hours
- MealPlan components: 4 hours
- Pantry/Importer: 2 hours
- Page integration: 2 hours
- Testing: 3 hours
- **Total: ~16 hours**

## Notes
- Keep existing hooks (`useMealPlanningQuery.ts`) - they're already good
- Maintain all existing functionality - no breaking changes
- Use TypeScript strictly - import types from `src/types`
- Follow Finance component patterns for consistency
- Add proper error boundaries where needed
