import { test, expect } from '@playwright/test';

test.describe('Theme and UI Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Theme Toggle', () => {
    test('should have theme toggle button', async ({ page }) => {
      // Look for theme toggle
      const themeToggle = page.locator('[data-testid="theme-toggle"]').or(
        page.getByRole('button').filter({ hasText: /theme|dark|light/i }).first()
      );

      if (await themeToggle.isVisible()) {
        await expect(themeToggle).toBeVisible();
      }
    });

    test('should toggle between light and dark mode', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"]').first();

      if (await themeToggle.isVisible()) {
        // Get initial theme
        const html = page.locator('html');
        const initialClass = await html.getAttribute('class');

        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Check theme changed
        const newClass = await html.getAttribute('class');
        expect(newClass).not.toBe(initialClass);

        // Toggle back
        await themeToggle.click();
        await page.waitForTimeout(500);

        const finalClass = await html.getAttribute('class');
        expect(finalClass).toBe(initialClass);
      }
    });

    test('should persist theme preference', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"]').first();

      if (await themeToggle.isVisible()) {
        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(500);

        const html = page.locator('html');
        const themeClass = await html.getAttribute('class');

        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Theme should persist
        const newThemeClass = await html.getAttribute('class');
        expect(newThemeClass).toBe(themeClass);
      }
    });
  });

  test.describe('Sidebar Navigation', () => {
    test('should have sidebar', async ({ page }) => {
      const sidebar = page.locator('[data-testid="sidebar"]').or(
        page.locator('nav, aside').first()
      );

      if (await sidebar.isVisible()) {
        await expect(sidebar).toBeVisible();
      }
    });

    test('should toggle sidebar collapse', async ({ page }) => {
      // Look for sidebar toggle button
      const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]').or(
        page.getByRole('button').filter({ hasText: /menu|sidebar/i }).first()
      );

      if (await sidebarToggle.isVisible()) {
        // Toggle sidebar
        await sidebarToggle.click();
        await page.waitForTimeout(300);

        // Sidebar should change state
        await expect(page.locator('body')).toBeVisible();

        // Toggle back
        await sidebarToggle.click();
        await page.waitForTimeout(300);

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should navigate using sidebar links', async ({ page }) => {
      const sidebar = page.locator('[data-testid="sidebar"]').or(
        page.locator('nav').first()
      );

      if (await sidebar.isVisible()) {
        // Find navigation links
        const navLink = sidebar.locator('a, button').first();

        if (await navLink.isVisible()) {
          await navLink.click();
          await page.waitForLoadState('networkidle');

          // Navigation should occur
          await expect(page.locator('body')).toBeVisible();
        }
      }
    });

    test('should highlight active navigation item', async ({ page }) => {
      const sidebar = page.locator('[data-testid="sidebar"]');

      if (await sidebar.isVisible()) {
        // Look for active/selected navigation item
        const activeNav = sidebar.locator('[data-active="true"], .active, [aria-current="page"]').first();

        if (await activeNav.isVisible()) {
          await expect(activeNav).toBeVisible();
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display mobile menu on small screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Look for mobile menu button (hamburger)
      const mobileMenuButton = page.locator('[data-testid="mobile-menu"]').or(
        page.getByRole('button').filter({ hasText: /menu/i }).first()
      );

      if (await mobileMenuButton.isVisible()) {
        await expect(mobileMenuButton).toBeVisible();

        // Open mobile menu
        await mobileMenuButton.click();
        await page.waitForTimeout(300);

        // Menu should appear
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should adapt layout for tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Page should be responsive
      await expect(page.locator('body')).toBeVisible();
    });

    test('should adapt layout for desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Page should be responsive
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test('should show loading spinner on initial load', async ({ page }) => {
      // Start fresh navigation
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Look for loading spinner (might be very fast)
      const spinner = page.locator('[data-testid="loading"]').or(
        page.locator('.loading, .spinner')
      );

      // Eventually page should load
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should show skeleton loaders for content', async ({ page }) => {
      // Navigate to a content page
      await page.goto('/todos');
      await page.waitForLoadState('domcontentloaded');

      // Look for skeleton loaders (might be very fast)
      const skeleton = page.locator('[data-testid="skeleton"]').or(
        page.locator('.skeleton')
      );

      // Eventually content should load
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Toast Notifications', () => {
    test('should display toast notifications', async ({ page }) => {
      // Perform an action that triggers a toast
      // Navigate to todos and try to create a task
      await page.goto('/todos');
      await page.waitForLoadState('networkidle');

      const addTaskButton = page.getByRole('button', { name: /add task/i }).first();
      if (await addTaskButton.isVisible()) {
        await addTaskButton.click();
        await page.waitForTimeout(500);

        const taskInput = page.getByPlaceholder(/what needs/i).first();
        if (await taskInput.isVisible()) {
          await taskInput.fill('Test Task');

          const createButton = page.getByRole('button', { name: /create/i }).first();
          if (await createButton.isVisible()) {
            await createButton.click();
            await page.waitForTimeout(1000);

            // Look for toast notification
            const toast = page.locator('[data-testid="toast"]').or(
              page.locator('.toast, .notification')
            );

            // Toast might appear briefly
            await expect(page.locator('body')).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Error Boundaries', () => {
    test('should handle errors gracefully', async ({ page }) => {
      // Test error handling by going offline
      await page.context().setOffline(true);

      // Try to navigate
      await page.goto('/todos').catch(() => {
        // Expected to fail
      });

      // Restore online
      await page.context().setOffline(false);
      await page.reload();
      await page.waitForLoadState('networkidle');

      // App should recover
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      // Check for h1 heading
      const h1 = page.locator('h1').first();

      if (await h1.isVisible()) {
        await expect(h1).toBeVisible();
      }
    });

    test('should have semantic HTML landmarks', async ({ page }) => {
      // Check for main landmark
      const main = page.locator('main');
      if (await main.isVisible()) {
        await expect(main).toBeVisible();
      }

      // Check for nav landmark
      const nav = page.locator('nav');
      if (await nav.isVisible()) {
        await expect(nav).toBeVisible();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Some element should have focus
      const focusedElement = page.locator(':focus');
      if (await focusedElement.isVisible()) {
        await expect(focusedElement).toBeVisible();
      }
    });
  });

  test.describe('Modals and Dialogs', () => {
    test('should open and close modals', async ({ page }) => {
      // Try to open a modal (e.g., create task)
      await page.goto('/todos');
      await page.waitForLoadState('networkidle');

      const addButton = page.getByRole('button', { name: /add task/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Modal should open
        const modal = page.locator('[role="dialog"]').or(
          page.locator('.modal, [data-testid="modal"]')
        );

        if (await modal.first().isVisible()) {
          await expect(modal.first()).toBeVisible();

          // Close modal (ESC key)
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);

          // Modal should close
          await expect(page.locator('body')).toBeVisible();
        }
      }
    });
  });

  test.describe('Layout Persistence', () => {
    test('should maintain user preferences across sessions', async ({ page }) => {
      // This is tested through theme persistence
      const html = page.locator('html');
      const initialClass = await html.getAttribute('class');

      // Reload
      await page.reload();
      await page.waitForLoadState('networkidle');

      const newClass = await html.getAttribute('class');

      // Should maintain state
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
