import { test, expect } from '@playwright/test'

test.describe('Star toggle persistence', () => {
  test('starred state persists after reload', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Quick add
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Persist Star ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.locator('form button[type="submit"]').click()
    await page.waitForTimeout(1500)

    // Navigate to Todos page to edit the task
    await page.goto('/todos')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Switch to List view to see all tasks
    const listViewBtn = page.getByRole('button', { name: '📋 List view' })
    if (await listViewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listViewBtn.click()
      await page.waitForTimeout(500)
    }

    // Click the task card to open edit modal
    const taskCard = page.getByText(title).first()
    await taskCard.click()
    await page.waitForTimeout(500)

    // Check the star checkbox in the modal
    const starCheckbox = page.locator('input[type="checkbox"][name="starred"]')
      .or(page.getByRole('checkbox', { name: /star/i }))
    if (await starCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await starCheckbox.check()
      await page.waitForTimeout(500)
    }

    // Save the task using form submit button
    await page.locator('form button[type="submit"]').click()
    await page.waitForTimeout(1000)

    // Click the Starred filter to verify
    const starredFilter = page.getByText('⭐ Starred', { exact: true }).or(
      page.getByRole('button').filter({ hasText: /starred/i })
    )
    if (await starredFilter.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await starredFilter.first().click()
      await page.waitForTimeout(500)
      await expect(page.getByText(title).first()).toBeVisible()
    }

    // Reload and verify star persists
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // Click the Starred filter again after reload
    if (await starredFilter.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await starredFilter.first().click()
      await page.waitForTimeout(500)
      await expect(page.getByText(title).first()).toBeVisible()
    }
  })
})

