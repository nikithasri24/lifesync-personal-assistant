/**
 * Recipe Queries and Mutations
 * 
 * React Query hooks for recipe CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as mealPlanningAPI from '@/api/mealPlanningAPI';
import type { RecipeData } from '@/services/types';
import { logger } from '@/services/logger';
import { mealPlanningKeys } from './keys';
import type { Recipe, RecipeInput, RecipeUpdate } from './types';
import { mapRecipeDataToRecipe, buildRecipeInsertPayload, buildRecipeUpdatePayload } from './mappers';

/**
 * Fetch all recipes
 */
export function useRecipesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: mealPlanningKeys.recipesList(),
    queryFn: async () => {
      const data = await mealPlanningAPI.getRecipes();
      return data.map(mapRecipeDataToRecipe);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: options?.enabled ?? true,
  });
}

/**
 * Create a new recipe
 */
export function useCreateRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RecipeInput) => {
      const payload = buildRecipeInsertPayload(input) as Omit<RecipeData, 'id' | 'created_at' | 'updated_at'>;
      const created = await mealPlanningAPI.createRecipe(payload);
      return mapRecipeDataToRecipe(created);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.recipesList() });
      const previousRecipes = queryClient.getQueryData<Recipe[]>(mealPlanningKeys.recipesList());

      const optimisticRecipe: Recipe = {
        id: `temp-${Date.now()}`,
        ...input,
        instructions: input.instructions ?? [],
        ingredients: input.ingredients ?? [],
        createdAt: new Date(),
      };

      queryClient.setQueryData<Recipe[]>(mealPlanningKeys.recipesList(), (old) => {
        if (!old) return [optimisticRecipe];
        return [optimisticRecipe, ...old];
      });

      return { previousRecipes };
    },
    onError: (err, _variables, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(mealPlanningKeys.recipesList(), context.previousRecipes);
      }
      logger.error('MealPlanning', 'Error creating recipe', { error: err });
    },
    onSuccess: (newRecipe) => {
      queryClient.setQueryData<Recipe[]>(mealPlanningKeys.recipesList(), (old) => {
        if (!old) return [newRecipe];
        return old.map((r) => (r.id.startsWith('temp-') ? newRecipe : r));
      });
    },
  });
}

/**
 * Update an existing recipe
 */
export function useUpdateRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipeId, updates }: { recipeId: string; updates: RecipeUpdate }) => {
      const payload = buildRecipeUpdatePayload(updates) as Partial<RecipeData>;
      const updated = await mealPlanningAPI.updateRecipe(recipeId, payload);
      return mapRecipeDataToRecipe(updated);
    },
    onMutate: async ({ recipeId, updates }) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.recipesList() });
      const previousRecipes = queryClient.getQueryData<Recipe[]>(mealPlanningKeys.recipesList());

      queryClient.setQueryData<Recipe[]>(mealPlanningKeys.recipesList(), (old) => {
        if (!old) return [];
        return old.map((r) => (r.id === recipeId ? { ...r, ...updates } : r));
      });

      return { previousRecipes };
    },
    onError: (err, _variables, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(mealPlanningKeys.recipesList(), context.previousRecipes);
      }
      logger.error('MealPlanning', 'Error updating recipe', { error: err });
    },
    onSuccess: (updatedRecipe) => {
      queryClient.setQueryData<Recipe[]>(mealPlanningKeys.recipesList(), (old) => {
        if (!old) return [updatedRecipe];
        return old.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r));
      });
    },
  });
}

/**
 * Delete a recipe
 */
export function useDeleteRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId: string) => {
      await mealPlanningAPI.deleteRecipe(recipeId);
      return recipeId;
    },
    onMutate: async (recipeId) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.recipesList() });
      const previousRecipes = queryClient.getQueryData<Recipe[]>(mealPlanningKeys.recipesList());

      queryClient.setQueryData<Recipe[]>(mealPlanningKeys.recipesList(), (old) => {
        if (!old) return [];
        return old.filter((r) => r.id !== recipeId);
      });

      return { previousRecipes };
    },
    onError: (err, _recipeId, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(mealPlanningKeys.recipesList(), context.previousRecipes);
      }
      logger.error('MealPlanning', 'Error deleting recipe', { error: err });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mealPlanningKeys.recipesList() });
    },
  });
}

/**
 * Delete all recipes (bulk operation)
 */
export function useDeleteAllRecipesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const recipes = queryClient.getQueryData<Recipe[]>(mealPlanningKeys.recipesList()) ?? [];
      for (const recipe of recipes) {
        try {
          await mealPlanningAPI.deleteRecipe(recipe.id);
        } catch (e) {
          logger.warn('MealPlanning', 'Failed to delete recipe', { recipeId: recipe.id, error: e });
        }
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.recipesList() });
      const previousRecipes = queryClient.getQueryData<Recipe[]>(mealPlanningKeys.recipesList());
      queryClient.setQueryData<Recipe[]>(mealPlanningKeys.recipesList(), []);
      return { previousRecipes };
    },
    onError: (err, _variables, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(mealPlanningKeys.recipesList(), context.previousRecipes);
      }
      logger.error('MealPlanning', 'Error deleting all recipes', { error: err });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mealPlanningKeys.recipesList() });
    },
  });
}

