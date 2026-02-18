# Meals Tab UI/UX Enhancement Plan

## Context

The Meals feature (MealPlanning.tsx) needs to be updated to match the design specifications in `meals-design-spec.html` and apply all 25 UI/UX enhancement patterns from CLAUDE.md (established by the Together tab reference implementation).

**Current State:**
- Meals page exists at `src/pages/MealPlanning.tsx` with basic components
- 4 main views: Today, Week, Recipes, Grocery
- Has: Recipe management, meal planning calendar, grocery list generation
- Uses lazy loading for heavy components
- Missing: V2 components, centered layout, Together modal patterns
- Small codebase (only 9 files in src/meals/)

**Goal:**
- Match `meals-design-spec.html` styling exactly
- Apply all Together tab UI patterns
- Maintain existing functionality (recipes, planning, grocery, import)
- Ensure responsive mobile/desktop behavior
- Create comprehensive V2 component suite

**Why This Matters:**
- Meals is a calendar-based feature (different pattern from lists)
- Recipe management requires detailed forms
- Grocery list auto-generation is complex logic
- Nutrition tracking integration
- Will serve as reference for other calendar/planning features

---

## Critical Files to Modify

### Primary Files (Must Update)
1. `src/pages/MealPlanning.tsx` - Main page component
2. `src/meals/components/views/TodayView.tsx` - Today's meals view
3. `src/meals/components/views/WeekView.tsx` - Weekly calendar view
4. `src/meals/components/views/RecipesView.tsx` - Recipe library
5. `src/meals/components/views/GroceryView.tsx` - Auto-generated grocery list
6. `src/meals/components/MealCell.tsx` - Calendar cell with meals

### V2 Components to Create
1. `src/meals/components/v2/MealsHeaderV2.tsx` - Simple header
2. `src/meals/components/v2/ViewSelectorV2.tsx` - View tabs
3. `src/meals/components/v2/RecipeFormModalV2.tsx` - Add/edit recipe (Together pattern)
4. `src/meals/components/v2/RecipeCardV2.tsx` - Recipe card
5. `src/meals/components/v2/MealFormModalV2.tsx` - Plan meal modal
6. `src/meals/components/v2/MealCardV2.tsx` - Planned meal card
7. `src/meals/components/v2/WeekNavigatorV2.tsx` - Week navigation
8. `src/meals/components/v2/CalendarGridV2.tsx` - Weekly calendar grid
9. `src/meals/components/v2/GroceryListV2.tsx` - Grocery list component
10. `src/meals/components/v2/GroceryItemV2.tsx` - Grocery item card
11. `src/meals/components/v2/NutritionSummaryV2.tsx` - Nutrition stats
12. `src/meals/components/v2/FilterBarV2.tsx` - Recipe filters
13. `src/meals/components/v2/ImportRecipeModalV2.tsx` - Import from URL
14. `src/meals/components/v2/index.ts` - Barrel exports

### Reference Files (Do NOT Modify)
- `src/pages/Together.tsx` - Reference implementation
- `src/pages/Notes.tsx` - Recent implementation
- `meals-design-spec.html` - Design specification
- `CLAUDE.md` - UI/UX standards

---

## Phase 0: Discovery & Verification ⭐ **START HERE**

Before making any changes, verify the current state to avoid wasted effort.

### Step 1: Compare with Design Spec
```bash
# Open design spec in browser
open meals-design-spec.html

# Run dev server and navigate to Meals tab
npm run dev
# Navigate to: http://localhost:5173/ → Meals tab
```

**Compare side-by-side:**
- [ ] Header design
- [ ] View tabs (Today/Week/Recipes/Grocery)
- [ ] Today view layout
- [ ] Weekly calendar grid
- [ ] Recipe cards
- [ ] Recipe form modal
- [ ] Meal planning modal
- [ ] Grocery list display
- [ ] Nutrition summary
- [ ] Empty states
- [ ] FAB placement

### Step 2: Inspect Current Database Schema
```typescript
// Recipes: recipes table
// Planned Meals: planned_meals table
// Grocery items: Generated from planned meals (not stored)

// Key fields to verify:
// Recipe:
// - name, cuisine, prepTime, cookTime, difficulty, servings
// - ingredients (array of objects)
// - instructions (array of strings)
// - nutritionInfo (calories, protein, carbs, fat, fiber, sugar)
// - tags, imageUrl, isFavorite

// PlannedMeal:
// - date (YYYY-MM-DD)
// - mealType (breakfast | lunch | dinner | snack)
// - recipeId (linked to recipe) OR customName (custom meal)
// - servings, status (planned | logged | skipped)
// - notes, actualNutrition

// GroceryItem:
// - Generated from planned meals' ingredients
// - name, amount, unit, category
// - isChecked, isAtHome
// - recipeIds (which recipes need this)
```

