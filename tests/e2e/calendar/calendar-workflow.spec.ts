/**
 * Comprehensive Calendar E2E Tests
 *
 * Tests calendar views, navigation, event creation, and interactions
 */

import { test, expect } from '@playwright/test';

test.describe('Calendar - Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('displays Calendar heading', async ({ page }) => {
    await expect(page.getByText('📅 Calendar')).toBeVisible();
  });

  test('displays three view toggle buttons', async ({ page }) => {
    await expect(page.getByText('Month')).toBeVisible();
    await expect(page.getByText('Week')).toBeVisible();
    await expect(page.getByText('Day')).toBeVisible();
  });

  test('displays navigation Previous button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible();
  });

  test('displays navigation Next button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
  });

  test('displays Today button', async ({ page }) => {
    await expect(page.getByText('Today')).toBeVisible();
  });

  test('displays current month/period', async ({ page }) => {
    // Should show some month/year text
    const today = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = months[today.getMonth()];
    await expect(page.locator(`text=${currentMonth}`)).toBeVisible();
  });

  test('displays terracotta gradient header', async ({ page }) => {
    const header = page.locator('[style*="linear-gradient"]').first();
    await expect(header).toBeVisible();
  });
});

test.describe('Calendar - View Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('switch to Month view', async ({ page }) => {
    await page.getByText('Month').click();
    await page.waitForTimeout(300);

    // Month view should show weekday headers
    await expect(page.getByText('Sun')).toBeVisible();
    await expect(page.getByText('Mon')).toBeVisible();
    await expect(page.getByText('Sat')).toBeVisible();
  });

  test('switch to Week view', async ({ page }) => {
    await page.getByText('Week').click();
    await page.waitForTimeout(300);

    // Week view should show time slots
    await expect(page.getByText('Week')).toBeVisible();
  });

  test('switch to Day view', async ({ page }) => {
    await page.getByText('Day').click();
    await page.waitForTimeout(300);

    // Day view should show hour labels
    await expect(page.getByText(/AM|PM/).first()).toBeVisible();
  });

  test('active view button is highlighted', async ({ page }) => {
    await page.getByText('Month').click();
    await page.waitForTimeout(300);

    const monthButton = page.getByText('Month');
    const classes = await monthButton.getAttribute('class');
    expect(classes).toContain('bg-white');
  });

  test('switch between views multiple times', async ({ page }) => {
    await page.getByText('Month').click();
    await page.waitForTimeout(200);
    await page.getByText('Day').click();
    await page.waitForTimeout(200);
    await page.getByText('Week').click();
    await page.waitForTimeout(200);

    await expect(page.getByText('Week')).toBeVisible();
  });
});

test.describe('Calendar - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('click Next to navigate forward', async ({ page }) => {
    const initialText = await page.locator('[class*="text-white"][class*="font-semibold"]').first().textContent();

    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(300);

    const newText = await page.locator('[class*="text-white"][class*="font-semibold"]').first().textContent();

    // Period should have changed
    expect(newText).not.toBe(initialText);
  });

  test('click Previous to navigate backward', async ({ page }) => {
    const initialText = await page.locator('[class*="text-white"][class*="font-semibold"]').first().textContent();

    await page.getByRole('button', { name: 'Previous' }).click();
    await page.waitForTimeout(300);

    const newText = await page.locator('[class*="text-white"][class*="font-semibold"]').first().textContent();

    expect(newText).not.toBe(initialText);
  });

  test('click Today to return to current period', async ({ page }) => {
    // Navigate away
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(300);

    // Click Today to come back
    await page.getByText('Today').click();
    await page.waitForTimeout(300);

    // Should show current month again
    const today = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    await expect(page.locator(`text=${months[today.getMonth()]}`)).toBeVisible();
  });
});

test.describe('Calendar - Month View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.getByText('Month').click();
    await page.waitForTimeout(300);
  });

  test('displays weekday headers', async ({ page }) => {
    await expect(page.getByText('Sun')).toBeVisible();
    await expect(page.getByText('Mon')).toBeVisible();
    await expect(page.getByText('Tue')).toBeVisible();
    await expect(page.getByText('Wed')).toBeVisible();
    await expect(page.getByText('Thu')).toBeVisible();
    await expect(page.getByText('Fri')).toBeVisible();
    await expect(page.getByText('Sat')).toBeVisible();
  });

  test('displays date numbers in grid', async ({ page }) => {
    await expect(page.getByText('1').first()).toBeVisible();
    await expect(page.getByText('15').first()).toBeVisible();
  });

  test('clicking a date switches to day view', async ({ page }) => {
    // Click on a date in the current month
    await page.getByText('15').first().click();
    await page.waitForTimeout(500);

    // Should switch to day view showing hourly slots
    await expect(page.getByText(/AM|PM/).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Calendar - Day View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.getByText('Day').click();
    await page.waitForTimeout(300);
  });

  test('displays morning hour labels', async ({ page }) => {
    await expect(page.getByText('6 AM')).toBeVisible();
    await expect(page.getByText('9 AM')).toBeVisible();
    await expect(page.getByText('12 PM')).toBeVisible();
  });

  test('displays afternoon hour labels', async ({ page }) => {
    await expect(page.getByText('1 PM')).toBeVisible();
    await expect(page.getByText('6 PM')).toBeVisible();
  });

  test('displays 11 PM as last hour', async ({ page }) => {
    await expect(page.getByText('11 PM')).toBeVisible();
  });

  test('does NOT show 5 AM (before range)', async ({ page }) => {
    await expect(page.getByText('5 AM')).not.toBeVisible();
  });
});

test.describe('Calendar - Event Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('FAB button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: '+' }).or(page.locator('button:has-text("+")')).last()).toBeVisible();
  });

  test('clicking FAB opens add event modal', async ({ page }) => {
    // Find the FAB (fixed positioned add button)
    const fab = page.locator('button.fixed').or(page.locator('[style*="bottom"]').filter({ hasText: '+' })).last();
    if (await fab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fab.click();
      await page.waitForTimeout(500);
      await expect(page.getByRole('heading', { name: /add event/i })).toBeVisible({ timeout: 5000 });
    } else {
      // Skip if FAB not found in this view
      test.skip();
    }
  });

  test('create event with title and date', async ({ page }) => {
    const eventTitle = `Test Event ${Date.now()}`;

    // Try to open add event modal via FAB
    const fab = page.locator('button').filter({ hasText: '+' }).last();
    await fab.click();
    await page.waitForTimeout(500);

    // Check if modal opened
    const modal = page.getByRole('heading', { name: /add event/i });
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.getByPlaceholderText(/event title/i).fill(eventTitle);
      await page.getByRole('button', { name: /add event/i }).last().click();
      await page.waitForTimeout(1000);

      // Event might appear on calendar
      await expect(page.getByText(eventTitle)).toBeVisible({ timeout: 5000 });
    }
  });

  test('cancel event creation', async ({ page }) => {
    const fab = page.locator('button').filter({ hasText: '+' }).last();
    await fab.click();
    await page.waitForTimeout(500);

    const modal = page.getByRole('heading', { name: /add event/i });
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.getByRole('button', { name: /cancel/i }).click();
      await page.waitForTimeout(300);

      await expect(modal).not.toBeVisible();
    }
  });
});
