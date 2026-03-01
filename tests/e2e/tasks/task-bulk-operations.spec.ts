/**
 * Bulk Operations Tests for Tasks
 *
 * Tests bulk selection, bulk complete, bulk delete, and bulk status changes
 */

import { test, expect } from '@playwright/test';

test.describe('Task Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('domcontentloaded');

    // Close mobile sidebar if open
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    // Switch to List view for better bulk operations
    const listBtn = page.getByRole('button', { name: /list/i });
    if (await listBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('enter and exit bulk selection mode', async ({ page }) => {
    // Enter selection mode
    await page.getByRole('button', { name: /select tasks/i }).click();
    await page.waitForTimeout(300);

    // Verify selection mode UI
    await expect(page.getByRole('button', { name: /cancel selection/i })).toBeVisible();

    // Exit selection mode
    await page.getByRole('button', { name: /cancel selection/i }).click();
    await page.waitForTimeout(300);

    // Verify selection mode exited
    await expect(page.getByRole('button', { name: /select tasks/i })).toBeVisible();
  });

  test('select and deselect individual tasks', async ({ page }) => {
    // Create some test tasks
    const tasks = [`Select Task 1 ${Date.now()}`, `Select Task 2 ${Date.now()}`];
    for (const taskTitle of tasks) {
      await page.getByRole('button', { name: /add task/i }).first().click();
      await page.waitForTimeout(300);
      await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
      await page.locator('form button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }

    // Enter selection mode
    await page.getByRole('button', { name: /select tasks/i }).click();
    await page.waitForTimeout(300);

    // Select first checkbox
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(0).click();
    await page.waitForTimeout(300);

    // Verify selection count
    await expect(page.getByText(/1 task selected/i)).toBeVisible();

    // Select second checkbox
    await checkboxes.nth(1).click();
    await page.waitForTimeout(300);

    // Verify selection count updated
    await expect(page.getByText(/2 tasks selected/i)).toBeVisible();

    // Deselect first checkbox
    await checkboxes.nth(0).click();
    await page.waitForTimeout(300);

    // Verify count decreased
    await expect(page.getByText(/1 task selected/i)).toBeVisible();
  });

  test('select all and deselect all functionality', async ({ page }) => {
    // Create multiple tasks
    const tasks = [
      `Bulk Task 1 ${Date.now()}`,
      `Bulk Task 2 ${Date.now()}`,
      `Bulk Task 3 ${Date.now()}`,
    ];
    for (const taskTitle of tasks) {
      await page.getByRole('button', { name: /add task/i }).first().click();
      await page.waitForTimeout(300);
      await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
      await page.locator('form button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }

    // Enter selection mode
    await page.getByRole('button', { name: /select tasks/i }).click();
    await page.waitForTimeout(300);

    // Select one task to show bulk action bar
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.first().click();
    await page.waitForTimeout(500);

    // Click Select All
    const selectAllBtn = page.getByRole('button').filter({ hasText: /^Select All/ });
    if (await selectAllBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await selectAllBtn.click();
      await page.waitForTimeout(500);

      // Verify all tasks selected (count should be higher)
      await expect(page.getByText(/\d+ tasks selected/i)).toBeVisible();

      // Click Deselect All
      const deselectAllBtn = page.getByRole('button', { name: /deselect all/i });
      await deselectAllBtn.click();
      await page.waitForTimeout(500);

      // Bulk action bar should disappear
      await expect(selectAllBtn).not.toBeVisible();
    }
  });

  test('bulk complete multiple tasks', async ({ page }) => {
    // Create tasks
    const tasks = [
      `Complete Bulk 1 ${Date.now()}`,
      `Complete Bulk 2 ${Date.now()}`,
    ];
    for (const taskTitle of tasks) {
      await page.getByRole('button', { name: /add task/i }).first().click();
      await page.waitForTimeout(300);
      await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
      await page.locator('form button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }

    // Enter selection mode
    await page.getByRole('button', { name: /select tasks/i }).click();
    await page.waitForTimeout(300);

    // Select both tasks
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(0).click();
    await page.waitForTimeout(200);
    await checkboxes.nth(1).click();
    await page.waitForTimeout(500);

    // Click Complete Selected button if available
    const completeBtn = page.getByRole('button', { name: /complete selected|mark as done/i });
    if (await completeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await completeBtn.click();
      await page.waitForTimeout(1000);

      // Tasks should move to Done section
      const doneSection = page.locator('div').filter({ hasText: /✅.*Done/i }).first();
      await expect(doneSection).toBeVisible();
    }
  });

  test('bulk delete with confirmation', async ({ page }) => {
    // Create tasks to delete
    const tasks = [
      `Delete Bulk 1 ${Date.now()}`,
      `Delete Bulk 2 ${Date.now()}`,
    ];
    for (const taskTitle of tasks) {
      await page.getByRole('button', { name: /add task/i }).first().click();
      await page.waitForTimeout(300);
      await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
      await page.locator('form button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }

    // Enter selection mode
    await page.getByRole('button', { name: /select tasks/i }).click();
    await page.waitForTimeout(300);

    // Select tasks
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(0).click();
    await page.waitForTimeout(200);
    await checkboxes.nth(1).click();
    await page.waitForTimeout(500);

    // Verify Delete Selected button
    const deleteBtn = page.getByRole('button', { name: /delete selected/i });
    await expect(deleteBtn).toBeVisible();
    await expect(deleteBtn).toBeEnabled();

    // Click delete
    await deleteBtn.click();
    await page.waitForTimeout(1000);

    // Handle confirmation if present
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i }).last();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    }

    // Wait for deletion to complete and toasts to clear
    await page.waitForTimeout(5000);

    // Tasks should be removed
    for (const taskTitle of tasks) {
      await expect(page.locator('main').getByText(taskTitle)).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('bulk operations disabled when no tasks selected', async ({ page }) => {
    // Enter selection mode
    await page.getByRole('button', { name: /select tasks/i }).click();
    await page.waitForTimeout(300);

    // Bulk action buttons should not be visible until a task is selected
    await expect(page.getByRole('button', { name: /delete selected/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /select all/i })).not.toBeVisible();
  });

  test('selection persists during scroll', async ({ page }) => {
    // Create many tasks to enable scrolling
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      tasks.push(`Scroll Task ${i} ${Date.now()}`);
    }

    for (const taskTitle of tasks) {
      await page.getByRole('button', { name: /add task/i }).first().click();
      await page.waitForTimeout(200);
      await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
      await page.locator('form button[type="submit"]').click();
      await page.waitForTimeout(800);
    }

    // Enter selection mode
    await page.getByRole('button', { name: /select tasks/i }).click();
    await page.waitForTimeout(300);

    // Select first task
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.first().click();
    await page.waitForTimeout(300);

    // Verify selection
    await expect(page.getByText(/1 task selected/i)).toBeVisible();

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);

    // Scroll back up
    await page.evaluate(() => window.scrollBy(0, -500));
    await page.waitForTimeout(500);

    // Selection should still show
    await expect(page.getByText(/1 task selected/i)).toBeVisible();
  });

  test('cancel selection clears all selections', async ({ page }) => {
    // Create tasks
    const tasks = [`Cancel Test 1 ${Date.now()}`, `Cancel Test 2 ${Date.now()}`];
    for (const taskTitle of tasks) {
      await page.getByRole('button', { name: /add task/i }).first().click();
      await page.waitForTimeout(300);
      await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
      await page.locator('form button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }

    // Enter selection mode
    await page.getByRole('button', { name: /select tasks/i }).click();
    await page.waitForTimeout(300);

    // Select tasks
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(0).click();
    await page.waitForTimeout(200);
    await checkboxes.nth(1).click();
    await page.waitForTimeout(300);

    // Verify selections
    await expect(page.getByText(/2 tasks selected/i)).toBeVisible();

    // Cancel selection mode
    await page.getByRole('button', { name: /cancel selection/i }).click();
    await page.waitForTimeout(300);

    // Re-enter selection mode
    await page.getByRole('button', { name: /select tasks/i }).click();
    await page.waitForTimeout(300);

    // Selections should be cleared - bulk action bar should not show
    await expect(page.getByText(/tasks selected/i)).not.toBeVisible();
  });

  test('bulk selection count updates correctly', async ({ page }) => {
    // Create 5 tasks
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: /add task/i }).first().click();
      await page.waitForTimeout(200);
      await page.getByPlaceholder('What needs to be done?').fill(`Count Task ${i} ${Date.now()}`);
      await page.locator('form button[type="submit"]').click();
      await page.waitForTimeout(800);
    }

    // Enter selection mode
    await page.getByRole('button', { name: /select tasks/i }).click();
    await page.waitForTimeout(300);

    const checkboxes = page.locator('input[type="checkbox"]');

    // Select 1 task
    await checkboxes.nth(0).click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/1 task selected/i)).toBeVisible();

    // Select 2 more tasks
    await checkboxes.nth(1).click();
    await page.waitForTimeout(200);
    await checkboxes.nth(2).click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/3 tasks selected/i)).toBeVisible();

    // Deselect 1 task
    await checkboxes.nth(0).click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/2 tasks selected/i)).toBeVisible();
  });
});