### Step 3: Check Current Component Structure
```bash
# List existing components
ls -la src/meals/components/
ls -la src/meals/components/views/

# Check if V2 directory exists
ls -la src/meals/components/v2/ 2>/dev/null || echo "V2 directory doesn't exist yet"
```

### Step 4: Review Current Hooks
```bash
# Check Meals query hooks
cat src/hooks/useMealPlanningQuery.ts | head -50
```

**Verify hooks available:**
- [ ] `useRecipesQuery()` - Fetch recipes
- [ ] `useMealPlansQuery()` - Fetch planned meals
- [ ] `useCreateRecipeMutation()`
- [ ] `useDeleteRecipeMutation()`
- [ ] `useCreatePlannedMealMutation()`
- [ ] `useUpdatePlannedMealMutation()`
- [ ] Import hooks (URL scraping)
- [ ] Grocery list generation

### Step 5: Identify Gaps

**From design spec comparison, identify missing/broken:**
- No V2 components yet
- No centered layout
- Header needs simplification
- Modals need Together pattern
- Calendar grid needs styling
- Recipe cards need enhancement
- [Add more as you discover them]

**Document in notes:**
```
Current Issues to Fix:
1. No V2 components directory
2. No centered layout (900px max-width)
3. Modals don't match Together pattern
4. Calendar grid needs better styling
5. Recipe cards need standardization
6. [Add more as you discover them]
```

---

## Implementation Plan

### Phase 1: Page Layout - Centered Container

**File:** `src/pages/MealPlanning.tsx`

**Changes:**
1. Wrap entire page content in centered container pattern:
   ```tsx
   import { useThemeColors } from '@/hooks/useThemeColors';

   const colors = useThemeColors();

   return (
     <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
       <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
         {/* All content */}
         <MealsHeaderV2 />
         {/* View selector, content */}
       </div>
     </div>
   );
   ```

2. Update Layout.tsx to exclude duplicate header:
   ```typescript
   // src/components/Layout.tsx
   {!isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && activeView !== 'todos' && activeView !== 'shopping' && activeView !== 'meals' && (
   {isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && activeView !== 'todos' && activeView !== 'shopping' && activeView !== 'meals' && (
   ```

**Expected Outcome:**
- Content centered on desktop (max 900px wide)
- Full width on mobile (minus padding)
- No duplicate "Meals" header
- Matches all previous tab layouts

---

### Phase 2: Create MealsHeaderV2 Component

**File:** `src/meals/components/v2/MealsHeaderV2.tsx` (Create new)

**Changes:**
1. Create simple header matching Together tab pattern:
   ```tsx
   import React from 'react';
   import { useThemeColors } from '@/hooks/useThemeColors';

   export const MealsHeaderV2: React.FC = () => {
     const colors = useThemeColors();

     return (
       <div className="mb-6">
         <h1 className="text-3xl font-bold flex items-center gap-3 mb-4" style={{ color: colors.text.primary }}>
           <span className="text-4xl">🍽️</span>
           Meal Planning
         </h1>
         <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
           Plan your meals and generate grocery lists
         </p>
       </div>
     );
   };
   ```

**Expected Outcome:**
- Simple header with emoji 🍽️
- No gradient text
- Matches Together/Notes/Goals/Tasks/Shopping style

---

### Phase 3: Create ViewSelectorV2 Component

**File:** `src/meals/components/v2/ViewSelectorV2.tsx` (Create new)

**Changes:**
1. Create view selector with SegmentedControlV2:
   ```tsx
   import React from 'react';
   import { SegmentedControlV2 } from '@/components/v2/SegmentedControlV2';

   export type MealView = 'today' | 'week' | 'recipes' | 'grocery';

   interface ViewSelectorV2Props {
     activeView: MealView;
     onChange: (view: MealView) => void;
   }

   export const ViewSelectorV2: React.FC<ViewSelectorV2Props> = ({
     activeView,
     onChange,
   }) => {
     return (
       <div className="mb-6">
         <SegmentedControlV2
           options={[
             { value: 'today', label: '📅 Today' },
             { value: 'week', label: '🗓️ Week' },
             { value: 'recipes', label: '📖 Recipes' },
             { value: 'grocery', label: '🛒 Grocery' },
           ]}
           value={activeView}
           onChange={(value) => onChange(value as MealView)}
         />
       </div>
     );
   };
   ```

