/**
 * Tests for recipe utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchClippedRecipe, fetchRecipeFromGoogle } from '../recipeUtils';
import { ValidationError, NetworkError, ServerError } from '@/lib/errors';

describe('recipeUtils', () => {
  beforeEach(() => {
    // Mock environment variable
    vi.stubEnv('VITE_RECIPE_CLIPPER_URL', '/api/clip/recipe');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('fetchClippedRecipe', () => {
    it('should fetch and parse recipe from valid URL', async () => {
      const mockResponse = {
        name: 'Chocolate Chip Cookies',
        description: 'Delicious homemade cookies',
        ingredients: [
          { name: '2 cups flour' },
          { name: '1 cup sugar' },
          { name: '1 tsp vanilla' },
        ],
        instructions: [
          'Mix dry ingredients',
          'Add wet ingredients',
          'Bake at 350°F for 12 minutes',
        ],
        prepTime: 15,
        cookTime: 12,
        servings: 24,
        tags: ['dessert', 'cookies'],
        image: 'https://example.com/cookies.jpg',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
        json: async () => mockResponse,
      });

      const result = await fetchClippedRecipe('https://example.com/recipe');

      expect(result).toMatchObject({
        name: 'Chocolate Chip Cookies',
        description: 'Delicious homemade cookies',
        ingredients: [
          { name: '2 cups flour' },
          { name: '1 cup sugar' },
          { name: '1 tsp vanilla' },
        ],
        instructions: [
          'Mix dry ingredients',
          'Add wet ingredients',
          'Bake at 350°F for 12 minutes',
        ],
        prepTime: 15,
        cookTime: 12,
        servings: 24,
        tags: ['dessert', 'cookies'],
        image: 'https://example.com/cookies.jpg',
        difficulty: 'medium',
        isFavorite: false,
        sourceUrl: 'https://example.com/recipe',
      });
    });

    it('should throw ValidationError for invalid URL', async () => {
      await expect(fetchClippedRecipe('not-a-url')).rejects.toThrow(ValidationError);
      await expect(fetchClippedRecipe('not-a-url')).rejects.toThrow('Please enter a valid recipe URL');
    });

    it('should throw NetworkError when fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(fetchClippedRecipe('https://example.com/recipe')).rejects.toThrow(NetworkError);
      await expect(fetchClippedRecipe('https://example.com/recipe')).rejects.toThrow(
        'Unable to reach the recipe clipper service'
      );
    });

    it('should throw ValidationError for 404 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Service not found',
      });

      await expect(fetchClippedRecipe('https://example.com/recipe')).rejects.toThrow(ValidationError);
      await expect(fetchClippedRecipe('https://example.com/recipe')).rejects.toThrow(
        'Recipe clipper service not found'
      );
    });

    it('should throw ServerError for 500 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      });

      await expect(fetchClippedRecipe('https://example.com/recipe')).rejects.toThrow(ServerError);
      await expect(fetchClippedRecipe('https://example.com/recipe')).rejects.toThrow(
        'Recipe clipper service is currently unavailable'
      );
    });

    it('should throw ServerError for 400 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Bad request',
      });

      await expect(fetchClippedRecipe('https://example.com/recipe')).rejects.toThrow(ServerError);
      await expect(fetchClippedRecipe('https://example.com/recipe')).rejects.toThrow(
        'Failed to import recipe: Bad Request'
      );
    });

    it('should throw ValidationError for invalid JSON response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
        json: async () => { throw new Error('Invalid JSON'); },
      });

      await expect(fetchClippedRecipe('https://example.com/recipe')).rejects.toThrow(ValidationError);
      await expect(fetchClippedRecipe('https://example.com/recipe')).rejects.toThrow(
        'Received invalid data from recipe clipper service'
      );
    });

    it('should use default values for missing fields', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
        json: async () => ({}),
      });

      const result = await fetchClippedRecipe('https://example.com/recipe');

      expect(result).toMatchObject({
        name: 'Clipped Recipe',
        description: '',
        ingredients: [
          { name: 'Ingredient 1' },
          { name: 'Ingredient 2' },
        ],
        instructions: ['Follow the steps on the source page.'],
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        tags: ['clipped'],
      });
    });

    it('should use defaults for empty arrays', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
        json: async () => ({
          name: 'Test Recipe',
          ingredients: [],
          instructions: [],
        }),
      });

      const result = await fetchClippedRecipe('https://example.com/recipe');

      expect(result.ingredients).toEqual([
        { name: 'Ingredient 1' },
        { name: 'Ingredient 2' },
      ]);
      expect(result.instructions).toEqual(['Follow the steps on the source page.']);
    });

    it('should handle numeric values correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
        json: async () => ({
          name: 'Test',
          prepTime: '30',
          cookTime: '45',
          servings: '6',
        }),
      });

      const result = await fetchClippedRecipe('https://example.com/recipe');

      expect(result.prepTime).toBe(30);
      expect(result.cookTime).toBe(45);
      expect(result.servings).toBe(6);
    });

    it('should use default values for invalid numeric fields', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
       headers: { get: vi.fn().mockReturnValue(null) },
        headers: { get: vi.fn().mockReturnValue(null) },
        json: async () => ({
          name: 'Test',
          prepTime: 'invalid',
          cookTime: 'invalid', // Using 'invalid' string to trigger default (null becomes 0 due to Number(null)=0)
          servings: 'abc',
        }),
      });

      const result = await fetchClippedRecipe('https://example.com/recipe');

      expect(result.prepTime).toBe(10);
      expect(result.cookTime).toBe(20);
      expect(result.servings).toBe(2);
    });

    it('should URL encode the recipe URL parameter', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
        json: async () => ({ name: 'Test' }),
      });

      await fetchClippedRecipe('https://example.com/recipe?id=123&category=dessert');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('https://example.com/recipe?id=123&category=dessert')),
        expect.any(Object)
      );
    });
  });

  describe('fetchRecipeFromGoogle', () => {
    it('should fetch recipe from search API', async () => {
      const mockResponse = {
        name: 'Grilled Chicken',
        description: 'Juicy grilled chicken',
        ingredients: [
          { name: '2 chicken breasts' },
          { name: '1 tbsp olive oil' },
        ],
        instructions: [
          'Season chicken',
          'Grill for 6 minutes per side',
        ],
        prepTime: 10,
        cookTime: 12,
        servings: 2,
        tags: ['dinner', 'protein'],
        image: 'https://example.com/chicken.jpg',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
        json: async () => mockResponse,
      });

      const result = await fetchRecipeFromGoogle('grilled chicken');

      expect(result).toMatchObject({
        name: 'Grilled Chicken',
        description: 'Juicy grilled chicken',
        ingredients: [
          { name: '2 chicken breasts' },
          { name: '1 tbsp olive oil' },
        ],
        instructions: [
          'Season chicken',
          'Grill for 6 minutes per side',
        ],
        prepTime: 10,
        cookTime: 12,
        servings: 2,
        tags: ['dinner', 'protein'],
        image: 'https://example.com/chicken.jpg',
      });
    });

    it('should return scaffold when API fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await fetchRecipeFromGoogle('pasta carbonara');

      expect(result).toMatchObject({
        name: 'pasta carbonara',
        ingredients: [
          { name: 'pasta carbonara' },
          { name: '1 tbsp oil' },
          { name: 'salt to taste' },
        ],
        instructions: [
          'Prepare pasta carbonara.',
          'Cook pasta carbonara to desired doneness.',
          'Adjust seasoning and serve.',
        ],
        servings: 4,
        difficulty: 'medium',
        tags: ['auto-scaffold'],
      });
    });

    it('should return scaffold when API returns non-OK status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await fetchRecipeFromGoogle('tacos');

      expect(result).toMatchObject({
        name: 'tacos',
        tags: ['auto-scaffold'],
      });
    });

    it('should use meal name when API returns no name', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
        json: async () => ({
          description: 'A tasty dish',
          ingredients: [{ name: 'ingredient' }],
        }),
      });

      const result = await fetchRecipeFromGoogle('burger');

      expect(result?.name).toBe('burger');
    });

    it('should use default values for missing fields', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
        json: async () => ({
          name: 'Test Recipe',
        }),
      });

      const result = await fetchRecipeFromGoogle('test');

      expect(result).toMatchObject({
        name: 'Test Recipe',
        description: '',
        ingredients: [{ name: 'Add ingredients...' }],
        instructions: ['Add instructions...'],
        servings: 4,
        tags: ['auto-fetched'],
      });
    });

    it('should handle empty response arrays correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
        json: async () => ({
          name: 'Test',
          ingredients: [],
          instructions: [],
          tags: [],
        }),
      });

      const result = await fetchRecipeFromGoogle('test');

      // Empty arrays are valid string arrays - implementation returns empty arrays
      // Ingredients and instructions use different logic: check length > 0
      expect(result?.ingredients).toEqual([{ name: 'Add ingredients...' }]);
      expect(result?.instructions).toEqual(['Add instructions...']);
      // Empty tags array is a valid string array, so it stays empty
      expect(result?.tags).toEqual([]);
    });

    it('should URL encode the meal name in search query', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
        json: async () => ({ name: 'Test' }),
      });

      await fetchRecipeFromGoogle('chicken & rice');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('chicken & rice')),
        expect.any(Object)
      );
    });

    it('should preserve optional time fields when provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
        json: async () => ({
          name: 'Quick Meal',
          prepTime: 5,
          cookTime: 10,
        }),
      });

      const result = await fetchRecipeFromGoogle('quick meal');

      expect(result?.prepTime).toBe(5);
      expect(result?.cookTime).toBe(10);
    });

    it('should handle invalid time values by using undefined', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
        json: async () => ({
          name: 'Test',
          prepTime: 'invalid',
          cookTime: 'invalid', // null becomes 0 via Number(null)=0 which is finite - use 'invalid' string to get undefined
        }),
      });

      const result = await fetchRecipeFromGoogle('test');

      // 'invalid' string: Number('invalid') = NaN, Number.isFinite(NaN) = false → undefined
      expect(result?.prepTime).toBeUndefined();
      expect(result?.cookTime).toBeUndefined();
    });
  });
});
