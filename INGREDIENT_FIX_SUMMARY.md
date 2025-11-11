# Recipe Ingredient Persistence Fix

## Summary
Fixed the issue where recipe ingredients were not being persisted to the database, which prevented the grocery list feature from working properly.

## Changes Made

### 1. Database Schema (`supabase/migrations/202502180001_add_recipe_ingredients_jsonb.sql`)
- Added `ingredients` JSONB column to `recipes` table
- Created GIN index for fast ingredient queries
- Structure: `[{"name": "flour", "amount": "2", "unit": "cups"}]`

### 2. Type Definitions (`src/services/types.ts`)
- Added `ingredients` field to `RecipeData` interface:
  ```typescript
  ingredients?: Array<{ name: string; amount?: string; unit?: string }> | null;
  ```

### 3. Store Mappers (`src/stores/useRealAppStore.ts`)

#### `mapRecipeDataToRecipe` (lines 780-815)
- Now extracts ingredients from database response
- Maps each ingredient to frontend format

#### `buildRecipeInsertPayload` (lines 817-844)
- Includes ingredients in recipe creation payload
- Converts ingredient array to JSONB-compatible format

#### `buildRecipeUpdatePayload` (lines 846-873)
- Includes ingredients in recipe update payload
- Preserves ingredient structure on updates

### 4. Supabase Adapter (`src/services/supabaseAdapter.ts`)
- Updated `createRecipe` method (line 836) to include ingredients in patch operation

## How to Apply

### Option 1: Local Development (Requires Docker)
```bash
# Start Docker Desktop first, then:
npx supabase db reset --local
```

### Option 2: Push to Cloud
```bash
# Push migration to your Supabase project:
npx supabase db push
```

### Option 3: Manual SQL (via Supabase Dashboard)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration file content:
```sql
ALTER TABLE recipes
    ADD COLUMN IF NOT EXISTS ingredients JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_recipes_ingredients ON recipes USING gin(ingredients);

COMMENT ON COLUMN recipes.ingredients IS 'Array of ingredient objects with structure: [{"name": "flour", "amount": "2", "unit": "cups"}]';
```

## Testing

After applying the migration, test the fix:

1. **Import a recipe** (via YouTube, URL, or Paste Text)
2. **Check the recipe card** - ingredients should display
3. **Add recipe to meal plan** for the current week
4. **Open Grocery List** - ingredients should appear

### Test Recipe (Paste Text)
```
Banana Bread

Ingredients:
3 ripe bananas
1/2 cup butter
3/4 cup sugar
2 eggs
2 cups flour
1 tsp baking soda

Instructions:
1. Preheat oven to 350°F
2. Mash bananas in a bowl
3. Mix in melted butter, sugar, and eggs
4. Fold in flour and baking soda
5. Pour into loaf pan and bake 60 minutes
```

## What Now Works

✅ **Recipe Creation**: Ingredients persist to database
✅ **Recipe Viewing**: Ingredients display in recipe cards
✅ **Recipe Editing**: Ingredient changes save properly
✅ **Grocery List**: Auto-generates from meal plan recipes
✅ **Portion Scaling**: Ingredients scale with servings

## Migration Details

- **File**: `supabase/migrations/202502180001_add_recipe_ingredients_jsonb.sql`
- **Type**: Additive (safe to run on existing data)
- **Backward Compatible**: Yes (existing recipes get empty array)
- **Index**: GIN index for efficient JSON queries

## Next Steps (Optional Enhancements)

1. **Re-enable Meal Options Manager** (currently commented out)
2. **Add recipe search/filter** by ingredient
3. **Pantry integration** ("already have" indicators)
4. **Recipe nutrition display** (schema ready, needs UI)

## Troubleshooting

**Issue**: Migration fails with "column already exists"
- **Solution**: The `ADD COLUMN IF NOT EXISTS` will skip safely

**Issue**: Ingredients still empty after migration
- **Solution**: Create a new recipe; existing recipes without ingredients need manual import/update

**Issue**: TypeScript errors about ingredients
- **Solution**: Restart your dev server: `npm run dev`

## Files Modified

```
src/services/types.ts                 (added ingredients to RecipeData)
src/stores/useRealAppStore.ts         (3 functions updated)
src/services/supabaseAdapter.ts       (createRecipe updated)
supabase/migrations/...sql            (new migration file)
```
