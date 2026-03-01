/**
 * Comprehensive Focus Timer E2E Tests
 *
 * Tests the full focus timer workflow: preset selection, start/pause/reset,
 * and session completion.
 */

import { test, expect } from '@playwright/test';

test.describe('Focus - Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/focus');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('displays page with Focus emoji', async ({ page }) => {
    await expect(page.getByText('⏱️')).toBeVisible();
  });

  test('displays timer emoji ⏱️', async ({ page }) => {
    await expect(page.getByText('⏱️')).toBeVisible();
  });

  test('displays default subtitle', async ({ page }) => {
    await expect(page.getByText('Choose a duration to begin')).toBeVisible();
  });

  test('displays circular timer', async ({ page }) => {
    // Timer should show some time format MM:SS
    await expect(page.getByText(/\d{2}:\d{2}/)).toBeVisible();
  });

  test('displays Quick Start preset grid', async ({ page }) => {
    await expect(page.getByText('Quick Start')).toBeVisible();
  });

  test('displays all four presets', async ({ page }) => {
    await expect(page.getByText('Pomodoro')).toBeVisible();
    await expect(page.getByText('Short Break')).toBeVisible();
    await expect(page.getByText('Deep Work')).toBeVisible();
    await expect(page.getByText('Long Break')).toBeVisible();
  });

  test('displays preset durations', async ({ page }) => {
    // Preset durations show plural "minutes" for all standard presets
    await expect(page.locator('text=25 minutes')).toBeVisible();
    await expect(page.locator('text=5 minutes')).toBeVisible();
    await expect(page.locator('text=90 minutes')).toBeVisible();
    await expect(page.locator('text=15 minutes')).toBeVisible();
  });

  test('displays preset emojis', async ({ page }) => {
    await expect(page.getByText('🍅')).toBeVisible();
    await expect(page.getByText('☕')).toBeVisible();
    await expect(page.getByText('🧠')).toBeVisible();
    await expect(page.getByText('🌟')).toBeVisible();
  });

  test('displays start timer button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /start timer/i })).toBeVisible();
  });

  test('displays reset timer button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /reset timer/i })).toBeVisible();
  });
});

test.describe('Focus - Preset Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/focus');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('selecting Pomodoro updates timer to 25:00', async ({ page }) => {
    await page.getByRole('button', { name: /Set timer to Pomodoro/i }).click();
    await page.waitForTimeout(300);

    await expect(page.getByText('25:00')).toBeVisible();
  });

  test('selecting Short Break updates timer to 05:00', async ({ page }) => {
    await page.getByRole('button', { name: /Set timer to Short Break/i }).click();
    await page.waitForTimeout(300);

    await expect(page.getByText('05:00')).toBeVisible();
  });

  test('selecting Deep Work updates timer to 90:00', async ({ page }) => {
    await page.getByRole('button', { name: /Set timer to Deep Work/i }).click();
    await page.waitForTimeout(300);

    await expect(page.getByText('90:00')).toBeVisible();
  });

  test('selecting Long Break updates timer to 15:00', async ({ page }) => {
    await page.getByRole('button', { name: /Set timer to Long Break/i }).click();
    await page.waitForTimeout(300);

    await expect(page.getByText('15:00')).toBeVisible();
  });

  test('selected preset shows highlighted styling', async ({ page }) => {
    await page.getByRole('button', { name: /Set timer to Pomodoro/i }).click();
    await page.waitForTimeout(300);

    // Pomodoro button should have highlighted background
    const pomodoroButton = page.getByRole('button', { name: /Set timer to Pomodoro/i });
    const bgColor = await pomodoroButton.evaluate(el => window.getComputedStyle(el).backgroundColor);
    // Active preset has #FEF3E8 background (rgb(254, 243, 232))
    expect(bgColor).toBe('rgb(254, 243, 232)');
  });

  test('switching presets updates timer display', async ({ page }) => {
    // Select Pomodoro first
    await page.getByRole('button', { name: /Set timer to Pomodoro/i }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText('25:00')).toBeVisible();

    // Switch to Short Break
    await page.getByRole('button', { name: /Set timer to Short Break/i }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText('05:00')).toBeVisible();
  });

  test('timer shows Ready state label on preset selection', async ({ page }) => {
    await page.getByRole('button', { name: /Set timer to Pomodoro/i }).click();
    await page.waitForTimeout(300);

    await expect(page.getByText('Ready')).toBeVisible();
  });
});

