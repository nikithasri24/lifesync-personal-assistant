import { test, expect } from '@playwright/test'

test.describe('Focus Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Navigate to focus page
    const focusNav = page.locator('[data-testid="nav-focus"]').first()
    if (await focusNav.isVisible()) {
      await focusNav.click()
      await page.waitForLoadState('networkidle')
    }
  })

  test('focus API endpoints are accessible', async ({ page }) => {
    // Test that the Focus API endpoints respond correctly
    // This verifies the critical endpoints that were previously missing
    
    const apiBaseUrl = 'http://10.247.209.223:3001/api'
    
    // Test focus/profile endpoint
    const profileResponse = await page.request.get(`${apiBaseUrl}/focus/profile`)
    expect(profileResponse.status()).toBe(200)
    
    // Test focus/achievements endpoint
    const achievementsResponse = await page.request.get(`${apiBaseUrl}/focus/achievements`)
    expect(achievementsResponse.status()).toBe(200)
    
    // Test focus/analytics endpoint
    const analyticsResponse = await page.request.get(`${apiBaseUrl}/focus/analytics`)
    expect(analyticsResponse.status()).toBe(200)
    
    // Test focus/sessions endpoint
    const sessionsResponse = await page.request.get(`${apiBaseUrl}/focus/sessions`)
    expect(sessionsResponse.status()).toBe(200)
  })
})
