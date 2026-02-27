/**
 * E2E Tests: Advanced Task Features
 * Tests for subtasks, dependencies, and reminders
 */

import { test, expect } from '@playwright/test';

test.describe('Task Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Todos page
    await page.goto('/todos');

    // Wait for page to load
    await page.waitForSelector('[data-task-card]', { timeout: 10000 });
  });

  // ============================================================================
  // SUBTASKS TESTS
  // ============================================================================

  test.describe('Subtasks', () => {
    test('should create task with subtasks', async ({ page }) => {
      // Click FAB to open quick add
      await page.click('button[aria-label*="add task"]');

      // Wait for modal and click to open full form
      await page.waitForSelector('text=Quick Add');
      await page.click('text=Open Full Form');

      // Wait for full modal
      await page.waitForSelector('text=Create Task');

      // Fill task title
      await page.fill('input[placeholder*="What needs to be done"]', 'Parent Task with Subtasks');

      // Fill subtasks (one per line)
      await page.fill('textarea[placeholder*="Enter subtasks"]', 'Subtask 1\nSubtask 2\nSubtask 3');

      // Submit
      await page.click('button:has-text("Create Task")');

      // Wait for modal to close
      await page.waitForSelector('text=Create Task', { state: 'hidden' });

      // Verify task appears with subtask count
      await expect(page.locator('text=Parent Task with Subtasks')).toBeVisible();
      await expect(page.locator('text=0/3')).toBeVisible(); // 0 completed out of 3
    });

    test('should expand and collapse subtasks', async ({ page }) => {
      // Create task with subtasks first
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.click('text=Open Full Form');
      await page.waitForSelector('text=Create Task');
      await page.fill('input[placeholder*="What needs to be done"]', 'Expandable Task');
      await page.fill('textarea[placeholder*="Enter subtasks"]', 'Step 1\nStep 2');
      await page.click('button:has-text("Create Task")');
      await page.waitForSelector('text=Create Task', { state: 'hidden' });

      // Click subtask count to expand
      const subtaskButton = page.locator('button:has-text("0/2")');
      await subtaskButton.click();

      // Verify subtasks are visible
      await expect(page.locator('text=Step 1')).toBeVisible();
      await expect(page.locator('text=Step 2')).toBeVisible();

      // Click again to collapse
      await subtaskButton.click();

      // Verify subtasks are hidden
      await expect(page.locator('text=Step 1')).not.toBeVisible();
    });

    test('should toggle subtask completion', async ({ page }) => {
      // Create task with subtasks
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.click('text=Open Full Form');
      await page.waitForSelector('text=Create Task');
      await page.fill('input[placeholder*="What needs to be done"]', 'Task with Checkable Subtasks');
      await page.fill('textarea[placeholder*="Enter subtasks"]', 'Buy milk\nBuy eggs');
      await page.click('button:has-text("Create Task")');
      await page.waitForSelector('text=Create Task', { state: 'hidden' });

      // Expand subtasks
      await page.click('button:has-text("0/2")');

      // Check first subtask
      const firstCheckbox = page.locator('text=Buy milk').locator('..').locator('input[type="checkbox"]');
      await firstCheckbox.click();

      // Wait for update
      await page.waitForTimeout(500);

      // Verify count updated
      await expect(page.locator('text=1/2')).toBeVisible();

      // Verify checkbox is checked
      await expect(firstCheckbox).toBeChecked();
    });

    test('should edit subtasks in existing task', async ({ page }) => {
      // Create task first
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.click('text=Open Full Form');
      await page.waitForSelector('text=Create Task');
      await page.fill('input[placeholder*="What needs to be done"]', 'Editable Subtask Task');
      await page.click('button:has-text("Create Task")');
      await page.waitForSelector('text=Create Task', { state: 'hidden' });

      // Click task to edit
      await page.click('text=Editable Subtask Task');
      await page.waitForSelector('text=Edit Task');

      // Add subtasks
      await page.fill('textarea[placeholder*="Enter subtasks"]', 'New subtask 1\nNew subtask 2');

      // Update task
      await page.click('button:has-text("Update Task")');
      await page.waitForSelector('text=Edit Task', { state: 'hidden' });

      // Verify subtasks appear
      await expect(page.locator('text=0/2')).toBeVisible();
    });
  });

  // ============================================================================
  // DEPENDENCIES TESTS
  // ============================================================================

  test.describe('Dependencies', () => {
    test('should create task with dependency', async ({ page }) => {
      // Create first task (prerequisite)
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.fill('input[placeholder*="task title"]', 'Prerequisite Task');
      await page.press('input[placeholder*="task title"]', 'Enter');
      await page.waitForSelector('text=Prerequisite Task');

      // Create second task with dependency
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.click('text=Open Full Form');
      await page.waitForSelector('text=Create Task');
      await page.fill('input[placeholder*="What needs to be done"]', 'Dependent Task');

      // Open dependency selector and select prerequisite
      const dependencySection = page.locator('text=Dependencies (optional)').locator('..');
      await dependencySection.locator('button:has-text("Add Dependency")').click();
      await page.click('text=Prerequisite Task');

      // Submit
      await page.click('button:has-text("Create Task")');
      await page.waitForSelector('text=Create Task', { state: 'hidden' });

      // Verify dependent task shows blocked indicator
      const dependentCard = page.locator('text=Dependent Task').locator('..');
      await expect(dependentCard.locator('[title*="Blocked"]')).toBeVisible();
    });

    test('should unblock task when dependency is completed', async ({ page }) => {
      // Create prerequisite task
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.fill('input[placeholder*="task title"]', 'Blocker Task');
      await page.press('input[placeholder*="task title"]', 'Enter');
      await page.waitForSelector('text=Blocker Task');

      // Create dependent task
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.click('text=Open Full Form');
      await page.waitForSelector('text=Create Task');
      await page.fill('input[placeholder*="What needs to be done"]', 'Blocked Task');
      await page.locator('text=Dependencies (optional)').locator('..').locator('button:has-text("Add Dependency")').click();
      await page.click('text=Blocker Task');
      await page.click('button:has-text("Create Task")');
      await page.waitForSelector('text=Create Task', { state: 'hidden' });

      // Complete the blocker task
      const blockerCheckbox = page.locator('text=Blocker Task').locator('..').locator('input[type="checkbox"]').first();
      await blockerCheckbox.click();

      // Wait for status update
      await page.waitForTimeout(500);

      // Verify blocked indicator is gone
      const blockedCard = page.locator('text=Blocked Task').locator('..');
      await expect(blockedCard.locator('[title*="Blocked"]')).not.toBeVisible();
    });

    test('should show dependency count', async ({ page }) => {
      // Create two prerequisite tasks
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.fill('input[placeholder*="task title"]', 'Prereq 1');
      await page.press('input[placeholder*="task title"]', 'Enter');

      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.fill('input[placeholder*="task title"]', 'Prereq 2');
      await page.press('input[placeholder*="task title"]', 'Enter');

      // Create task with both dependencies
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.click('text=Open Full Form');
      await page.waitForSelector('text=Create Task');
      await page.fill('input[placeholder*="What needs to be done"]', 'Multi-Dependency Task');
      await page.locator('text=Dependencies (optional)').locator('..').locator('button:has-text("Add Dependency")').click();
      await page.click('text=Prereq 1');
      await page.click('text=Prereq 2');
      await page.click('button:has-text("Create Task")');
      await page.waitForSelector('text=Create Task', { state: 'hidden' });

      // Verify indicator shows count of 2
      const card = page.locator('text=Multi-Dependency Task').locator('..');
      await expect(card.locator('text=2')).toBeVisible(); // Shows "2" blocked tasks
    });
  });

  // ============================================================================
  // REMINDERS TESTS
  // ============================================================================

  test.describe('Reminders', () => {
    test('should create task with reminder', async ({ page }) => {
      // Open full form
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.click('text=Open Full Form');
      await page.waitForSelector('text=Create Task');

      // Fill task details
      await page.fill('input[placeholder*="What needs to be done"]', 'Task with Reminder');

      // Enable reminder
      await page.click('text=Set Reminder');

      // Set date and time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

      await page.fill('input[type="date"]', dateStr);
      await page.fill('input[type="time"]', '14:30');

      // Submit
      await page.click('button:has-text("Create Task")');
      await page.waitForSelector('text=Create Task', { state: 'hidden' });

      // Verify task shows reminder icon
      const card = page.locator('text=Task with Reminder').locator('..');
      await expect(card.locator('[aria-label*="reminder"]').or(card.locator('svg').filter({ hasText: /bell/i }))).toBeVisible();
    });

    test('should show reminder time on task card', async ({ page }) => {
      // Create task with reminder
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.click('text=Open Full Form');
      await page.waitForSelector('text=Create Task');
      await page.fill('input[placeholder*="What needs to be done"]', 'Reminder Display Test');
      await page.click('text=Set Reminder');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      await page.fill('input[type="date"]', dateStr);
      await page.fill('input[type="time"]', '09:00');
      await page.click('button:has-text("Create Task")');
      await page.waitForSelector('text=Create Task', { state: 'hidden' });

      // Verify reminder time is displayed (format: "Jan 15, 9:00 AM")
      const card = page.locator('text=Reminder Display Test').locator('..');
      await expect(card.locator('text=/9:00 AM/i')).toBeVisible();
    });

    test('should edit reminder on existing task', async ({ page }) => {
      // Create task without reminder
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.fill('input[placeholder*="task title"]', 'Add Reminder Later');
      await page.press('input[placeholder*="task title"]', 'Enter');
      await page.waitForSelector('text=Add Reminder Later');

      // Click to edit
      await page.click('text=Add Reminder Later');
      await page.waitForSelector('text=Edit Task');

      // Enable reminder
      await page.click('text=Set Reminder');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      await page.fill('input[type="date"]', dateStr);
      await page.fill('input[type="time"]', '16:00');

      // Update
      await page.click('button:has-text("Update Task")');
      await page.waitForSelector('text=Edit Task', { state: 'hidden' });

      // Verify reminder appears
      const card = page.locator('text=Add Reminder Later').locator('..');
      await expect(card.locator('text=/4:00 PM/i')).toBeVisible();
    });

    test('should disable reminder when checkbox is unchecked', async ({ page }) => {
      // Create task with reminder
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.click('text=Open Full Form');
      await page.waitForSelector('text=Create Task');
      await page.fill('input[placeholder*="What needs to be done"]', 'Remove Reminder Test');
      await page.click('text=Set Reminder');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      await page.fill('input[type="date"]', dateStr);
      await page.fill('input[type="time"]', '10:00');
      await page.click('button:has-text("Create Task")');
      await page.waitForSelector('text=Create Task', { state: 'hidden' });

      // Edit to remove reminder
      await page.click('text=Remove Reminder Test');
      await page.waitForSelector('text=Edit Task');

      // Uncheck reminder
      await page.click('text=Set Reminder');

      // Update
      await page.click('button:has-text("Update Task")');
      await page.waitForSelector('text=Edit Task', { state: 'hidden' });

      // Verify reminder indicator is gone
      const card = page.locator('text=Remove Reminder Test').locator('..');
      await expect(card.locator('text=/10:00 AM/i')).not.toBeVisible();
    });
  });

  // ============================================================================
  // COMBINED FEATURES TESTS
  // ============================================================================

  test.describe('Combined Features', () => {
    test('should create task with all three features', async ({ page }) => {
      // Create prerequisite task first
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.fill('input[placeholder*="task title"]', 'Setup Environment');
      await page.press('input[placeholder*="task title"]', 'Enter');
      await page.waitForSelector('text=Setup Environment');

      // Create comprehensive task
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.click('text=Open Full Form');
      await page.waitForSelector('text=Create Task');

      // Fill basic info
      await page.fill('input[placeholder*="What needs to be done"]', 'Complex Task');

      // Add subtasks
      await page.fill('textarea[placeholder*="Enter subtasks"]', 'Write code\nWrite tests\nWrite docs');

      // Add dependency
      await page.locator('text=Dependencies (optional)').locator('..').locator('button:has-text("Add Dependency")').click();
      await page.click('text=Setup Environment');

      // Add reminder
      await page.click('text=Set Reminder');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      await page.fill('input[type="date"]', dateStr);
      await page.fill('input[type="time"]', '11:00');

      // Submit
      await page.click('button:has-text("Create Task")');
      await page.waitForSelector('text=Create Task', { state: 'hidden' });

      // Verify all indicators present
      const card = page.locator('text=Complex Task').locator('..');
      await expect(card.locator('text=0/3')).toBeVisible(); // Subtasks
      await expect(card.locator('[title*="Blocked"]')).toBeVisible(); // Dependency
      await expect(card.locator('text=/11:00 AM/i')).toBeVisible(); // Reminder
    });

    test('should persist features after page reload', async ({ page }) => {
      // Create task with all features
      await page.click('button[aria-label*="add task"]');
      await page.waitForSelector('text=Quick Add');
      await page.click('text=Open Full Form');
      await page.waitForSelector('text=Create Task');
      await page.fill('input[placeholder*="What needs to be done"]', 'Persistent Features Task');
      await page.fill('textarea[placeholder*="Enter subtasks"]', 'Subtask A\nSubtask B');
      await page.click('text=Set Reminder');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      await page.fill('input[type="date"]', dateStr);
      await page.fill('input[type="time"]', '13:00');
      await page.click('button:has-text("Create Task")');
      await page.waitForSelector('text=Create Task', { state: 'hidden' });

      // Reload page
      await page.reload();
      await page.waitForSelector('[data-task-card]');

      // Verify features still present
      const card = page.locator('text=Persistent Features Task').locator('..');
      await expect(card.locator('text=0/2')).toBeVisible();
      await expect(card.locator('text=/1:00 PM/i')).toBeVisible();
    });
  });
});
