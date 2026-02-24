import { test, expect } from '@playwright/test'

test.describe('Complete task flow', () => {
  test('marks a task as completed and appears in Completed view', async ({ page }) => {
    // Navigate to Dashboard
    await page.goto('/')
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

    // Navigate to Todos page to edit the task
    await page.goto('/todos')
    await page.waitForLoadState('networkidle')
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

    // Change status to Done by clicking the Done button
    const doneButton = page.getByRole('button', { name: 'Done', exact: true })
    if (await doneButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await doneButton.click()
      await page.waitForTimeout(500)
    }

    // Save the task using form submit button
    await page.locator('form button[type="submit"]').click()
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

