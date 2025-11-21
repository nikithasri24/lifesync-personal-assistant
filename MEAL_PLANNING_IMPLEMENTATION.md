# Meal Planning Refactor - Implementation Roadmap

## Current Progress
✅ Analysis complete
✅ Architecture designed
✅ Directory structure created
⏳ Ready to implement

## Phase 1: Foundation (Domain + Services)
**Goal**: Extract all business logic and utilities from MealPlanning.tsx
**Estimated**: 4-6 hours

### Step 1.1: Domain Layer (1 hour)
```bash
# Create domain type definitions
src/mealPlanning/domain/recipe/types.ts
src/mealPlanning/domain/recipe/constants.ts
src/mealPlanning/domain/mealPlan/types.ts
src/mealPlanning/domain/mealPlan/constants.ts
```

**Tasks**:
- [ ] Export Recipe, Ingredient, Instruction types from src/types (or redefine)
- [ ] Define MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] const
- [ ] Define DEFAULT_SERVINGS, MAX_PREP_TIME constants
- [ ] Create MealType, CellKey type aliases

### Step 1.2: Service Layer - Parsers (2-3 hours)
```bash
src/mealPlanning/services/parsers/youtubeParser.ts
src/mealPlanning/services/parsers/textParser.ts
src/mealPlanning/services/parsers/recipeNormalizer.ts
```

**Extract from MealPlanning.tsx**:
- `extractYoutubeId()` → youtubeParser.ts
- `parseTimecodeToSeconds()` → youtubeParser.ts
- `extractFlowFromDescription()` → youtubeParser.ts
- `parseDescriptionToLists()` → youtubeParser.ts
- `parseTranscriptToLists()` → youtubeParser.ts
- `parseTextToRecipe()` → textParser.ts
- `normalizeFractions()` → textParser.ts

**Create**:
- YouTubeParser class with methods above
- TextParser class with text parsing methods
- RecipeNormalizer to handle different formats

### Step 1.3: Service Layer - Storage (1 hour)
```bash
src/mealPlanning/services/storage/draftStorage.ts
```

**Extract from MealPlanning.tsx**:
- `cleanupOldDrafts()` function
- Create getMealDraftKey helper
- Create DraftStorage class:
  - `saveDraft(dateKey, mealType, value)`
  - `getDraft(dateKey, mealType)`
  - `clearDraft(dateKey, mealType)`
  - `cleanupOldDrafts(daysOld = 7)`

### Step 1.4: Utilities (1 hour)
```bash
src/mealPlanning/utils/dateHelpers.ts
src/mealPlanning/utils/recipeHelpers.ts
```

**Extract from MealPlanning.tsx**:
- `toKey(date)` → dateHelpers.ts
- `ensureDate(value)` → dateHelpers.ts
- `parseLocalDateKey(key)` → dateHelpers.ts (from line 458)

**Create**:
- `scaleIngredients(ingredients, fromServings, toServings)` → recipeHelpers.ts
- `calculateTotalTime(recipe)` → recipeHelpers.ts
- `formatTime(minutes)` → recipeHelpers.ts

## Phase 2: Hooks & Components (8-10 hours)

### Step 2.1: Feature Hooks (3 hours)
```bash
src/mealPlanning/hooks/features/useRecipeImport.ts
src/mealPlanning/hooks/features/useMealPlanner.ts
src/mealPlanning/hooks/features/useWeekNavigation.ts
```

**useRecipeImport.ts**:
- Combines YouTubeParser, TextParser, URL parsing
- Manages import state (loading, error, draft)
- Methods: `importFromUrl`, `importFromVideo`, `importFromText`
- Returns: `{ importRecipe, draft, isImporting, error, clearDraft }`

**useMealPlanner.ts**:
- Uses React Query mutations from existing hooks
- Manages active meal plan for week
- Methods: `addMeal`, `removeMeal`, `moveMeal`, `copyWeek`
- Returns: `{ addMeal, removeMeal, moveMeal, copyWeek, meals, isLoading }`

**useWeekNavigation.ts**:
- Manages current week, week start preference
- Methods: `goToNextWeek`, `goToPrevWeek`, `goToToday`
- Returns: `{ currentWeek, nextWeek, prevWeek, goToToday, weekDays }`

### Step 2.2: UI Component Library (2 hours)
```bash
src/mealPlanning/components/ui/Modal.tsx
src/mealPlanning/components/ui/Card.tsx
src/mealPlanning/components/ui/Button.tsx
```

Create reusable UI primitives (if not using existing finance/ui components)

### Step 2.3: Recipe Components (3-4 hours)
```bash
src/mealPlanning/components/recipe/RecipeCard/RecipeCard.tsx
src/mealPlanning/components/recipe/RecipeList/RecipeList.tsx
src/mealPlanning/components/recipe/RecipeModal/RecipeModal.tsx
src/mealPlanning/components/recipe/RecipeEditor/RecipeEditor.tsx
```

**Extract from MealPlanning.tsx**:
- RecipeCard (lines 3819-3900) → `RecipeCard.tsx`
- SavedRecipesList (lines 3791-3818) → `RecipeList.tsx`
- RecipeViewModal (lines 4042-4197) → `RecipeModal.tsx`
- RecipeEditModal (lines 1863-2152) → `RecipeEditor.tsx`

Break each into subcomponents as needed.

