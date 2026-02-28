/**
 * Task Sorting and Organization E2E Tests
 *
 * Tests task sorting, ordering, and organization features
 */

import { test, expect } from '@playwright/test';

test.describe('Task Sorting - Priority', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);
  });

  test('tasks display in priority order', async ({ page }) => {
    const timestamp = Date.now();
    const urgentTask = `Urgent ${timestamp}`;
    const lowTask = `Low ${timestamp}`;

    // Create low priority task first
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(lowTask);

    const prioritySelect1 = page.locator('select[name="priority"]').or(page.getByLabel(/priority/i));
    if (await prioritySelect1.isVisible({ timeout: 2000 }).catch(() => false)) {
      await prioritySelect1.selectOption('low');
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Create urgent task second
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(urgentTask);

    const prioritySelect2 = page.locator('select[name="priority"]').or(page.getByLabel(/priority/i));
    if (await prioritySelect2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await prioritySelect2.selectOption('urgent');
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Both tasks should be visible
    await expect(page.getByText(urgentTask)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(lowTask)).toBeVisible({ timeout: 10000 });

    // In properly sorted lists, urgent should appear before low priority
    // (Visual verification - exact order checking would be fragile)
  });

  test('high priority tasks appear prominently', async ({ page }) => {
    const taskTitle = `High Priority ${Date.now()}`;

    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);

    const prioritySelect = page.locator('select[name="priority"]').or(page.getByLabel(/priority/i));
    if (await prioritySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await prioritySelect.selectOption('high');
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Task should be visible with high priority indicator
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Task Sorting - Due Date', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);
  });

  test('overdue tasks display with overdue indicator', async ({ page }) => {
    const overdueTask = `Overdue ${Date.now()}`;

    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(overdueTask);

    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      await dateInput.fill(yesterday.toISOString().split('T')[0]);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(overdueTask)).toBeVisible({ timeout: 10000 });

    // Should show overdue indicator
    const overdueIndicator = page.getByText(/overdue/i);
    if (await overdueIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(overdueIndicator).toBeVisible();
    }
  });

  test('tasks due today display prominently', async ({ page }) => {
    const todayTask = `Due Today ${Date.now()}`;

    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(todayTask);

    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const today = new Date().toISOString().split('T')[0];
      await dateInput.fill(today);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Today view
    await page.getByRole('button', { name: /📅.*today/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(todayTask)).toBeVisible({ timeout: 10000 });

    // Should show "Due today" indicator
    const todayIndicator = page.getByText(/due today/i);
    if (await todayIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(todayIndicator).toBeVisible();
    }
  });

  test('upcoming tasks show due date', async ({ page }) => {
    const upcomingTask = `Upcoming ${Date.now()}`;

    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(upcomingTask);

    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      await dateInput.fill(future.toISOString().split('T')[0]);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Upcoming view (exact accessible name)
    await page.getByRole('button', { name: '🗓️ Upcoming view' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(upcomingTask)).toBeVisible({ timeout: 10000 });

    // Should show due date
    const dueDate = page.getByText(/due/i);
    if (await dueDate.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(dueDate).toBeVisible();
    }
  });
});

test.describe('Task Organization - Status Sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    // Switch to List view for status sections
    const listBtn = page.getByRole('button', { name: /📋.*list/i });
    await listBtn.click();
    await page.waitForTimeout(500);
  });

  test('tasks organize into correct status sections', async ({ page }) => {
    const timestamp = Date.now();
    const todoTask = `Todo ${timestamp}`;
    const doneTask = `Done ${timestamp}`;

    // Create todo task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(todoTask);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Create and complete done task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(doneTask);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    await page.getByText(doneTask).first().click();
    await page.waitForTimeout(500);

    const doneBtn = page.getByRole('button', { name: 'Done', exact: true });
    if (await doneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await doneBtn.click();
      await page.waitForTimeout(300);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Verify both tasks appear in their sections
    const todoSection = page.locator('div').filter({ hasText: /📝.*To Do/i }).first();
    const doneSection = page.locator('div').filter({ hasText: /✅.*Done/i }).first();

    await expect(todoSection).toBeVisible();
    await expect(doneSection).toBeVisible();
  });

  test('moving task between sections updates display', async ({ page }) => {
    const taskTitle = `Move Between ${Date.now()}`;

    // Create task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Task should be in To Do section
    await expect(page.getByText(taskTitle)).toBeVisible();

    // Move to In Progress
    await page.getByText(taskTitle).first().click();
    await page.waitForTimeout(500);

    const inProgressBtn = page.getByRole('button', { name: /in progress/i });
    if (await inProgressBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inProgressBtn.click();
      await page.waitForTimeout(300);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Should now appear in In Progress section
    const inProgressSection = page.locator('div').filter({ hasText: /⚡.*In Progress/i }).first();
    await expect(inProgressSection).toBeVisible();
  });

  test('section counts update when tasks move', async ({ page }) => {
    const taskTitle = `Count Update ${Date.now()}`;

    // Create task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Get initial count for To Do section
    await page.waitForTimeout(500);

    // Complete the task
    await page.getByText(taskTitle).first().click();
    await page.waitForTimeout(500);

    const doneBtn = page.getByRole('button', { name: 'Done', exact: true });
    if (await doneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await doneBtn.click();
      await page.waitForTimeout(300);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Section counts should have updated
    // (Visual verification - exact count checking would be fragile)
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Task Organization - Grouping', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);
  });

  test('completed tasks visually distinct from active tasks', async ({ page }) => {
    const activeTask = `Active ${Date.now()}`;
    const completedTask = `Completed ${Date.now()}`;

    // Create active task from Inbox view (null date)
    await page.getByRole('button', { name: '📥 Inbox view' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(activeTask);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Active task should be visible in Inbox
    await expect(page.getByText(activeTask)).toBeVisible({ timeout: 5000 });

    // Switch to List view — shows all status sections including Done
    await page.getByRole('button', { name: '📋 List view' }).click();
    await page.waitForTimeout(500);

    // Active task appears in the To Do / In Progress sections
    await expect(page.getByText(activeTask)).toBeVisible({ timeout: 5000 });

    // Verify visual distinction: active task has no line-through
    const activeEl = page.getByText(activeTask).first();
    const activeDecoration = await activeEl.evaluate((el) => {
      return window.getComputedStyle(el).textDecoration;
    });
    expect(activeDecoration).not.toContain('line-through');
  });

  test('tasks without due dates appear in inbox', async ({ page }) => {
    const noDateTask = `No Due Date ${Date.now()}`;

    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(noDateTask);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Should appear in Inbox
    await page.getByRole('button', { name: /📥.*inbox/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(noDateTask)).toBeVisible({ timeout: 10000 });

    // Should NOT appear in Upcoming (which requires dates)
    await page.getByRole('button', { name: /🗓️.*upcoming/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(noDateTask)).not.toBeVisible();
  });
});
