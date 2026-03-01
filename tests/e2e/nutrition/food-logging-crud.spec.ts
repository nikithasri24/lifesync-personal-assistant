/**
 * Comprehensive Nutrition Food Logging CRUD Tests
 *
 * Tests all Create, Read, Update, Delete operations for food logging
 * including different meal types and macros.
 */

import { test, expect } from '@playwright/test';

test.describe('Nutrition Food Logging - Create Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nutrition');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('log breakfast food with all macros', async ({ page }) => {
    const foodName = `Scrambled Eggs ${Date.now()}`;

    // Click Add Food button for breakfast section (first "+ Add Food" button)
    await page.getByRole('button', { name: '+ Add Food' }).nth(0).click();

    // Wait for modal to open and verify
    await expect(page.getByRole('heading', { name: /log food/i })).toBeVisible({ timeout: 5000 });

    // Fill food name
    await page.getByPlaceholder(/grilled chicken salad/i).fill(foodName);

    // Select breakfast meal type (should auto-select based on which section clicked)
    await page.getByRole('button', { name: /select breakfast meal type/i }).click();
    await page.waitForTimeout(200);

    // Fill serving size
    await page.getByPlaceholder(/1 cup, 250g/i).fill('2 eggs');

    // Fill calories
    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('180');

    // Fill macros
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(1).fill('12'); // Protein
    await numberInputs.nth(2).fill('2'); // Carbs
    await numberInputs.nth(3).fill('12'); // Fat

    // Submit form
    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Verify food appears in breakfast section
    await expect(page.getByText(foodName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('180 cal')).toBeVisible();
  });

  test('log lunch food with minimal info', async ({ page }) => {
    const foodName = `Salad ${Date.now()}`;

    // Click Add Food button for lunch section
    await page.getByRole('button', { name: '+ Add Food' }).nth(1).click();
    await page.waitForTimeout(500);

    // Fill only required fields
    await page.getByPlaceholder(/grilled chicken salad/i).fill(foodName);

    // Select lunch meal type
    await page.getByRole('button', { name: /select lunch meal type/i }).click();
    await page.waitForTimeout(200);

    // Fill calories only
    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('250');

    // Submit form
    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Verify food appears in lunch section
    await expect(page.getByText(foodName)).toBeVisible({ timeout: 5000 });
  });

  test('log dinner food with serving size', async ({ page }) => {
    const foodName = `Grilled Chicken ${Date.now()}`;

    // Click Add Food for dinner
    await page.getByRole('button', { name: '+ Add Food' }).nth(2).click();
    await page.waitForTimeout(500);

    // Fill form
    await page.getByPlaceholder(/grilled chicken salad/i).fill(foodName);
    await page.getByRole('button', { name: /select dinner meal type/i }).click();
    await page.waitForTimeout(200);
    await page.getByPlaceholder(/1 cup, 250g/i).fill('1 breast, 200g');

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('350');

    // Fill protein only
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(1).fill('40');

    // Submit
    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Verify
    await expect(page.getByText(foodName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('1 breast, 200g')).toBeVisible();
  });

  test('log snack with notes', async ({ page }) => {
    const foodName = `Protein Bar ${Date.now()}`;

    // Click Add Food for snack
    await page.getByRole('button', { name: '+ Add Food' }).nth(3).click();
    await page.waitForTimeout(500);

    // Fill form with notes
    await page.getByPlaceholder(/grilled chicken salad/i).fill(foodName);
    await page.getByRole('button', { name: /select snack meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('200');

    await page.getByPlaceholder(/add any notes/i).fill('Post-workout snack');

    // Submit
    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Verify
    await expect(page.getByText(foodName)).toBeVisible({ timeout: 5000 });
  });

  test('log food with high protein content', async ({ page }) => {
    const foodName = `Chicken Breast ${Date.now()}`;

    await page.getByRole('button', { name: '+ Add Food' }).nth(0).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill(foodName);
    await page.getByRole('button', { name: /select breakfast meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('165');

    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(1).fill('31'); // High protein

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(foodName)).toBeVisible({ timeout: 5000 });
  });

  test('log food with zero calories', async ({ page }) => {
    const foodName = `Water ${Date.now()}`;

    await page.getByRole('button', { name: '+ Add Food' }).nth(3).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill(foodName);
    await page.getByRole('button', { name: /select snack meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('0');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(foodName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Nutrition Food Logging - Read Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nutrition');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('display calorie summary', async ({ page }) => {
    // Verify calorie summary component is visible
    await expect(page.getByText(/calories/i)).toBeVisible();
    await expect(page.getByText(/remaining/i)).toBeVisible();
  });

  test('display macro progress bars', async ({ page }) => {
    // Verify macro section is visible
    await expect(page.getByText('Macros')).toBeVisible();
    await expect(page.getByText('Protein')).toBeVisible();
    await expect(page.getByText('Carbs')).toBeVisible();
    await expect(page.getByText('Fat')).toBeVisible();
  });

  test('display all meal type sections', async ({ page }) => {
    // Verify all four meal sections are present
    await expect(page.getByText('Breakfast')).toBeVisible();
    await expect(page.getByText('Lunch')).toBeVisible();
    await expect(page.getByText('Dinner')).toBeVisible();
    await expect(page.getByText('Snack')).toBeVisible();
  });

  test('display date navigation', async ({ page }) => {
    // Verify date picker is visible
    await expect(page.getByRole('button', { name: /previous day/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /next day/i })).toBeVisible();
  });

  test('display food items with serving info', async ({ page }) => {
    // Create a food entry first
    const foodName = `Test Food ${Date.now()}`;

    await page.getByRole('button', { name: '+ Add Food' }).nth(1).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill(foodName);
    await page.getByRole('button', { name: /select lunch meal type/i }).click();
    await page.waitForTimeout(200);
    await page.getByPlaceholder(/1 cup, 250g/i).fill('1 serving');

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('100');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Verify item displays with serving info
    await expect(page.getByText(foodName)).toBeVisible();
    await expect(page.getByText('1 serving')).toBeVisible();
  });
});

test.describe('Nutrition Food Logging - Update Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nutrition');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Create a test food entry to edit
    await page.getByRole('button', { name: '+ Add Food' }).nth(0).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill('Test Food');
    await page.getByRole('button', { name: /select breakfast meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('100');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);
  });

  test('update food name', async ({ page }) => {
    const newName = `Updated Food ${Date.now()}`;

    // Click on food item to edit
    await page.getByText('Test Food').click();
    await page.waitForTimeout(500);

    // Verify edit modal opened
    await expect(page.getByRole('heading', { name: /edit food/i })).toBeVisible({ timeout: 5000 });

    // Update food name
    const nameInput = page.getByPlaceholder(/grilled chicken salad/i);
    await nameInput.clear();
    await nameInput.fill(newName);

    // Submit
    await page.getByRole('button', { name: /update food/i }).click();
    await page.waitForTimeout(1000);

    // Verify updated name appears
    await expect(page.getByText(newName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Test Food')).not.toBeVisible();
  });

  test('update calories', async ({ page }) => {
    // Click on food item to edit
    await page.getByText('Test Food').click();
    await page.waitForTimeout(500);

    // Update calories
    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.clear();
    await caloriesInput.fill('250');

    // Submit
    await page.getByRole('button', { name: /update food/i }).click();
    await page.waitForTimeout(1000);

    // Verify updated calories
    await expect(page.getByText('250 cal')).toBeVisible({ timeout: 5000 });
  });

  test('update serving size', async ({ page }) => {
    // Click on food item to edit
    await page.getByText('Test Food').click();
    await page.waitForTimeout(500);

    // Update serving size
    await page.getByPlaceholder(/1 cup, 250g/i).fill('2 servings');

    // Submit
    await page.getByRole('button', { name: /update food/i }).click();
    await page.waitForTimeout(1000);

    // Verify updated serving size
    await expect(page.getByText('2 servings')).toBeVisible({ timeout: 5000 });
  });

  test('update macros', async ({ page }) => {
    // Click on food item to edit
    await page.getByText('Test Food').click();
    await page.waitForTimeout(500);

    // Update macros
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(1).fill('20'); // Protein
    await numberInputs.nth(2).fill('30'); // Carbs
    await numberInputs.nth(3).fill('10'); // Fat

    // Submit
    await page.getByRole('button', { name: /update food/i }).click();
    await page.waitForTimeout(1000);

    // Food should still be visible
    await expect(page.getByText('Test Food')).toBeVisible({ timeout: 5000 });
  });

  test('change meal type from breakfast to lunch', async ({ page }) => {
    // Click on food item to edit
    await page.getByText('Test Food').click();
    await page.waitForTimeout(500);

    // Change meal type to lunch
    await page.getByRole('button', { name: /select lunch meal type/i }).click();
    await page.waitForTimeout(200);

    // Submit
    await page.getByRole('button', { name: /update food/i }).click();
    await page.waitForTimeout(1000);

    // Verify food still exists (meal type changed)
    await expect(page.getByText('Test Food')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Nutrition Food Logging - Delete Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nutrition');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Create a test food entry to delete
    await page.getByRole('button', { name: '+ Add Food' }).nth(2).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill('Food to Delete');
    await page.getByRole('button', { name: /select dinner meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('300');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);
  });

  test('delete food entry', async ({ page }) => {
    // Verify food exists
    await expect(page.getByText('Food to Delete')).toBeVisible();

    // Click on food to open edit modal
    await page.getByText('Food to Delete').click();
    await page.waitForTimeout(500);

    // Click delete button
    await page.getByRole('button', { name: /delete/i }).click();
    await page.waitForTimeout(1000);

    // Verify food is removed
    await expect(page.getByText('Food to Delete')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Nutrition Food Logging - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nutrition');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('cancel food logging', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Food' }).nth(0).click();
    await page.waitForTimeout(500);

    // Fill some data
    await page.getByPlaceholder(/grilled chicken salad/i).fill('Cancelled Food');

    // Click cancel
    await page.getByRole('button', { name: /cancel/i }).click();
    await page.waitForTimeout(500);

    // Verify modal closed and food not added
    await expect(page.getByText('Cancelled Food')).not.toBeVisible();
  });

  test('validation requires food name', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Food' }).nth(1).click();
    await page.waitForTimeout(500);

    // Try to submit without food name (only calories)
    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('100');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(500);

    // Modal should still be open (validation failed)
    await expect(page.getByRole('heading', { name: /log food/i })).toBeVisible({ timeout: 5000 });
  });

  test('validation requires calories', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Food' }).nth(2).click();
    await page.waitForTimeout(500);

    // Fill only food name
    await page.getByPlaceholder(/grilled chicken salad/i).fill('Test Food');

    // Try to submit without calories
    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(500);

    // Modal should still be open
    await expect(page.getByRole('heading', { name: /log food/i })).toBeVisible({ timeout: 5000 });
  });

  test('log food with very long name', async ({ page }) => {
    const longName = 'A'.repeat(100);

    await page.getByRole('button', { name: '+ Add Food' }).nth(3).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill(longName);
    await page.getByRole('button', { name: /select snack meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('50');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Should handle long names gracefully
    await expect(page.locator(`text=${longName.substring(0, 20)}`)).toBeVisible({ timeout: 5000 });
  });

  test('log food with decimal calories', async ({ page }) => {
    const foodName = `Decimal Calories ${Date.now()}`;

    await page.getByRole('button', { name: '+ Add Food' }).nth(1).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill(foodName);
    await page.getByRole('button', { name: /select lunch meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('123.5');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(foodName)).toBeVisible({ timeout: 5000 });
  });
});