**Expected Outcome:**
- Pill-style tab navigation
- Active view highlighted with terracotta
- Smooth transitions
- Matches Together pattern

---

### Phase 4: Create WeekNavigatorV2 Component

**File:** `src/meals/components/v2/WeekNavigatorV2.tsx` (Create new)

**Changes:**
1. Create week navigation controls:
   ```tsx
   import React from 'react';
   import { ChevronLeft, ChevronRight } from 'lucide-react';
   import { format, startOfWeek, endOfWeek } from 'date-fns';
   import { useThemeColors } from '@/hooks/useThemeColors';

   interface WeekNavigatorV2Props {
     currentDate: Date;
     onPreviousWeek: () => void;
     onNextWeek: () => void;
     onToday: () => void;
   }

   export const WeekNavigatorV2: React.FC<WeekNavigatorV2Props> = ({
     currentDate,
     onPreviousWeek,
     onNextWeek,
     onToday,
   }) => {
     const colors = useThemeColors();
     const weekStart = startOfWeek(currentDate);
     const weekEnd = endOfWeek(currentDate);

     return (
       <div className="mb-6 flex items-center justify-between">
         {/* Week Range Display */}
         <div>
           <div className="text-lg font-bold" style={{ color: colors.text.primary }}>
             {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
           </div>
         </div>

         {/* Navigation Controls */}
         <div className="flex gap-2">
           <button
             onClick={onPreviousWeek}
             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
             aria-label="Previous week"
           >
             <ChevronLeft className="w-5 h-5" style={{ color: colors.text.secondary }} />
           </button>
           <button
             onClick={onToday}
             className="px-4 py-2 rounded-lg font-semibold transition-colors"
             style={{
               background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)',
               borderWidth: '2px',
               borderStyle: 'solid',
               borderColor: '#C18B5E',
               color: '#C18B5E',
             }}
           >
             Today
           </button>
           <button
             onClick={onNextWeek}
             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
             aria-label="Next week"
           >
             <ChevronRight className="w-5 h-5" style={{ color: colors.text.secondary }} />
           </button>
         </div>
       </div>
     );
   };
   ```

**Expected Outcome:**
- Week range display
- Previous/Next navigation
- Today button highlighted
- Responsive controls

---

### Phase 5: Create CalendarGridV2 Component

**File:** `src/meals/components/v2/CalendarGridV2.tsx` (Create new)

**Changes:**
1. Create weekly calendar grid:
   ```tsx
   import React from 'react';
   import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
   import { useThemeColors } from '@/hooks/useThemeColors';
   import type { PlannedMeal } from '@/meals/types';
   import { MealCardV2 } from './MealCardV2';

   interface CalendarGridV2Props {
     currentDate: Date;
     plannedMeals: PlannedMeal[];
     onMealClick: (meal: PlannedMeal) => void;
     onCellClick: (date: Date, mealType: string) => void;
   }

   export const CalendarGridV2: React.FC<CalendarGridV2Props> = ({
     currentDate,
     plannedMeals,
     onMealClick,
     onCellClick,
   }) => {
     const colors = useThemeColors();
     const weekStart = startOfWeek(currentDate);
     const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
     const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

     const getMealsForDateAndType = (date: Date, mealType: string) => {
       return plannedMeals.filter(
         meal => isSameDay(new Date(meal.date), date) && meal.mealType === mealType
       );
     };

     return (
       <div className="mb-6">
         {/* Day Headers */}
         <div className="grid grid-cols-7 gap-2 mb-2">
           {days.map((day) => (
             <div
               key={day.toISOString()}
               className="text-center py-2 rounded-lg"
               style={{
                 backgroundColor: isToday(day) ? colors.bg.tertiary : 'transparent',
               }}
             >
               <div className="text-xs font-semibold" style={{ color: colors.text.tertiary }}>
                 {format(day, 'EEE')}
               </div>
               <div className="text-lg font-bold" style={{ color: isToday(day) ? '#C18B5E' : colors.text.primary }}>
                 {format(day, 'd')}
               </div>
             </div>
           ))}
         </div>

         {/* Meal Grid */}
         {mealTypes.map((mealType) => (
           <div key={mealType} className="mb-4">
             {/* Meal Type Row Header */}
             <div className="text-sm font-bold mb-2 capitalize" style={{ color: colors.text.secondary }}>
               {mealType === 'breakfast' && '🍳'} {mealType === 'lunch' && '🥗'}
               {mealType === 'dinner' && '🍽️'} {mealType === 'snack' && '🍎'} {mealType}
             </div>

             {/* Day Cells for this meal type */}
             <div className="grid grid-cols-7 gap-2">
               {days.map((day) => {
                 const meals = getMealsForDateAndType(day, mealType);
                 return (
                   <div
                     key={`${day.toISOString()}-${mealType}`}
                     onClick={() => meals.length === 0 && onCellClick(day, mealType)}
                     className="min-h-[80px] p-2 rounded-xl border cursor-pointer hover:border-terracotta-400 transition-colors"
                     style={{
                       backgroundColor: colors.bg.white,
                       borderColor: colors.border.light,
                     }}
                   >
                     {meals.length === 0 ? (
                       <div className="text-center text-gray-400 text-xs pt-6">+</div>
                     ) : (
                       <div className="space-y-1">
                         {meals.map((meal) => (
                           <MealCardV2
                             key={meal.id}
                             meal={meal}
                             onClick={() => onMealClick(meal)}
                             compact
                           />
                         ))}
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           </div>
         ))}
       </div>
     );
   };
   ```

