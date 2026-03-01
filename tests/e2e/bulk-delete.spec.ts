import { test, expect } from '@playwright/test'

test.describe('Bulk delete functionality', () => {
  test('can select tasks and access delete button', async ({ page }) => {
    // Navigate to Todos page for bulk operations
    await page.goto('/todos')
    await page.waitForLoadState('domcontentloaded')

    // Create two tasks
    const addBtn = page.getByRole('button', { name: /Add Task/i }).first()
    const timestamp = Date.now()
    const taskNames = [`Del A ${timestamp}`, `Del B ${timestamp}`]

    for (const name of taskNames) {
      await addBtn.click()
      await page.waitForTimeout(300)
      await page.getByRole('textbox', { name: /What needs to be done\?/i })
        .or(page.getByPlaceholder(/What needs to be done\?/i))
        .fill(name)
      await page.locator('form button[type="submit"]').click()
      await page.waitForTimeout(1000)
    }

    // Switch to List view to see all tasks
    const listViewBtn = page.getByRole('button', { name: '📋 List view' })
    if (await listViewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listViewBtn.click()
      await page.waitForTimeout(500)
    }

    // Verify tasks exist
    await expect(page.getByText(taskNames[0]).first()).toBeVisible()
    await expect(page.getByText(taskNames[1]).first()).toBeVisible()

    // Enable bulk selection mode
    await page.getByRole('button', { name: /Select Tasks/i }).click()
    await page.waitForTimeout(300)

    // Verify selection mode is active
    await expect(page.getByRole('button', { name: /Cancel Selection/i })).toBeVisible()

    // Select 2 tasks by clicking their checkboxes
    const allCheckboxes = page.locator('input[type="checkbox"]')
    await allCheckboxes.nth(0).click()
    await page.waitForTimeout(300)

    await allCheckboxes.nth(1).click()
    await page.waitForTimeout(500)

    // Verify 2 tasks selected
    await expect(page.getByText(/2 tasks selected/i)).toBeVisible()

    // Verify Delete Selected button is accessible
    const deleteBtn = page.getByRole('button', { name: /Delete Selected/i })
    await expect(deleteBtn).toBeVisible()
    await expect(deleteBtn).toBeEnabled()

    // Cancel selection mode (don't actually delete in test)
    await page.getByRole('button', { name: /Cancel Selection/i }).click()
    await page.waitForTimeout(300)

    // Verify selection mode exited
    await expect(page.getByRole('button', { name: /Select Tasks/i })).toBeVisible()
  })
})

