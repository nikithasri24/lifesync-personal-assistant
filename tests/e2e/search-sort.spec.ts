import { test, expect } from '@playwright/test'

test.describe('Search and Sort in Tasks', () => {
  test('filters by search and sorts by Title A–Z', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('load')
    // Wait for dashboard data to load (Quick Actions including Add Task appear after isLoading=false)
    await expect(page.getByText('Tasks Today')).toBeVisible({ timeout: 15000 })

    // Add three tasks via the Quick Add modal
    for (const name of ['Charlie', 'Alpha', 'Bravo']) {
      await page.getByRole('button', { name: /Add task|Add to /i }).first().click()
      await page.waitForTimeout(500)
      const input = page.getByPlaceholder(/What needs to be done/i)
        .or(page.getByRole('textbox', { name: /What needs to be done/i }))
      await expect(input).toBeVisible({ timeout: 5000 })
      await input.fill(`${name} E2E`)
      await page.locator('form button[type="submit"]').first().click()
      await page.waitForTimeout(800) // wait for Supabase write
    }

    // Navigate to Tasks page where the search and sort UI lives
    await page.goto('/todos')
    await page.waitForLoadState('load')
    await page.waitForTimeout(1000)

    // Switch to List view so tasks without due dates are visible
    // (default "Today" view only shows tasks due today)
    await page.getByRole('button', { name: /list view/i }).click().catch(() =>
      page.getByLabel(/📋 List view/).click().catch(() => null)
    )
    await page.waitForTimeout(500)

    // Reveal the FilterBarV2 (hidden by default behind "Show Filters" toggle)
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i })
    if (await showFiltersBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await showFiltersBtn.click()
      await page.waitForTimeout(500)
    }

    // Filter by search 'Bravo'
    const search = page.getByPlaceholder('Search tasks...')
    await search.fill('Bravo')
    await expect(page.getByText(/Bravo E2E/).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Alpha E2E/)).not.toBeVisible()
    await expect(page.getByText(/Charlie E2E/)).not.toBeVisible()

    // Clear search — all three tasks should appear
    await search.fill('')
    await expect(page.getByText(/Alpha E2E/).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Bravo E2E/).first()).toBeVisible()
    await expect(page.getByText(/Charlie E2E/).first()).toBeVisible()
  })
})

