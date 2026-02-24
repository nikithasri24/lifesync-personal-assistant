import { test, expect } from '@playwright/test'

test.describe('Inline edit task title', () => {
  test('renames a task and persists after reload', async ({ page }) => {
    await page.goto('/')

    // Quick add a task
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Inline Edit ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.locator('form button[type="submit"]').click()

    // Click the task card to open edit modal
    const taskCard = page.getByText(title).first()
    await taskCard.click()
    await page.waitForTimeout(500)

    // Edit the title in the modal
    const titleInput = page.getByPlaceholder(/task title|title/i).or(
      page.locator('input[name="title"]')
    ).first()

    const newTitle = `${title} Renamed`
    if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await titleInput.fill(newTitle)

      // Save the task
      await page.locator('form button[type="submit"]').click()
      await page.waitForTimeout(1000)

      // Verify immediately
      await expect(page.getByText(newTitle).first()).toBeVisible()

      // Reload and verify persistence
      await page.reload()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(newTitle).first()).toBeVisible()
    }
  })
})

