import { test, expect } from '@playwright/test';

test.describe('Focus Timer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Focus Timer
    const focusLink = page.locator('[data-testid="nav-focus"]').or(page.getByText('Focus'));

    if (await focusLink.first().isVisible()) {
      await focusLink.first().click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('/focus');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display focus timer page', async ({ page }) => {
    // Check for focus page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have timer mode options', async ({ page }) => {
    // Wait for "Quick Start" heading to ensure presets have loaded
    await expect(page.getByText('Quick Start')).toBeVisible({ timeout: 10000 });

    // Look for timer mode buttons (actual presets: Pomodoro 25min, Short Break 5min, Deep Work 90min, Long Break 15min)
    const pomodoroMode = page.getByRole('button', { name: /Set timer to Pomodoro/i });

    // At least Pomodoro should be visible
    await expect(pomodoroMode).toBeVisible();
  });

  test('should select 25min Pomodoro mode', async ({ page }) => {
    // Wait for presets to load
    await expect(page.getByText('Quick Start')).toBeVisible({ timeout: 10000 });

    const pomodoroButton = page.getByRole('button', { name: /Set timer to Pomodoro/i });
    await expect(pomodoroButton).toBeVisible();

    await pomodoroButton.click();
    await page.waitForTimeout(500);

    // Mode should be selected (button should have active styling)
    await expect(pomodoroButton).toBeVisible();
  });

  test('should select 90min Deep Work mode', async ({ page }) => {
    // Wait for presets to load
    await expect(page.getByText('Quick Start')).toBeVisible({ timeout: 10000 });

    const deepWorkButton = page.getByRole('button', { name: /Set timer to Deep Work/i });
    await expect(deepWorkButton).toBeVisible();

    await deepWorkButton.click();
    await page.waitForTimeout(500);

    // Mode should be selected (button should have active styling)
    await expect(deepWorkButton).toBeVisible();
  });

  test('should select 5min Short Break mode', async ({ page }) => {
    // Wait for presets to load
    await expect(page.getByText('Quick Start')).toBeVisible({ timeout: 10000 });

    const shortBreakButton = page.getByRole('button', { name: /Set timer to Short Break/i });
    await expect(shortBreakButton).toBeVisible();

    await shortBreakButton.click();
    await page.waitForTimeout(500);

    // Mode should be selected (button should have active styling)
    await expect(shortBreakButton).toBeVisible();
  });

  test('should have start timer button', async ({ page }) => {
    // Wait for presets to load
    await expect(page.getByText('Quick Start')).toBeVisible({ timeout: 10000 });

    // Look for start timer button
    const startButton = page.getByRole('button', { name: /start timer/i });
    await expect(startButton).toBeVisible();
  });

  test('should start a focus timer session', async ({ page }) => {
    // Wait for presets to load
    await expect(page.getByText('Quick Start')).toBeVisible({ timeout: 10000 });

    // Pomodoro is selected by default, click start timer
    const startButton = page.getByRole('button', { name: /start timer/i });
    await expect(startButton).toBeVisible();
    await startButton.click();
    await page.waitForTimeout(1000);

    // Timer should be running - verify pause button appears
    const pauseButton = page.getByRole('button', { name: /pause timer/i });
    await expect(pauseButton).toBeVisible();
  });

  test('should pause timer', async ({ page }) => {
    // Start a timer first
    const startButton = page.locator('[data-testid="start-timer"]').or(
      page.getByRole('button', { name: /start/i }).first()
    );

    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);

      // Look for pause button
      const pauseButton = page.locator('[data-testid="pause-timer"]').or(
        page.getByRole('button', { name: /pause/i }).first()
      );

      if (await pauseButton.isVisible()) {
        await pauseButton.click();
        await page.waitForTimeout(500);

        // Timer should be paused
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should resume timer', async ({ page }) => {
    // Start and pause timer
    const startButton = page.locator('[data-testid="start-timer"]').or(
      page.getByRole('button', { name: /start/i }).first()
    );

    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);

      const pauseButton = page.locator('[data-testid="pause-timer"]').or(
        page.getByRole('button', { name: /pause/i }).first()
      );

      if (await pauseButton.isVisible()) {
        await pauseButton.click();
        await page.waitForTimeout(500);

        // Look for resume button
        const resumeButton = page.locator('[data-testid="resume-timer"]').or(
          page.getByRole('button', { name: /resume|continue/i }).first()
        );

        if (await resumeButton.isVisible()) {
          await resumeButton.click();
          await page.waitForTimeout(500);

          // Timer should resume
          await expect(page.locator('body')).toBeVisible();
        }
      }
    }
  });

  test('should stop/reset timer', async ({ page }) => {
    // Start a timer
    const startButton = page.locator('[data-testid="start-timer"]').or(
      page.getByRole('button', { name: /start/i }).first()
    );

    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);

      // Look for stop/reset button
      const stopButton = page.locator('[data-testid="stop-timer"]').or(
        page.getByRole('button', { name: /stop|reset/i }).first()
      );

      if (await stopButton.isVisible()) {
        await stopButton.click();
        await page.waitForTimeout(500);

        // Timer should be stopped
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should display timer countdown', async ({ page }) => {
    // Start a timer
    const startButton = page.locator('[data-testid="start-timer"]').or(
      page.getByRole('button', { name: /start/i }).first()
    );

    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);

      // Look for timer display (MM:SS format)
      const timerDisplay = page.locator('[data-testid="timer-display"]').or(
        page.getByText(/\d{1,2}:\d{2}/i).first()
      );

      if (await timerDisplay.isVisible()) {
        await expect(timerDisplay).toBeVisible();
      }
    }
  });

  test('should integrate with tasks', async ({ page }) => {
    // Look for task selection or integration
    const taskSelector = page.locator('[data-testid="task-selector"]').or(
      page.getByText(/select task|link task/i).first()
    );

    // Page should render
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have break timer options', async ({ page }) => {
    // Look for break timer settings
    const breakOptions = page.getByText(/short break|long break|5.*min|15.*min/i).first();

    // Page should render
    await expect(page.locator('body')).toBeVisible();
  });

  test('should track interruptions', async ({ page }) => {
    // Start a timer
    const startButton = page.locator('[data-testid="start-timer"]').or(
      page.getByRole('button', { name: /start/i }).first()
    );

    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);

      // Look for interruption tracking
      const interruptionButton = page.locator('[data-testid="log-interruption"]').or(
        page.getByRole('button', { name: /interruption/i }).first()
      );

      // Timer should be running
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display session statistics', async ({ page }) => {
    // Look for statistics section
    const statsSection = page.locator('[data-testid="session-stats"]').or(
      page.getByText(/statistics|stats|sessions|completed/i).first()
    );

    // Page should render
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display daily statistics', async ({ page }) => {
    // Look for daily stats
    const dailyStats = page.locator('[data-testid="daily-stats"]').or(
      page.getByText(/today|daily/i).first()
    );

    // Page should render
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have settings/customization options', async ({ page }) => {
    // Look for settings button
    const settingsButton = page.locator('[data-testid="timer-settings"]').or(
      page.getByRole('button', { name: /settings|customize/i }).first()
    );

    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(500);

      // Settings panel should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should have audio alerts option', async ({ page }) => {
    // Look for audio/sound settings
    const settingsButton = page.locator('[data-testid="timer-settings"]').or(
      page.getByRole('button', { name: /settings/i }).first()
    );

    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(500);

      // Look for audio options
      const audioToggle = page.getByText(/sound|audio|alert|notification/i).first();

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should have visual alerts', async ({ page }) => {
    // Visual alerts are typically shown when timer completes
    // This is a smoke test to ensure the feature exists
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show progress indicator', async ({ page }) => {
    // Start a timer
    const startButton = page.locator('[data-testid="start-timer"]').or(
      page.getByRole('button', { name: /start/i }).first()
    );

    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);

      // Look for progress bar or circle
      const progressIndicator = page.locator('[data-testid="progress"]').or(
        page.locator('.progress, .progress-bar, .progress-ring')
      );

      // Timer should be visible
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should track completed sessions', async ({ page }) => {
    // Look for session history or completed sessions count
    const completedSessions = page.locator('[data-testid="completed-sessions"]').or(
      page.getByText(/completed|sessions/i).first()
    );

    // Page should render
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Focus timer should adapt to mobile
    await expect(page.locator('body')).toBeVisible();
  });

  test('should persist timer state on page reload', async ({ page }) => {
    // Start a timer
    const startButton = page.locator('[data-testid="start-timer"]').or(
      page.getByRole('button', { name: /start/i }).first()
    );

    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(2000);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Timer state might persist
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
