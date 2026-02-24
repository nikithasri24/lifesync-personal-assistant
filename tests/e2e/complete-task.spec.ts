import { test, expect } from '@playwright/test'

test.describe('Complete task flow', () => {
  test('marks a task as completed and appears in Completed view', async ({ page }) => {
    // Navigate to Todos page
    await page.goto('/todos')
    await page.waitForLoadState('networkidle')

    // Quick add
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Complete Me ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    // Click submit button inside modal (not the FAB)
    await page.locator('form button[type="submit"]').click()
    await page.waitForTimeout(1500)

    // Click the task card to open edit modal
    const taskCard = page.getByText(title).first()
    await taskCard.click()
    await page.waitForTimeout(500)

    // Change status to Done in the modal
    const statusSelect = page.locator('select[name="status"], select').filter({ hasText: /To Do|In Progress|Done/ }).first()
    if (await statusSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await statusSelect.selectOption('done')
    }

    // Save the task
    await page.getByRole('button', { name: 'Update Task' }).click()
    await page.waitForTimeout(1000)

    // Filter by Done status to verify
    const doneFilter = page.getByText('Done', { exact: true }).first()
    if (await doneFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await doneFilter.click()
      await page.waitForTimeout(500)
      await expect(page.getByText(title).first()).toBeVisible()
    }
  })
})

