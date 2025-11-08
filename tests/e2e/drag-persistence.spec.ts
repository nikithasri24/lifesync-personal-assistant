import { test, expect } from '@playwright/test'

test.describe('Drag-to-group persistence after reload', () => {
  test('Waiting For persists after reload', async ({ page }) => {
    await page.goto('/')
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Persist Waiting ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.getByRole('button', { name: /^Add$/ }).click()
    const task = page.getByText(title).first()
    const waiting = page.getByText('Waiting For', { exact: true }).first()
      .or(page.getByRole('button', { name: /Waiting For/i }))
    await task.dragTo(waiting)
    await waiting.click()
    await expect(page.getByText(title).first()).toBeVisible()
    await page.reload()
    await expect(page.getByText(title).first()).toBeVisible()
  })

  test('Scheduled persists after reload', async ({ page }) => {
    await page.goto('/')
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Persist Scheduled ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.getByRole('button', { name: /^Add$/ }).click()
    const task = page.getByText(title).first()
    const scheduled = page.getByText('Scheduled', { exact: true }).first()
      .or(page.getByRole('button', { name: /Scheduled/i }))
    await task.dragTo(scheduled)
    await scheduled.click()
    await expect(page.getByText(title).first()).toBeVisible()
    await page.reload()
    await expect(page.getByText(title).first()).toBeVisible()
  })

  test('Project assignment persists after reload', async ({ page }) => {
    await page.goto('/')
    // Create a project
    const projHeader = page.locator('div:has(> h3:has-text("Projects"))')
    await projHeader.getByRole('button').first().click()
    const projectName = `Persist Project ${Date.now()}`
    await page.getByPlaceholder('Project name').fill(projectName)
    await page.getByPlaceholder('Project description').fill('E2E Project Persistence')
    await page.getByRole('button', { name: 'Create Project' }).click()

    // Create a task
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Persist To Project ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.getByRole('button', { name: /^Add$/ }).click()

    const task = page.getByText(title).first()
    const projectNav = page.getByText(projectName, { exact: true }).first()
    await task.dragTo(projectNav)
    await projectNav.click()
    await expect(page.getByText(title).first()).toBeVisible()
    await page.reload()
    await expect(page.getByText(title).first()).toBeVisible()
  })
})

