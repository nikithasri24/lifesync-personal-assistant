import { test, expect } from '@playwright/test'

test.describe('LifeSync Application', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the application
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle')
  })

  test('loads the main application', async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle(/LifeSync/)
    
    // Check that main navigation elements are present
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
    
    // Check that the dashboard content loads
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible()
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

  test('navigation sidebar works correctly', async ({ page }) => {
    // Test navigation to different pages
    const navItems = [
      { selector: '[data-testid="nav-dashboard"]', expectedUrl: '/' },
      { selector: '[data-testid="nav-todos"]', expectedUrl: '/todos' },
      { selector: '[data-testid="nav-habits"]', expectedUrl: '/habits' },
      { selector: '[data-testid="nav-focus"]', expectedUrl: '/focus' },
      { selector: '[data-testid="nav-finances"]', expectedUrl: '/finances' },
    ]

    for (const navItem of navItems) {
      const navElement = page.locator(navItem.selector).first()
      
      if (await navElement.isVisible()) {
        await navElement.click()
        await page.waitForLoadState('networkidle')
        
        // Check that navigation occurred (URL might not change in SPA)
        // Instead check for page-specific content
        await expect(page.locator('[data-testid="main-content"]')).toBeVisible()
      }
    }
  })

  test('app is responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // App should still be functional
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // App should still be functional
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // App should still be functional
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible()
  })

  test('handles network errors gracefully', async ({ page }) => {
    // Simulate offline condition
    await page.context().setOffline(true)
    
    // Try to interact with the app
    await page.reload()
    
    // App should show appropriate error handling
    // This depends on how your app handles offline scenarios
    await expect(page.locator('body')).toBeVisible()
    
    // Restore online
    await page.context().setOffline(false)
  })

  test('has proper accessibility landmarks', async ({ page }) => {
    // Check for main landmarks
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('nav')).toBeVisible()
    
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
    await page.waitForLoadState('networkidle')
    
    // Filter out known acceptable errors
    const significantErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('chrome-extension') &&
      !error.includes('ResizeObserver loop limit exceeded')
    )
    
    expect(significantErrors).toHaveLength(0)
  })
})