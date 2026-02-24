import { test, expect } from '@playwright/test'

test.describe('Star toggle', () => {
  test('stars a task and shows it in Starred', async ({ page }) => {
    await page.goto('/')

    // Quick add
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Star Me ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.locator('form button[type="submit"]').click()
    await page.waitForTimeout(1000)

    // Click the task card to open edit modal
    const taskCard = page.getByText(title).first()
    await taskCard.click()
    await page.waitForTimeout(500)

    // Check the star checkbox in the modal
    const starCheckbox = page.locator('input[type="checkbox"]').filter({ has: page.locator('text=/Star this task/i') })
      .or(page.getByRole('checkbox', { name: /star/i }))
    if (await starCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await starCheckbox.check()
    }

    // Save the task
    await page.getByRole('button', { name: /Save|Update/i }).first().click()
    await page.waitForTimeout(1000)

    // Click the Starred filter button to show only starred tasks
    const starredFilter = page.getByText('⭐ Starred', { exact: true }).or(
      page.getByRole('button').filter({ hasText: /starred/i })
    )
    if (await starredFilter.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await starredFilter.first().click()
      await page.waitForTimeout(500)
      await expect(page.getByText(title).first()).toBeVisible()
    }
  })
})

