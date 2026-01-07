/**
 * Meal Planning AI Tools
 *
 * AI tools for meal planning and recipe suggestions
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import * as mealPlanningAPI from '@/api/mealPlanningAPI';
import { logger } from '@/services/logger';
import type { RecipeData, PantryItemData } from '@/services/types';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const suggestMealDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'suggest_meal',
    description: 'Suggest meals based on available pantry ingredients and meal type. Requires meal_type (string). Returns meal suggestions.',
    parameters: {
      type: 'object',
      properties: {
        meal_type: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          description: 'Type of meal needed - required'
        }
      },
      required: ['meal_type']
    }
  }
};

const getRecipesDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_recipes',
    description: 'Get all saved recipes. Optional: category (string) to filter by meal type, search_term (string) to search by name.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category like "breakfast", "lunch", "dinner", "dessert" - optional'
        },
        search_term: {
          type: 'string',
          description: 'Search recipes by name - optional'
        }
      }
    }
  }
};

const addRecipeDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'add_recipe',
    description: 'Add a new recipe to your collection. Requires name (string). Optional: description, prep_time (number in minutes), cook_time (number in minutes), servings (number).',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Recipe name (e.g., "Chicken Stir Fry") - required'
        },
        description: {
          type: 'string',
          description: 'Recipe description or notes - optional'
        },
        prep_time: {
          type: 'number',
          description: 'Preparation time in minutes - optional'
        },
        cook_time: {
          type: 'number',
          description: 'Cooking time in minutes - optional'
        },
        servings: {
          type: 'number',
          description: 'Number of servings - optional'
        }
      },
      required: ['name']
    }
  }
};

// =====================================================
// TOOL IMPLEMENTATIONS
// =====================================================

/**
 * Suggest meals based on pantry items and meal type
 */
async function executeSuggestMeal(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const mealType = args.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack';

    // Validate
    if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
      return {
        success: false,
        error: 'Meal type must be breakfast, lunch, dinner, or snack'
      };
    }

    logger.info('MealTools', 'Suggesting meal', { mealType });

    // Get pantry items to suggest meals based on available ingredients
    const pantryItems = await mealPlanningAPI.getPantryItems();

    // Get saved recipes
    const allRecipes = await mealPlanningAPI.getRecipes();

    // Filter recipes by tags if applicable
    const categoryRecipes = allRecipes.filter(recipe =>
      recipe.tags?.some(tag => tag.toLowerCase() === mealType.toLowerCase())
    );

    logger.info('MealTools', 'Meal suggestions generated', {
      mealType,
      pantryItemCount: pantryItems.length,
      matchingRecipes: categoryRecipes.length
    });

    // Create suggestions based on pantry ingredients
    const suggestions: string[] = [];

    // Add user's saved recipes first
    if (categoryRecipes.length > 0) {
      suggestions.push(...categoryRecipes.slice(0, 2).map(r => r.name));
    }

    // Add some default suggestions based on common pantry items
    const pantryIngredients = pantryItems.map(item => item.name.toLowerCase());

    if (mealType === 'breakfast') {
      if (pantryIngredients.some(i => i.includes('egg') || i.includes('eggs'))) {
        suggestions.push('Scrambled Eggs');
      }
      if (pantryIngredients.some(i => i.includes('oat') || i.includes('oatmeal'))) {
        suggestions.push('Oatmeal Bowl');
      }
      if (suggestions.length === 0) {
        suggestions.push('Toast with Avocado', 'Fruit Smoothie');
      }
    } else if (mealType === 'lunch') {
      if (pantryIngredients.some(i => i.includes('chicken'))) {
        suggestions.push('Chicken Salad');
      }
      if (pantryIngredients.some(i => i.includes('pasta') || i.includes('noodle'))) {
        suggestions.push('Pasta Bowl');
      }
      if (suggestions.length === 0) {
        suggestions.push('Grilled Sandwich', 'Veggie Wrap');
      }
    } else if (mealType === 'dinner') {
      if (pantryIngredients.some(i => i.includes('chicken'))) {
        suggestions.push('Chicken Stir Fry');
      }
      if (pantryIngredients.some(i => i.includes('rice'))) {
        suggestions.push('Fried Rice');
      }
      if (suggestions.length === 0) {
        suggestions.push('Pasta Aglio e Olio', 'Baked Salmon');
      }
    } else if (mealType === 'snack') {
      suggestions.push('Fruit Salad', 'Trail Mix', 'Hummus with Veggies');
    }

    // Ensure we have at least 2 suggestions
    const finalSuggestions = Array.from(new Set(suggestions)).slice(0, 3);

    return {
      success: true,
      meal_type: mealType,
      suggestions: finalSuggestions,
      pantry_items_available: pantryItems.length,
      message: `Based on your pantry, I suggest these ${mealType} options: ${finalSuggestions.join(', ')}`
    };
  } catch (error) {
    logger.error('MealTools', 'Operation failed', { error,
      operation: 'suggest_meal',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to suggest meals'
    };
  }
}

/**
 * Get all recipes
 */
async function executeGetRecipes(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const category = args.category as string | undefined;
    const searchTerm = args.search_term as string | undefined;

    logger.info('MealTools', 'Getting recipes', { category, searchTerm });

    let recipes = await mealPlanningAPI.getRecipes();

    // Apply filters
    if (category) {
      recipes = recipes.filter(recipe =>
        recipe.tags?.some(tag => tag.toLowerCase() === category.toLowerCase())
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      recipes = recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(term) ||
        recipe.description?.toLowerCase().includes(term)
      );
    }

    logger.info('MealTools', 'Recipes retrieved', {
      count: recipes.length,
      category,
      searchTerm
    });

    return {
      success: true,
      recipes: recipes.map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        tags: recipe.tags,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings
      })),
      count: recipes.length,
      message: `You have ${recipes.length} recipe${recipes.length !== 1 ? 's' : ''}${category ? ` in ${category}` : ''}`
    };
  } catch (error) {
    logger.error('MealTools', 'Operation failed', { error,
      operation: 'get_recipes',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recipes'
    };
  }
}

/**
 * Add a new recipe
 */
async function executeAddRecipe(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const name = args.name as string;
    const description = args.description as string | undefined;
    const prepTime = args.prep_time as number | undefined;
    const cookTime = args.cook_time as number | undefined;
    const servings = args.servings as number | undefined;

    // Validate
    if (!name || name.trim().length === 0) {
      return {
        success: false,
        error: 'Recipe name is required'
      };
    }

    logger.info('MealTools', 'Adding recipe', {
      name,
      prepTime,
      cookTime,
      servings
    });

    const recipe = await mealPlanningAPI.createRecipe({
      name: name.trim(),
      description,
      prep_time: prepTime,
      cook_time: cookTime,
      servings
    });

    logger.info('MealTools', 'Recipe added successfully', {
      recipeId: recipe.id,
      name: recipe.name
    });

    return {
      success: true,
      message: `Recipe "${recipe.name}" added successfully!`,
      recipe: {
        id: recipe.id,
        name: recipe.name,
        tags: recipe.tags,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings
      }
    };
  } catch (error) {
    logger.error('MealTools', 'Operation failed', { error,
      operation: 'add_recipe',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add recipe'
    };
  }
}

// =====================================================
// EXPORTED TOOLS
// =====================================================

export const mealTools: Tool[] = [
  {
    definition: suggestMealDefinition,
    execute: executeSuggestMeal
  },
  {
    definition: getRecipesDefinition,
    execute: executeGetRecipes
  },
  {
    definition: addRecipeDefinition,
    execute: executeAddRecipe
  }
];