**Expected Outcome:**
- 7-column grid (days of week)
- Day headers with today highlighted
- 4 rows (breakfast, lunch, dinner, snack)
- Cells show planned meals or + to add
- Click empty cell to plan meal
- Click meal to view/edit

---

### Phase 6: Create RecipeCardV2 Component

**File:** `src/meals/components/v2/RecipeCardV2.tsx` (Create new)

**Changes:**
1. Create enhanced recipe card:
   ```tsx
   import React from 'react';
   import { Clock, Users, Heart } from 'lucide-react';
   import { useThemeColors } from '@/hooks/useThemeColors';
   import type { Recipe } from '@/meals/types';

   interface RecipeCardV2Props {
     recipe: Recipe;
     onClick: () => void;
     onFavoriteToggle?: () => void;
   }

   export const RecipeCardV2: React.FC<RecipeCardV2Props> = ({
     recipe,
     onClick,
     onFavoriteToggle,
   }) => {
     const colors = useThemeColors();

     const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

     const difficultyColors = {
       easy: '#10B981',
       medium: '#F59E0B',
       hard: '#EF4444',
     };

     return (
       <div
         onClick={onClick}
         className="relative cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98]"
         style={{
           backgroundColor: 'white',
           borderLeft: `4px solid ${difficultyColors[recipe.difficulty || 'easy']}`,
           borderRadius: '12px',
           padding: '16px',
           boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
         }}
       >
         {/* Favorite Button */}
         {onFavoriteToggle && (
           <button
             onClick={(e) => {
               e.stopPropagation();
               onFavoriteToggle();
             }}
             className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
             aria-label={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
           >
             <Heart
               className="w-5 h-5"
               style={{ color: recipe.isFavorite ? '#EF4444' : '#9CA3AF' }}
               fill={recipe.isFavorite ? '#EF4444' : 'none'}
             />
           </button>
         )}

         {/* Recipe Image */}
         {recipe.imageUrl && (
           <div className="mb-3 rounded-lg overflow-hidden" style={{ height: '120px' }}>
             <img
               src={recipe.imageUrl}
               alt={recipe.name}
               className="w-full h-full object-cover"
             />
           </div>
         )}

         {/* Recipe Name */}
         <h3
           style={{
             fontSize: '15px',
             fontWeight: 700,
             color: colors.text.primary,
             marginBottom: '8px',
             lineHeight: 1.3,
             paddingRight: recipe.isFavorite ? '30px' : '0',
           }}
         >
           {recipe.name}
         </h3>

         {/* Cuisine & Difficulty */}
         <div className="flex gap-2 mb-3">
           {recipe.cuisine && (
             <div
               style={{
                 padding: '4px 8px',
                 background: colors.bg.tertiary,
                 borderRadius: '8px',
                 fontSize: '11px',
                 fontWeight: 600,
                 color: colors.text.secondary,
                 textTransform: 'capitalize',
               }}
             >
               {recipe.cuisine}
             </div>
           )}
           {recipe.difficulty && (
             <div
               style={{
                 padding: '4px 8px',
                 backgroundColor: `${difficultyColors[recipe.difficulty]}20`,
                 borderRadius: '8px',
                 fontSize: '11px',
                 fontWeight: 600,
                 color: difficultyColors[recipe.difficulty],
                 textTransform: 'capitalize',
               }}
             >
               {recipe.difficulty}
             </div>
           )}
         </div>

         {/* Meta Info */}
         <div className="flex items-center gap-4">
           {totalTime > 0 && (
             <div className="flex items-center gap-1">
               <Clock className="w-4 h-4" style={{ color: colors.text.tertiary }} />
               <span className="text-xs" style={{ color: colors.text.secondary }}>
                 {totalTime} min
               </span>
             </div>
           )}
           {recipe.servings && (
             <div className="flex items-center gap-1">
               <Users className="w-4 h-4" style={{ color: colors.text.tertiary }} />
               <span className="text-xs" style={{ color: colors.text.secondary }}>
                 {recipe.servings} servings
               </span>
             </div>
           )}
           {recipe.nutritionInfo?.calories && (
             <div className="flex items-center gap-1">
               <span className="text-xs" style={{ color: colors.text.secondary }}>
                 {recipe.nutritionInfo.calories} cal
               </span>
             </div>
           )}
         </div>
       </div>
     );
   };
   ```

