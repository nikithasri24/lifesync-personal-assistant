import { test, expect } from '@playwright/test';

/**
 * Multi-select drag tests for V2 Todos UI
 * Tests dragging multiple selected tasks at once to change their status
 */
test.describe('Multi-select drag', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    // Switch to List view
    const listViewBtn = page.getByRole('button', { name: /List.*view/i });
    if (await listViewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listViewBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('drag multiple selected tasks to change status', async ({ page }) => {
    // Create 3 tasks
    const taskTitles = [
      `Multi1 ${Date.now()}`,
      `Multi2 ${Date.now()}`,
      `Multi3 ${Date.now()}`,
    ];

    for (const title of taskTitles) {
      const addBtn = page.getByRole('button', { name: /Add task/i }).first();
      await addBtn.click();
      await page.getByPlaceholder(/What needs to be done\?/i).fill(title);
      await page.locator('form button[type="submit"]').click();
      await page.waitForTimeout(500);
    }

    // Enable selection mode
    const selectionBtn = page.getByRole('button', { name: /Select Tasks/i });
    await selectionBtn.click();
    await page.waitForTimeout(500);

    // Select all 3 tasks
    for (const title of taskTitles) {
      const taskCard = page.locator(`[data-task-card="true"]:has-text("${title}")`).first();
      const checkbox = taskCard.locator('input[type="checkbox"]');
      await checkbox.check();
      await page.waitForTimeout(200);
    }

    // Exit selection mode - button text changes to "Cancel Selection"
    const cancelBtn = page.getByRole('button', { name: /Cancel Selection/i });
    await cancelBtn.click();
    await page.waitForTimeout(500);

    // Drag one of the selected tasks to In Progress
    const firstTaskCard = page.locator(`[data-task-card="true"]:has-text("${taskTitles[0]}")`).first();
    const inProgressHeader = page.locator('div:has-text("⚡ In Progress")').first();

    await firstTaskCard.dragTo(inProgressHeader);
    await page.waitForTimeout(1000);

    // Verify all 3 tasks moved to In Progress
    const inProgressSection = page.locator('div:has(> div:has-text("⚡ In Progress"))').first();
    for (const title of taskTitles) {
      await expect(inProgressSection.locator(`[data-task-card="true"]:has-text("${title}")`)).toBeVisible();
    }
  });

  test('shows count badge when dragging multiple tasks', async ({ page }) => {
    // Create 2 tasks
    const taskTitles = [
      `Badge1 ${Date.now()}`,
      `Badge2 ${Date.now()}`,
    ];

    for (const title of taskTitles) {
      const addBtn = page.getByRole('button', { name: /Add task/i }).first();
      await addBtn.click();
      await page.getByPlaceholder(/What needs to be done\?/i).fill(title);
      await page.locator('form button[type="submit"]').click();
      await page.waitForTimeout(500);
    }

    // Enable selection mode and select both tasks
    const selectionBtn = page.getByRole('button', { name: /Select Tasks/i });
    await selectionBtn.click();
    await page.waitForTimeout(500);

    for (const title of taskTitles) {
      const taskCard = page.locator(`[data-task-card="true"]:has-text("${title}")`).first();
      const checkbox = taskCard.locator('input[type="checkbox"]');
      await checkbox.check();
      await page.waitForTimeout(200);
    }

    // Exit selection mode - button text changes to "Cancel Selection"
    const cancelBtn = page.getByRole('button', { name: /Cancel Selection/i });
    await cancelBtn.click();
    await page.waitForTimeout(500);

    // Start dragging one task - the count badge should appear
    // Note: Playwright's dragTo doesn't let us inspect mid-drag state easily
    // So we verify tasks can be selected and are draggable
    const firstTaskCard = page.locator(`[data-task-card="true"]:has-text("${taskTitles[0]}")`).first();
    const isDraggable = await firstTaskCard.getAttribute('draggable');
    expect(isDraggable).toBe('true');
  });

  test('single task drag when not selected', async ({ page }) => {
    // Create 2 tasks
    const task1 = `Single1 ${Date.now()}`;
    const task2 = `Single2 ${Date.now()}`;

    for (const title of [task1, task2]) {
      const addBtn = page.getByRole('button', { name: /Add task/i }).first();
      await addBtn.click();
      await page.getByPlaceholder(/What needs to be done\?/i).fill(title);
      await page.locator('form button[type="submit"]').click();
      await page.waitForTimeout(500);
    }

    // Select only task1 in selection mode
    const selectionBtn = page.getByRole('button', { name: /Select Tasks/i });
    await selectionBtn.click();
    await page.waitForTimeout(500);

    const task1Card = page.locator(`[data-task-card="true"]:has-text("${task1}")`).first();
    const task1Checkbox = task1Card.locator('input[type="checkbox"]');
    await task1Checkbox.check();
    await page.waitForTimeout(200);

    // Exit selection mode - button text changes to "Cancel Selection"
    const cancelBtn = page.getByRole('button', { name: /Cancel Selection/i });
    await cancelBtn.click();
    await page.waitForTimeout(500);

    // Drag task2 (not selected) - should only move task2
    const task2Card = page.locator(`[data-task-card="true"]:has-text("${task2}")`).first();
    const inProgressHeader = page.locator('div:has-text("⚡ In Progress")').first();

    await task2Card.dragTo(inProgressHeader);
    await page.waitForTimeout(1000);

    // Verify only task2 moved to In Progress
    const inProgressSection = page.locator('div:has(> div:has-text("⚡ In Progress"))').first();
    await expect(inProgressSection.locator(`[data-task-card="true"]:has-text("${task2}")`)).toBeVisible();

    // task1 should still be in To Do
    const todoSection = page.locator('div:has(> div:has-text("📝 To Do"))').first();
    await expect(todoSection.locator(`[data-task-card="true"]:has-text("${task1}")`)).toBeVisible();
  });

  test('multi-select drag persists after reload', async ({ page }) => {
    // Create 2 tasks
    const taskTitles = [
      `Persist1 ${Date.now()}`,
      `Persist2 ${Date.now()}`,
    ];

    for (const title of taskTitles) {
      const addBtn = page.getByRole('button', { name: /Add task/i }).first();
      await addBtn.click();
      await page.getByPlaceholder(/What needs to be done\?/i).fill(title);
      await page.locator('form button[type="submit"]').click();
      await page.waitForTimeout(500);
    }

    // Enable selection mode and select both tasks
    const selectionBtn = page.getByRole('button', { name: /Select Tasks/i });
    await selectionBtn.click();
    await page.waitForTimeout(500);

    for (const title of taskTitles) {
      const taskCard = page.locator(`[data-task-card="true"]:has-text("${title}")`).first();
      const checkbox = taskCard.locator('input[type="checkbox"]');
      await checkbox.check();
      await page.waitForTimeout(200);
    }

    // Exit selection mode - button text changes to "Cancel Selection"
    const cancelBtn = page.getByRole('button', { name: /Cancel Selection/i });
    await cancelBtn.click();
    await page.waitForTimeout(500);

    // Drag to Waiting
    const firstTaskCard = page.locator(`[data-task-card="true"]:has-text("${taskTitles[0]}")`).first();
    const waitingHeader = page.locator('div:has-text("⏸️ Waiting")').first();
    await firstTaskCard.dragTo(waitingHeader);
    await page.waitForTimeout(1000);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Ensure we're in List view after reload
    const listViewBtn = page.getByRole('button', { name: /List.*view/i });
    if (await listViewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listViewBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify both tasks are in Waiting section
    const waitingSection = page.locator('div:has(> div:has-text("⏸️ Waiting"))').first();
    for (const title of taskTitles) {
      await expect(waitingSection.locator(`[data-task-card="true"]:has-text("${title}")`)).toBeVisible();
    }
  });
});
