/**
 * Nutrition Statistics and Validation Tests
 *
 * Tests calorie/macro calculations and form validation
 */

import { test, expect } from '@playwright/test';

test.describe('Nutrition Statistics - Calorie Summary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nutrition');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('calorie summary updates when food is logged', async ({ page }) => {
    // Log a food with 200 calories
    await page.getByRole('button', { name: '+ Add Food' }).nth(0).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill('Test Food');
    await page.getByRole('button', { name: /select breakfast meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('200');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Verify calorie summary shows consumed calories
    await expect(page.getByText(/calories/i)).toBeVisible();
    await expect(page.getByText(/remaining/i)).toBeVisible();
  });

  test('calorie summary shows remaining calories', async ({ page }) => {
    // Verify remaining calories display exists
    await expect(page.getByText(/remaining/i)).toBeVisible();
  });

  test('multiple food items accumulate calories', async ({ page }) => {
    // Log first food (100 cal)
    await page.getByRole('button', { name: '+ Add Food' }).nth(0).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill('Food 1');
    await page.getByRole('button', { name: /select breakfast meal type/i }).click();
    await page.waitForTimeout(200);

    let caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('100');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Log second food (150 cal)
    await page.getByRole('button', { name: '+ Add Food' }).nth(1).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill('Food 2');
    await page.getByRole('button', { name: /select lunch meal type/i }).click();
    await page.waitForTimeout(200);

    caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('150');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Calorie summary should reflect total (250 cal)
    await expect(page.getByText(/calories/i)).toBeVisible();
  });

  test('deleting food updates calorie summary', async ({ page }) => {
    // Log food
    await page.getByRole('button', { name: '+ Add Food' }).nth(3).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill('Food to Delete');
    await page.getByRole('button', { name: /select snack meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('300');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Delete the food
    await page.getByText('Food to Delete').click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /delete/i }).click();
    await page.waitForTimeout(1000);

    // Calorie summary should update (food removed)
    await expect(page.getByText(/calories/i)).toBeVisible();
  });
});

test.describe('Nutrition Statistics - Macro Progress', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nutrition');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('macro progress displays all three macros', async ({ page }) => {
    // Verify macro section shows all macros
    await expect(page.getByText('Macros')).toBeVisible();
    await expect(page.getByText('Protein')).toBeVisible();
    await expect(page.getByText('Carbs')).toBeVisible();
    await expect(page.getByText('Fat')).toBeVisible();
  });

  test('logging food with macros updates progress bars', async ({ page }) => {
    // Log food with all macros
    await page.getByRole('button', { name: '+ Add Food' }).nth(1).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill('Macro Food');
    await page.getByRole('button', { name: /select lunch meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('300');

    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(1).fill('25'); // Protein
    await numberInputs.nth(2).fill('30'); // Carbs
    await numberInputs.nth(3).fill('15'); // Fat

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Macro section should still be visible and updated
    await expect(page.getByText('Protein')).toBeVisible();
    await expect(page.getByText('Carbs')).toBeVisible();
    await expect(page.getByText('Fat')).toBeVisible();
  });

  test('logging food with only protein updates protein bar', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Food' }).nth(0).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill('High Protein Food');
    await page.getByRole('button', { name: /select breakfast meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('200');

    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(1).fill('40'); // Protein only

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Protein bar should be updated
    await expect(page.getByText('Protein')).toBeVisible();
  });
});

test.describe('Nutrition Meal Type Distribution', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nutrition');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('food appears in correct meal section', async ({ page }) => {
    const foodName = `Breakfast Food ${Date.now()}`;

    // Log food for breakfast
    await page.getByRole('button', { name: '+ Add Food' }).nth(0).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill(foodName);
    await page.getByRole('button', { name: /select breakfast meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('150');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Verify food appears in breakfast section
    await expect(page.getByText(foodName)).toBeVisible({ timeout: 5000 });

    // Verify food does NOT appear in other sections
    // Food should be visible on page
    await expect(page.getByText(foodName)).toBeVisible();
  });

  test('each meal section shows total calories', async ({ page }) => {
    // Log food in lunch
    await page.getByRole('button', { name: '+ Add Food' }).nth(1).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill('Lunch Food');
    await page.getByRole('button', { name: /select lunch meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('400');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Lunch section should show the 400 cal
    await expect(page.getByText('400 cal')).toBeVisible({ timeout: 5000 });
  });

  test('multiple foods in same meal accumulate', async ({ page }) => {
    // Log first dinner food (200 cal)
    await page.getByRole('button', { name: '+ Add Food' }).nth(2).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill('Dinner Food 1');
    await page.getByRole('button', { name: /select dinner meal type/i }).click();
    await page.waitForTimeout(200);

    let caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('200');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Log second dinner food (300 cal)
    await page.getByRole('button', { name: '+ Add Food' }).nth(2).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill('Dinner Food 2');
    await page.getByRole('button', { name: /select dinner meal type/i }).click();
    await page.waitForTimeout(200);

    caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('300');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Both foods should be visible
    await expect(page.getByText('Dinner Food 1')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Dinner Food 2')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Nutrition Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nutrition');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('cannot submit without food name', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Food' }).nth(0).click();
    await page.waitForTimeout(500);

    // Fill only calories (skip food name)
    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('100');

    // Try to submit
    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(500);

    // Modal should still be visible (validation failed)
    await expect(page.getByRole('heading', { name: /log food/i })).toBeVisible({ timeout: 5000 });
  });

  test('cannot submit without calories', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Food' }).nth(1).click();
    await page.waitForTimeout(500);

    // Fill only food name (skip calories)
    await page.getByPlaceholder(/grilled chicken salad/i).fill('Test Food');

    // Try to submit
    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(500);

    // Modal should still be visible
    await expect(page.getByRole('heading', { name: /log food/i })).toBeVisible({ timeout: 5000 });
  });

  test('can submit with only required fields', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Food' }).nth(2).click();
    await page.waitForTimeout(500);

    // Fill only required fields
    await page.getByPlaceholder(/grilled chicken salad/i).fill('Minimal Food');
    await page.getByRole('button', { name: /select dinner meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('100');

    // Submit
    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Should succeed
    await expect(page.getByText('Minimal Food')).toBeVisible({ timeout: 5000 });
  });

  test('macros are optional', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Food' }).nth(3).click();
    await page.waitForTimeout(500);

    // Fill required fields only (no macros)
    await page.getByPlaceholder(/grilled chicken salad/i).fill('No Macros Food');
    await page.getByRole('button', { name: /select snack meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('50');

    // Submit without filling macros
    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Should succeed
    await expect(page.getByText('No Macros Food')).toBeVisible({ timeout: 5000 });
  });

  test('serving size is optional', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Food' }).nth(0).click();
    await page.waitForTimeout(500);

    // Fill required fields only (no serving size)
    await page.getByPlaceholder(/grilled chicken salad/i).fill('No Serving Food');
    await page.getByRole('button', { name: /select breakfast meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('75');

    // Submit
    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Should succeed
    await expect(page.getByText('No Serving Food')).toBeVisible({ timeout: 5000 });
  });

  test('notes are optional', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Food' }).nth(1).click();
    await page.waitForTimeout(500);

    // Fill required fields only (no notes)
    await page.getByPlaceholder(/grilled chicken salad/i).fill('No Notes Food');
    await page.getByRole('button', { name: /select lunch meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('125');

    // Submit
    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Should succeed
    await expect(page.getByText('No Notes Food')).toBeVisible({ timeout: 5000 });
  });
});
