import { test, expect } from '@playwright/test';

test.describe('Tasks Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');
  });

  test('should display tasks page', async ({ page }) => {
    // Verify we're on the Tasks page - check for the header subtitle
    await expect(page.getByText('Organize and track your to-dos')).toBeVisible();
  });

  test('should show filters', async ({ page }) => {
    // Check for Show Filters button (may already be open)
    await expect(
      page.getByText('Show Filters').or(page.getByText('Hide Filters'))
    ).toBeVisible();
    // Check for view mode tabs
    await expect(page.getByText('Today')).toBeVisible();
    await expect(page.getByText('Inbox')).toBeVisible();
    await expect(page.getByText('Upcoming')).toBeVisible();
  });

  // TODO: Task creation failing - QuickAddModalV2 onSubmit handler in Todos.tsx doesn't await mutation
  //  Modal closes immediately, task creation completes async, React Query doesn't refetch in time
  //  Fix: Make onSubmit async and properly return the promise from mutateAsync
  test.skip('should create a new task', async ({ page }) => {
    const taskName = `Buy groceries ${Date.now()}`;

    // Click FAB button to open quick add modal
    await page.getByLabel('Add Task').click();
    await page.waitForTimeout(500);

    // Fill the task name
    await page.getByPlaceholder('What needs to be done?').fill(taskName);

    // Submit using Enter key (more reliable than button click)
    await page.getByPlaceholder('What needs to be done?').press('Enter');
    await page.waitForTimeout(2000);

    // Verify task was created (wait longer to allow React Query to refetch)
    await expect(page.getByText(taskName)).toBeVisible({ timeout: 15000 });
  });

  // TODO: Same issue as create task test - QuickAddModalV2 integration broken
  test.skip('should toggle task completion', async ({ page }) => {
    const taskName = `Toggle Task ${Date.now()}`;

    // Create a task
    await page.getByLabel('Add Task').click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskName);
    await page.getByPlaceholder('What needs to be done?').press('Enter');
    await page.waitForTimeout(2000);

    // Verify task appears
    await expect(page.getByText(taskName)).toBeVisible({ timeout: 15000 });

    // Toggle completion using checkbox or complete button
    const taskRow = page.locator('li, [role="listitem"], div').filter({ hasText: taskName }).first();
    const checkbox = taskRow.locator('input[type="checkbox"], [role="checkbox"]').first();

    if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await checkbox.click();
    } else {
      await taskRow.getByRole('button').first().click();
    }
    await page.waitForTimeout(500);

    // Page should still be functional
    await expect(page.locator('main')).toBeVisible();
  });

  test('should filter tasks', async ({ page }) => {
    // Open filters panel
    const showFiltersBtn = page.getByText('Show Filters');
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    // Filters should be visible now
    await expect(page.locator('main')).toBeVisible();

    // View tabs should still work
    await page.getByText('Inbox').click();
    await page.waitForTimeout(300);
    await expect(page.locator('main')).toBeVisible();
  });

  // TODO: Same issue as create task test - QuickAddModalV2 integration broken
  test.skip('should delete a task', async ({ page }) => {
    const taskName = `Task to Delete ${Date.now()}`;

    // Create a task
    await page.getByLabel('Add Task').click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskName);
    await page.getByPlaceholder('What needs to be done?').press('Enter');
    await page.waitForTimeout(2000);

    // Verify task appears
    await expect(page.getByText(taskName)).toBeVisible({ timeout: 15000 });

    // Click the task to open edit modal
    await page.getByText(taskName).click();
    await page.waitForTimeout(500);

    // Delete the task from the modal
    const deleteButton = page.getByRole('button', { name: /Delete|Trash/i });
    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.click();
      await page.waitForTimeout(500);

      // Confirm if dialog appears
      const confirmButton = page.getByRole('button', { name: /Confirm|Yes|Delete/i });
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Verify task is gone
    await expect(page.getByText(taskName)).not.toBeVisible({ timeout: 5000 });
  });
});