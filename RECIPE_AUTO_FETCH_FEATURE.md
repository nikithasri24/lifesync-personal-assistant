# Recipe Auto-Fetch Feature

## Overview
Implemented automatic recipe lookup and fetching when adding meals to the meal planning grid.

## How It Works

### 1. Auto-Linking to Existing Recipes
When you add a meal with a custom name:
- System checks if a recipe with that name already exists (case-insensitive match)
- If found, automatically links the meal to that recipe
- You'll see the chef hat icon to view the recipe

### 2. Auto-Fetching from Google (Backend Required)
If no existing recipe is found:
- System attempts to fetch recipe data from Google
- Creates a new recipe automatically
- Links the meal to the newly created recipe

### 3. Auto-Save Recipe Edits
When editing recipes:
- Changes are automatically saved after 2 seconds of inactivity
- Visual indicator shows "Saving..." or "Auto-saved" status
- No manual save button needed - just close when done

## Backend Setup Required

To enable Google recipe fetching, you need to set up a backend endpoint:

### Endpoint: `/api/recipe/search`

**Request:**
```
GET /api/recipe/search?q=chicken+tikka+masala+recipe
```

**Expected Response:**
```json
{
  "name": "Chicken Tikka Masala",
  "description": "A flavorful Indian curry dish",
  "ingredients": [
    { "name": "chicken breast", "amount": "2", "unit": "lbs" },
    { "name": "yogurt", "amount": "1", "unit": "cup" }
  ],
  "instructions": [
    "Marinate chicken in yogurt and spices",
    "Cook in a pan until done"
  ],
  "prepTime": 20,
  "cookTime": 30,
  "servings": 4,
  "tags": ["indian", "curry"],
  "image": "https://example.com/image.jpg",
  "sourceUrl": "https://example.com/recipe",
  "authorName": "Recipe Author"
}
```

### Implementation Options

#### Option 1: Google Custom Search API
1. Create a Google Custom Search Engine
2. Use the API to search for "[meal name] recipe"
3. Scrape the first result using the existing clipper

#### Option 2: Recipe API Services
Use existing recipe APIs like:
- Spoonacular API
- Edamam Recipe API
- TheMealDB API

#### Option 3: Web Scraping
1. Search Google for "[meal name] recipe"
2. Parse search results
3. Use the existing `/api/clip/recipe` endpoint to scrape the top result

### Environment Variable

Set the endpoint URL (optional, defaults to `/api/recipe/search`):
```
VITE_RECIPE_SEARCH_URL=/api/recipe/search
```

## Fallback Behavior

If the backend endpoint is not available or fails:
- Meal is created as a custom meal (no recipe link)
- User can manually add recipe later using the chef hat icon
- No errors shown to user - graceful degradation

## Features Implemented

✅ Auto-link to existing recipes by name
✅ Auto-fetch recipes from Google (requires backend)
✅ Auto-save recipe edits with 2-second debounce
✅ Visual auto-save indicator
✅ Graceful fallback to custom meals
✅ Plain text editable recipe fields
✅ Database persistence for all recipes

## User Flow

1. **Add a meal** - Type "Chicken Tikka Masala" in a cell
2. **Auto-lookup** - System checks existing recipes
3. **Auto-fetch** - If not found, fetches from Google (if backend is set up)
4. **Auto-link** - Meal is linked to recipe automatically
5. **View/Edit** - Click chef hat to view/edit recipe card
6. **Auto-save** - Edits save automatically as you type
7. **Persist** - All changes saved to database

## Testing Without Backend

You can test the auto-linking feature immediately:
1. Create a recipe manually (e.g., "Pasta")
2. Add a meal with the same name
3. System will auto-link them

Google fetching will be skipped and meal will be created as custom meal.
