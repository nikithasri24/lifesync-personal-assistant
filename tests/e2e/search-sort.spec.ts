import { test, expect } from '@playwright/test'

test.describe('Search and Sort in Tasks', () => {
  test('filters by search and sorts by Title A–Z', async ({ page }) => {
    await page.goto('/')

    // Add three tasks
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    for (const name of ['Charlie', 'Alpha', 'Bravo']) {
      await addBtn.click()
      await page.getByRole('textbox', { name: /What needs to be done\?/i })
        .or(page.getByPlaceholder(/What needs to be done\?/i))
        .fill(`${name} E2E`)
      await page.locator('form button[type="submit"]').click()
    }

    // Filter by search 'Bravo'
    const search = page.getByPlaceholder('Search tasks...')
    await search.fill('Bravo')
    await expect(page.getByText(/Bravo E2E/).first()).toBeVisible()
    await expect(page.getByText(/Alpha E2E/).first()).toHaveCount(0)
    await expect(page.getByText(/Charlie E2E/).first()).toHaveCount(0)

    // Clear search and sort by Title A–Z
    await search.fill('')
    const sortSelect = page.locator('select').first()
    await sortSelect.selectOption('title-asc')

    // Verify vertical order: Alpha < Bravo < Charlie
    const a = page.getByText('Alpha E2E').first()
    const b = page.getByText('Bravo E2E').first()
    const c = page.getByText('Charlie E2E').first()
    const top = async (loc: any) => loc.evaluate((el: any) => el.getBoundingClientRect().top)

    const ta = await top(a)
    const tb = await top(b)
    const tc = await top(c)
    expect(ta).toBeLessThan(tb)
    expect(tb).toBeLessThan(tc)
  })
})

