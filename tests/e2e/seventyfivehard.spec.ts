import { test, expect } from '@playwright/test'

test.describe('75 Hard tab (UI removals)', () => {
  test('loads without "This Week" and "Challenge History"', async ({ page }) => {
    await page.goto('/')

    // Open 75 Hard tab from sidebar
    await page.getByRole('button', { name: '75 Hard' }).click({ trial: true }).catch(async () => {
      const maybeNav = page.getByText('75 Hard', { exact: true })
      if (await maybeNav.count()) await maybeNav.first().click()
    })

    // Header present
    await expect(page.getByRole('heading', { name: /75 Hard Challenge/i })).toBeVisible()

    // Ensure removed sections are not visible
    await expect(page.getByText('This Week').first()).toHaveCount(0)
    await expect(page.getByText('Challenge History').first()).toHaveCount(0)
  })

  test('start challenge and toggle rule segments, then pause', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '75 Hard' }).click({ trial: true }).catch(async () => {
      const maybeNav = page.getByText('75 Hard', { exact: true })
      if (await maybeNav.count()) await maybeNav.first().click()
    })

    // If no active challenge, start one
    const startHeaderBtn = page.getByRole('button', { name: /^Start Challenge$/ })
    if (await startHeaderBtn.isVisible().catch(() => false)) {
      await startHeaderBtn.click()
      await page.getByPlaceholder('My 75 Hard Challenge').fill('E2E Challenge')
      // Click the modal submit (scoped by form attribute)
      await page.locator('button[form="challenge-form"]', { hasText: 'Start Challenge' }).click()
    }

    // Ensure active challenge header is visible
    await expect(page.getByRole('heading', { name: /Active Challenge/i })).toBeVisible()

    // Toggle a simple rule (first toggle button in Today list)
    const todayHeading = page.getByRole('heading', { name: /Today - Day/i })
    await expect(todayHeading).toBeVisible()
    const firstRuleToggle = page.locator('div:has(h4:has-text("Follow a Diet")) button').first()
    await firstRuleToggle.click()

    // Toggle multi-segment rule if present (Workout 1/2)
    const seg1 = page.getByRole('button', { name: /Workout 1/i })
    const seg2 = page.getByRole('button', { name: /Workout 2/i })
    if (await seg1.count()) {
      await seg1.click()
      await seg2.click()
      // After a toggle, segment buttons should reflect a selected state
      await expect(seg1).toHaveAttribute('class', /bg-green-500|border-green-500/)
      await expect(seg2).toHaveAttribute('class', /bg-green-500|border-green-500/)
    }

    // Pause challenge and verify we can start again
    await page.getByRole('button', { name: /^Pause$/ }).click()
    await expect(page.getByRole('button', { name: /^Start Challenge$/ })).toBeVisible()
  })
})
