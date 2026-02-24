/**
 * Modal Interaction Helpers
 *
 * Reusable functions for interacting with modals across the app.
 * All modals follow the same design patterns per CLAUDE.md standards.
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Wait for modal to open
 */
export async function waitForModal(
  page: Page,
  modalName?: string
): Promise<Locator> {
  const modal = modalName
    ? page.getByRole('dialog', { name: new RegExp(modalName, 'i') })
    : page.getByRole('dialog').first();

  await expect(modal).toBeVisible();
  return modal;
}

/**
 * Close modal via backdrop click
 */
export async function closeModalViaBackdrop(page: Page): Promise<void> {
  const backdrop = page.locator('[style*="backdrop"]').first();
  await backdrop.click({ position: { x: 5, y: 5 } }); // Click in corner
  await expect(page.getByRole('dialog')).not.toBeVisible();
}

/**
 * Close modal via ESC key
 */
export async function closeModalViaEsc(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
}

/**
 * Close modal via X button
 */
export async function closeModalViaButton(page: Page): Promise<void> {
  const closeButton = page.getByRole('button', { name: /close/i });
  await closeButton.click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
}

/**
 * Close modal via Cancel button
 */
export async function closeModalViaCancel(page: Page): Promise<void> {
  const cancelButton = page.getByRole('button', { name: /cancel/i });
  await cancelButton.click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
}

/**
 * Fill and submit modal form
 */
export async function fillAndSubmitModal(
  page: Page,
  fields: Record<string, string>,
  submitButtonText = /create|save|submit/i
): Promise<void> {
  const modal = await waitForModal(page);

  // Fill all fields
  for (const [label, value] of Object.entries(fields)) {
    const field = modal.getByRole('textbox', { name: new RegExp(label, 'i') });
    await field.fill(value);
  }

  // Submit
  const submitButton = modal.getByRole('button', { name: submitButtonText });
  await submitButton.click();

  // Modal should close
  await expect(modal).not.toBeVisible();
}

/**
 * Verify modal structure matches CLAUDE.md standards
 */
export async function verifyModalStructure(page: Page): Promise<void> {
  const modal = page.getByRole('dialog');

  // Should have header with title
  await expect(modal.getByRole('heading')).toBeVisible();

  // Should have scrollable content area
  const contentArea = modal.locator('[class*="overflow-y-auto"]');
  await expect(contentArea).toBeVisible();

  // Should have footer with buttons
  const footer = modal.locator('[class*="border-t"]');
  await expect(footer).toBeVisible();

  // Mobile: Should have drag handle on mobile
  // (This would need viewport detection)
}

/**
 * Verify modal can be closed via all methods
 */
export async function testAllModalCloseMethods(
  page: Page,
  openModalFn: () => Promise<void>
): Promise<void> {
  // Test ESC key
  await openModalFn();
  await closeModalViaEsc(page);

  // Test backdrop click
  await openModalFn();
  await closeModalViaBackdrop(page);

  // Test X button
  await openModalFn();
  await closeModalViaButton(page);
}

/**
 * Verify form auto-save to localStorage
 */
export async function verifyFormAutoSave(
  page: Page,
  storageKey: string,
  fieldName: string,
  testValue: string
): Promise<void> {
  const modal = await waitForModal(page);

  // Fill field
  const field = modal.getByRole('textbox', { name: new RegExp(fieldName, 'i') });
  await field.fill(testValue);

  // Wait for auto-save (debounced)
  await page.waitForTimeout(500);

  // Check localStorage
  const savedData = await page.evaluate((key) => {
    return localStorage.getItem(key);
  }, storageKey);

  expect(savedData).toContain(testValue);
}

/**
 * Verify form validation
 */
export async function verifyFormValidation(
  page: Page,
  requiredFields: string[]
): Promise<void> {
  const modal = await waitForModal(page);

  // Try to submit without filling required fields
  const submitButton = modal.getByRole('button', { name: /create|save/i });
  await submitButton.click();

  // Modal should still be visible (validation failed)
  await expect(modal).toBeVisible();

  // Should show error messages or prevent submission
  // (Implementation depends on your validation UI)
}
