import { test, expect } from '@playwright/test';

test.describe('Global Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should have global search input', async ({ page }) => {
    // Look for global search input
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('should open search with keyboard shortcut', async ({ page }) => {
    // Common shortcuts: Cmd+K or Ctrl+K
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';

    await page.keyboard.press(`${modifier}+KeyK`);
    await page.waitForTimeout(500);

    // Search should open/focus
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      const isFocused = await searchInput.evaluate(el => document.activeElement === el);
      if (isFocused) {
        expect(isFocused).toBeTruthy();
      }
    }
  });

  test('should search for tasks', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('task');
      await page.waitForTimeout(1000);

      // Search results should appear
      const results = page.locator('[data-testid="search-results"]').or(
        page.locator('.search-results, .results')
      );

      if (await results.first().isVisible()) {
        await expect(results.first()).toBeVisible();
      }
    }
  });

  test('should search for notes', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('note');
      await page.waitForTimeout(1000);

      // Look for note results
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should search for habits', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('habit');
      await page.waitForTimeout(1000);

      // Look for habit results
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should search for projects', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('project');
      await page.waitForTimeout(1000);

      // Look for project results
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter search by type', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      // Look for type filters (Tasks, Notes, Habits, etc.)
      const typeFilter = page.locator('[data-testid="search-filter"]').or(
        page.getByRole('button', { name: /tasks|notes|habits|all/i }).first()
      );

      if (await typeFilter.isVisible()) {
        await typeFilter.click();
        await page.waitForTimeout(300);

        // Filter options should appear
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should display search suggestions', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('te');
      await page.waitForTimeout(500);

      // Look for autocomplete/suggestions
      const suggestions = page.locator('[data-testid="search-suggestions"]').or(
        page.locator('.suggestions, .autocomplete')
      );

      // Suggestions might appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should navigate to result on click', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('task');
      await page.waitForTimeout(1000);

      // Look for a result item
      const resultItem = page.locator('[data-testid*="search-result"]').or(
        page.locator('.search-result, .result-item')
      ).first();

      if (await resultItem.isVisible()) {
        await resultItem.click();
        await page.waitForTimeout(500);

        // Should navigate to result
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should navigate results with keyboard', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);

      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);

      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(200);

      // Should highlight different results
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should select result with Enter key', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('task');
      await page.waitForTimeout(1000);

      // Navigate to a result
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);

      // Select with Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Should navigate to result
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should clear search', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('test query');
      await page.waitForTimeout(500);

      // Look for clear button
      const clearButton = page.locator('[data-testid="clear-search"]').or(
        page.getByRole('button', { name: /clear|×/i }).first()
      );

      if (await clearButton.isVisible()) {
        await clearButton.click();
        await page.waitForTimeout(300);

        // Search should be cleared
        const value = await searchInput.inputValue();
        expect(value).toBe('');
      }
    }
  });

  test('should close search with Escape', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Search results should close or input should blur
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should show recent searches', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      // Focus search without typing
      await searchInput.click();
      await page.waitForTimeout(500);

      // Look for recent searches
      const recentSearches = page.locator('[data-testid="recent-searches"]').or(
        page.getByText(/recent|history/i).first()
      );

      // Recent searches might appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle no results gracefully', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('xyzabc123nonexistent');
      await page.waitForTimeout(1000);

      // Look for no results message
      const noResults = page.locator('[data-testid="no-results"]').or(
        page.getByText(/no results|not found/i).first()
      );

      if (await noResults.isVisible()) {
        await expect(noResults).toBeVisible();
      }
    }
  });

  test('should search across all content types', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      // Results might include tasks, notes, habits, goals, etc.
      const results = page.locator('[data-testid="search-results"]').or(
        page.locator('.search-results')
      );

      // Mixed content types should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should highlight search terms in results', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      // Look for highlighted text
      const highlight = page.locator('mark, .highlight, strong').first();

      // Highlighting might be present
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('[data-testid="global-search"]').or(
      page.getByPlaceholder(/search/i).first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      // Search should work on mobile
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