**Expected Outcome:**
- Recipe card with image
- Border-left accent based on difficulty
- Favorite heart button
- Cuisine and difficulty badges
- Meta info (time, servings, calories)
- Hover animation

---

### Phase 7: Create RecipeFormModalV2 Component

**File:** `src/meals/components/v2/RecipeFormModalV2.tsx` (Create new)

**This is a comprehensive modal for creating/editing recipes.**

**Key Fields:**
- Name (required)
- Cuisine (dropdown)
- Difficulty (easy/medium/hard)
- Prep Time + Cook Time
- Servings
- Ingredients (dynamic list)
- Instructions (dynamic list)
- Nutrition Info (calories, protein, carbs, fat, fiber, sugar)
- Tags
- Image URL
- Favorite toggle

**Structure:**
```tsx
// Together pattern:
// - Mobile drag handle
// - Fixed header with close button
// - Scrollable form content (all fields above)
// - Fixed footer with action buttons
// - Auto-save to localStorage
// - ESC key and backdrop click support
// - Delete button in edit mode

// Ingredients section: dynamic add/remove with:
// - Name, Amount, Unit
// - Category (for grocery list grouping)

// Instructions section: numbered list with:
// - Add/remove/reorder steps
```

---

### Phase 8: Create MealFormModalV2 Component

**File:** `src/meals/components/v2/MealFormModalV2.tsx` (Create new)

**For planning a meal on a specific date/type.**

**Key Fields:**
- Date (auto-filled from calendar cell click)
- Meal Type (breakfast/lunch/dinner/snack)
- Recipe Selector (dropdown or search)
- OR Custom Meal Name (if not using recipe)
- Servings
- Notes

**Structure:**
```tsx
// Together pattern modal
// Recipe selector: searchable dropdown with recipe cards
// Show recipe nutrition preview when selected
// Quick favorite recipes at top
```

---

### Phase 9: Create GroceryListV2 Component

**File:** `src/meals/components/v2/GroceryListV2.tsx` (Create new)

**Auto-generated grocery list from planned meals.**

**Features:**
- Group ingredients by category (produce, dairy, meat, etc.)
- Show which recipes need each ingredient
- Checkbox to mark purchased
- "Already at home" toggle
- Export to shopping list
- Quantity aggregation (combine same ingredients)

**Structure:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { GroceryItem } from '@/meals/types';
import { GroceryItemV2 } from './GroceryItemV2';

interface GroceryListV2Props {
  items: GroceryItem[];
  onItemCheck: (itemId: string) => void;
  onItemToggleAtHome: (itemId: string) => void;
  onExportToShopping: () => void;
}

