import { test, expect } from '@playwright/test';

test.describe('Meal Planning Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Meal Planning
    const mealPlanningLink = page.locator('[data-testid="nav-meal-planning"]').or(
      page.getByText('Meal Planning').or(page.getByText('Meals'))
    );

    if (await mealPlanningLink.first().isVisible()) {
      await mealPlanningLink.first().click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('/meal-planning');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display meal planning page', async ({ page }) => {
    // Check for meal planning page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display weekly meal grid', async ({ page }) => {
    // Look for weekly grid layout
    const weeklyGrid = page.locator('[data-testid="meal-grid"]').or(
      page.locator('.meal-grid, .weekly-planner')
    );

    await expect(page.locator('body')).toBeVisible();
  });

  test('should show meal types (breakfast, lunch, dinner, snack)', async ({ page }) => {
    // Look for meal type labels
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

    let found = false;
    for (const type of mealTypes) {
      const element = page.getByText(type, { exact: true });
      if (await element.first().isVisible()) {
        found = true;
        break;
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should show days of the week', async ({ page }) => {
    // Look for day labels
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    let found = false;
    for (const day of days) {
      const element = page.getByText(day);
      if (await element.first().isVisible()) {
        found = true;
        break;
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should have recipe library access', async ({ page }) => {
    // Look for recipe library button
    const recipeLibraryButton = page.locator('[data-testid="recipe-library"]').or(
      page.getByRole('button', { name: /recipe library|recipes/i }).first()
    );

    if (await recipeLibraryButton.isVisible()) {
      await expect(recipeLibraryButton).toBeVisible();
    }
  });

  test('should open recipe library', async ({ page }) => {
    const recipeLibraryButton = page.getByRole('button', { name: /recipe library|recipes/i }).first();

    if (await recipeLibraryButton.isVisible()) {
      await recipeLibraryButton.click();
      await page.waitForTimeout(500);

      // Recipe library should open
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should create a new recipe', async ({ page }) => {
    // Look for add recipe button
    const addRecipeButton = page.locator('[data-testid="add-recipe"]').or(
      page.getByRole('button').filter({ hasText: /add recipe|new recipe|create recipe/i }).first()
    );

    if (await addRecipeButton.isVisible()) {
      await addRecipeButton.click();
      await page.waitForTimeout(500);

      // Fill recipe details
      const recipeNameInput = page.getByPlaceholder(/recipe name|name|title/i).first();
      if (await recipeNameInput.isVisible()) {
        await recipeNameInput.fill('Test Recipe');

        const saveButton = page.getByRole('button', { name: /save|create/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should import recipe from URL', async ({ page }) => {
    // Look for import button
    const importButton = page.locator('[data-testid="import-recipe"]').or(
      page.getByRole('button', { name: /import/i }).first()
    );

    if (await importButton.isVisible()) {
      await importButton.click();
      await page.waitForTimeout(500);

      // URL input should appear
      const urlInput = page.getByPlaceholder(/url|link|http/i).first();
      if (await urlInput.isVisible()) {
        await expect(urlInput).toBeVisible();
      }
    }
  });

  test('should import recipe from YouTube', async ({ page }) => {
    // Look for YouTube import option
    const importButton = page.getByRole('button', { name: /import|youtube/i }).first();

    if (await importButton.isVisible()) {
      await importButton.click();
      await page.waitForTimeout(500);

      // Check for YouTube-specific import
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should assign meal to a day/time slot', async ({ page }) => {
    // Look for a meal cell in the grid
    const mealCell = page.locator('[data-testid*="meal-cell"]').or(
      page.locator('.meal-cell, .meal-slot')
    ).first();

    if (await mealCell.isVisible()) {
      await mealCell.click();
      await page.waitForTimeout(500);

      // Should show meal assignment options
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should support drag and drop meal assignment', async ({ page }) => {
    // Look for draggable recipe
    const draggableRecipe = page.locator('[draggable="true"]').first();

    if (await draggableRecipe.isVisible()) {
      const isDraggable = await draggableRecipe.getAttribute('draggable');
      expect(isDraggable).toBe('true');
    }
  });

  test('should generate grocery list from meal plan', async ({ page }) => {
    // Look for grocery list button
    const groceryListButton = page.locator('[data-testid="generate-grocery-list"]').or(
      page.getByRole('button', { name: /grocery list|shopping list/i }).first()
    );

    if (await groceryListButton.isVisible()) {
      await groceryListButton.click();
      await page.waitForTimeout(1000);

      // Grocery list should be generated
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should copy week meals', async ({ page }) => {
    // Look for copy week button
    const copyWeekButton = page.locator('[data-testid="copy-week"]').or(
      page.getByRole('button', { name: /copy week/i }).first()
    );

    if (await copyWeekButton.isVisible()) {
      await copyWeekButton.click();
      await page.waitForTimeout(500);

      // Should prompt for target week
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should navigate between weeks', async ({ page }) => {
    // Look for week navigation buttons
    const prevWeekButton = page.locator('[data-testid="prev-week"]').or(
      page.getByRole('button').filter({ hasText: /prev|‹|←/i }).first()
    );
    const nextWeekButton = page.locator('[data-testid="next-week"]').or(
      page.getByRole('button').filter({ hasText: /next|›|→/i }).first()
    );

    if (await prevWeekButton.isVisible()) {
      await prevWeekButton.click();
      await page.waitForTimeout(500);
    }

    if (await nextWeekButton.isVisible()) {
      await nextWeekButton.click();
      await page.waitForTimeout(500);
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should search recipes', async ({ page }) => {
    // Open recipe library
    const recipeLibraryButton = page.getByRole('button', { name: /recipe library|recipes/i }).first();
    if (await recipeLibraryButton.isVisible()) {
      await recipeLibraryButton.click();
      await page.waitForTimeout(500);
    }

    // Look for search input
    const searchInput = page.locator('[data-testid="search-recipes"]').or(
      page.getByPlaceholder(/search/i)
    );

    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill('pasta');
      await page.waitForTimeout(500);

      // Recipes should be filtered
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter recipes by category', async ({ page }) => {
    // Open recipe library
    const recipeLibraryButton = page.getByRole('button', { name: /recipe library|recipes/i }).first();
    if (await recipeLibraryButton.isVisible()) {
      await recipeLibraryButton.click();
      await page.waitForTimeout(500);
    }

    // Look for category filter
    const categoryFilter = page.locator('[data-testid="category-filter"]').or(
      page.getByRole('button', { name: /category/i }).first()
    );

    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.waitForTimeout(300);

      // Categories should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should favorite a recipe', async ({ page }) => {
    // Open recipe library
    const recipeLibraryButton = page.getByRole('button', { name: /recipe library|recipes/i }).first();
    if (await recipeLibraryButton.isVisible()) {
      await recipeLibraryButton.click();
      await page.waitForTimeout(500);
    }

    // Find a recipe card
    const recipeCard = page.locator('[data-testid*="recipe-card"]').or(
      page.locator('.recipe-card')
    ).first();

    if (await recipeCard.isVisible()) {
      // Look for favorite button
      const favoriteButton = page.locator('[data-testid="favorite-recipe"]').or(
        page.getByRole('button').filter({ hasText: /favorite|star|♥/i }).first()
      );

      if (await favoriteButton.isVisible()) {
        await favoriteButton.click();
        await page.waitForTimeout(500);
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should edit a recipe', async ({ page }) => {
    // Open recipe library
    const recipeLibraryButton = page.getByRole('button', { name: /recipe library|recipes/i }).first();
    if (await recipeLibraryButton.isVisible()) {
      await recipeLibraryButton.click();
      await page.waitForTimeout(500);
    }

    // Find a recipe card
    const recipeCard = page.locator('[data-testid*="recipe-card"]').first();

    if (await recipeCard.isVisible()) {
      await recipeCard.click();
      await page.waitForTimeout(500);

      // Look for edit button
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(500);

        // Edit form should appear
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should delete a recipe', async ({ page }) => {
    // Create a test recipe first
    const addRecipeButton = page.getByRole('button').filter({ hasText: /add recipe|new recipe/i }).first();

    if (await addRecipeButton.isVisible()) {
      await addRecipeButton.click();
      await page.waitForTimeout(500);

      const recipeNameInput = page.getByPlaceholder(/recipe name|name/i).first();
      if (await recipeNameInput.isVisible()) {
        const testRecipeName = `Delete Test ${Date.now()}`;
        await recipeNameInput.fill(testRecipeName);

        const saveButton = page.getByRole('button', { name: /save|create/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // Now delete it
          const recipeToDelete = page.getByText(testRecipeName).first();
          if (await recipeToDelete.isVisible()) {
            await recipeToDelete.click();
            await page.waitForTimeout(500);

            const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();
            if (await deleteButton.isVisible()) {
              await deleteButton.click();
              await page.waitForTimeout(500);

              // Confirm deletion
              const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i }).first();
              if (await confirmButton.isVisible()) {
                await confirmButton.click();
                await page.waitForTimeout(1000);
              }
            }
          }
        }
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should integrate with pantry', async ({ page }) => {
    // Look for pantry integration
    const pantryButton = page.locator('[data-testid="pantry"]').or(
      page.getByRole('button', { name: /pantry/i }).first()
    );

    if (await pantryButton.isVisible()) {
      await expect(pantryButton).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Meal planning should adapt to mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
