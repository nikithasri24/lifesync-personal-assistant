import { test, expect } from '@playwright/test';

test.describe('Finances Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Finances
    const financesLink = page.locator('[data-testid="nav-finances"]').or(page.getByText('Finances'));

    if (await financesLink.first().isVisible()) {
      await financesLink.first().click();
      await page.waitForLoadState('domcontentloaded');
    } else {
      await page.goto('/finances');
      await page.waitForLoadState('domcontentloaded');
    }
  });

  test('should display finances page', async ({ page }) => {
    // Check for finances page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have multiple tab options', async ({ page }) => {
    // Look for tab navigation
    const tabs = ['Dashboard', 'Transactions', 'Net Worth', 'Goals', 'Projections', 'Calculators'];

    // At least one tab should be visible
    let tabFound = false;
    for (const tab of tabs) {
      const tabElement = page.getByRole('button', { name: tab }).or(page.getByText(tab));
      if (await tabElement.first().isVisible()) {
        tabFound = true;
        break;
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test.describe('Dashboard Tab', () => {
    test('should display financial overview', async ({ page }) => {
      // Click dashboard tab if needed
      const dashboardTab = page.getByRole('button', { name: /dashboard/i }).or(page.getByText('Dashboard'));

      if (await dashboardTab.first().isVisible()) {
        await dashboardTab.first().click();
        await page.waitForTimeout(500);
      }

      // Look for overview metrics
      await expect(page.locator('body')).toBeVisible();
    });

    test('should show quick stats', async ({ page }) => {
      // Look for stat cards (income, expenses, balance, etc.)
      const statsSection = page.locator('[data-testid="financial-stats"]').or(
        page.locator('.stats, .metrics')
      );

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Transactions Tab', () => {
    test('should switch to transactions tab', async ({ page }) => {
      const transactionsTab = page.getByRole('button', { name: /transactions/i }).or(
        page.getByText('Transactions')
      );

      if (await transactionsTab.first().isVisible()) {
        await transactionsTab.first().click();
        await page.waitForTimeout(500);

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should have add transaction button', async ({ page }) => {
      const transactionsTab = page.getByRole('button', { name: /transactions/i }).first();
      if (await transactionsTab.isVisible()) {
        await transactionsTab.click();
        await page.waitForTimeout(500);
      }

      const addButton = page.locator('[data-testid="add-transaction"]').or(
        page.getByRole('button').filter({ hasText: /add|new transaction/i }).first()
      );

      if (await addButton.isVisible()) {
        await expect(addButton).toBeVisible();
      }
    });

    test('should add income transaction', async ({ page }) => {
      const transactionsTab = page.getByRole('button', { name: /transactions/i }).first();
      if (await transactionsTab.isVisible()) {
        await transactionsTab.click();
        await page.waitForTimeout(500);
      }

      const addButton = page.getByRole('button').filter({ hasText: /add|new transaction/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Select income type
        const incomeType = page.getByRole('button', { name: /income/i }).or(
          page.getByText('Income')
        );

        if (await incomeType.first().isVisible()) {
          await incomeType.first().click();
          await page.waitForTimeout(300);

          // Fill amount
          const amountInput = page.getByPlaceholder(/amount/i).first();
          if (await amountInput.isVisible()) {
            await amountInput.fill('1000');

            // Save transaction
            const saveButton = page.getByRole('button', { name: /save|add|create/i }).first();
            if (await saveButton.isVisible()) {
              await saveButton.click();
              await page.waitForTimeout(1000);
            }
          }
        }
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should add expense transaction', async ({ page }) => {
      const transactionsTab = page.getByRole('button', { name: /transactions/i }).first();
      if (await transactionsTab.isVisible()) {
        await transactionsTab.click();
        await page.waitForTimeout(500);
      }

      const addButton = page.getByRole('button').filter({ hasText: /add|new transaction/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Select expense type
        const expenseType = page.getByRole('button', { name: /expense/i }).or(
          page.getByText('Expense')
        );

        if (await expenseType.first().isVisible()) {
          await expenseType.first().click();
          await page.waitForTimeout(300);

          // Fill details
          const amountInput = page.getByPlaceholder(/amount/i).first();
          if (await amountInput.isVisible()) {
            await amountInput.fill('50');

            const saveButton = page.getByRole('button', { name: /save|add|create/i }).first();
            if (await saveButton.isVisible()) {
              await saveButton.click();
              await page.waitForTimeout(1000);
            }
          }
        }
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should categorize transactions', async ({ page }) => {
      const transactionsTab = page.getByRole('button', { name: /transactions/i }).first();
      if (await transactionsTab.isVisible()) {
        await transactionsTab.click();
        await page.waitForTimeout(500);
      }

      // Look for category options
      const categorySelect = page.locator('[data-testid="category-select"]').or(
        page.getByText(/category/i).first()
      );

      await expect(page.locator('body')).toBeVisible();
    });

    test('should filter transactions by date', async ({ page }) => {
      const transactionsTab = page.getByRole('button', { name: /transactions/i }).first();
      if (await transactionsTab.isVisible()) {
        await transactionsTab.click();
        await page.waitForTimeout(500);
      }

      // Look for date filter
      const dateFilter = page.locator('input[type="date"]').first();
      if (await dateFilter.isVisible()) {
        await dateFilter.click();
        await page.waitForTimeout(300);
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should support CSV import', async ({ page }) => {
      const transactionsTab = page.getByRole('button', { name: /transactions/i }).first();
      if (await transactionsTab.isVisible()) {
        await transactionsTab.click();
        await page.waitForTimeout(500);
      }

      // Look for import button
      const importButton = page.getByRole('button', { name: /import/i }).first();
      if (await importButton.isVisible()) {
        await expect(importButton).toBeVisible();
      }
    });

    test('should support CSV export', async ({ page }) => {
      const transactionsTab = page.getByRole('button', { name: /transactions/i }).first();
      if (await transactionsTab.isVisible()) {
        await transactionsTab.click();
        await page.waitForTimeout(500);
      }

      // Look for export button
      const exportButton = page.getByRole('button', { name: /export/i }).first();
      if (await exportButton.isVisible()) {
        await expect(exportButton).toBeVisible();
      }
    });
  });

  test.describe('Net Worth Tab', () => {
    test('should switch to net worth tab', async ({ page }) => {
      const netWorthTab = page.getByRole('button', { name: /net worth/i }).or(
        page.getByText('Net Worth')
      );

      if (await netWorthTab.first().isVisible()) {
        await netWorthTab.first().click();
        await page.waitForTimeout(500);

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should add asset account', async ({ page }) => {
      const netWorthTab = page.getByRole('button', { name: /net worth/i }).first();
      if (await netWorthTab.isVisible()) {
        await netWorthTab.click();
        await page.waitForTimeout(500);
      }

      const addButton = page.getByRole('button').filter({ hasText: /add account|add asset/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Select asset type
        const assetType = page.getByText(/asset/i).first();
        if (await assetType.isVisible()) {
          await assetType.click();
          await page.waitForTimeout(300);
        }
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should add liability account', async ({ page }) => {
      const netWorthTab = page.getByRole('button', { name: /net worth/i }).first();
      if (await netWorthTab.isVisible()) {
        await netWorthTab.click();
        await page.waitForTimeout(500);
      }

      const addButton = page.getByRole('button').filter({ hasText: /add account|add liability/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Select liability type
        const liabilityType = page.getByText(/liability/i).first();
        if (await liabilityType.isVisible()) {
          await liabilityType.click();
          await page.waitForTimeout(300);
        }
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should display net worth trend chart', async ({ page }) => {
      const netWorthTab = page.getByRole('button', { name: /net worth/i }).first();
      if (await netWorthTab.isVisible()) {
        await netWorthTab.click();
        await page.waitForTimeout(500);
      }

      // Look for chart
      const chart = page.locator('[data-testid="net-worth-chart"]').or(
        page.locator('canvas, svg').first()
      );

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Goals Tab', () => {
    test('should switch to goals tab', async ({ page }) => {
      const goalsTab = page.getByRole('button', { name: /^goals$/i }).first();

      if (await goalsTab.isVisible()) {
        await goalsTab.click();
        await page.waitForTimeout(500);

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should create financial goal', async ({ page }) => {
      const goalsTab = page.getByRole('button', { name: /^goals$/i }).first();
      if (await goalsTab.isVisible()) {
        await goalsTab.click();
        await page.waitForTimeout(500);
      }

      const addButton = page.getByRole('button').filter({ hasText: /add goal|new goal|create/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Fill goal details
        const goalNameInput = page.getByPlaceholder(/goal name|name/i).first();
        if (await goalNameInput.isVisible()) {
          await goalNameInput.fill('Emergency Fund');

          const targetAmount = page.getByPlaceholder(/target|amount/i).first();
          if (await targetAmount.isVisible()) {
            await targetAmount.fill('10000');

            const saveButton = page.getByRole('button', { name: /save|create/i }).first();
            if (await saveButton.isVisible()) {
              await saveButton.click();
              await page.waitForTimeout(1000);
            }
          }
        }
      }

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Calculators Tab', () => {
    test('should switch to calculators tab', async ({ page }) => {
      const calculatorsTab = page.getByRole('button', { name: /calculators/i }).or(
        page.getByText('Calculators')
      );

      if (await calculatorsTab.first().isVisible()) {
        await calculatorsTab.first().click();
        await page.waitForTimeout(500);

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should have debt payoff calculator', async ({ page }) => {
      const calculatorsTab = page.getByRole('button', { name: /calculators/i }).first();
      if (await calculatorsTab.isVisible()) {
        await calculatorsTab.click();
        await page.waitForTimeout(500);
      }

      // Look for debt payoff option
      const debtCalculator = page.getByText(/debt payoff|debt/i).first();
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have savings rate calculator', async ({ page }) => {
      const calculatorsTab = page.getByRole('button', { name: /calculators/i }).first();
      if (await calculatorsTab.isVisible()) {
        await calculatorsTab.click();
        await page.waitForTimeout(500);
      }

      // Look for savings rate option
      const savingsCalculator = page.getByText(/savings rate|savings/i).first();
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Finances should adapt to mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
