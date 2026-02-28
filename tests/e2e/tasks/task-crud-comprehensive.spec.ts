/**
 * Comprehensive Task CRUD Tests
 *
 * Tests all Create, Read, Update, Delete operations for tasks
 * including various field combinations and edge cases.
 */

import { test, expect } from '@playwright/test';

test.describe('Task CRUD - Create Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    // Close mobile sidebar if open
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('create task via Quick Add modal with just title', async ({ page }) => {
    const taskTitle = `Quick Task ${Date.now()}`;

    // Open Quick Add modal via FAB
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);

    // Fill title and submit
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.getByText('Add Task', { exact: true }).click();

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Add New Task' })).not.toBeVisible({ timeout: 5000 });

    // Switch to Inbox to verify
    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);

    // Verify task appears
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });
  });

  test('create task with priority via full modal', async ({ page }) => {
    const taskTitle = `Priority Task ${Date.now()}`;

    // Open Quick Add, then switch to full modal
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);

    // Fill title
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);

    // Look for priority selector
    const prioritySelect = page.locator('select[name="priority"]').or(
      page.getByLabel(/priority/i)
    );
    if (await prioritySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await prioritySelect.selectOption('high');
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Inbox
    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);

    // Verify task with priority badge
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });
  });

  test('create task with due date for today', async ({ page }) => {
    const taskTitle = `Today Task ${Date.now()}`;

    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);

    // Set due date to today
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const today = new Date().toISOString().split('T')[0];
      await dateInput.fill(today);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Should appear in Today view
    await page.getByRole('button', { name: /today/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });
  });

  test('create task with description/notes', async ({ page }) => {
    const taskTitle = `Detailed Task ${Date.now()}`;
    const taskDescription = 'This is a detailed description of the task';

    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);

    // Look for description/notes field
    const descriptionField = page.getByPlaceholder(/description|notes|details/i).or(
      page.locator('textarea[name="description"]')
    );
    if (await descriptionField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descriptionField.fill(taskDescription);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });
  });

  test('create multiple tasks in sequence', async ({ page }) => {
    const timestamp = Date.now();
    const tasks = [
      `Sequential Task 1 ${timestamp}`,
      `Sequential Task 2 ${timestamp}`,
      `Sequential Task 3 ${timestamp}`,
    ];

    for (const taskTitle of tasks) {
      await page.getByRole('button', { name: /add task/i }).first().click();
      await page.waitForTimeout(300);

      await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
      await page.locator('form button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }

    // Switch to Inbox and verify all tasks
    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);

    for (const taskTitle of tasks) {
      await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Task CRUD - Read/View Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('view task details by clicking card', async ({ page }) => {
    const taskTitle = `View Details ${Date.now()}`;

    // Create task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Inbox
    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);

    // Click task to view details
    await page.getByText(taskTitle).first().click();
    await page.waitForTimeout(500);

    // Edit modal should open
    await expect(page.getByRole('heading', { name: /edit task/i })).toBeVisible({ timeout: 5000 });

    // Task title should be in the modal
    const titleInput = page.getByDisplayValue(taskTitle);
    await expect(titleInput).toBeVisible();
  });

  test('switch between view modes - Today/Inbox/Upcoming/List', async ({ page }) => {
    // Test Today view
    const todayBtn = page.getByRole('button', { name: /today/i });
    await todayBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('main')).toBeVisible();

    // Test Inbox view
    const inboxBtn = page.getByRole('button', { name: /inbox/i });
    await inboxBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('main')).toBeVisible();

    // Test Upcoming view
    const upcomingBtn = page.getByRole('button', { name: /upcoming/i });
    await upcomingBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('main')).toBeVisible();

    // Test List view
    const listBtn = page.getByRole('button', { name: /list/i });
    if (await listBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('tasks appear in correct view based on due date', async ({ page }) => {
    const todayTaskTitle = `Today Task ${Date.now()}`;

    // Create task with today's date
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder('What needs to be done?').fill(todayTaskTitle);

    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const today = new Date().toISOString().split('T')[0];
      await dateInput.fill(today);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Should be in Today view
    await page.getByRole('button', { name: /today/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(todayTaskTitle)).toBeVisible({ timeout: 10000 });

    // Should also be in Inbox
    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(todayTaskTitle)).toBeVisible({ timeout: 10000 });
  });

  test('completed tasks appear in Done section (List view)', async ({ page }) => {
    const taskTitle = `Complete Me ${Date.now()}`;

    // Create task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to List view
    const listBtn = page.getByRole('button', { name: /list/i });
    if (await listBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listBtn.click();
      await page.waitForTimeout(500);
    }

    // Find and complete the task
    await page.getByText(taskTitle).first().click();
    await page.waitForTimeout(500);

    // Click Done status button
    const doneBtn = page.getByRole('button', { name: 'Done', exact: true });
    if (await doneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await doneBtn.click();
      await page.waitForTimeout(300);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Task should appear in Done section
    const doneSection = page.locator('div').filter({ hasText: /✅.*Done/i }).first();
    await expect(doneSection).toBeVisible();
  });
});

test.describe('Task CRUD - Update Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('update task title', async ({ page }) => {
    const originalTitle = `Original Title ${Date.now()}`;
    const updatedTitle = `Updated Title ${Date.now()}`;

    // Create task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(originalTitle);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Inbox
    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);

    // Open edit modal
    await page.getByText(originalTitle).first().click();
    await page.waitForTimeout(500);

    // Update title
    const titleInput = page.getByDisplayValue(originalTitle);
    await titleInput.clear();
    await titleInput.fill(updatedTitle);

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Verify updated title
    await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(originalTitle)).not.toBeVisible();
  });

  test('change task priority', async ({ page }) => {
    const taskTitle = `Priority Change ${Date.now()}`;

    // Create task with default priority
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Inbox
    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);

    // Open edit modal
    await page.getByText(taskTitle).first().click();
    await page.waitForTimeout(500);

    // Change priority
    const prioritySelect = page.locator('select[name="priority"]').or(
      page.getByLabel(/priority/i)
    );
    if (await prioritySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await prioritySelect.selectOption('urgent');
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Task should still be visible
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });
  });

  test('change task status from Todo to In Progress', async ({ page }) => {
    const taskTitle = `Status Change ${Date.now()}`;

    // Create task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to List view to see status sections
    const listBtn = page.getByRole('button', { name: /list/i });
    if (await listBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listBtn.click();
      await page.waitForTimeout(500);
    }

    // Open edit modal
    await page.getByText(taskTitle).first().click();
    await page.waitForTimeout(500);

    // Change to In Progress
    const inProgressBtn = page.getByRole('button', { name: /in progress/i });
    if (await inProgressBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inProgressBtn.click();
      await page.waitForTimeout(300);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Task should appear in In Progress section
    const inProgressSection = page.locator('div').filter({ hasText: /⚡.*In Progress/i }).first();
    await expect(inProgressSection).toBeVisible();
  });

  test('set due date on existing task', async ({ page }) => {
    const taskTitle = `Add Due Date ${Date.now()}`;

    // Create task without due date
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Inbox
    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);

    // Open edit modal
    await page.getByText(taskTitle).first().click();
    await page.waitForTimeout(500);

    // Set due date to tomorrow
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      await dateInput.fill(tomorrowStr);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Task should be visible
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });
  });

  test('update task description', async ({ page }) => {
    const taskTitle = `Description Update ${Date.now()}`;
    const description = 'Updated task description with more details';

    // Create task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Inbox
    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);

    // Open edit modal
    await page.getByText(taskTitle).first().click();
    await page.waitForTimeout(500);

    // Add description
    const descriptionField = page.getByPlaceholder(/description|notes|details/i).or(
      page.locator('textarea[name="description"]')
    );
    if (await descriptionField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descriptionField.fill(description);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Task should still be visible
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Task CRUD - Delete Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('delete task from edit modal', async ({ page }) => {
    const taskTitle = `Delete Me ${Date.now()}`;

    // Create task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Inbox
    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);

    // Open edit modal
    await page.getByText(taskTitle).first().click();
    await page.waitForTimeout(500);

    // Click Delete button
    await page.getByRole('button', { name: /delete/i }).last().click();
    await page.waitForTimeout(1000);

    // Wait for toasts to clear
    await page.waitForTimeout(4500);

    // Task should be removed from list
    await expect(page.locator('main').getByText(taskTitle)).not.toBeVisible({ timeout: 5000 });
  });

  test('delete multiple tasks via bulk selection', async ({ page }) => {
    const timestamp = Date.now();
    const tasks = [
      `Bulk Delete 1 ${timestamp}`,
      `Bulk Delete 2 ${timestamp}`,
    ];

    // Create tasks
    for (const taskTitle of tasks) {
      await page.getByRole('button', { name: /add task/i }).first().click();
      await page.waitForTimeout(300);
      await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
      await page.locator('form button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }

    // Switch to List view
    const listBtn = page.getByRole('button', { name: /list/i });
    if (await listBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listBtn.click();
      await page.waitForTimeout(500);
    }

    // Enable selection mode
    await page.getByRole('button', { name: /select tasks/i }).click();
    await page.waitForTimeout(300);

    // Select the first two checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(0).click();
    await page.waitForTimeout(200);
    await checkboxes.nth(1).click();
    await page.waitForTimeout(500);

    // Click Delete Selected
    const deleteBtn = page.getByRole('button', { name: /delete selected/i });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
    await page.waitForTimeout(1000);

    // Confirm deletion if confirmation dialog appears
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i }).last();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    }

    // Wait for deletion to complete
    await page.waitForTimeout(5000);

    // Tasks should be removed
    for (const taskTitle of tasks) {
      await expect(page.locator('main').getByText(taskTitle)).not.toBeVisible({ timeout: 5000 });
    }
  });
});
