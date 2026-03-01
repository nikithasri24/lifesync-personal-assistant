/**
 * Comprehensive Selfcare Products CRUD Tests
 *
 * Tests all Create, Read, Update, Delete operations for skincare products
 */

import { test, expect } from '@playwright/test';

test.describe('Selfcare Products - Create Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/selfcare');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Navigate to Products tab
    await page.getByRole('tab', { name: '🧴 Products' }).click();
    await page.waitForTimeout(500);
  });

  test('create basic skincare product', async ({ page }) => {
    const productName = `Face Cream ${Date.now()}`;

    await page.getByRole('button', { name: /add product/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: /add product/i })).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder(/hydrating face cream/i).fill(productName);
    await page.getByPlaceholder(/cerave, the ordinary/i).fill('CeraVe');

    await page.getByRole('button', { name: /add product/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(productName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('CeraVe')).toBeVisible();
  });

  test('create product with category selection', async ({ page }) => {
    const productName = `Vitamin C Serum ${Date.now()}`;

    await page.getByRole('button', { name: /add product/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/hydrating face cream/i).fill(productName);
    await page.getByPlaceholder(/cerave, the ordinary/i).fill('The Ordinary');
    await page.getByRole('button', { name: /serum/i }).click();

    await page.getByRole('button', { name: /add product/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(productName)).toBeVisible({ timeout: 5000 });
  });

  test('create product with star rating', async ({ page }) => {
    const productName = `Toner ${Date.now()}`;

    await page.getByRole('button', { name: /add product/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/hydrating face cream/i).fill(productName);
    await page.getByPlaceholder(/cerave, the ordinary/i).fill('Paula\'s Choice');

    // Select 4-star rating
    await page.getByRole('button', { name: 'Rate 4 stars' }).click();

    await page.getByRole('button', { name: /add product/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(productName)).toBeVisible({ timeout: 5000 });
  });

  test('create product with use frequency', async ({ page }) => {
    const productName = `SPF Sunscreen ${Date.now()}`;

    await page.getByRole('button', { name: /add product/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/hydrating face cream/i).fill(productName);
    await page.getByPlaceholder(/cerave, the ordinary/i).fill('EltaMD');
    await page.getByPlaceholder(/daily am, 2x per week/i).fill('Daily AM');

    await page.getByRole('button', { name: /add product/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(productName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Daily AM')).toBeVisible();
  });

  test('create product with notes', async ({ page }) => {
    const productName = `Eye Cream ${Date.now()}`;

    await page.getByRole('button', { name: /add product/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/hydrating face cream/i).fill(productName);
    await page.getByPlaceholder(/cerave, the ordinary/i).fill('Kiehl\'s');
    await page.getByPlaceholder(/add any notes/i).fill('Apply morning and night');

    await page.getByRole('button', { name: /add product/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(productName)).toBeVisible({ timeout: 5000 });
  });

  test('create moisturizer category product', async ({ page }) => {
    const productName = `Moisturizer ${Date.now()}`;

    await page.getByRole('button', { name: /add product/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/hydrating face cream/i).fill(productName);
    await page.getByPlaceholder(/cerave, the ordinary/i).fill('Neutrogena');
    await page.getByRole('button', { name: /moisturizer/i }).click();

    await page.getByRole('button', { name: /add product/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(productName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Selfcare Products - Read Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/selfcare');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    await page.getByRole('tab', { name: '🧴 Products' }).click();
    await page.waitForTimeout(500);
  });

  test('display products grid', async ({ page }) => {
    // Products tab should show the grid layout
    await expect(page.getByRole('button', { name: /add product/i })).toBeVisible();
  });

  test('display product name and brand', async ({ page }) => {
    // Create a product to display
    const productName = `Display Test ${Date.now()}`;

    await page.getByRole('button', { name: /add product/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/hydrating face cream/i).fill(productName);
    await page.getByPlaceholder(/cerave, the ordinary/i).fill('Test Brand');

    await page.getByRole('button', { name: /add product/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(productName)).toBeVisible();
    await expect(page.getByText('Test Brand')).toBeVisible();
  });

  test('display product category badge', async ({ page }) => {
    const productName = `Badge Test ${Date.now()}`;

    await page.getByRole('button', { name: /add product/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/hydrating face cream/i).fill(productName);
    await page.getByPlaceholder(/cerave, the ordinary/i).fill('Test Brand');
    await page.getByRole('button', { name: /toner/i }).click();

    await page.getByRole('button', { name: /add product/i }).last().click();
    await page.waitForTimeout(1000);

    // Category badge should be visible on product card
    await expect(page.getByText(productName)).toBeVisible();
  });
});

test.describe('Selfcare Products - Update Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/selfcare');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    await page.getByRole('tab', { name: '🧴 Products' }).click();
    await page.waitForTimeout(500);

    // Create a product to edit
    await page.getByRole('button', { name: /add product/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/hydrating face cream/i).fill('Edit Test Product');
    await page.getByPlaceholder(/cerave, the ordinary/i).fill('Test Brand');

    await page.getByRole('button', { name: /add product/i }).last().click();
    await page.waitForTimeout(1000);
  });

  test('update product name', async ({ page }) => {
    const updatedName = `Updated Product ${Date.now()}`;

    // Click product card to edit
    await page.getByText('Edit Test Product').click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: /edit product/i })).toBeVisible({ timeout: 5000 });

    const nameInput = page.getByPlaceholder(/hydrating face cream/i);
    await nameInput.clear();
    await nameInput.fill(updatedName);

    await page.getByRole('button', { name: /update product/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Edit Test Product')).not.toBeVisible();
  });

  test('update product brand', async ({ page }) => {
    await page.getByText('Edit Test Product').click();
    await page.waitForTimeout(500);

    const brandInput = page.getByPlaceholder(/cerave, the ordinary/i);
    await brandInput.clear();
    await brandInput.fill('New Brand');

    await page.getByRole('button', { name: /update product/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText('New Brand')).toBeVisible({ timeout: 5000 });
  });

  test('update product rating', async ({ page }) => {
    await page.getByText('Edit Test Product').click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Rate 5 stars' }).click();

    await page.getByRole('button', { name: /update product/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText('Edit Test Product')).toBeVisible({ timeout: 5000 });
  });

  test('update product category', async ({ page }) => {
    await page.getByText('Edit Test Product').click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /moisturizer/i }).click();

    await page.getByRole('button', { name: /update product/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText('Edit Test Product')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Selfcare Products - Delete Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/selfcare');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    await page.getByRole('tab', { name: '🧴 Products' }).click();
    await page.waitForTimeout(500);

    // Create a product to delete
    await page.getByRole('button', { name: /add product/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/hydrating face cream/i).fill('Delete Test Product');
    await page.getByPlaceholder(/cerave, the ordinary/i).fill('Test Brand');

    await page.getByRole('button', { name: /add product/i }).last().click();
    await page.waitForTimeout(1000);
  });

  test('delete a product', async ({ page }) => {
    await expect(page.getByText('Delete Test Product')).toBeVisible();

    await page.getByText('Delete Test Product').click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /delete/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText('Delete Test Product')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Selfcare Products - Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/selfcare');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    await page.getByRole('tab', { name: '🧴 Products' }).click();
    await page.waitForTimeout(500);
  });

  test('cannot create product without name', async ({ page }) => {
    await page.getByRole('button', { name: /add product/i }).click();
    await page.waitForTimeout(500);

    // Fill only brand (skip name)
    await page.getByPlaceholder(/cerave, the ordinary/i).fill('Test Brand');
    await page.getByRole('button', { name: /add product/i }).last().click();
    await page.waitForTimeout(500);

    // Modal should remain open
    await expect(page.getByRole('heading', { name: /add product/i })).toBeVisible({ timeout: 5000 });
  });

  test('cannot create product without brand', async ({ page }) => {
    await page.getByRole('button', { name: /add product/i }).click();
    await page.waitForTimeout(500);

    // Fill only name (skip brand)
    await page.getByPlaceholder(/hydrating face cream/i).fill('Test Product');
    await page.getByRole('button', { name: /add product/i }).last().click();
    await page.waitForTimeout(500);

    // Modal should remain open
    await expect(page.getByRole('heading', { name: /add product/i })).toBeVisible({ timeout: 5000 });
  });

  test('cancel product creation', async ({ page }) => {
    await page.getByRole('button', { name: /add product/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder(/hydrating face cream/i).fill('Cancelled Product');

    await page.getByRole('button', { name: /cancel/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Cancelled Product')).not.toBeVisible();
  });
});
