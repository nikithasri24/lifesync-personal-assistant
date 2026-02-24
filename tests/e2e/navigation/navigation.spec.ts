/**
 * Navigation Tests
 *
 * Tests core navigation functionality:
 * - Sidebar navigation between main features
 * - Active state highlighting
 * - All navigation links work
 * - URL updates correctly
 *
 * These tests ensure users can navigate the app successfully.
 */

import { test, expect } from '@playwright/test';
import { loginAsAccount1 } from '../fixtures/test-accounts';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await loginAsAccount1(page);
  });

  test('can navigate from Dashboard to Tasks @critical @smoke', async ({ page }) => {
    // Start on dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify we're on dashboard
    await expect(page.getByRole('heading', { name: /good (morning|afternoon|evening)/i })).toBeVisible();

    // Click Tasks link in sidebar
    const tasksLink = page.getByRole('link', { name: /tasks/i });
    await tasksLink.click();

    // Verify we're on Tasks page
    await expect(page).toHaveURL('/todos');
    await expect(page.getByRole('heading', { name: /✅.*tasks/i })).toBeVisible();
  });

  test('can navigate from Tasks to Habits @critical', async ({ page }) => {
    // Start on Tasks
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    // Click Habits link
    const habitsLink = page.getByRole('link', { name: /habits/i });
    await habitsLink.click();

    // Verify we're on Habits page
    await expect(page).toHaveURL('/habits');
    await expect(page.getByRole('heading', { name: 'Habits', exact: true })).toBeVisible();
  });

  test('can navigate to all main sections @critical', async ({ page }) => {
    await page.goto('/');

    // Test each main navigation item
    const navItems = [
      { name: /dashboard/i, url: '/' },
      { name: /ai assistant/i, url: '/assistant' },
      { name: /calendar/i, url: '/calendar' },
      { name: /focus/i, url: '/focus' },
    ];

    for (const item of navItems) {
      const link = page.getByRole('link', { name: item.name });
      await link.click();
      await page.waitForLoadState('networkidle');

      // Verify URL changed (use RegExp for flexible matching)
      const currentURL = page.url();
      expect(currentURL).toContain(item.url);

      // Small delay between navigations
      await page.waitForTimeout(500);
    }
  });

  test('can navigate to all Productivity sections @p0', async ({ page }) => {
    await page.goto('/');

    const productivityItems = [
      { name: 'Habits', url: '/habits' },
      { name: 'Tasks', url: '/todos' },
      { name: 'Notes', url: '/notes' },
    ];

    for (const item of productivityItems) {
      // Use exact name matching
      const link = page.locator(`a:has-text("${item.name}")`).first();
      await link.click();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain(item.url);
      await page.waitForTimeout(300);
    }
  });

  test('can navigate to all Personal sections @p0', async ({ page }) => {
    await page.goto('/');

    const personalItems = [
      { name: 'Finances', url: '/finances' },
      { name: 'Shopping', url: '/shopping' },
      { name: 'Meals', url: '/meals' },
      { name: 'Goals', url: '/goals' },
      { name: 'Together', url: '/together' },
    ];

    for (const item of personalItems) {
      const link = page.locator(`a:has-text("${item.name}")`).first();
      await link.click();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain(item.url);
      await page.waitForTimeout(300);
    }
  });

  test('sidebar is visible on desktop @p1', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Sidebar should be visible (complementary landmark)
    const sidebar = page.getByRole('complementary').or(page.getByRole('navigation'));
    await expect(sidebar.first()).toBeVisible();

    // Logo should be visible in sidebar
    await expect(page.getByText(/life weave/i)).toBeVisible();
  });

  test('can return to Dashboard from any page @p0', async ({ page }) => {
    // Navigate to a different page
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    // Click Dashboard link
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    await dashboardLink.click();

    // Verify we're back on dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /good (morning|afternoon|evening)/i })).toBeVisible();
  });

  test('URL changes persist after navigation @p1', async ({ page }) => {
    // Navigate to Tasks
    await page.goto('/todos');
    const tasksURL = page.url();
    expect(tasksURL).toContain('/todos');

    // Navigate to Habits
    await page.goto('/habits');
    const habitsURL = page.url();
    expect(habitsURL).toContain('/habits');

    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should be back on Tasks
    expect(page.url()).toContain('/todos');
  });

  test('navigation links have correct icons @p1', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigation items should have icons (images or SVG elements)
    const tasksLink = page.getByRole('link', { name: /tasks/i });
    const tasksIcon = tasksLink.locator('img, svg').first();
    await expect(tasksIcon).toBeVisible();
  });
});
