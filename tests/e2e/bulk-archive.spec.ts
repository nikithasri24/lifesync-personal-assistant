import { test, expect } from '@playwright/test'

test.describe('Bulk selection mode', () => {
  test('can enter bulk selection mode and select multiple tasks', async ({ page }) => {
    // Navigate to Todos page for bulk operations
    await page.goto('/todos')
    await page.waitForLoadState('networkidle')

    // Create two tasks
    const addBtn = page.getByRole('button', { name: /Add Task/i }).first()
    const timestamp = Date.now()
    const t1 = `Bulk T1 ${timestamp}`
    const t2 = `Bulk T2 ${timestamp}`

    await addBtn.click()
    await page.waitForTimeout(300)
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(t1)
    await page.locator('form button[type="submit"]').click()
    await page.waitForTimeout(1000)

    await addBtn.click()
    await page.waitForTimeout(300)
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(t2)
    await page.locator('form button[type="submit"]').click()
    await page.waitForTimeout(1000)

    // Switch to List view to see all tasks
    const listViewBtn = page.getByRole('button', { name: '📋 List view' })
    if (await listViewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listViewBtn.click()
      await page.waitForTimeout(500)
    }

    // Enable bulk selection mode
    await page.getByRole('button', { name: /Select Tasks/i }).click()
    await page.waitForTimeout(300)

    // Verify selection mode is active (button changes to Cancel Selection)
    await expect(page.getByRole('button', { name: /Cancel Selection/i })).toBeVisible()

    // Click a task checkbox to show bulk action bar
    const firstCheckbox = page.locator('input[type="checkbox"]').first()
    await firstCheckbox.click()
    await page.waitForTimeout(500)

    // Now bulk action bar should appear with Select All button
    const selectAllBtn = page.getByRole('button').filter({ hasText: /^Select All/ })
    const deselectAllBtn = page.getByRole('button', { name: 'Deselect All', exact: true })

    await expect(selectAllBtn).toBeVisible()
    await expect(deselectAllBtn).toBeVisible()

    // Select All
    await selectAllBtn.click()
    await page.waitForTimeout(500)

    // Verify selection count (should show many tasks selected)
    await expect(page.getByText(/\d+ tasks selected/i)).toBeVisible()

    // Verify Delete Selected button is visible
    await expect(page.getByRole('button', { name: /Delete Selected/i })).toBeVisible()

    // Deselect all
    await deselectAllBtn.click()
    await page.waitForTimeout(500)

    // After deselecting all, bulk action bar should disappear
    // So Select All and Delete Selected buttons should not be visible
    await expect(selectAllBtn).not.toBeVisible()
    await expect(page.getByRole('button', { name: /Delete Selected/i })).not.toBeVisible()

    // Cancel selection mode
    await page.getByRole('button', { name: /Cancel Selection/i }).click()
    await page.waitForTimeout(300)

    // Verify bulk UI is hidden
    await expect(page.getByRole('button', { name: /Select All/i })).not.toBeVisible()
  })
})