### Step 2.4: Meal Plan Components (3-4 hours)
```bash
src/mealPlanning/components/mealPlan/WeeklyGrid/WeeklyGrid.tsx
src/mealPlanning/components/mealPlan/MealCell/MealCell.tsx
src/mealPlanning/components/mealPlan/MealCell/MealItem.tsx
src/mealPlanning/components/mealPlan/MealCell/AddMealButton.tsx
```

**Extract from MealPlanning.tsx**:
- MealItem (lines 463-830) → `MealItem.tsx`
- CellWithMeals (lines 1146-1193) → `MealCell.tsx`
- AddMealControl (lines 1194-1640) → `AddMealButton.tsx` + `MealSelector.tsx`
- Weekly Grid (lines 2700-3054) → `WeeklyGrid.tsx`

## Phase 3: Page & Testing (4-5 hours)

### Step 3.1: Main Page (2 hours)
```bash
src/mealPlanning/pages/MealPlanningPage.tsx
```

**Responsibilities**:
- Use hooks: `useRecipes`, `useMealPlanner`, `useWeekNavigation`, `useRecipeImport`
- Render major sections: WeeklyGrid, RecipeList, Importers, Pantry
- Manage modals: RecipeEditor, RecipeViewer
- Keep minimal state (modal open/close, selected recipe)

**Structure**:
```typescript
const MealPlanningPage = () => {
  // Hooks
  const { currentWeek, nextWeek, prevWeek } = useWeekNavigation()
  const { meals, addMeal, removeMeal } = useMealPlanner(currentWeek)
  const { recipes } = useRecipes()
  const { importRecipe, draft } = useRecipeImport()

  // Local UI state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  return (
    <div>
      <WeeklyGrid
        week={currentWeek}
        meals={meals}
        recipes={recipes}
        onAddMeal={addMeal}
        onRemoveMeal={removeMeal}
      />

      <RecipeImporter onImport={importRecipe} draft={draft} />

      <RecipeList
        recipes={recipes}
        onSelect={setSelectedRecipe}
      />

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  )
}
```

### Step 3.2: Testing (2-3 hours)
```bash
src/mealPlanning/services/parsers/__tests__/youtubeParser.test.ts
src/mealPlanning/utils/__tests__/dateHelpers.test.ts
src/mealPlanning/hooks/features/__tests__/useMealPlanner.test.ts
src/mealPlanning/components/recipe/RecipeCard/__tests__/RecipeCard.test.tsx
```

**Test Coverage**:
- [ ] Parser functions (YouTube, text)
- [ ] Date helpers
- [ ] Draft storage
- [ ] useMealPlanner hook
- [ ] RecipeCard component
- [ ] Integration test: Import recipe flow

### Step 3.3: Final Migration (1 hour)
- [ ] Update `src/pages/MealPlanning.tsx` to import from new location
- [ ] Test all features work
- [ ] Remove old code
- [ ] Update imports across codebase

## Implementation Order

### Critical Path (Do This First)
1. ✅ Domain types and constants (needed by everything)
2. ✅ Parsers (needed by import hooks)
3. ✅ useRecipeImport hook (critical feature)
4. ✅ RecipeCard component (most used)
5. ✅ MealCell component (core UI)
6. ✅ WeeklyGrid (main interface)
7. ✅ MealPlanningPage (orchestration)

### Can Do In Parallel
- Draft storage service
- Utility functions
- RecipeModal, RecipeEditor (nice to have, not critical path)
- Pantry components
- Grocery list

## File Size Estimates

| File | Lines | Status |
|------|-------|--------|
| youtubeParser.ts | ~200 | To extract |
| textParser.ts | ~150 | To extract |
| draftStorage.ts | ~50 | To extract |
| useRecipeImport.ts | ~100 | New |
| useMealPlanner.ts | ~150 | New |
| RecipeCard.tsx | ~80 | To extract |
| RecipeEditor.tsx | ~250 | To extract |
| MealCell.tsx | ~100 | To extract |
| WeeklyGrid.tsx | ~200 | To extract |
| MealPlanningPage.tsx | ~300 | New (orchestration) |
| **Total** | **~1,580 lines** | vs 4,197 original |

## Success Criteria

✅ **All existing features work** (no regressions)
✅ **Code is modular** (max 250 lines per file)
✅ **Clear separation of concerns** (domain, services, hooks, UI)
✅ **Testable** (can unit test parsers, hooks, components)
✅ **Maintainable** (easy to find and fix bugs)
✅ **Extensible** (easy to add meal templates, nutrition, etc.)
✅ **Performant** (lazy loading, memoization)

## Quick Start Commands

```bash
# Create all directories
mkdir -p src/mealPlanning/{domain/{recipe,mealPlan,pantry},services/{parsers,storage},hooks/{features,queries,mutations},components/{ui,recipe,mealPlan,pantry,grocery},utils,pages}

# Start with Phase 1
touch src/mealPlanning/domain/recipe/{types.ts,constants.ts}
touch src/mealPlanning/domain/mealPlan/{types.ts,constants.ts}
touch src/mealPlanning/services/parsers/{youtubeParser.ts,textParser.ts}
touch src/mealPlanning/services/storage/draftStorage.ts
touch src/mealPlanning/utils/{dateHelpers.ts,recipeHelpers.ts}

# Run tests continuously
npm run test:watch src/mealPlanning
```

## Notes
- Keep `src/mealPlanning/hooks/useMealPlanningQuery.ts` - it's already well-structured
- Reuse types from `src/types.ts` where possible
- Use existing `useAppStore` for global preferences (weekStartsOn)
- Follow Finance module patterns for consistency
- Add lazy loading for modals (use React.lazy + Suspense)
