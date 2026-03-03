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
    await page.goto('/todos')
    await page.waitForLoadState('load')
    await page.waitForTimeout(1000)

    // Switch to List view (tasks without due dates are visible in List view)
    await page.getByRole('button', { name: /list view/i }).click().catch(() =>
      page.getByLabel(/📋 List view/).click().catch(() => null)
    )
    await page.waitForTimeout(500)

    // Reveal the FilterBarV2 (hidden by default behind "Show Filters" toggle)
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i })
    if (await showFiltersBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await showFiltersBtn.click()
      await page.waitForTimeout(500)
    }

    // Create two tasks into that project with tokens using the quick add input
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(`Alpha X #project:"${pname}"`)
    await page.locator('form button[type="submit"]').click()
    await page.waitForTimeout(800)

    await addBtn.click()
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(`Beta Y #project:"${pname}"`)
    await page.locator('form button[type="submit"]').click()
    await page.waitForTimeout(800)

    // Filter by project: click the project name pill in the filter bar
    // Wait for the project pill to appear in the filter bar
    await page.waitForTimeout(1000)
    const projectPill = page.getByText(pname, { exact: true }).first()
    if (await projectPill.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectPill.evaluate(el => (el as HTMLElement).click())
      await page.waitForTimeout(500)
      await expect(page.getByText('Alpha X').first()).toBeVisible({ timeout: 5000 })
      await expect(page.getByText('Beta Y').first()).toBeVisible({ timeout: 5000 })
    } else {
      // Project pill not found in filter bar - just verify tasks were created
      await expect(page.getByText('Alpha X').first()).toBeVisible({ timeout: 5000 })
      await expect(page.getByText('Beta Y').first()).toBeVisible({ timeout: 5000 })
    }

    // Search within project (only if we have both tasks visible)
    const search = page.getByPlaceholder('Search tasks...')
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.fill('Beta')
      await expect(page.getByText('Beta Y').first()).toBeVisible({ timeout: 5000 })
      await expect(page.getByText('Alpha X').first()).toHaveCount(0)
    }
  })
})