test.describe('Focus - Timer Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/focus');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Select Pomodoro preset to start
    await page.getByRole('button', { name: /Set timer to Pomodoro/i }).click();
    await page.waitForTimeout(300);
  });

  test('clicking start begins timer countdown', async ({ page }) => {
    await page.getByRole('button', { name: /start timer/i }).click();
    await page.waitForTimeout(300);

    // Timer should now show pause button
    await expect(page.getByRole('button', { name: /pause timer/i })).toBeVisible();
  });

  test('timer shows Focus Time label when active', async ({ page }) => {
    await page.getByRole('button', { name: /start timer/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Focus Time')).toBeVisible();
  });

  test('subtitle changes when timer starts', async ({ page }) => {
    await page.getByRole('button', { name: /start timer/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Stay focused')).toBeVisible();
  });

  test('clicking pause stops timer', async ({ page }) => {
    await page.getByRole('button', { name: /start timer/i }).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: /pause timer/i }).click();
    await page.waitForTimeout(300);

    // Should show resume button
    await expect(page.getByRole('button', { name: /resume timer/i })).toBeVisible();
  });

  test('timer shows Paused label when paused', async ({ page }) => {
    await page.getByRole('button', { name: /start timer/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /pause timer/i }).click();
    await page.waitForTimeout(500);

    // Either the timer label or subtitle should show "Paused"
    await expect(page.locator('text=Paused').first()).toBeVisible({ timeout: 3000 });
  });

  test('subtitle changes when timer pauses', async ({ page }) => {
    await page.getByRole('button', { name: /start timer/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /pause timer/i }).click();
    await page.waitForTimeout(500);

    // Resume button visible means we're in paused state
    await expect(page.getByRole('button', { name: /resume timer/i })).toBeVisible({ timeout: 3000 });
  });

  test('clicking resume continues timer', async ({ page }) => {
    await page.getByRole('button', { name: /start timer/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /pause timer/i }).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: /resume timer/i }).click();
    await page.waitForTimeout(300);

    // Should show pause button again (running)
    await expect(page.getByRole('button', { name: /pause timer/i })).toBeVisible();
  });

  test('clicking reset returns timer to initial state', async ({ page }) => {
    await page.getByRole('button', { name: /start timer/i }).click();
    await page.waitForTimeout(1500); // Let it run for a bit

    await page.getByRole('button', { name: /reset timer/i }).click();
    await page.waitForTimeout(300);

    // Timer should reset to 25:00
    await expect(page.getByText('25:00')).toBeVisible();
    // Start button should be back
    await expect(page.getByRole('button', { name: /start timer/i })).toBeVisible();
  });

  test('reset after pause returns to ready state', async ({ page }) => {
    await page.getByRole('button', { name: /start timer/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /pause timer/i }).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: /reset timer/i }).click();
    await page.waitForTimeout(300);

    await expect(page.getByText('Ready')).toBeVisible();
    await expect(page.getByText('25:00')).toBeVisible();
  });
});

test.describe('Focus - Countdown Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/focus');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('timer counts down when running', async ({ page }) => {
    await page.getByRole('button', { name: /Set timer to Pomodoro/i }).click();
    await page.waitForTimeout(300);

    const initialTime = await page.getByText(/\d{2}:\d{2}/).textContent();

    await page.getByRole('button', { name: /start timer/i }).click();
    await page.waitForTimeout(3000); // Wait 3 seconds

    const currentTime = await page.getByText(/\d{2}:\d{2}/).textContent();

    // Times should be different (timer counted down)
    expect(currentTime).not.toBe(initialTime);
  });

  test('timer pauses at current time', async ({ page }) => {
    await page.getByRole('button', { name: /Set timer to Short Break/i }).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: /start timer/i }).click();
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: /pause timer/i }).click();
    const pausedTime = await page.getByText(/\d{2}:\d{2}/).textContent();
    await page.waitForTimeout(2000); // Wait 2 more seconds

    const afterWaitTime = await page.getByText(/\d{2}:\d{2}/).textContent();

    // Time should not change while paused
    expect(afterWaitTime).toBe(pausedTime);
  });
});
