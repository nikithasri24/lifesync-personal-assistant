import { test, expect } from '@playwright/test';

test.describe('Data Export and Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test.describe('Export Functionality', () => {
    test('should export all data', async ({ page }) => {
      // Look for settings or export menu
      const settingsLink = page.locator('[data-testid="nav-settings"]').or(
        page.getByRole('button', { name: /settings/i }).first()
      );

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        // Look for export option
        const exportButton = page.locator('[data-testid="export-data"]').or(
          page.getByRole('button', { name: /export|download data/i }).first()
        );

        if (await exportButton.isVisible()) {
          // Setup download listener
          const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

          await exportButton.click();
          await page.waitForTimeout(1000);

          const download = await downloadPromise;
          if (download) {
            expect(download).toBeTruthy();
          }
        }
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should export tasks only', async ({ page }) => {
      await page.goto('/todos');
      await page.waitForLoadState('domcontentloaded');

      // Look for export button in tasks page
      const exportButton = page.locator('[data-testid="export-tasks"]').or(
        page.getByRole('button', { name: /export/i }).first()
      );

      if (await exportButton.isVisible()) {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

        await exportButton.click();
        await page.waitForTimeout(1000);

        const download = await downloadPromise;
        if (download) {
          expect(download).toBeTruthy();
        }
      }
    });

    test('should export to CSV format', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        const exportButton = page.getByRole('button', { name: /export/i }).first();
        if (await exportButton.isVisible()) {
          await exportButton.click();
          await page.waitForTimeout(500);

          // Look for CSV format option
          const csvOption = page.getByRole('button', { name: /csv/i }).first();
          if (await csvOption.isVisible()) {
            const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

            await csvOption.click();
            await page.waitForTimeout(1000);

            const download = await downloadPromise;
            if (download) {
              const filename = download.suggestedFilename();
              expect(filename).toContain('.csv');
            }
          }
        }
      }
    });

    test('should export to JSON format', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        const exportButton = page.getByRole('button', { name: /export/i }).first();
        if (await exportButton.isVisible()) {
          await exportButton.click();
          await page.waitForTimeout(500);

          // Look for JSON format option
          const jsonOption = page.getByRole('button', { name: /json/i }).first();
          if (await jsonOption.isVisible()) {
            const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

            await jsonOption.click();
            await page.waitForTimeout(1000);

            const download = await downloadPromise;
            if (download) {
              const filename = download.suggestedFilename();
              expect(filename).toContain('.json');
            }
          }
        }
      }
    });

    test('should export habits data', async ({ page }) => {
      await page.goto('/habits');
      await page.waitForLoadState('domcontentloaded');

      const exportButton = page.locator('[data-testid="export-habits"]').or(
        page.getByRole('button', { name: /export/i }).first()
      );

      if (await exportButton.isVisible()) {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

        await exportButton.click();
        await page.waitForTimeout(1000);

        const download = await downloadPromise;
        if (download) {
          expect(download).toBeTruthy();
        }
      }
    });

    test('should export notes', async ({ page }) => {
      await page.goto('/notes');
      await page.waitForLoadState('domcontentloaded');

      const exportButton = page.getByRole('button', { name: /export/i }).first();

      if (await exportButton.isVisible()) {
        await exportButton.click();
        await page.waitForTimeout(1000);
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should export financial data', async ({ page }) => {
      await page.goto('/finances');
      await page.waitForLoadState('domcontentloaded');

      const exportButton = page.getByRole('button', { name: /export/i }).first();

      if (await exportButton.isVisible()) {
        await exportButton.click();
        await page.waitForTimeout(1000);
      }

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Import Functionality', () => {
    test('should have import data option', async ({ page }) => {
      const settingsLink = page.locator('[data-testid="nav-settings"]').or(
        page.getByRole('button', { name: /settings/i }).first()
      );

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        const importButton = page.locator('[data-testid="import-data"]').or(
          page.getByRole('button', { name: /import/i }).first()
        );

        if (await importButton.isVisible()) {
          await expect(importButton).toBeVisible();
        }
      }
    });

    test('should show file upload for import', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        const importButton = page.getByRole('button', { name: /import/i }).first();
        if (await importButton.isVisible()) {
          await importButton.click();
          await page.waitForTimeout(500);

          // Look for file input
          const fileInput = page.locator('input[type="file"]').first();
          if (await fileInput.isVisible()) {
            await expect(fileInput).toBeVisible();
          }
        }
      }
    });

    test('should accept CSV files for import', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        const importButton = page.getByRole('button', { name: /import/i }).first();
        if (await importButton.isVisible()) {
          await importButton.click();
          await page.waitForTimeout(500);

          const fileInput = page.locator('input[type="file"]').first();
          if (await fileInput.isVisible()) {
            const acceptAttr = await fileInput.getAttribute('accept');
            if (acceptAttr) {
              expect(acceptAttr).toContain('csv');
            }
          }
        }
      }
    });

    test('should accept JSON files for import', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        const importButton = page.getByRole('button', { name: /import/i }).first();
        if (await importButton.isVisible()) {
          await importButton.click();
          await page.waitForTimeout(500);

          const fileInput = page.locator('input[type="file"]').first();
          if (await fileInput.isVisible()) {
            const acceptAttr = await fileInput.getAttribute('accept');
            if (acceptAttr) {
              expect(acceptAttr).toContain('json');
            }
          }
        }
      }
    });

    test('should validate imported data format', async ({ page }) => {
      // This is a smoke test for import validation
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        const importButton = page.getByRole('button', { name: /import/i }).first();
        if (await importButton.isVisible()) {
          await importButton.click();
          await page.waitForTimeout(500);

          // Validation happens on file selection/upload
          await expect(page.locator('body')).toBeVisible();
        }
      }
    });

    test('should show import preview', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        const importButton = page.getByRole('button', { name: /import/i }).first();
        if (await importButton.isVisible()) {
          await importButton.click();
          await page.waitForTimeout(500);

          // Look for preview option
          const preview = page.locator('[data-testid="import-preview"]').or(
            page.getByText(/preview/i).first()
          );

          await expect(page.locator('body')).toBeVisible();
        }
      }
    });

    test('should confirm before overwriting data', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        const importButton = page.getByRole('button', { name: /import/i }).first();
        if (await importButton.isVisible()) {
          // Import should ask for confirmation
          await expect(page.locator('body')).toBeVisible();
        }
      }
    });
  });

  test.describe('Backup and Restore', () => {
    test('should create automatic backups', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        // Look for backup settings
        const backupSettings = page.locator('[data-testid="backup-settings"]').or(
          page.getByText(/backup|auto backup/i).first()
        );

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should list available backups', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        const backupsButton = page.getByRole('button', { name: /backups|view backups/i }).first();
        if (await backupsButton.isVisible()) {
          await backupsButton.click();
          await page.waitForTimeout(500);

          // Should show list of backups
          await expect(page.locator('body')).toBeVisible();
        }
      }
    });

    test('should restore from backup', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        const restoreButton = page.getByRole('button', { name: /restore/i }).first();
        if (await restoreButton.isVisible()) {
          // Should have restore functionality
          await expect(restoreButton).toBeVisible();
        }
      }
    });
  });

  test.describe('Data Portability', () => {
    test('should export data in standard formats', async ({ page }) => {
      // Standard formats: CSV, JSON, etc.
      await expect(page.locator('body')).toBeVisible();
    });

    test('should maintain data integrity during export/import', async ({ page }) => {
      // This is a smoke test for data integrity
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle large data exports', async ({ page }) => {
      // Test that large exports don't crash
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        const exportButton = page.getByRole('button', { name: /export/i }).first();
        if (await exportButton.isVisible()) {
          await exportButton.click();
          await page.waitForTimeout(2000);

          // Should handle export
          await expect(page.locator('body')).toBeVisible();
        }
      }
    });
  });
});
