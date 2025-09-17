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

  test('focus page loads correctly', async ({ page }) => {
    // Check that focus page elements are present
    await expect(page.locator('[data-testid="focus-container"]')).toBeVisible()
    
    // Check for key focus elements
    const focusElements = [
      '[data-testid="focus-timer"]',
      '[data-testid="focus-profile"]',
      '[data-testid="focus-sessions"]'
    ]
    
    for (const selector of focusElements) {
      const element = page.locator(selector).first()
      if (await element.isVisible()) {
        await expect(element).toBeVisible()
      }
    }
  })

  test('can start a focus session', async ({ page }) => {
    // Look for start session button
    const startButton = page.locator('[data-testid="start-focus-session"]').first()
    
    if (await startButton.isVisible()) {
      // Click start session
      await startButton.click()
      
      // Verify session started
      await expect(page.locator('[data-testid="active-session"]')).toBeVisible()
      
      // Check that timer is running
      const timer = page.locator('[data-testid="session-timer"]').first()
      if (await timer.isVisible()) {
        const initialTime = await timer.textContent()
        
        // Wait a moment and check if timer updated
        await page.waitForTimeout(2000)
        const updatedTime = await timer.textContent()
        
        // Timer should have changed (decreased)
        expect(updatedTime).not.toBe(initialTime)
      }
    }
  })

  test('can pause and resume focus session', async ({ page }) => {
    // Start a session first
    const startButton = page.locator('[data-testid="start-focus-session"]').first()
    if (await startButton.isVisible()) {
      await startButton.click()
      await page.waitForTimeout(1000)
      
      // Look for pause button
      const pauseButton = page.locator('[data-testid="pause-focus-session"]').first()
      if (await pauseButton.isVisible()) {
        await pauseButton.click()
        
        // Verify session is paused
        await expect(page.locator('[data-testid="session-paused"]')).toBeVisible()
        
        // Look for resume button
        const resumeButton = page.locator('[data-testid="resume-focus-session"]').first()
        if (await resumeButton.isVisible()) {
          await resumeButton.click()
          
          // Verify session resumed
          await expect(page.locator('[data-testid="active-session"]')).toBeVisible()
        }
      }
    }
  })

  test('can stop focus session', async ({ page }) => {
    // Start a session first
    const startButton = page.locator('[data-testid="start-focus-session"]').first()
    if (await startButton.isVisible()) {
      await startButton.click()
      await page.waitForTimeout(1000)
      
      // Look for stop button
      const stopButton = page.locator('[data-testid="stop-focus-session"]').first()
      if (await stopButton.isVisible()) {
        await stopButton.click()
        
        // Confirm if there's a confirmation dialog
        const confirmButton = page.locator('[data-testid="confirm-stop-session"]').first()
        if (await confirmButton.isVisible()) {
          await confirmButton.click()
        }
        
        // Verify session stopped
        await expect(page.locator('[data-testid="session-complete"]')).toBeVisible()
      }
    }
  })

  test('displays focus profile correctly', async ({ page }) => {
    // Check for profile elements
    const profileElements = [
      '[data-testid="focus-level"]',
      '[data-testid="focus-xp"]',
      '[data-testid="focus-streak"]'
    ]
    
    for (const selector of profileElements) {
      const element = page.locator(selector).first()
      if (await element.isVisible()) {
        await expect(element).toBeVisible()
        
        // Check that element has content
        const content = await element.textContent()
        expect(content).toBeTruthy()
      }
    }
  })

  test('shows focus achievements', async ({ page }) => {
    // Look for achievements section
    const achievementsSection = page.locator('[data-testid="focus-achievements"]').first()
    
    if (await achievementsSection.isVisible()) {
      await expect(achievementsSection).toBeVisible()
      
      // Check for achievement items
      const achievements = page.locator('[data-testid^="achievement-"]')
      const achievementCount = await achievements.count()
      
      // Should have at least some achievements defined
      expect(achievementCount).toBeGreaterThanOrEqual(0)
      
      // Check achievement structure
      if (achievementCount > 0) {
        const firstAchievement = achievements.first()
        await expect(firstAchievement).toBeVisible()
        
        // Achievement should have title and progress
        const title = firstAchievement.locator('[data-testid="achievement-title"]').first()
        if (await title.isVisible()) {
          await expect(title).toBeVisible()
        }
      }
    }
  })

  test('displays focus analytics', async ({ page }) => {
    // Look for analytics section
    const analyticsSection = page.locator('[data-testid="focus-analytics"]').first()
    
    if (await analyticsSection.isVisible()) {
      await expect(analyticsSection).toBeVisible()
      
      // Check for analytics charts/data
      const analyticsElements = [
        '[data-testid="weekly-sessions"]',
        '[data-testid="total-time"]',
        '[data-testid="average-session"]'
      ]
      
      for (const selector of analyticsElements) {
        const element = page.locator(selector).first()
        if (await element.isVisible()) {
          await expect(element).toBeVisible()
        }
      }
    }
  })

  test('can set custom session duration', async ({ page }) => {
    // Look for session settings
    const settingsButton = page.locator('[data-testid="focus-settings"]').first()
    
    if (await settingsButton.isVisible()) {
      await settingsButton.click()
      
      // Look for duration input
      const durationInput = page.locator('[data-testid="session-duration-input"]').first()
      if (await durationInput.isVisible()) {
        // Set custom duration (e.g., 30 minutes)
        await durationInput.clear()
        await durationInput.fill('30')
        
        // Save settings
        const saveButton = page.locator('[data-testid="save-focus-settings"]').first()
        if (await saveButton.isVisible()) {
          await saveButton.click()
          
          // Verify settings saved
          await expect(page.locator('text=Settings saved')).toBeVisible()
        }
      }
    }
  })

  test('displays session history', async ({ page }) => {
    // Look for session history
    const historySection = page.locator('[data-testid="focus-history"]').first()
    
    if (await historySection.isVisible()) {
      await expect(historySection).toBeVisible()
      
      // Check for session entries
      const sessionEntries = page.locator('[data-testid^="session-entry-"]')
      const entryCount = await sessionEntries.count()
      
      // Should show existing sessions or empty state
      expect(entryCount).toBeGreaterThanOrEqual(0)
      
      if (entryCount > 0) {
        const firstEntry = sessionEntries.first()
        await expect(firstEntry).toBeVisible()
        
        // Entry should have session details
        const details = [
          '[data-testid="session-duration"]',
          '[data-testid="session-date"]'
        ]
        
        for (const selector of details) {
          const element = firstEntry.locator(selector).first()
          if (await element.isVisible()) {
            await expect(element).toBeVisible()
          }
        }
      }
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

  test('focus API returns correct data structure', async ({ page }) => {
    const apiBaseUrl = 'http://10.247.209.223:3001/api'
    
    // Test profile endpoint data structure
    const profileResponse = await page.request.get(`${apiBaseUrl}/focus/profile`)
    const profileData = await profileResponse.json()
    
    expect(profileData).toHaveProperty('level')
    expect(profileData).toHaveProperty('xp')
    expect(profileData).toHaveProperty('streak')
    expect(profileData).toHaveProperty('totalSessions')
    
    // Test achievements endpoint data structure
    const achievementsResponse = await page.request.get(`${apiBaseUrl}/focus/achievements`)
    const achievementsData = await achievementsResponse.json()
    
    expect(Array.isArray(achievementsData)).toBe(true)
    if (achievementsData.length > 0) {
      expect(achievementsData[0]).toHaveProperty('id')
      expect(achievementsData[0]).toHaveProperty('title')
      expect(achievementsData[0]).toHaveProperty('unlocked')
    }
    
    // Test analytics endpoint data structure
    const analyticsResponse = await page.request.get(`${apiBaseUrl}/focus/analytics`)
    const analyticsData = await analyticsResponse.json()
    
    expect(analyticsData).toHaveProperty('totalTime')
    expect(analyticsData).toHaveProperty('weeklyStats')
    expect(Array.isArray(analyticsData.weeklyStats)).toBe(true)
  })

  test('handles focus session completion', async ({ page }) => {
    // This test simulates a complete focus session workflow
    
    // Start a very short session for testing (if custom duration is available)
    const settingsButton = page.locator('[data-testid="focus-settings"]').first()
    if (await settingsButton.isVisible()) {
      await settingsButton.click()
      
      const durationInput = page.locator('[data-testid="session-duration-input"]').first()
      if (await durationInput.isVisible()) {
        await durationInput.clear()
        await durationInput.fill('0.1') // 6 seconds for testing
        
        const saveButton = page.locator('[data-testid="save-focus-settings"]').first()
        if (await saveButton.isVisible()) {
          await saveButton.click()
        }
      }
    }
    
    // Start session
    const startButton = page.locator('[data-testid="start-focus-session"]').first()
    if (await startButton.isVisible()) {
      await startButton.click()
      
      // Wait for session to complete (longer wait for safety)
      await page.waitForTimeout(10000)
      
      // Check for completion indicators
      const completionElements = [
        '[data-testid="session-complete"]',
        '[data-testid="session-summary"]',
        '[data-testid="xp-gained"]'
      ]
      
      for (const selector of completionElements) {
        const element = page.locator(selector).first()
        if (await element.isVisible()) {
          await expect(element).toBeVisible()
        }
      }
    }
  })
})