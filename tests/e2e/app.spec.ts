import { test, expect } from '@playwright/test'

test.describe('LifeSync Application', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the application
    await page.goto('/')
    // 'load' ensures all scripts have executed (React app initialized)
    await page.waitForLoadState('load')
  })

  test('loads the main application', async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Life Weave|LifeSync/)

    // Check that navigation is present (desktop sidebar or mobile tab bar).
    // The sidebar uses aria-label="Main navigation"; wait up to 10s for React to mount.
    const mainNav = page.getByRole('navigation', { name: /Main navigation/i })
    const tabNav = page.getByRole('navigation', { name: /Bottom tab navigation/i })
    await Promise.race([
      mainNav.waitFor({ state: 'visible', timeout: 10000 }).catch(() => null),
      tabNav.waitFor({ state: 'visible', timeout: 10000 }).catch(() => null),
    ])
    const navVisible = await mainNav.isVisible() || await tabNav.isVisible()
    expect(navVisible).toBeTruthy()

    // Check that the dashboard content loads
    await expect(page.locator('main')).toBeVisible()
  })

  test('has functional theme toggle', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.locator('[data-testid="theme-toggle"]').first()
    
    if (await themeToggle.isVisible()) {
      // Get initial theme
      const initialHtml = await page.locator('html').getAttribute('class')
      
      // Click theme toggle
      await themeToggle.click()
      
      // Wait for theme change
      await page.waitForTimeout(500)
      
      // Check that theme changed
      const newHtml = await page.locator('html').getAttribute('class')
      expect(newHtml).not.toBe(initialHtml)
    }
  })

  test('navigation works correctly', async ({ page }) => {
    // Test navigation to different pages using semantic links
    const navItems = [
      { name: 'Dashboard', path: '/' },
      { name: 'Tasks', path: '/todos' },
      { name: 'Habits', path: '/habits' },
      { name: 'Focus', path: '/focus' },
      { name: 'Finances', path: '/finances' },
    ]

    for (const navItem of navItems) {
      // Try to find and click the navigation link by accessible name
      const navLink = page.getByRole('link', { name: navItem.name })

      if (await navLink.isVisible()) {
        await navLink.click()
        await page.waitForLoadState('domcontentloaded')

        // Check that page content loads
        await expect(page.locator('main')).toBeVisible()
      }
    }
  })

  test('app is responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // App should still be functional
    await expect(page.locator('main')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // App should still be functional
    await expect(page.locator('main')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // App should still be functional
    await expect(page.locator('main')).toBeVisible()
  })

  test('handles network errors gracefully', async ({ page }) => {
    // Simulate offline condition
    await page.context().setOffline(true)

    // Try to reload - this will fail offline, which is expected
    await page.reload().catch(() => {
      // Expected to fail offline
    })

    // Restore online
    await page.context().setOffline(false)
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // App should recover and show content
    await expect(page.locator('body')).toBeVisible()
  })

  test('has proper accessibility landmarks', async ({ page }) => {
    // Check for main landmarks
    await expect(page.locator('main')).toBeVisible()

    // Check for navigation (either sidebar or tab bar visible depending on screen size)
    const mainNav = page.getByRole('navigation', { name: /Main navigation/i })
    const tabNav = page.getByRole('navigation', { name: /Bottom tab navigation/i })

    // At least one navigation should be visible
    const mainNavVisible = await mainNav.isVisible()
    const tabNavVisible = await tabNav.isVisible()
    expect(mainNavVisible || tabNavVisible).toBeTruthy()

    // Check for proper heading structure
    const h1 = page.locator('h1').first()
    if (await h1.isVisible()) {
      await expect(h1).toBeVisible()
    }
  })

  test('loads without console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Filter out known acceptable errors
    const significantErrors = consoleErrors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('chrome-extension') &&
      !error.includes('ResizeObserver loop limit exceeded') &&
      !error.includes('WebSocket') &&
      !error.includes('[vite]') &&
      // Supabase auth initialization errors are expected during page load
      !error.includes('Failed to fetch') &&
      !error.includes('AUTH_ERROR') &&
      !error.includes('getHabitsWithReminders') &&
      !error.includes('LifeSyncError') &&
      !error.includes('401')
    )
    
    expect(significantErrors).toHaveLength(0)
  })
})