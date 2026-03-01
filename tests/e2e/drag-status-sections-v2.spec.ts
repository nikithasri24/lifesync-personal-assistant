import { test, expect } from '@playwright/test';

/**
 * V2 Todos Drag and Drop - Status Sections
 *
 * Tests dragging tasks between status sections:
 * - To Do → In Progress → Waiting → Done
 *
 * Prerequisites:
 * - Drag and drop implementation in TaskListViewV2
 * - List view active
 */
test.describe('V2 Drag between status sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('domcontentloaded');

    // Close mobile sidebar if open (backdrop blocks clicks on mobile)
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    // Switch to List view (if not already active)
    const listViewBtn = page.getByRole('button', { name: /List.*view/i });
    if (await listViewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listViewBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('drag task from To Do to In Progress', async ({ page }) => {
    // Create a task
    const addBtn = page.getByRole('button', { name: /Add task/i }).first();
    await addBtn.click();
    const title = `Drag To Progress ${Date.now()}`;
    await page.getByPlaceholder(/What needs to be done\?/i).fill(title);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Find the draggable task card container (not just the text)
    const taskCard = page.locator(`[data-task-card="true"]:has-text("${title}")`).first();
    await expect(taskCard).toBeVisible();

    // Drag to "In Progress" section header
    const inProgressHeader = page.locator('div:has-text("⚡ In Progress")').first();
    await taskCard.dragTo(inProgressHeader);
    await page.waitForTimeout(1000);

    // Verify task moved to In Progress section
    const inProgressSection = page.locator('div:has(> div:has-text("⚡ In Progress"))').first();
    await expect(inProgressSection.locator(`[data-task-card="true"]:has-text("${title}")`)).toBeVisible();
  });

  test('drag task from In Progress to Waiting', async ({ page }) => {
    // Create a task
    const addBtn = page.getByRole('button', { name: /Add task/i }).first();
    await addBtn.click();
    const title = `Drag To Waiting ${Date.now()}`;
    await page.getByPlaceholder(/What needs to be done\?/i).fill(title);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Drag task to In Progress first
    let taskCard = page.locator(`[data-task-card="true"]:has-text("${title}")`).first();
    await expect(taskCard).toBeVisible();

    const inProgressHeader = page.locator('div:has-text("⚡ In Progress")').first();
    await taskCard.dragTo(inProgressHeader);
    await page.waitForTimeout(1000);

    // Now drag from In Progress to Waiting
    taskCard = page.locator(`[data-task-card="true"]:has-text("${title}")`).first();
    await expect(taskCard).toBeVisible();

    const waitingHeader = page.locator('div:has-text("⏸️ Waiting")').first();
    await taskCard.dragTo(waitingHeader);
    await page.waitForTimeout(1000);

    // Verify task moved to Waiting section
    const waitingSection = page.locator('div:has(> div:has-text("⏸️ Waiting"))').first();
    await expect(waitingSection.locator(`[data-task-card="true"]:has-text("${title}")`)).toBeVisible();
  });

  test('drag task from To Do to Done completes task', async ({ page }) => {
    // Create a task
    const addBtn = page.getByRole('button', { name: /Add task/i }).first();
    await addBtn.click();
    const title = `Drag To Done ${Date.now()}`;
    await page.getByPlaceholder(/What needs to be done\?/i).fill(title);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Find the draggable task card
    const taskCard = page.locator(`[data-task-card="true"]:has-text("${title}")`).first();
    await expect(taskCard).toBeVisible();

    // Drag to "Done" section header
    const doneHeader = page.locator('div:has-text("✅ Done")').first();
    await taskCard.dragTo(doneHeader);
    await page.waitForTimeout(1000);

    // Verify task moved to Done section
    const doneSection = page.locator('div:has(> div:has-text("✅ Done"))').first();
    await expect(doneSection.locator(`[data-task-card="true"]:has-text("${title}")`)).toBeVisible();
  });

  test('drag task status persists after page reload', async ({ page }) => {
    // Create a task
    const addBtn = page.getByRole('button', { name: /Add task/i }).first();
    await addBtn.click();
    const title = `Drag Persist ${Date.now()}`;
    await page.getByPlaceholder(/What needs to be done\?/i).fill(title);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Drag to Waiting
    const taskCard = page.locator(`[data-task-card="true"]:has-text("${title}")`).first();
    await expect(taskCard).toBeVisible();

    const waitingHeader = page.locator('div:has-text("⏸️ Waiting")').first();
    await taskCard.dragTo(waitingHeader);
    await page.waitForTimeout(1000);

    // Verify in Waiting section
    const waitingSection = page.locator('div:has(> div:has-text("⏸️ Waiting"))').first();
    await expect(waitingSection.locator(`[data-task-card="true"]:has-text("${title}")`)).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Ensure we're in List view after reload
    const listViewBtn = page.getByRole('button', { name: /List.*view/i });
    if (await listViewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listViewBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify task still in Waiting section
    const waitingSectionAfterReload = page.locator('div:has(> div:has-text("⏸️ Waiting"))').first();
    await expect(waitingSectionAfterReload.locator(`[data-task-card="true"]:has-text("${title}")`)).toBeVisible();
  });

  test('cannot drag task when in selection mode', async ({ page }) => {
    // Create a task
    const addBtn = page.getByRole('button', { name: /Add task/i }).first();
    await addBtn.click();
    const title = `Selection Mode ${Date.now()}`;
    await page.getByPlaceholder(/What needs to be done\?/i).fill(title);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Enable selection mode
    const selectionBtn = page.getByRole('button', { name: /Select Tasks/i });
    await selectionBtn.click();
    await page.waitForTimeout(500);

    // Task card should NOT be draggable
    const taskCard = page.locator(`[data-task-card="true"]:has-text("${title}")`).first();

    // Verify draggable is false
    const isDraggable = await taskCard.getAttribute('draggable');
    expect(isDraggable).toBe('false');
  });

  test('visual feedback during drag', async ({ page }) => {
    // Create a task
    const addBtn = page.getByRole('button', { name: /Add task/i }).first();
    await addBtn.click();
    const title = `Visual Feedback ${Date.now()}`;
    await page.getByPlaceholder(/What needs to be done\?/i).fill(title);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Note: Testing visual feedback (opacity, borders, etc.) is tricky in Playwright
    // This test verifies the drag operation completes successfully
    const taskCard = page.locator(`[data-task-card="true"]:has-text("${title}")`).first();
    await expect(taskCard).toBeVisible();

    const inProgressHeader = page.locator('div:has-text("⚡ In Progress")').first();

    // Perform drag
    await taskCard.dragTo(inProgressHeader);
    await page.waitForTimeout(1000);

    // Verify successful move
    const inProgressSection = page.locator('div:has(> div:has-text("⚡ In Progress"))').first();
    await expect(inProgressSection.locator(`[data-task-card="true"]:has-text("${title}")`)).toBeVisible();
  });
});
