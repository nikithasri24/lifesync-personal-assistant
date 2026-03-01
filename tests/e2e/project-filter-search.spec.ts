import { test, expect } from '@playwright/test'

test.describe('Project filter combined with search', () => {
  test('filters by project then by search within that project', async ({ page }) => {
    await page.goto('/')

    // Create project via the Projects page
    await page.goto('/projects')
    await page.waitForLoadState('domcontentloaded')

    const createButton = page.locator('[data-testid="create-project"]').or(
      page.getByRole('button').filter({ hasText: /new project|add project|create/i }).first()
    )

    const pname = `FilterProj ${Date.now()}`
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click()
      await page.waitForTimeout(500)
      await page.getByPlaceholder(/Project name|name/i).fill(pname)

      const descInput = page.getByPlaceholder(/description/i)
      if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descInput.fill('desc')
      }

      await page.getByRole('button', { name: /Create Project|Save|Add/i }).click()
      await page.waitForTimeout(1000)
    }

    // Go back to todos
    await page.goto('/')

    // Create two tasks into that project with tokens
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(`Alpha X #project:"${pname}"`)
    await page.locator('form button[type="submit"]').click()

    await addBtn.click()
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(`Beta Y #project:"${pname}"`)
    await page.locator('form button[type="submit"]').click()

    // Filter by project then search
    await page.getByText(pname, { exact: true }).first().click()
    await expect(page.getByText('Alpha X').first()).toBeVisible()
    await expect(page.getByText('Beta Y').first()).toBeVisible()

    const search = page.getByPlaceholder('Search tasks...')
    await search.fill('Beta')
    await expect(page.getByText('Beta Y').first()).toBeVisible()
    await expect(page.getByText('Alpha X').first()).toHaveCount(0)
  })
})

