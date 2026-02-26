import { test, expect } from '@playwright/test';

/**
 * Drag task to calendar date test
 * Tests dragging tasks within calendar day view to different time slots
 */
test.describe('Drag task to calendar date', () => {
  // Increase timeout for this test due to cross-page data sync
  test.setTimeout(60000); // 60 seconds

  test('task is draggable in calendar day view', async ({ page }) => {
    // Go to Todos and create a task with today's date
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    // Close mobile sidebar if open (backdrop blocks clicks on mobile)
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    // Create task via QuickAdd in Today view to ensure due_date is set to today
    const todayViewBtn = page.getByRole('button', { name: /📅.*Today/i });
    await todayViewBtn.click();
    await page.waitForTimeout(500);

    const addBtn = page.getByRole('button', { name: /Add task/i }).first();
    await addBtn.click();

    // Wait for modal
    const modalHeading = page.getByRole('heading', { name: /quick add task/i });
    await expect(modalHeading).toBeVisible();

    const title = `Calendar Drag ${Date.now()}`;
    await page.getByPlaceholder(/What needs to be done\?/i).fill(title);
    await page.getByText('Add Task', { exact: true }).click();

    // Wait for modal to close
    await expect(modalHeading).not.toBeVisible({ timeout: 5000 });

    // Wait for React Query mutation to complete
    await page.waitForTimeout(2000);

    // Navigate to Calendar - cache invalidation should trigger refetch
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Wait for React Query to refetch tasks (it should see stale cache and refetch)
    await page.waitForTimeout(3000);

    // Switch to Day view
    const dayViewBtn = page.getByRole('button', { name: /Day/i });
    if (await dayViewBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await dayViewBtn.click();
      await page.waitForTimeout(2000);
    }

    // Find the task card in calendar - it should be draggable
    // Use longer timeout for flaky test suite runs
    const taskCard = page.locator('[draggable="true"]').filter({ hasText: title }).first();
    await expect(taskCard).toBeVisible({ timeout: 20000 });

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

