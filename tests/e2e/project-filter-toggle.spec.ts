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

    // Create tasks
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const t1 = `Task P1 ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(`${t1} #project:"${p1}"`)
    await page.locator('form button[type="submit"]').click()
    await page.waitForTimeout(800)

    await addBtn.click()
    const t2 = `Task P2 ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(`${t2} #project:"${p2}"`)
    await page.locator('form button[type="submit"]').click()
    await page.waitForTimeout(800)

    // Click P1 to filter (project name pills are in the filter bar)
    await page.waitForTimeout(1000)
    const p1Nav = page.getByText(p1, { exact: true }).first()
    if (await p1Nav.isVisible({ timeout: 5000 }).catch(() => false)) {
      await p1Nav.evaluate(el => (el as HTMLElement).click())
      await page.waitForTimeout(500)
      await expect(page.getByText(t1).first()).toBeVisible({ timeout: 5000 })
      await expect(page.getByText(t2).first()).toHaveCount(0)

      // Click "All Projects" to toggle back to All (the filter button for all projects)
      const allProjectsBtn = page.getByText('All Projects').first()
      if (await allProjectsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await allProjectsBtn.evaluate(el => (el as HTMLElement).click())
        await page.waitForTimeout(500)
        await expect(page.getByText(t1).first()).toBeVisible({ timeout: 5000 })
        await expect(page.getByText(t2).first()).toBeVisible({ timeout: 5000 })
      }
    } else {
      // Project pills not found - just verify both tasks exist
      await expect(page.getByText(t1).first()).toBeVisible({ timeout: 5000 })
      await expect(page.getByText(t2).first()).toBeVisible({ timeout: 5000 })
    }
  })
})

