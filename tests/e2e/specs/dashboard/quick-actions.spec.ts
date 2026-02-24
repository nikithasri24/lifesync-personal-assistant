/**
 * Dashboard Quick Actions Tests
 *
 * Tests all quick action buttons on the Dashboard:
 * - Add Task
 * - New Note
 * - Journal
 * - Focus
 *
 * Maps to: QA-TESTING-PLAN.md Section 2 (Dashboard Testing)
 */

import { test, expect } from '@playwright/test';
import { loginAsAccount1 } from '../../fixtures/test-accounts';
import { DashboardPage } from '../../page-objects/dashboard.page';
import { testData } from '../../fixtures/test-data';
import {
  waitForModal,
  closeModalViaEsc,
  fillAndSubmitModal,
  testAllModalCloseMethods,
} from '../../helpers/modal.helpers';

test.describe('Dashboard Quick Actions', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    // Login
    await loginAsAccount1(page);

    // Initialize page object
    dashboard = new DashboardPage(page);
    await dashboard.goto();
  });

  test.describe('Add Task Button', () => {
    test('should open Add Task modal when clicked @critical @p0', async ({ page }) => {
      await dashboard.clickAddTask();

      // Modal should be visible
      const modal = await waitForModal(page, 'Add Task');
      await expect(modal).toBeVisible();

      // Should have form fields (this was the bug found in QA)
      await expect(modal.getByRole('textbox', { name: /title/i })).toBeVisible();
      await expect(modal.getByRole('button', { name: /create/i })).toBeVisible();
    });

    test('should close modal via ESC key @p0', async ({ page }) => {
      await dashboard.clickAddTask();
      await closeModalViaEsc(page);
    });

    test('should close modal via backdrop click @p0', async ({ page }) => {
      await dashboard.clickAddTask();

      // Click backdrop
      const backdrop = page.locator('[style*="backdrop"]');
      await backdrop.click({ position: { x: 5, y: 5 } });

      // Modal should close
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should create task from dashboard @critical @p0', async ({ page }) => {
      const taskData = testData.task({
        title: 'Dashboard Quick Add Test',
      });

      await dashboard.clickAddTask();

      const modal = await waitForModal(page);
      await modal.getByRole('textbox', { name: /title/i }).fill(taskData.title);
      await modal.getByRole('button', { name: /create/i }).click();

      // Modal should close
      await expect(modal).not.toBeVisible();

      // Should show success toast
      await expect(page.getByText(/task created/i)).toBeVisible();

      // Task count should increase
      const newCount = await dashboard.getTaskCount();
      expect(newCount).toBeGreaterThan(0);
    });

    test('should validate required fields @p1', async ({ page }) => {
      await dashboard.clickAddTask();

      const modal = await waitForModal(page);

      // Try to submit without title
      await modal.getByRole('button', { name: /create/i }).click();

      // Modal should still be visible (validation failed)
      await expect(modal).toBeVisible();
    });

    test('should auto-save draft to localStorage @p1', async ({ page }) => {
      const testTitle = 'Auto-save test task';

      await dashboard.clickAddTask();
      const modal = await waitForModal(page);

      // Fill title
      await modal.getByRole('textbox', { name: /title/i }).fill(testTitle);

      // Wait for debounce
      await page.waitForTimeout(500);

      // Close modal without saving
      await closeModalViaEsc(page);

      // Reopen modal
      await dashboard.clickAddTask();

      // Draft should be restored
      const titleInput = page.getByRole('textbox', { name: /title/i });
      await expect(titleInput).toHaveValue(testTitle);

      // Cleanup - submit to clear draft
      await modal.getByRole('button', { name: /create/i }).click();
    });
  });

  test.describe('New Note Button', () => {
    test('should open New Note modal @p0', async ({ page }) => {
      await dashboard.clickNewNote();

      const modal = await waitForModal(page, 'Note');
      await expect(modal).toBeVisible();
    });

    test('should create note from dashboard @p0', async ({ page }) => {
      const noteData = testData.note({
        title: 'Dashboard Quick Note',
        content: 'Test content',
      });

      await dashboard.clickNewNote();

      await fillAndSubmitModal(page, {
        title: noteData.title,
        content: noteData.content,
      });

      // Should show success toast
      await expect(page.getByText(/note created/i)).toBeVisible();
    });
  });

  test.describe('Journal Button', () => {
    test('should navigate to Journal page @p1', async ({ page }) => {
      await dashboard.journalButton.click();

      // Should navigate to journal page
      await expect(page).toHaveURL('/journal');
    });
  });

  test.describe('Focus Button', () => {
    test('should navigate to Focus page @p1', async ({ page }) => {
      await dashboard.focusButton.click();

      // Should navigate to focus page
      await expect(page).toHaveURL('/focus');
    });
  });

  test.describe('Integration Tests', () => {
    test('should update dashboard after creating task @integration @p0', async ({ page }) => {
      // Get initial task count
      const initialCount = await dashboard.getTaskCount();

      // Create a task with today's due date
      await dashboard.clickAddTask();
      const modal = await waitForModal(page);

      const today = new Date().toISOString().split('T')[0];
      await modal.getByRole('textbox', { name: /title/i }).fill('Today Task');
      await modal.getByRole('textbox', { name: /due date/i }).fill(today);
      await modal.getByRole('button', { name: /create/i }).click();

      // Wait for modal to close
      await expect(modal).not.toBeVisible();

      // Task count should increase
      const newCount = await dashboard.getTaskCount();
      expect(newCount).toBe(initialCount + 1);

      // Today's tasks section should show the new task
      await dashboard.verifyTodayTasks();
      await expect(page.getByText('Today Task')).toBeVisible();
    });

    test('should reflect habit completion in summary @integration @p0', async ({ page }) => {
      // Complete a habit if any exist
      const habitsList = dashboard.todayHabitsSection.getByRole('listitem');
      const habitCount = await habitsList.count();

      if (habitCount > 0) {
        const firstHabit = habitsList.first();
        const habitName = await firstHabit.textContent();

        // Complete it
        const completeButton = firstHabit.getByRole('button', { name: /\+/ });
        await completeButton.click();

        // Should show success feedback
        await expect(page.getByText(/completed/i)).toBeVisible();

        // Habit should be removed from today's list (since it's complete)
        await expect(page.getByText(habitName || '')).not.toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('all action buttons should have proper labels @a11y @p1', async ({ page }) => {
      await dashboard.goto();

      // All buttons should have accessible names
      await expect(dashboard.addTaskButton).toHaveAccessibleName();
      await expect(dashboard.newNoteButton).toHaveAccessibleName();
      await expect(dashboard.journalButton).toHaveAccessibleName();
      await expect(dashboard.focusButton).toHaveAccessibleName();
    });

    test('should be keyboard navigable @a11y @p1', async ({ page }) => {
      await dashboard.goto();

      // Tab to first button
      await page.keyboard.press('Tab');

      // Should be able to activate with Enter
      await page.keyboard.press('Enter');

      // Modal should open
      await expect(page.getByRole('dialog')).toBeVisible();
    });
  });

  test.describe('Visual Regression', () => {
    test('Dashboard should match design spec @visual', async ({ page }) => {
      await dashboard.goto();

      // Take screenshot
      await expect(page).toHaveScreenshot('dashboard-full.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('Add Task modal should match design @visual', async ({ page }) => {
      await dashboard.clickAddTask();

      const modal = page.getByRole('dialog');
      await expect(modal).toHaveScreenshot('add-task-modal.png');
    });
  });
});
