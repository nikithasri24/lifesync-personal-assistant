/**
 * Navigation Helpers
 *
 * Helper functions for navigating the app consistently across tests.
 */

import { Page, expect } from '@playwright/test';

/**
 * Navigate to a page and wait for it to load
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate via sidebar menu
 */
export async function navigateViaSidebar(
  page: Page,
  menuItemName: string
): Promise<void> {
  const menuItem = page
    .locator('[data-testid="sidebar"]')
    .getByRole('link', { name: new RegExp(menuItemName, 'i') });
  await menuItem.click();
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to specific feature pages
 */
export const goTo = {
  dashboard: (page: Page) => navigateTo(page, '/'),
  tasks: (page: Page) => navigateTo(page, '/todos'),
  habits: (page: Page) => navigateTo(page, '/habits'),
  notes: (page: Page) => navigateTo(page, '/notes'),
  journal: (page: Page) => navigateTo(page, '/journal'),
  goals: (page: Page) => navigateTo(page, '/life-goals'),
  shopping: (page: Page) => navigateTo(page, '/shopping-smart'),
  meals: (page: Page) => navigateTo(page, '/meals'),
  calendar: (page: Page) => navigateTo(page, '/calendar'),
  together: (page: Page) => navigateTo(page, '/together'),
  finance: (page: Page) => navigateTo(page, '/finances'),
  travel: (page: Page) => navigateTo(page, '/travel'),
  selfcare: (page: Page) => navigateTo(page, '/skincare'),
  focus: (page: Page) => navigateTo(page, '/focus'),
  assistant: (page: Page) => navigateTo(page, '/assistant'),
};

/**
 * Verify current page
 */
export async function verifyCurrentPage(
  page: Page,
  path: string,
  pageTitle?: string
): Promise<void> {
  await expect(page).toHaveURL(path);

  if (pageTitle) {
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toContainText(pageTitle);
  }
}

/**
 * Go back using browser back button
 */
export async function goBack(page: Page): Promise<void> {
  await page.goBack();
  await page.waitForLoadState('networkidle');
}

/**
 * Verify active navigation item
 */
export async function verifyActiveNavItem(
  page: Page,
  itemName: string
): Promise<void> {
  const activeItem = page
    .locator('[data-testid="sidebar"]')
    .locator('[class*="bg-terracotta"], [class*="text-terracotta"]')
    .getByText(new RegExp(itemName, 'i'));

  await expect(activeItem).toBeVisible();
}
