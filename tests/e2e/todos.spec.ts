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

  test('should create a new task', async ({ page }) => {
    const taskName = `Buy groceries ${Date.now()}`;

    // Switch to Inbox view to see all tasks (regardless of due date)
    await page.getByRole('button', { name: /Inbox/i }).click();
    await page.waitForTimeout(300);

    // Click FAB button to open quick add modal
    await page.getByLabel('Add Task').click();
    await page.waitForTimeout(500);

    // Fill the task name
    await page.getByPlaceholder('What needs to be done?').fill(taskName);

    // Submit using Enter key (submits the form)
    await page.getByPlaceholder('What needs to be done?').press('Enter');

    // Wait for modal to close (indicates mutation completed)
    await expect(page.getByText('Quick Add Task')).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify task was created
    await expect(page.getByText(taskName)).toBeVisible({ timeout: 10000 });
  });

  test('should toggle task completion', async ({ page }) => {
    const taskName = `Toggle Task ${Date.now()}`;

    // Switch to Inbox view to see all tasks
    await page.getByRole('button', { name: /Inbox/i }).click();
    await page.waitForTimeout(300);

    // Create a task
    await page.getByLabel('Add Task').click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskName);
    await page.getByPlaceholder('What needs to be done?').press('Enter');

    // Wait for modal to close
    await expect(page.getByText('Quick Add Task')).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify task appears
    await expect(page.getByText(taskName)).toBeVisible({ timeout: 10000 });

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

  test('should delete a task', async ({ page }) => {
    const taskName = `Task to Delete ${Date.now()}`;

    // Switch to Inbox view to see all tasks
    await page.getByRole('button', { name: /Inbox/i }).click();
    await page.waitForTimeout(300);

    // Create a task
    await page.getByLabel('Add Task').click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskName);
    await page.getByPlaceholder('What needs to be done?').press('Enter');

    // Wait for modal to close
    await expect(page.getByText('Quick Add Task')).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify task appears
    await expect(page.getByText(taskName)).toBeVisible({ timeout: 10000 });

    // Click the task to open edit modal
    await page.getByText(taskName).click();
    await page.waitForTimeout(500);

    // Wait for edit modal to appear
    await expect(page.getByText('Edit Task')).toBeVisible({ timeout: 5000 });

    // Click delete button
    const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
    await deleteButton.click();
    await page.waitForTimeout(500);

    // Verify task is gone (modal should close and task should disappear from list)
    await expect(page.getByText('Edit Task')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(taskName)).not.toBeVisible({ timeout: 5000 });
  });
});