export const GroceryListV2: React.FC<GroceryListV2Props> = ({
  items,
  onItemCheck,
  onItemToggleAtHome,
  onExportToShopping,
}) => {
  const colors = useThemeColors();

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  const categories = Object.keys(groupedItems).sort();

  return (
    <div>
      {/* Export Button */}
      <div className="mb-6">
        <button
          onClick={onExportToShopping}
          className="w-full px-4 py-3 rounded-xl font-semibold text-white transition-opacity"
          style={{
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
          }}
        >
          🛒 Add to Shopping List
        </button>
      </div>

      {/* Grouped Grocery Items */}
      {categories.map((category) => (
        <div key={category} className="mb-6">
          <h3
            className="text-sm font-bold mb-3 capitalize"
            style={{ color: colors.text.secondary }}
          >
            {getCategoryEmoji(category)} {category}
          </h3>
          <div className="space-y-2">
            {groupedItems[category].map((item) => (
              <GroceryItemV2
                key={item.id}
                item={item}
                onCheck={() => onItemCheck(item.id)}
                onToggleAtHome={() => onItemToggleAtHome(item.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    produce: '🥬',
    dairy: '🥛',
    meat: '🥩',
    pantry: '🥫',
    frozen: '🧊',
    bakery: '🍞',
    other: '📦',
  };
  return emojis[category] || '📦';
}
```

---

### Phase 10: Create NutritionSummaryV2 Component

**File:** `src/meals/components/v2/NutritionSummaryV2.tsx` (Create new)

**Show nutrition totals for planned meals.**

**Structure:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { NutritionInfo } from '@/meals/types';

interface NutritionSummaryV2Props {
  nutrition: NutritionInfo;
  dailyGoals?: NutritionInfo; // Optional daily targets
}

export const NutritionSummaryV2: React.FC<NutritionSummaryV2Props> = ({
  nutrition,
  dailyGoals,
}) => {
  const colors = useThemeColors();

  const nutrients = [
    { key: 'calories', label: 'Calories', unit: 'cal', color: '#C18B5E' },
    { key: 'protein', label: 'Protein', unit: 'g', color: '#3B82F6' },
    { key: 'carbs', label: 'Carbs', unit: 'g', color: '#F59E0B' },
    { key: 'fat', label: 'Fat', unit: 'g', color: '#EF4444' },
    { key: 'fiber', label: 'Fiber', unit: 'g', color: '#10B981' },
    { key: 'sugar', label: 'Sugar', unit: 'g', color: '#EC4899' },
  ] as const;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-4" style={{ color: colors.text.primary }}>
        Nutrition Summary
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {nutrients.map(({ key, label, unit, color }) => {
          const value = nutrition[key] || 0;
          const goal = dailyGoals?.[key];
          const percentage = goal ? (value / goal) * 100 : 0;

          return (
            <div
              key={key}
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: colors.bg.white,
                borderColor: colors.border.light,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: colors.text.secondary }}>
                  {label}
                </span>
                {goal && (
                  <span className="text-xs" style={{ color: colors.text.tertiary }}>
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold mb-2" style={{ color }}>
                {value.toFixed(0)}
                <span className="text-sm font-normal ml-1" style={{ color: colors.text.tertiary }}>
                  {unit}
                </span>
              </div>
              {goal && (
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: colors.border.light }}
                >
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

---

### Phase 11: Create FilterBarV2 Component (for Recipes)

**File:** `src/meals/components/v2/FilterBarV2.tsx` (Create new)

**Recipe filtering:**
- Search by name
- Filter by cuisine
- Filter by difficulty
- Filter by prep time
- Favorites only toggle

---

### Phase 12: Create ImportRecipeModalV2 Component

**File:** `src/meals/components/v2/ImportRecipeModalV2.tsx` (Create new)

**Import recipe from URL.**

**Features:**
- URL input
- Scrape recipe data from common sites
- Preview scraped data
- Edit before saving
- Together pattern modal

---

### Phase 13: Update Main Page with V2 Components

**File:** `src/pages/MealPlanning.tsx`

**Changes:**
1. Apply centered layout
2. Replace header with MealsHeaderV2
3. Add ViewSelectorV2
4. Integrate all V2 components for each view
5. Use useModalState for all modals
6. Clean up old components

---

### Phase 14: Update Layout.tsx

**File:** `src/components/Layout.tsx`

```typescript
// Add 'meals' to exclusion list
{!isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && activeView !== 'todos' && activeView !== 'shopping' && activeView !== 'meals' && (
{isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && activeView !== 'todos' && activeView !== 'shopping' && activeView !== 'meals' && (
```

---

## Testing Checklist

### Visual Comparison
- [ ] Open `meals-design-spec.html`
- [ ] Open Meals tab
- [ ] Compare side-by-side
- [ ] All spacing, colors, fonts match

### Page Layout
- [ ] Content centered (max 900px)
- [ ] No duplicate header
- [ ] Proper padding

### Header
- [ ] Simple header (emoji + title)
- [ ] Matches Together pattern

### View Tabs
- [ ] Today view works
- [ ] Week view works
- [ ] Recipes view works
- [ ] Grocery view works
- [ ] Active view highlighted

### Week Navigation
- [ ] Previous week works
- [ ] Next week works
- [ ] Today button works
- [ ] Week range displays correctly

### Calendar Grid
- [ ] 7 columns (days)
- [ ] Today highlighted
- [ ] 4 meal type rows
- [ ] Empty cells show +
- [ ] Planned meals display
- [ ] Click cell to add meal
- [ ] Click meal to edit

### Recipe Management
- [ ] Recipe cards display
- [ ] Favorite toggle works
- [ ] Create recipe works
- [ ] Edit recipe works
- [ ] Delete recipe works
- [ ] Recipe search works
- [ ] Filter by cuisine works
- [ ] Filter by difficulty works

### Recipe Form Modal
- [ ] Together pattern structure
- [ ] All fields present
- [ ] Ingredients list (add/remove)
- [ ] Instructions list (add/remove)
- [ ] Nutrition fields
- [ ] Auto-save draft
- [ ] ESC/backdrop close
- [ ] Delete button (edit mode)

### Meal Planning
- [ ] Plan meal from calendar
- [ ] Recipe selector works
- [ ] Custom meal works
- [ ] Servings adjust
- [ ] Edit planned meal works
- [ ] Delete planned meal works
- [ ] Meal status toggle works

### Grocery List
- [ ] Auto-generates from meals
- [ ] Groups by category
- [ ] Shows recipe sources
- [ ] Checkbox works
- [ ] "At home" toggle works
- [ ] Export to shopping works
- [ ] Quantities aggregate correctly

### Nutrition Summary
- [ ] Totals calculate correctly
- [ ] Progress bars show
- [ ] Daily goals display (if set)
- [ ] Macros tracked

### Import Recipe
- [ ] URL input works
- [ ] Scraping works
- [ ] Preview displays
- [ ] Edit before save works
- [ ] Save to recipes works

### Responsive
- [ ] Mobile layout correct
- [ ] Desktop layout correct
- [ ] Calendar responsive
- [ ] Modals responsive

### Accessibility
- [ ] Tab navigation works
- [ ] Aria-labels present
- [ ] Focus visible

---

## Common Pitfalls

| Issue | Solution | Prevention |
|-------|----------|------------|
| Duplicate headers | Exclude 'meals' from Layout.tsx | Check Layout.tsx first |
| Calendar grid overflow | Use responsive grid with proper min widths | Test on mobile |
| Ingredient list bugs | Use unique keys for dynamic lists | Test add/remove thoroughly |
| Nutrition calculation errors | Validate all number inputs | Handle null/undefined values |
| Date timezone issues | Use date-fns with consistent format | Always use YYYY-MM-DD for dates |

---

## Meals-Specific Challenges

### Challenge 1: Weekly Calendar Grid
**Solution:**
- 7-column responsive grid
- 4 meal type rows
- Min height for cells
- Handle multiple meals per cell
- Touch-friendly on mobile

### Challenge 2: Ingredient Management
**Solution:**
- Dynamic add/remove ingredients
- Amount + unit fields
- Category for grocery grouping
- Validation for required fields
- Drag to reorder (optional)

### Challenge 3: Grocery List Generation
**Solution:**
- Aggregate same ingredients from multiple recipes
- Combine quantities intelligently
- Group by category
- Track which recipes need each item
- Handle custom meals (no recipe)

### Challenge 4: Recipe Import from URLs
**Solution:**
- Scrape recipe data from common sites (AllRecipes, Food Network, etc.)
- Parse ingredients and instructions
- Extract nutrition if available
- Handle different HTML structures
- Graceful fallback if scraping fails

### Challenge 5: Nutrition Tracking
**Solution:**
- Calculate totals from all planned meals
- Show daily progress vs goals
- Handle missing nutrition data
- Macros breakdown (protein, carbs, fat)
- Progress bars with colors

---

## File Modification Summary

**Files to Create:** 14
- ✏️ `src/meals/components/v2/MealsHeaderV2.tsx`
- ✏️ `src/meals/components/v2/ViewSelectorV2.tsx`
- ✏️ `src/meals/components/v2/WeekNavigatorV2.tsx`
- ✏️ `src/meals/components/v2/CalendarGridV2.tsx`
- ✏️ `src/meals/components/v2/RecipeCardV2.tsx`
- ✏️ `src/meals/components/v2/RecipeFormModalV2.tsx`
- ✏️ `src/meals/components/v2/MealFormModalV2.tsx`
- ✏️ `src/meals/components/v2/MealCardV2.tsx`
- ✏️ `src/meals/components/v2/GroceryListV2.tsx`
- ✏️ `src/meals/components/v2/GroceryItemV2.tsx`
- ✏️ `src/meals/components/v2/NutritionSummaryV2.tsx`
- ✏️ `src/meals/components/v2/FilterBarV2.tsx`
- ✏️ `src/meals/components/v2/ImportRecipeModalV2.tsx`
- ✏️ `src/meals/components/v2/index.ts`

**Files to Update:** 2
- ✏️ `src/pages/MealPlanning.tsx` - Integrate V2 components
- ✏️ `src/components/Layout.tsx` - Exclude duplicate header

**Reference Files:** 4
- 📖 `meals-design-spec.html`
- 📖 `src/pages/Together.tsx`
- 📖 `src/pages/Notes.tsx`
- 📖 `CLAUDE.md`

---

## Commit Message Template

```bash
feat: Complete Meals tab UI/UX enhancement with Together patterns

Updated Meals feature to match meals-design-spec.html and apply all 25
UI/UX enhancement patterns from CLAUDE.md. Major improvements include:

UI Components:
- Created MealsHeaderV2: Simple header matching Together tab
- Created ViewSelectorV2: 4 view tabs (Today/Week/Recipes/Grocery)
- Created WeekNavigatorV2: Week navigation with previous/next/today
- Created CalendarGridV2: Weekly meal planning calendar (7 days × 4 meal types)
- Created RecipeCardV2: Enhanced recipe cards with images, difficulty, time
- Created MealCardV2: Planned meal cards for calendar
- Created GroceryListV2: Auto-generated grocery list with categories
- Created NutritionSummaryV2: Nutrition tracking with progress bars

Modals (Together Pattern):
- RecipeFormModalV2: Full recipe creation/editing
  - Dynamic ingredient list (add/remove)
  - Dynamic instruction list (numbered steps)
  - Nutrition info fields
  - Cuisine, difficulty, time, servings
  - Image URL and favorite toggle
- MealFormModalV2: Plan meals on calendar
  - Recipe selector or custom meal
  - Date and meal type
  - Servings and notes
- ImportRecipeModalV2: Import recipes from URLs
  - URL scraping from common sites
  - Preview and edit before saving
- Mobile drag handles, fixed headers/footers, scrollable content
- Auto-save to localStorage
- ESC key and backdrop support

Page Layout:
- Applied centered layout (900px max-width)
- Removed duplicate "Meals" header from Layout.tsx
- Simple header (no gradient text)

Features:
- 4 views: Today, Week, Recipes, Grocery
- Weekly calendar grid (7 days × 4 meal types)
- Recipe library with search and filters
- Auto-generated grocery list from planned meals
- Nutrition tracking and summaries
- Recipe import from URLs
- Favorite recipes
- Week navigation and copying
- Ingredient aggregation for grocery list

Advanced Features:
- Recipe import with URL scraping
- Grocery list generation with category grouping
- Nutrition calculation and tracking
- Macro breakdown (protein, carbs, fat)
- Progress bars for daily nutrition goals
- Ingredients grouped by category for grocery shopping
- Shows which recipes need each ingredient

Technical:
- All V2 components in src/meals/components/v2/
- Maintained existing functionality (planning, recipes, grocery)
- Responsive mobile/desktop behavior
- Lazy loading for heavy components

Fixes:
- No duplicate headers
- Simple header (no gradient text)
- Calendar grid responsive
- Ingredient list dynamic add/remove works
- Nutrition calculations accurate

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Success Criteria

✅ Meals page matches `meals-design-spec.html` exactly
✅ All 25 UI/UX patterns from CLAUDE.md applied
✅ All modals match Together pattern
✅ Auto-save functionality works
✅ Centered page layout (900px max-width)
✅ Simple header matching Together tab
✅ 4 views working correctly
✅ Weekly calendar grid functional
✅ Recipe management complete
✅ Grocery list auto-generation works
✅ Nutrition tracking accurate
✅ Recipe import works
✅ Responsive mobile/desktop
✅ Accessible
✅ No console errors

---

## Estimated Complexity

**Complexity:** High (calendar grid, dynamic lists, grocery generation)
**Risk Level:** Medium (complex logic but smaller codebase than Shopping/Tasks)
**Estimated Components:** 14 new V2 components + 2 file updates

---

## Next Steps After Meals

Recommended order for remaining tabs:

1. **Travel** - Trip planning
2. **Finance** - Accounts, transactions
3. **Nutrition** - Food logging
4. **Self Care** - Activities
5. **Projects** - Project management
6. **Focus** - Focus sessions
7. **Calendar** - Calendar view
8. **Dashboard** - Overview
9. **Assistant** - AI assistant

Each will have a detailed plan created before implementation.
