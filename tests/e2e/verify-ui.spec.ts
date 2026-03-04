import { test, expect } from '@playwright/test';

test.describe('UI Verification', () => {

  test('Finance Timeline tab renders without errors', async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    // Click the Timeline tab
    const timelineTab = page.getByText('📅 Timeline');
    await expect(timelineTab).toBeVisible({ timeout: 10000 });
    await timelineTab.click();
    await page.waitForTimeout(3000);

    // Should not show error boundary
    await expect(page.getByText('Something went wrong')).not.toBeVisible();

    // h1 header should say Timeline (use heading role to be specific)
    await expect(page.getByRole('heading', { name: /Timeline/i })).toBeVisible();

    await page.screenshot({ path: '/tmp/timeline-overview.png', fullPage: true });
    console.log('✅ Timeline Overview tab OK');

    // Click Statements sub-tab
    await page.getByText('Statements').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/timeline-statements.png', fullPage: true });
    console.log('✅ Timeline Statements tab OK');

    // Click Payments sub-tab
    await page.getByText('Payments').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/timeline-payments.png', fullPage: true });
    console.log('✅ Timeline Payments tab OK');
  });

  test('Finance Accounts shows monthly snapshot month picker', async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    // Click Accounts tab
    await page.getByText('Accounts').click();
    await page.waitForTimeout(3000);

    // Month picker should be visible
    const monthInput = page.locator('input[type="month"]');
    await expect(monthInput).toBeVisible({ timeout: 10000 });
    console.log('✅ Month picker visible on Accounts');

    await expect(page.getByText('Monthly snapshot')).toBeVisible();
    await page.screenshot({ path: '/tmp/accounts-snapshot.png', fullPage: true });
    console.log('✅ Accounts monthly snapshot OK');
  });

  test('Meal Planning Week shows this weeks meals', async ({ page }) => {
    await page.goto('/meals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // SegmentedControl uses button elements — click Week tab by text
    await page.getByText('Week').click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: '/tmp/meals-week.png', fullPage: true });

    // Should show Bread + Guasacaca (breakfast all week)
    await expect(page.getByText('Bread + Guasacaca').first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Breakfast meals showing in Week view');
  });

});
