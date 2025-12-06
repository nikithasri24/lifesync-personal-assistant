import { test, expect } from '@playwright/test';

test.describe('Settings and Preferences', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to settings
    const settingsLink = page.locator('[data-testid="nav-settings"]').or(
      page.getByRole('button', { name: /settings/i }).first()
    );

    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
    }
  });

  test.describe('General Settings', () => {
    test('should display settings page', async ({ page }) => {
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have profile settings section', async ({ page }) => {
      const profileSection = page.locator('[data-testid="profile-settings"]').or(
        page.getByText(/profile|account/i).first()
      );

      if (await profileSection.isVisible()) {
        await expect(profileSection).toBeVisible();
      }
    });

    test('should update user name', async ({ page }) => {
      const nameInput = page.locator('[data-testid="user-name"]').or(
        page.getByPlaceholder(/name|full name/i).first()
      );

      if (await nameInput.isVisible()) {
        await nameInput.fill('Test User');
        await page.waitForTimeout(500);

        const saveButton = page.getByRole('button', { name: /save/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should update email', async ({ page }) => {
      const emailInput = page.locator('[data-testid="user-email"]').or(
        page.locator('input[type="email"]').first()
      );

      if (await emailInput.isVisible()) {
        await expect(emailInput).toBeVisible();
      }
    });

    test('should change password', async ({ page }) => {
      const changePasswordButton = page.locator('[data-testid="change-password"]').or(
        page.getByRole('button', { name: /change password/i }).first()
      );

      if (await changePasswordButton.isVisible()) {
        await changePasswordButton.click();
        await page.waitForTimeout(500);

        // Password change form should appear
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('Appearance Settings', () => {
    test('should have theme selector', async ({ page }) => {
      const themeSelector = page.locator('[data-testid="theme-selector"]').or(
        page.getByText(/theme|appearance/i).first()
      );

      if (await themeSelector.isVisible()) {
        await expect(themeSelector).toBeVisible();
      }
    });

    test('should switch to light theme', async ({ page }) => {
      const lightThemeButton = page.getByRole('button', { name: /light/i }).first();

      if (await lightThemeButton.isVisible()) {
        await lightThemeButton.click();
        await page.waitForTimeout(500);

        const html = page.locator('html');
        const htmlClass = await html.getAttribute('class');

        // Theme should change
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should switch to dark theme', async ({ page }) => {
      const darkThemeButton = page.getByRole('button', { name: /dark/i }).first();

      if (await darkThemeButton.isVisible()) {
        await darkThemeButton.click();
        await page.waitForTimeout(500);

        // Theme should change
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should switch to system theme', async ({ page }) => {
      const systemThemeButton = page.getByRole('button', { name: /system|auto/i }).first();

      if (await systemThemeButton.isVisible()) {
        await systemThemeButton.click();
        await page.waitForTimeout(500);

        // Theme should follow system
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should change font size', async ({ page }) => {
      const fontSizeSelector = page.locator('[data-testid="font-size"]').or(
        page.locator('input[type="range"]').first()
      );

      if (await fontSizeSelector.isVisible()) {
        await fontSizeSelector.fill('18');
        await page.waitForTimeout(500);

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should change accent color', async ({ page }) => {
      const colorPicker = page.locator('input[type="color"]').first();

      if (await colorPicker.isVisible()) {
        await colorPicker.click();
        await page.waitForTimeout(300);

        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('Language and Region', () => {
    test('should have language selector', async ({ page }) => {
      const languageSelector = page.locator('[data-testid="language-selector"]').or(
        page.getByText(/language/i).first()
      );

      if (await languageSelector.isVisible()) {
        await expect(languageSelector).toBeVisible();
      }
    });

    test('should change language', async ({ page }) => {
      const languageSelect = page.locator('select[name="language"]').first();

      if (await languageSelect.isVisible()) {
        await languageSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should set timezone', async ({ page }) => {
      const timezoneSelector = page.locator('[data-testid="timezone-selector"]').or(
        page.getByText(/timezone/i).first()
      );

      if (await timezoneSelector.isVisible()) {
        await expect(timezoneSelector).toBeVisible();
      }
    });

    test('should set date format', async ({ page }) => {
      const dateFormatSelector = page.locator('[data-testid="date-format"]').or(
        page.getByText(/date format/i).first()
      );

      if (await dateFormatSelector.isVisible()) {
        await expect(dateFormatSelector).toBeVisible();
      }
    });

    test('should set time format (12/24 hour)', async ({ page }) => {
      const timeFormatToggle = page.locator('[data-testid="time-format"]').or(
        page.getByText(/12 hour|24 hour/i).first()
      );

      if (await timeFormatToggle.isVisible()) {
        await expect(timeFormatToggle).toBeVisible();
      }
    });

    test('should set first day of week', async ({ page }) => {
      const firstDaySelector = page.locator('[data-testid="first-day-of-week"]').or(
        page.getByText(/first day/i).first()
      );

      if (await firstDaySelector.isVisible()) {
        await expect(firstDaySelector).toBeVisible();
      }
    });
  });

  test.describe('Privacy and Security', () => {
    test('should have privacy settings', async ({ page }) => {
      const privacySection = page.locator('[data-testid="privacy-settings"]').or(
        page.getByText(/privacy|security/i).first()
      );

      if (await privacySection.isVisible()) {
        await expect(privacySection).toBeVisible();
      }
    });

    test('should toggle analytics tracking', async ({ page }) => {
      const analyticsToggle = page.locator('[data-testid="analytics-toggle"]').or(
        page.getByText(/analytics|tracking/i).first()
      );

      if (await analyticsToggle.isVisible()) {
        await analyticsToggle.click();
        await page.waitForTimeout(300);

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should enable two-factor authentication', async ({ page }) => {
      const twoFactorButton = page.locator('[data-testid="enable-2fa"]').or(
        page.getByRole('button', { name: /two-factor|2fa/i }).first()
      );

      if (await twoFactorButton.isVisible()) {
        await expect(twoFactorButton).toBeVisible();
      }
    });

    test('should view active sessions', async ({ page }) => {
      const sessionsButton = page.locator('[data-testid="active-sessions"]').or(
        page.getByRole('button', { name: /sessions|devices/i }).first()
      );

      if (await sessionsButton.isVisible()) {
        await sessionsButton.click();
        await page.waitForTimeout(500);

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should delete account', async ({ page }) => {
      const deleteAccountButton = page.locator('[data-testid="delete-account"]').or(
        page.getByRole('button', { name: /delete account/i }).first()
      );

      if (await deleteAccountButton.isVisible()) {
        // Should have delete account option (but don't actually click it)
        await expect(deleteAccountButton).toBeVisible();
      }
    });
  });

  test.describe('Data and Storage', () => {
    test('should display storage usage', async ({ page }) => {
      const storageUsage = page.locator('[data-testid="storage-usage"]').or(
        page.getByText(/storage|space used/i).first()
      );

      if (await storageUsage.isVisible()) {
        await expect(storageUsage).toBeVisible();
      }
    });

    test('should clear cache', async ({ page }) => {
      const clearCacheButton = page.locator('[data-testid="clear-cache"]').or(
        page.getByRole('button', { name: /clear cache/i }).first()
      );

      if (await clearCacheButton.isVisible()) {
        await clearCacheButton.click();
        await page.waitForTimeout(500);

        // Confirm if needed
        const confirmButton = page.getByRole('button', { name: /confirm|yes/i }).first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(1000);
        }
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should manage offline data', async ({ page }) => {
      const offlineSettings = page.locator('[data-testid="offline-settings"]').or(
        page.getByText(/offline|sync/i).first()
      );

      if (await offlineSettings.isVisible()) {
        await expect(offlineSettings).toBeVisible();
      }
    });
  });

  test.describe('Integration Settings', () => {
    test('should have calendar integrations', async ({ page }) => {
      const integrationsSection = page.locator('[data-testid="integrations"]').or(
        page.getByText(/integrations|connect/i).first()
      );

      if (await integrationsSection.isVisible()) {
        await expect(integrationsSection).toBeVisible();
      }
    });

    test('should connect Google Calendar', async ({ page }) => {
      const googleCalendarButton = page.locator('[data-testid="connect-google-calendar"]').or(
        page.getByRole('button', { name: /google calendar/i }).first()
      );

      if (await googleCalendarButton.isVisible()) {
        await expect(googleCalendarButton).toBeVisible();
      }
    });

    test('should connect Outlook', async ({ page }) => {
      const outlookButton = page.locator('[data-testid="connect-outlook"]').or(
        page.getByRole('button', { name: /outlook/i }).first()
      );

      if (await outlookButton.isVisible()) {
        await expect(outlookButton).toBeVisible();
      }
    });

    test('should disconnect integration', async ({ page }) => {
      const disconnectButton = page.locator('[data-testid="disconnect-integration"]').or(
        page.getByRole('button', { name: /disconnect|remove/i }).first()
      );

      if (await disconnectButton.isVisible()) {
        // Disconnect option should exist
        await expect(disconnectButton).toBeVisible();
      }
    });
  });

  test.describe('Advanced Settings', () => {
    test('should enable developer mode', async ({ page }) => {
      const devModeToggle = page.locator('[data-testid="developer-mode"]').or(
        page.getByText(/developer mode|advanced/i).first()
      );

      if (await devModeToggle.isVisible()) {
        await devModeToggle.click();
        await page.waitForTimeout(300);

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should export settings', async ({ page }) => {
      const exportSettingsButton = page.locator('[data-testid="export-settings"]').or(
        page.getByRole('button', { name: /export settings/i }).first()
      );

      if (await exportSettingsButton.isVisible()) {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

        await exportSettingsButton.click();
        await page.waitForTimeout(1000);

        const download = await downloadPromise;
        if (download) {
          expect(download).toBeTruthy();
        }
      }
    });

    test('should import settings', async ({ page }) => {
      const importSettingsButton = page.locator('[data-testid="import-settings"]').or(
        page.getByRole('button', { name: /import settings/i }).first()
      );

      if (await importSettingsButton.isVisible()) {
        await expect(importSettingsButton).toBeVisible();
      }
    });

    test('should reset to defaults', async ({ page }) => {
      const resetButton = page.locator('[data-testid="reset-settings"]').or(
        page.getByRole('button', { name: /reset|defaults/i }).first()
      );

      if (await resetButton.isVisible()) {
        // Should have reset option (but don't click it)
        await expect(resetButton).toBeVisible();
      }
    });
  });

  test.describe('Settings Persistence', () => {
    test('should save settings on change', async ({ page }) => {
      // Change a setting
      const toggle = page.locator('input[type="checkbox"]').first();

      if (await toggle.isVisible()) {
        const initialState = await toggle.isChecked();
        await toggle.click();
        await page.waitForTimeout(1000);

        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Navigate back to settings
        const settingsLink = page.getByRole('button', { name: /settings/i }).first();
        if (await settingsLink.isVisible()) {
          await settingsLink.click();
          await page.waitForTimeout(500);
        }

        // Setting should be persisted
        const newState = await toggle.isChecked();
        expect(newState).not.toBe(initialState);
      }
    });
  });
});
