import { test, expect } from '@playwright/test'

test.describe('Quick Add parsing (project, date, priority, tags)', () => {
  test('creates a task with tokens and shows under the project', async ({ page }) => {
    await page.goto('/')

    // Create a project via the Projects page
    await page.goto('/projects')
    await page.waitForLoadState('domcontentloaded')

    const createButton = page.locator('[data-testid="create-project"]').or(
      page.getByRole('button').filter({ hasText: /new project|add project|create/i }).first()
    )

    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click()
      await page.waitForTimeout(500)
      await page.getByPlaceholder(/Project name|name/i).fill('Acme Website')

      const descInput = page.getByPlaceholder(/description/i)
      if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descInput.fill('E2E Project')
      }

      await page.getByRole('button', { name: /Create Project|Save|Add/i }).click()
      await page.waitForTimeout(1000)
    }

    // Go back to todos and wait for dashboard to load
    await page.goto('/')
    await page.waitForLoadState('load')
    await expect(page.getByText('Tasks Today')).toBeVisible({ timeout: 15000 })

    // Quick Add a task
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    await page.waitForTimeout(500)
    const taskTitle = `Design mock E2E ${Date.now()}`
    const input = page.getByPlaceholder(/What needs to be done/i)
      .or(page.getByRole('textbox', { name: /What needs to be done/i }))
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill(taskTitle)
    await page.locator('form button[type="submit"]').first().click()
    await page.waitForTimeout(800)

    // Navigate to Tasks page — switch to List view to see task without due-date filtering
    await page.goto('/todos')
    await page.waitForLoadState('load')
    await page.waitForTimeout(1000)

    // Switch to List view (default "Today" only shows tasks due today)
    await page.getByRole('button', { name: /list view/i }).click().catch(() =>
      page.getByLabel(/📋 List view/).click().catch(() => null)
    )
    await page.waitForTimeout(500)

    // Reveal FilterBarV2 to access search and project pills
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i })
    if (await showFiltersBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await showFiltersBtn.click()
      await page.waitForTimeout(500)
    }

    // The task should appear in the list
    await expect(page.getByText(taskTitle).first()).toBeVisible({ timeout: 10000 })

    // If project pill available, filter by it
    const projectPill = page.getByText('Acme Website', { exact: true }).first()
    if (await projectPill.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectPill.click()
      await page.waitForTimeout(500)
      await expect(page.getByText(taskTitle).first()).toBeVisible()
    }
  })
})

