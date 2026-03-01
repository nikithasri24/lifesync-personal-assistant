import { test, expect } from '@playwright/test'

test.describe('Project filter toggle to All', () => {
  test('clicking project again returns to All', async ({ page }) => {
    await page.goto('/')

    // Create two projects via the Projects page
    await page.goto('/projects')
    await page.waitForLoadState('domcontentloaded')

    const createButton = page.locator('[data-testid="create-project"]').or(
      page.getByRole('button').filter({ hasText: /new project|add project|create/i }).first()
    )

    // Create first project
    const p1 = `P1 ${Date.now()}`
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click()
      await page.waitForTimeout(500)
      await page.getByPlaceholder(/Project name|name/i).fill(p1)

      const descInput = page.getByPlaceholder(/description/i)
      if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descInput.fill('Desc')
      }

      await page.getByRole('button', { name: /Create Project|Save|Add/i }).click()
      await page.waitForTimeout(1000)
    }

    // Create second project
    const p2 = `P2 ${Date.now()}`
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click()
      await page.waitForTimeout(500)
      await page.getByPlaceholder(/Project name|name/i).fill(p2)

      const descInput = page.getByPlaceholder(/description/i)
      if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descInput.fill('Desc2')
      }

      await page.getByRole('button', { name: /Create Project|Save|Add/i }).click()
      await page.waitForTimeout(1000)
    }

    // Go back to todos
    await page.goto('/')

    // Create tasks
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const t1 = `Task P1 ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(`${t1} #project:"${p1}"`)
    await page.locator('form button[type="submit"]').click()

    await addBtn.click()
    const t2 = `Task P2 ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(`${t2} #project:"${p2}"`)
    await page.locator('form button[type="submit"]').click()

    // Click P1 to filter
    const p1Nav = page.getByText(p1, { exact: true }).first()
    await p1Nav.click()
    await expect(page.getByText(t1).first()).toBeVisible()
    await expect(page.getByText(t2).first()).toHaveCount(0)

    // Click P1 again to toggle back to All
    await p1Nav.click()
    await expect(page.getByText(t1).first()).toBeVisible()
    await expect(page.getByText(t2).first()).toBeVisible()
  })
})

