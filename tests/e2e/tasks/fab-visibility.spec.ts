/**
 * Tasks Page FAB Visibility Tests
 *
 * QA Issue #2: FAB button positioned outside viewport
 * Source: QA-ISSUES-FOUND.md
 *
 * The Floating Action Button should be visible and clickable
 * in the bottom-right corner of the viewport at all times.
 */

import { test, expect } from '@playwright/test';
import { loginAsAccount1 } from '../fixtures/test-accounts';

test.describe('Tasks Page FAB Visibility', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to Tasks page
    await loginAsAccount1(page);
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');
  });

  test('FAB is visible in viewport @critical @bug-qa-2', async ({ page }) => {
    // Find the FAB button
    // Based on QA report, it might be labeled "Add Task" or have a plus icon
    const fab = page.getByRole('button', { name: /add task|create task|\+/i }).first();

    // FAB should be visible without scrolling
    await expect(fab).toBeVisible();

    // FAB should be in viewport (not offscreen)
    await expect(fab).toBeInViewport();
  });

  test('FAB is clickable without JavaScript workarounds @critical @bug-qa-2', async ({ page }) => {
    const fab = page.getByRole('button', { name: /add task|create task|\+/i }).first();

    // Should be able to click normally (not with force or JavaScript)
    await fab.click();

    // Modal should open
    const modalHeading = page.getByRole('heading', { name: /add.*task|create.*task|new task/i });
    await expect(modalHeading).toBeVisible();
  });

  test('FAB remains visible when scrolling @p0', async ({ page }) => {
    const fab = page.getByRole('button', { name: /add task|create task|\+/i }).first();

    // Scroll down the page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // FAB should still be visible (fixed positioning)
    await expect(fab).toBeVisible();
    await expect(fab).toBeInViewport();

    // Scroll up
    await page.evaluate(() => window.scrollTo(0, 0));

    // FAB should still be visible
    await expect(fab).toBeVisible();
    await expect(fab).toBeInViewport();
  });

  test('FAB is positioned in bottom area and within viewport @p1', async ({ page }) => {
    const fab = page.getByRole('button', { name: /add task/i }).first();

    // Get computed styles
    const box = await fab.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      const viewport = page.viewportSize();
      if (viewport) {
        // FAB should be in bottom area (within 200px of bottom to account for bottom nav)
        expect(box.y + box.height).toBeGreaterThan(viewport.height - 200);

        // FAB should be completely within viewport bounds (not cut off)
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);

        // FAB should be visible (has positive dimensions)
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }
    }
  });

  test('FAB opens task creation modal @critical', async ({ page }) => {
    const fab = page.getByRole('button', { name: /add task/i }).first();

    // Click FAB
    await fab.click();

    // Modal should open - "Quick Add Task"
    const modalHeading = page.getByRole('heading', { name: 'Add New Task' });
    await expect(modalHeading).toBeVisible();

    // Should have task input field
    const taskInput = page.getByRole('textbox', { name: /what needs to be done/i });
    await expect(taskInput).toBeVisible();

    // Should have Cancel and Add Task buttons in the modal
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await expect(cancelButton).toBeVisible();

    // There should be a submit button (the golden terracotta one)
    // Use getByText to find the visible "Add Task" text within the modal
    const submitButton = page.getByText('Add Task', { exact: true });
    await expect(submitButton).toBeVisible();
  });

  test('FAB has proper z-index layering @p1', async ({ page }) => {
    const fab = page.getByRole('button', { name: /add task|create task|\+/i }).first();

    // Get z-index from computed styles
    const zIndex = await fab.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    // FAB should have z-index of at least 40 (above content, below modals)
    const zIndexNum = parseInt(zIndex, 10);
    expect(zIndexNum).toBeGreaterThanOrEqual(40);
  });
});
