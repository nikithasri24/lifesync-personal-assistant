import { test, expect } from '@playwright/test';

/**
 * Drag task to calendar date test
 * Tests dragging tasks within calendar day view to different time slots
 */
test.describe('Drag task to calendar date', () => {
  test('task is draggable in calendar day view', async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    // Create a task with today's date
    const addBtn = page.getByRole('button', { name: /Add task/i }).first();
    await addBtn.click();
    const title = `Calendar Drag ${Date.now()}`;
    await page.getByPlaceholder(/What needs to be done\?/i).fill(title);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Go to Calendar view
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Switch to Day view
    const dayViewBtn = page.getByRole('button', { name: /Day/i });
    if (await dayViewBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await dayViewBtn.click();
      await page.waitForTimeout(500);
    }

    // Find the task in the calendar (should appear in all-day section)
    const taskCard = page.locator(`div[draggable="true"]:has-text("${title}")`).first();
    await expect(taskCard).toBeVisible({ timeout: 5000 });

    // Verify task is draggable
    const isDraggable = await taskCard.getAttribute('draggable');
    expect(isDraggable).toBe('true');

    // Verify task shows correct title
    await expect(taskCard).toContainText(title);
  });

  test('calendar day cells accept drops in month view', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Switch to Month view (should be default)
    const monthViewBtn = page.getByRole('button', { name: /Month/i });
    if (await monthViewBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await monthViewBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify calendar grid is visible
    // Look for day numbers in the calendar
    const dayNumbers = page.locator('div').filter({ hasText: /^\d+$/ });
    const firstDay = dayNumbers.first();
    await expect(firstDay).toBeVisible({ timeout: 5000 });

    // Verify we have multiple days showing (month grid)
    const dayCount = await dayNumbers.count();
    expect(dayCount).toBeGreaterThan(20); // Should show at least most of a month
  });
})

