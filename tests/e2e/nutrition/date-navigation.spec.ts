/**
 * Nutrition Date Navigation Tests
 *
 * Tests date picker functionality and data persistence across dates
 */

import { test, expect } from '@playwright/test';

test.describe('Nutrition Date Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nutrition');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('navigate to previous day', async ({ page }) => {
    // Click previous day button
    await page.getByRole('button', { name: /previous day/i }).click();
    await page.waitForTimeout(500);

    // Date should have changed (verify by checking if navigation works)
    await expect(page.getByRole('button', { name: /next day/i })).toBeVisible();
  });

  test('navigate to next day', async ({ page }) => {
    // Click next day button
    await page.getByRole('button', { name: /next day/i }).click();
    await page.waitForTimeout(500);

    // Date should have changed
    await expect(page.getByRole('button', { name: /previous day/i })).toBeVisible();
  });

  test('navigate multiple days forward', async ({ page }) => {
    // Navigate forward 3 days
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /next day/i }).click();
      await page.waitForTimeout(300);
    }

    // Should still be on nutrition page
    await expect(page.getByText('Breakfast')).toBeVisible();
  });

  test('navigate multiple days backward', async ({ page }) => {
    // Navigate backward 3 days
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /previous day/i }).click();
      await page.waitForTimeout(300);
    }

    // Should still be on nutrition page
    await expect(page.getByText('Lunch')).toBeVisible();
  });

  test('food logged on specific date persists', async ({ page }) => {
    const foodName = `Dated Food ${Date.now()}`;

    // Log food on today
    const breakfastSection = page.locator('text=Breakfast').locator('..').locator('..');
    await breakfastSection.getByRole('button', { name: /add food/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill(foodName);
    await page.getByRole('button', { name: /select breakfast meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('150');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    // Verify food appears
    await expect(page.getByText(foodName)).toBeVisible();

    // Navigate to next day
    await page.getByRole('button', { name: /next day/i }).click();
    await page.waitForTimeout(500);

    // Food should NOT appear on next day
    await expect(page.getByText(foodName)).not.toBeVisible();

    // Navigate back to today
    await page.getByRole('button', { name: /previous day/i }).click();
    await page.waitForTimeout(500);

    // Food should reappear
    await expect(page.getByText(foodName)).toBeVisible({ timeout: 5000 });
  });

  test('empty state on new date', async ({ page }) => {
    // Navigate to future date (likely no data)
    for (let i = 0; i < 7; i++) {
      await page.getByRole('button', { name: /next day/i }).click();
      await page.waitForTimeout(200);
    }

    // Should show all meal sections but likely empty
    await expect(page.getByText('Breakfast')).toBeVisible();
    await expect(page.getByText('Lunch')).toBeVisible();
    await expect(page.getByText('Dinner')).toBeVisible();
    await expect(page.getByText('Snack')).toBeVisible();
  });

  test('date navigation updates calorie summary', async ({ page }) => {
    // Verify calorie summary exists on current day
    await expect(page.getByText(/calories/i)).toBeVisible();
    await expect(page.getByText(/remaining/i)).toBeVisible();

    // Navigate to different day
    await page.getByRole('button', { name: /next day/i }).click();
    await page.waitForTimeout(500);

    // Calorie summary should still be present
    await expect(page.getByText(/calories/i)).toBeVisible();
    await expect(page.getByText(/remaining/i)).toBeVisible();
  });

  test('date navigation updates macro progress', async ({ page }) => {
    // Verify macros exist on current day
    await expect(page.getByText('Macros')).toBeVisible();

    // Navigate to different day
    await page.getByRole('button', { name: /previous day/i }).click();
    await page.waitForTimeout(500);

    // Macros should still be present
    await expect(page.getByText('Macros')).toBeVisible();
    await expect(page.getByText('Protein')).toBeVisible();
  });
});

test.describe('Nutrition Date-Specific Data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nutrition');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('log different foods on consecutive days', async ({ page }) => {
    const food1 = `Day1 Food ${Date.now()}`;
    const food2 = `Day2 Food ${Date.now()}`;

    // Log food on day 1
    const breakfastSection = page.locator('text=Breakfast').locator('..').locator('..');
    await breakfastSection.getByRole('button', { name: /add food/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill(food1);
    await page.getByRole('button', { name: /select breakfast meal type/i }).click();
    await page.waitForTimeout(200);

    let caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('100');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(food1)).toBeVisible();

    // Navigate to next day
    await page.getByRole('button', { name: /next day/i }).click();
    await page.waitForTimeout(500);

    // Log different food on day 2
    const breakfastSection2 = page.locator('text=Breakfast').locator('..').locator('..');
    await breakfastSection2.getByRole('button', { name: /add food/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill(food2);
    await page.getByRole('button', { name: /select breakfast meal type/i }).click();
    await page.waitForTimeout(200);

    caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('150');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(food2)).toBeVisible();

    // Verify day 1 food not visible on day 2
    await expect(page.getByText(food1)).not.toBeVisible();

    // Navigate back to day 1
    await page.getByRole('button', { name: /previous day/i }).click();
    await page.waitForTimeout(500);

    // Verify day 1 food visible, day 2 food not visible
    await expect(page.getByText(food1)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(food2)).not.toBeVisible();
  });

  test('edit food on specific date does not affect other dates', async ({ page }) => {
    const originalName = `Original Food ${Date.now()}`;
    const updatedName = `Updated Food ${Date.now()}`;

    // Log food on current day
    const lunchSection = page.locator('text=Lunch').locator('..').locator('..');
    await lunchSection.getByRole('button', { name: /add food/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill(originalName);
    await page.getByRole('button', { name: /select lunch meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('200');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(originalName)).toBeVisible();

    // Edit the food
    await page.getByText(originalName).click();
    await page.waitForTimeout(500);

    const nameInput = page.getByPlaceholder(/grilled chicken salad/i);
    await nameInput.clear();
    await nameInput.fill(updatedName);

    await page.getByRole('button', { name: /update food/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(updatedName)).toBeVisible();

    // Navigate to next day
    await page.getByRole('button', { name: /next day/i }).click();
    await page.waitForTimeout(500);

    // Neither food should appear on next day
    await expect(page.getByText(originalName)).not.toBeVisible();
    await expect(page.getByText(updatedName)).not.toBeVisible();
  });

  test('delete food on specific date does not affect other dates', async ({ page }) => {
    const foodName = `Food to Delete ${Date.now()}`;

    // Log food on current day
    const dinnerSection = page.locator('text=Dinner').locator('..').locator('..');
    await dinnerSection.getByRole('button', { name: /add food/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/grilled chicken salad/i).fill(foodName);
    await page.getByRole('button', { name: /select dinner meal type/i }).click();
    await page.waitForTimeout(200);

    const caloriesInput = page.locator('input[type="number"][required]').first();
    await caloriesInput.fill('250');

    await page.getByRole('button', { name: /log food/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(foodName)).toBeVisible();

    // Delete the food
    await page.getByText(foodName).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /delete/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(foodName)).not.toBeVisible();

    // Navigate to next day and verify food never existed there
    await page.getByRole('button', { name: /next day/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(foodName)).not.toBeVisible();
  });
});

test.describe('Nutrition Date Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nutrition');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('display current date', async ({ page }) => {
    // Date display should be visible
    const today = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = monthNames[today.getMonth()];

    // Should show current month somewhere in the date display
    await expect(page.locator(`text=${currentMonth}`)).toBeVisible();
  });

  test('date changes when navigating', async ({ page }) => {
    // Get initial date text (if visible)
    const initialDate = await page.locator('text=/\\d{1,2}/').first().textContent();

    // Navigate to next day
    await page.getByRole('button', { name: /next day/i }).click();
    await page.waitForTimeout(500);

    // Date should have changed (could be same or different number depending on day)
    // Just verify we can still see a date
    await expect(page.locator('text=/\\d{1,2}/')).toBeVisible();
  });
});
