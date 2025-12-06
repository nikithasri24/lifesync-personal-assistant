import { test, expect } from '@playwright/test'

test.describe('Project filter toggle to All', () => {
  test('clicking project again returns to All', async ({ page }) => {
    await page.goto('/')

    // Create two projects
    const projHeader = page.locator('div:has(> h3:has-text("Projects"))')
    await projHeader.getByRole('button').first().click()
    const p1 = `P1 ${Date.now()}`
    await page.getByPlaceholder('Project name').fill(p1)
    await page.getByPlaceholder('Project description').fill('Desc')
    await page.getByRole('button', { name: 'Create Project' }).click()

    await projHeader.getByRole('button').first().click()
    const p2 = `P2 ${Date.now()}`
    await page.getByPlaceholder('Project name').fill(p2)
    await page.getByPlaceholder('Project description').fill('Desc2')
    await page.getByRole('button', { name: 'Create Project' }).click()

    // Create tasks
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const t1 = `Task P1 ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(`${t1} #project:"${p1}"`)
    await page.getByRole('button', { name: /^Add$/ }).click()

    await addBtn.click()
    const t2 = `Task P2 ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(`${t2} #project:"${p2}"`)
    await page.getByRole('button', { name: /^Add$/ }).click()

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

