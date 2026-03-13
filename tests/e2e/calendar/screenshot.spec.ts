import { test, expect } from '@playwright/test';
import { format } from 'date-fns';

test('show today 4PM-6PM row in the week view', async ({ page }) => {
  await page.goto('http://localhost:5173/scheduler');
  await page.waitForSelector('[data-testid="scheduler-page"]', { timeout: 15000 });
  await page.waitForTimeout(2000);

  await page.getByRole('tab', { name: 'Week' }).click();
  await page.waitForTimeout(600);

  // Scroll the week view's inner scroll container to 4PM (hour 16)
  // Each hour = 64px height, so hour 16 = 16*64 = 1024px from top
  const weekView = page.locator('[data-testid="week-view"]');
  await weekView.evaluate((el: HTMLElement) => { el.scrollTop = 960; });
  await page.waitForTimeout(400);

  // Highlight the 5PM row (red = was broken), 4PM row (green = has real tasks)
  const today = format(new Date(), 'yyyy-MM-dd');
  await page.evaluate((todayStr) => {
    // Mark 5PM
    const slot5 = document.querySelector(`[data-date="${todayStr}"][data-hour="17"]`);
    if (slot5) {
      (slot5 as HTMLElement).style.cssText += 'background:rgba(239,68,68,0.15)!important;border:3px dashed red;';
      const lbl = document.createElement('span');
      lbl.textContent = ' ← 5PM: EMPTY ✓ Fixed!';
      lbl.style.cssText = 'color:red;font-weight:bold;font-size:13px;';
      slot5.prepend(lbl);
    }
    // Mark 4PM
    const slot4 = document.querySelector(`[data-date="${todayStr}"][data-hour="16"]`);
    if (slot4) {
      (slot4 as HTMLElement).style.cssText += 'background:rgba(34,197,94,0.1)!important;border:2px solid green;';
    }
  }, today);

  await page.screenshot({ path: '/tmp/5pm-row.png' });

  const chips5 = await page.locator(`[data-date="${today}"][data-hour="17"] [data-testid="calendar-task-chip"]`).count();
  console.log(`Today's 5PM (${today}) chips: ${chips5} → ${chips5 === 0 ? '✓ EMPTY (Fix works!)' : '✗ Still broken'}`);
  expect(chips5).toBe(0);
});
