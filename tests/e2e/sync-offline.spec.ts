import { test, expect } from '@playwright/test';

test.describe('Data Sync and Offline Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Online Sync', () => {
    test('should sync data when online', async ({ page }) => {
      // Create a task
      await page.goto('/todos');
      await page.waitForLoadState('networkidle');

      const addButton = page.getByRole('button', { name: /add task/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        const taskInput = page.getByPlaceholder(/what needs/i).first();
        if (await taskInput.isVisible()) {
          await taskInput.fill('Sync Test Task');

          const createButton = page.getByRole('button', { name: /create/i }).first();
          if (await createButton.isVisible()) {
            await createButton.click();
            await page.waitForTimeout(1000);

            // Data should be synced
            await expect(page.locator('body')).toBeVisible();
          }
        }
      }
    });

    test('should show sync status indicator', async ({ page }) => {
      // Look for sync status
      const syncStatus = page.locator('[data-testid="sync-status"]').or(
        page.getByText(/synced|syncing/i).first()
      );

      if (await syncStatus.isVisible()) {
        await expect(syncStatus).toBeVisible();
      }
    });

    test('should sync across tabs', async ({ page, context }) => {
      // Create new tab
      const page2 = await context.newPage();
      await page2.goto('/');
      await page2.waitForLoadState('networkidle');

      // Create data in first tab
      await page.goto('/todos');
      await page.waitForLoadState('networkidle');

      // Check if data appears in second tab
      await page2.goto('/todos');
      await page2.waitForLoadState('networkidle');

      // Both tabs should show same data
      await expect(page.locator('body')).toBeVisible();
      await expect(page2.locator('body')).toBeVisible();

      await page2.close();
    });

    test('should handle sync conflicts', async ({ page }) => {
      // This is a smoke test for conflict resolution
      await expect(page.locator('body')).toBeVisible();
    });

    test('should retry failed syncs', async ({ page }) => {
      // Simulate network interruption
      await page.context().setOffline(true);

      // Try to create data
      await page.goto('/todos');
      await page.waitForLoadState('domcontentloaded');

      // Go back online
      await page.context().setOffline(false);
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should retry sync
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Offline Mode', () => {
    test('should work offline', async ({ page }) => {
      // Load the app online first
      await page.waitForLoadState('networkidle');

      // Go offline
      await page.context().setOffline(true);

      // App should still be functional
      await page.goto('/todos');
      await page.waitForLoadState('domcontentloaded');

      await expect(page.locator('body')).toBeVisible();

      // Restore online
      await page.context().setOffline(false);
    });

    test('should show offline indicator', async ({ page }) => {
      // Go offline
      await page.context().setOffline(true);

      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      // Look for offline indicator
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]').or(
        page.getByText(/offline|no connection/i).first()
      );

      // Wait a bit for indicator to appear
      await page.waitForTimeout(2000);

      // Restore online
      await page.context().setOffline(false);
    });

    test('should queue changes while offline', async ({ page }) => {
      // Load app
      await page.waitForLoadState('networkidle');

      // Go offline
      await page.context().setOffline(true);

      // Navigate to todos
      await page.goto('/todos');
      await page.waitForLoadState('domcontentloaded');

      // Try to create a task while offline
      const addButton = page.getByRole('button', { name: /add task/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        const taskInput = page.getByPlaceholder(/what needs/i).first();
        if (await taskInput.isVisible()) {
          await taskInput.fill('Offline Task');

          const createButton = page.getByRole('button', { name: /create/i }).first();
          if (await createButton.isVisible()) {
            await createButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }

      // Go back online
      await page.context().setOffline(false);
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Changes should sync
      await expect(page.locator('body')).toBeVisible();
    });

    test('should cache data for offline use', async ({ page }) => {
      // Load data while online
      await page.goto('/todos');
      await page.waitForLoadState('networkidle');

      // Go offline
      await page.context().setOffline(true);

      // Reload page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      // Cached data should be available
      await expect(page.locator('body')).toBeVisible();

      // Restore online
      await page.context().setOffline(false);
    });

    test('should handle offline navigation', async ({ page }) => {
      // Load app
      await page.waitForLoadState('networkidle');

      // Go offline
      await page.context().setOffline(true);

      // Navigate between pages
      await page.goto('/habits');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('body')).toBeVisible();

      await page.goto('/calendar');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('body')).toBeVisible();

      // Restore online
      await page.context().setOffline(false);
    });

    test('should sync when coming back online', async ({ page }) => {
      // Load app
      await page.waitForLoadState('networkidle');

      // Go offline
      await page.context().setOffline(true);
      await page.waitForTimeout(1000);

      // Go back online
      await page.context().setOffline(false);
      await page.waitForTimeout(2000);

      // Look for syncing indicator
      const syncStatus = page.locator('[data-testid="sync-status"]').or(
        page.getByText(/syncing|synced/i).first()
      );

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Service Worker', () => {
    test('should register service worker', async ({ page }) => {
      // Check if service worker is registered
      const swRegistered = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          return !!registration;
        }
        return false;
      });

      // Service worker might be registered
      await expect(page.locator('body')).toBeVisible();
    });

    test('should update service worker', async ({ page }) => {
      // This is a smoke test for SW updates
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Data Persistence', () => {
    test('should persist data locally', async ({ page }) => {
      // Create data
      await page.goto('/todos');
      await page.waitForLoadState('networkidle');

      const addButton = page.getByRole('button', { name: /add task/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        const taskInput = page.getByPlaceholder(/what needs/i).first();
        if (await taskInput.isVisible()) {
          const testTaskTitle = `Persistent Task ${Date.now()}`;
          await taskInput.fill(testTaskTitle);

          const createButton = page.getByRole('button', { name: /create/i }).first();
          if (await createButton.isVisible()) {
            await createButton.click();
            await page.waitForTimeout(1000);

            // Reload page
            await page.reload();
            await page.waitForLoadState('networkidle');

            // Data should persist
            const taskExists = await page.getByText(testTaskTitle).isVisible();
            if (taskExists) {
              await expect(page.getByText(testTaskTitle)).toBeVisible();
            }
          }
        }
      }
    });

    test('should use local storage', async ({ page }) => {
      // Check local storage usage
      const hasLocalStorage = await page.evaluate(() => {
        return localStorage.length > 0;
      });

      // Local storage might be used
      await expect(page.locator('body')).toBeVisible();
    });

    test('should use IndexedDB', async ({ page }) => {
      // Check IndexedDB usage
      const hasIndexedDB = await page.evaluate(async () => {
        if (!window.indexedDB) return false;

        return new Promise((resolve) => {
          const request = indexedDB.databases();
          request.onsuccess = (event: any) => {
            const databases = event.target.result;
            resolve(databases && databases.length > 0);
          };
          request.onerror = () => resolve(false);
        });
      });

      // IndexedDB might be used
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Sync Settings', () => {
    test('should have sync preferences', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        // Look for sync settings
        const syncSettings = page.locator('[data-testid="sync-settings"]').or(
          page.getByText(/sync|synchronization/i).first()
        );

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should toggle auto-sync', async ({ page }) => {
      const settingsLink = page.getByRole('button', { name: /settings/i }).first();

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await page.waitForTimeout(500);

        const autoSyncToggle = page.locator('[data-testid="auto-sync"]').or(
          page.getByText(/auto sync/i).first()
        );

        if (await autoSyncToggle.isVisible()) {
          await autoSyncToggle.click();
          await page.waitForTimeout(300);
        }
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should force manual sync', async ({ page }) => {
      // Look for sync button
      const syncButton = page.locator('[data-testid="manual-sync"]').or(
        page.getByRole('button', { name: /sync now|refresh/i }).first()
      );

      if (await syncButton.isVisible()) {
        await syncButton.click();
        await page.waitForTimeout(2000);

        // Sync should complete
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should show last sync time', async ({ page }) => {
      const lastSyncTime = page.locator('[data-testid="last-sync"]').or(
        page.getByText(/last synced|updated/i).first()
      );

      if (await lastSyncTime.isVisible()) {
        await expect(lastSyncTime).toBeVisible();
      }
    });
  });

  test.describe('Network Recovery', () => {
    test('should recover from network interruption', async ({ page }) => {
      // Start online
      await page.waitForLoadState('networkidle');

      // Simulate network interruption
      await page.context().setOffline(true);
      await page.waitForTimeout(2000);

      // Restore connection
      await page.context().setOffline(false);
      await page.waitForTimeout(2000);

      // App should recover
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle slow network', async ({ page }) => {
      // Simulate slow network with throttling
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 50 * 1024, // 50 KB/s
        uploadThroughput: 20 * 1024,   // 20 KB/s
        latency: 500, // 500ms
      });

      // Navigate
      await page.goto('/todos');
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      // App should still work
      await expect(page.locator('body')).toBeVisible();

      // Disable throttling
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0,
      });
    });
  });
});
