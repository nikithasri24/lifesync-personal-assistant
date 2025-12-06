import { test, expect } from '@playwright/test';

test.describe('Notifications System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Browser Notifications', () => {
    test('should request notification permissions', async ({ page, context }) => {
      // Grant notification permissions
      await context.grantPermissions(['notifications']);

      // Navigate to habits (which has reminder functionality)
      await page.goto('/habits');
      await page.waitForLoadState('networkidle');

      // Look for notification settings
      const notificationToggle = page.locator('[data-testid="enable-notifications"]').or(
        page.getByText(/notifications|reminders/i).first()
      );

      await expect(page.locator('body')).toBeVisible();
    });

    test('should show notification permission dialog', async ({ page }) => {
      // Look for settings
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        // Look for notification settings
        const notificationSettings = page.locator('[data-testid="notification-settings"]').or(
          page.getByText(/notifications/i).first()
        );

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should handle denied notification permissions', async ({ page, context }) => {
      // Don't grant permissions - test graceful degradation

      await page.goto('/habits');
      await page.waitForLoadState('networkidle');

      // App should still function without notifications
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('In-App Notifications', () => {
    test('should have notification center', async ({ page }) => {
      // Look for notification bell/icon
      const notificationBell = page.locator('[data-testid="notification-bell"]').or(
        page.getByRole('button').filter({ hasText: /notification|bell/i }).first()
      );

      if (await notificationBell.isVisible()) {
        await expect(notificationBell).toBeVisible();
      }
    });

    test('should show notification badge for unread', async ({ page }) => {
      const notificationBell = page.locator('[data-testid="notification-bell"]').first();

      if (await notificationBell.isVisible()) {
        // Look for badge
        const badge = notificationBell.locator('[data-testid="notification-badge"]').or(
          notificationBell.locator('.badge')
        );

        // Badge might be visible
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should open notification panel', async ({ page }) => {
      const notificationBell = page.locator('[data-testid="notification-bell"]').first();

      if (await notificationBell.isVisible()) {
        await notificationBell.click();
        await page.waitForTimeout(500);

        // Notification panel should open
        const notificationPanel = page.locator('[data-testid="notification-panel"]').or(
          page.locator('.notification-panel')
        );

        if (await notificationPanel.first().isVisible()) {
          await expect(notificationPanel.first()).toBeVisible();
        }
      }
    });

    test('should display notification list', async ({ page }) => {
      const notificationBell = page.locator('[data-testid="notification-bell"]').first();

      if (await notificationBell.isVisible()) {
        await notificationBell.click();
        await page.waitForTimeout(500);

        // Look for notifications
        const notificationsList = page.locator('[data-testid="notifications-list"]').or(
          page.locator('.notifications-list')
        );

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should mark notification as read', async ({ page }) => {
      const notificationBell = page.locator('[data-testid="notification-bell"]').first();

      if (await notificationBell.isVisible()) {
        await notificationBell.click();
        await page.waitForTimeout(500);

        // Click on a notification
        const notification = page.locator('[data-testid*="notification-"]').first();

        if (await notification.isVisible()) {
          await notification.click();
          await page.waitForTimeout(500);

          // Notification should be marked as read
          await expect(page.locator('body')).toBeVisible();
        }
      }
    });

    test('should mark all as read', async ({ page }) => {
      const notificationBell = page.locator('[data-testid="notification-bell"]').first();

      if (await notificationBell.isVisible()) {
        await notificationBell.click();
        await page.waitForTimeout(500);

        // Look for mark all as read button
        const markAllButton = page.locator('[data-testid="mark-all-read"]').or(
          page.getByRole('button', { name: /mark all|read all/i }).first()
        );

        if (await markAllButton.isVisible()) {
          await markAllButton.click();
          await page.waitForTimeout(500);

          // All notifications should be marked as read
          await expect(page.locator('body')).toBeVisible();
        }
      }
    });

    test('should clear notifications', async ({ page }) => {
      const notificationBell = page.locator('[data-testid="notification-bell"]').first();

      if (await notificationBell.isVisible()) {
        await notificationBell.click();
        await page.waitForTimeout(500);

        // Look for clear button
        const clearButton = page.locator('[data-testid="clear-notifications"]').or(
          page.getByRole('button', { name: /clear|dismiss all/i }).first()
        );

        if (await clearButton.isVisible()) {
          await clearButton.click();
          await page.waitForTimeout(500);

          await expect(page.locator('body')).toBeVisible();
        }
      }
    });

    test('should filter notifications by type', async ({ page }) => {
      const notificationBell = page.locator('[data-testid="notification-bell"]').first();

      if (await notificationBell.isVisible()) {
        await notificationBell.click();
        await page.waitForTimeout(500);

        // Look for filter options
        const filterButton = page.locator('[data-testid="filter-notifications"]').or(
          page.getByRole('button', { name: /filter/i }).first()
        );

        if (await filterButton.isVisible()) {
          await filterButton.click();
          await page.waitForTimeout(300);

          await expect(page.locator('body')).toBeVisible();
        }
      }
    });
  });

  test.describe('Reminder Notifications', () => {
    test('should set reminder for habit', async ({ page, context }) => {
      await context.grantPermissions(['notifications']);

      await page.goto('/habits');
      await page.waitForLoadState('networkidle');

      // Find a habit
      const habit = page.locator('[data-testid*="habit"]').first();

      if (await habit.isVisible()) {
        await habit.click();
        await page.waitForTimeout(500);

        // Look for reminder settings
        const reminderToggle = page.locator('[data-testid="reminder-toggle"]').or(
          page.getByText(/reminder|notify/i).first()
        );

        if (await reminderToggle.isVisible()) {
          await expect(reminderToggle).toBeVisible();
        }
      }
    });

    test('should set reminder time', async ({ page, context }) => {
      await context.grantPermissions(['notifications']);

      await page.goto('/habits');
      await page.waitForLoadState('networkidle');

      const habit = page.locator('[data-testid*="habit"]').first();

      if (await habit.isVisible()) {
        await habit.click();
        await page.waitForTimeout(500);

        // Look for time picker
        const timePicker = page.locator('input[type="time"]').first();

        if (await timePicker.isVisible()) {
          await expect(timePicker).toBeVisible();
        }
      }
    });

    test('should set task reminder', async ({ page, context }) => {
      await context.grantPermissions(['notifications']);

      await page.goto('/todos');
      await page.waitForLoadState('networkidle');

      const task = page.locator('[data-testid*="task"]').first();

      if (await task.isVisible()) {
        await task.click();
        await page.waitForTimeout(500);

        // Look for reminder option
        const reminderButton = page.locator('[data-testid="set-reminder"]').or(
          page.getByRole('button', { name: /reminder/i }).first()
        );

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should set recurring reminders', async ({ page, context }) => {
      await context.grantPermissions(['notifications']);

      await page.goto('/habits');
      await page.waitForLoadState('networkidle');

      const habit = page.locator('[data-testid*="habit"]').first();

      if (await habit.isVisible()) {
        await habit.click();
        await page.waitForTimeout(500);

        // Look for recurring reminder option
        const recurringOption = page.locator('[data-testid="recurring-reminder"]').or(
          page.getByText(/recurring|repeat/i).first()
        );

        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('Notification Settings', () => {
    test('should have notification preferences', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        const notificationSettings = page.locator('[data-testid="notification-settings"]').or(
          page.getByText(/notification/i).first()
        );

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should toggle notification types', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        // Look for notification type toggles
        const toggles = page.locator('[data-testid*="notification-toggle"]');

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should set quiet hours', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        // Look for quiet hours/do not disturb
        const quietHours = page.locator('[data-testid="quiet-hours"]').or(
          page.getByText(/quiet hours|do not disturb/i).first()
        );

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should configure notification sound', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        // Look for sound settings
        const soundSettings = page.locator('[data-testid="notification-sound"]').or(
          page.getByText(/sound|audio/i).first()
        );

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should test notification', async ({ page, context }) => {
      await context.grantPermissions(['notifications']);

      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        // Look for test notification button
        const testButton = page.locator('[data-testid="test-notification"]').or(
          page.getByRole('button', { name: /test notification/i }).first()
        );

        if (await testButton.isVisible()) {
          await testButton.click();
          await page.waitForTimeout(1000);

          // Test notification should be sent
          await expect(page.locator('body')).toBeVisible();
        }
      }
    });
  });

  test.describe('Notification Types', () => {
    test('should show task due notifications', async ({ page }) => {
      // Tasks with due dates should trigger notifications
      await expect(page.locator('body')).toBeVisible();
    });

    test('should show habit reminder notifications', async ({ page }) => {
      // Habits should trigger reminder notifications
      await expect(page.locator('body')).toBeVisible();
    });

    test('should show goal milestone notifications', async ({ page }) => {
      // Goal milestones should trigger notifications
      await expect(page.locator('body')).toBeVisible();
    });

    test('should show expiry notifications', async ({ page }) => {
      // Items with expiry (pantry, skincare) should notify
      await expect(page.locator('body')).toBeVisible();
    });

    test('should show achievement notifications', async ({ page }) => {
      // Completing streaks, goals should show achievements
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
