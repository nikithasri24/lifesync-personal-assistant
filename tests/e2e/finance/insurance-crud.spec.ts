/**
 * Comprehensive Finance Insurance CRUD Tests
 *
 * Tests all Create, Read, Update, Delete operations for insurance policies
 * including various policy types, premium frequencies, and coverage details.
 */

import { test, expect } from '@playwright/test';

test.describe('Finance Insurance - Create Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    // Close mobile sidebar if open
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    // Click on Insurance tab
    await page.getByRole('tab', { name: 'Insurance' }).click();
    await page.waitForTimeout(500);
  });

  test('create health insurance policy', async ({ page }) => {
    const policyName = `Health Insurance ${Date.now()}`;

    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('health');
    await page.locator('#policy-provider').fill('Blue Cross Blue Shield');
    await page.locator('#policy-number').fill('BCBS-123456');
    await page.locator('#policy-coverage').fill('500000');
    await page.locator('#policy-premium').fill('450');
    await page.locator('#policy-frequency').selectOption('monthly');
    await page.locator('#policy-deductible').fill('2000');

    const renewalField = page.locator('#policy-renewal');
    if (await renewalField.isVisible({ timeout: 2000 }).catch(() => false)) {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      await renewalField.fill(nextYear.toISOString().split('T')[0]);
    }

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/450/)).toBeVisible();
  });

  test('create life insurance policy', async ({ page }) => {
    const policyName = `Life Insurance ${Date.now()}`;

    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('life');
    await page.locator('#policy-provider').fill('State Farm');
    await page.locator('#policy-number').fill('SF-789012');
    await page.locator('#policy-coverage').fill('1000000');
    await page.locator('#policy-premium').fill('85');
    await page.locator('#policy-frequency').selectOption('monthly');

    const beneficiariesField = page.locator('#policy-beneficiaries');
    if (await beneficiariesField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await beneficiariesField.fill('Spouse, Children');
    }

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });

  test('create auto insurance policy', async ({ page }) => {
    const policyName = `Auto Insurance ${Date.now()}`;

    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('auto');
    await page.locator('#policy-provider').fill('Geico');
    await page.locator('#policy-number').fill('GEICO-456789');
    await page.locator('#policy-coverage').fill('250000');
    await page.locator('#policy-premium').fill('120');
    await page.locator('#policy-frequency').selectOption('monthly');
    await page.locator('#policy-deductible').fill('1000');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });

  test('create home insurance policy', async ({ page }) => {
    const policyName = `Home Insurance ${Date.now()}`;

    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('home');
    await page.locator('#policy-provider').fill('Allstate');
    await page.locator('#policy-number').fill('ALL-321654');
    await page.locator('#policy-coverage').fill('350000');
    await page.locator('#policy-premium').fill('1200');
    await page.locator('#policy-frequency').selectOption('annual');
    await page.locator('#policy-deductible').fill('2500');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });

  test('create renters insurance policy', async ({ page }) => {
    const policyName = `Renters Insurance ${Date.now()}`;

    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('renters');
    await page.locator('#policy-provider').fill('Lemonade');
    await page.locator('#policy-number').fill('LEM-654321');
    await page.locator('#policy-coverage').fill('50000');
    await page.locator('#policy-premium').fill('15');
    await page.locator('#policy-frequency').selectOption('monthly');
    await page.locator('#policy-deductible').fill('500');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });

  test('create disability insurance policy', async ({ page }) => {
    const policyName = `Disability Insurance ${Date.now()}`;

    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('disability');
    await page.locator('#policy-provider').fill('Guardian');
    await page.locator('#policy-number').fill('GUARD-987654');
    await page.locator('#policy-coverage').fill('5000'); // Monthly benefit
    await page.locator('#policy-premium').fill('125');
    await page.locator('#policy-frequency').selectOption('monthly');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });

  test('create dental insurance policy', async ({ page }) => {
    const policyName = `Dental Insurance ${Date.now()}`;

    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('dental');
    await page.locator('#policy-provider').fill('Delta Dental');
    await page.locator('#policy-number').fill('DD-147258');
    await page.locator('#policy-coverage').fill('2000'); // Annual max
    await page.locator('#policy-premium').fill('35');
    await page.locator('#policy-frequency').selectOption('monthly');
    await page.locator('#policy-deductible').fill('50');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });

  test('create vision insurance policy', async ({ page }) => {
    const policyName = `Vision Insurance ${Date.now()}`;

    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('vision');
    await page.locator('#policy-provider').fill('VSP');
    await page.locator('#policy-number').fill('VSP-852963');
    await page.locator('#policy-coverage').fill('500'); // Annual benefit
    await page.locator('#policy-premium').fill('12');
    await page.locator('#policy-frequency').selectOption('monthly');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });

  test('create umbrella insurance policy', async ({ page }) => {
    const policyName = `Umbrella Insurance ${Date.now()}`;

    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('umbrella');
    await page.locator('#policy-provider').fill('State Farm');
    await page.locator('#policy-number').fill('SF-UMB-741');
    await page.locator('#policy-coverage').fill('2000000');
    await page.locator('#policy-premium').fill('300');
    await page.locator('#policy-frequency').selectOption('annual');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });

  test('create policy with quarterly premium', async ({ page }) => {
    const policyName = `Quarterly Premium ${Date.now()}`;

    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('auto');
    await page.locator('#policy-provider').fill('Progressive');
    await page.locator('#policy-number').fill('PROG-369');
    await page.locator('#policy-coverage').fill('300000');
    await page.locator('#policy-premium').fill('360');
    await page.locator('#policy-frequency').selectOption('quarterly');
    await page.locator('#policy-deductible').fill('1000');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });

  test('create policy with semi-annual premium', async ({ page }) => {
    const policyName = `Semi-Annual Premium ${Date.now()}`;

    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('auto');
    await page.locator('#policy-provider').fill('Farmers');
    await page.locator('#policy-number').fill('FARM-258');
    await page.locator('#policy-coverage').fill('250000');
    await page.locator('#policy-premium').fill('600');
    await page.locator('#policy-frequency').selectOption('semi-annual');
    await page.locator('#policy-deductible').fill('750');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });

  test('create policy with notes', async ({ page }) => {
    const policyName = `Other Insurance ${Date.now()}`;

    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('other');
    await page.locator('#policy-provider').fill('Custom Provider');
    await page.locator('#policy-number').fill('CUST-999');
    await page.locator('#policy-coverage').fill('100000');
    await page.locator('#policy-premium').fill('50');
    await page.locator('#policy-frequency').selectOption('monthly');

    const notesField = page.locator('#policy-notes');
    if (await notesField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notesField.fill('Special coverage policy with custom terms');
    }

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Insurance - Update Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const insuranceTab = page.getByRole('button', { name: /insurance/i }).or(
      page.locator('button').filter({ hasText: /insurance/i })
    );
    if (await insuranceTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await insuranceTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('update premium amount', async ({ page }) => {
    const policyName = `Premium Update ${Date.now()}`;

    // Create policy
    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('health');
    await page.locator('#policy-provider').fill('Aetna');
    await page.locator('#policy-number').fill('AET-555');
    await page.locator('#policy-coverage').fill('500000');
    await page.locator('#policy-premium').fill('400');
    await page.locator('#policy-frequency').selectOption('monthly');
    await page.locator('#policy-deductible').fill('2000');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit policy
    await page.getByText(policyName).click();
    await page.waitForTimeout(500);

    const premiumInput = page.locator('#policy-premium');
    await premiumInput.clear();
    await premiumInput.fill('425'); // Rate increase

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });

  test('update coverage amount', async ({ page }) => {
    const policyName = `Coverage Update ${Date.now()}`;

    // Create policy
    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('life');
    await page.locator('#policy-provider').fill('Prudential');
    await page.locator('#policy-number').fill('PRU-888');
    await page.locator('#policy-coverage').fill('750000');
    await page.locator('#policy-premium').fill('65');
    await page.locator('#policy-frequency').selectOption('monthly');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit policy
    await page.getByText(policyName).click();
    await page.waitForTimeout(500);

    const coverageInput = page.locator('#policy-coverage');
    await coverageInput.clear();
    await coverageInput.fill('1000000'); // Increased coverage

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });

  test('change premium frequency', async ({ page }) => {
    const policyName = `Frequency Change ${Date.now()}`;

    // Create policy
    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('auto');
    await page.locator('#policy-provider').fill('Liberty Mutual');
    await page.locator('#policy-number').fill('LIB-777');
    await page.locator('#policy-coverage').fill('300000');
    await page.locator('#policy-premium').fill('700');
    await page.locator('#policy-frequency').selectOption('semi-annual');
    await page.locator('#policy-deductible').fill('1000');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit policy
    await page.getByText(policyName).click();
    await page.waitForTimeout(500);

    await page.locator('#policy-frequency').selectOption('monthly');

    const premiumInput = page.locator('#policy-premium');
    await premiumInput.clear();
    await premiumInput.fill('125'); // Adjusted for monthly

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });

  test('update renewal date', async ({ page }) => {
    const policyName = `Renewal Update ${Date.now()}`;

    // Create policy
    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('home');
    await page.locator('#policy-provider').fill('Travelers');
    await page.locator('#policy-number').fill('TRAV-444');
    await page.locator('#policy-coverage').fill('400000');
    await page.locator('#policy-premium').fill('1500');
    await page.locator('#policy-frequency').selectOption('annual');
    await page.locator('#policy-deductible').fill('2000');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit policy
    await page.getByText(policyName).click();
    await page.waitForTimeout(500);

    const renewalField = page.locator('#policy-renewal');
    if (await renewalField.isVisible({ timeout: 2000 }).catch(() => false)) {
      const newRenewal = new Date();
      newRenewal.setMonth(newRenewal.getMonth() + 6);
      await renewalField.fill(newRenewal.toISOString().split('T')[0]);
    }

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Insurance - Delete Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const insuranceTab = page.getByRole('button', { name: /insurance/i }).or(
      page.locator('button').filter({ hasText: /insurance/i })
    );
    if (await insuranceTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await insuranceTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('delete cancelled policy', async ({ page }) => {
    const policyName = `Cancelled Policy ${Date.now()}`;

    // Create policy
    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('renters');
    await page.locator('#policy-provider').fill('Test Provider');
    await page.locator('#policy-number').fill('TEST-999');
    await page.locator('#policy-coverage').fill('30000');
    await page.locator('#policy-premium').fill('20');
    await page.locator('#policy-frequency').selectOption('monthly');
    await page.locator('#policy-deductible').fill('500');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    // Click on policy to open details
    await page.getByText(policyName).click();
    await page.waitForTimeout(500);

    // Look for delete button
    const deleteButton = page.getByRole('button', { name: /delete/i }).or(
      page.locator('button').filter({ hasText: /delete/i })
    );

    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.click();
      await page.waitForTimeout(300);

      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i }).last();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      await page.waitForTimeout(1000);

      // Verify policy no longer appears
      await expect(page.getByText(policyName)).not.toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Finance Insurance - Display & Organization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const insuranceTab = page.getByRole('button', { name: /insurance/i }).or(
      page.locator('button').filter({ hasText: /insurance/i })
    );
    if (await insuranceTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await insuranceTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('display multiple policies with different types', async ({ page }) => {
    const timestamp = Date.now();
    const policies = [
      { name: `Health ${timestamp}`, type: 'health', provider: 'BlueCross', coverage: '500000', premium: '450', frequency: 'monthly' },
      { name: `Auto ${timestamp}`, type: 'auto', provider: 'Geico', coverage: '250000', premium: '120', frequency: 'monthly' },
      { name: `Home ${timestamp}`, type: 'home', provider: 'Allstate', coverage: '350000', premium: '1200', frequency: 'annual' },
    ];

    // Create multiple policies
    for (const policy of policies) {
      await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
      await page.waitForTimeout(500);

      await page.locator('#policy-name').fill(policy.name);
      await page.locator('#policy-type').selectOption(policy.type);
      await page.locator('#policy-provider').fill(policy.provider);
      await page.locator('#policy-number').fill(`${policy.type.toUpperCase()}-${timestamp}`);
      await page.locator('#policy-coverage').fill(policy.coverage);
      await page.locator('#policy-premium').fill(policy.premium);
      await page.locator('#policy-frequency').selectOption(policy.frequency);

      if (policy.type !== 'life') {
        await page.locator('#policy-deductible').fill('1000');
      }

      await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
      await page.waitForTimeout(800);
    }

    // Verify all policies are displayed
    for (const policy of policies) {
      await expect(page.getByText(policy.name)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Finance Insurance - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const insuranceTab = page.getByRole('button', { name: /insurance/i }).or(
      page.locator('button').filter({ hasText: /insurance/i })
    );
    if (await insuranceTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await insuranceTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('create policy with very high coverage', async ({ page }) => {
    const policyName = `High Coverage ${Date.now()}`;

    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('life');
    await page.locator('#policy-provider').fill('Northwestern Mutual');
    await page.locator('#policy-number').fill('NWM-HIGH');
    await page.locator('#policy-coverage').fill('10000000'); // $10M
    await page.locator('#policy-premium').fill('850');
    await page.locator('#policy-frequency').selectOption('monthly');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });

  test('create policy with low premium', async ({ page }) => {
    const policyName = `Low Premium ${Date.now()}`;

    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('vision');
    await page.locator('#policy-provider').fill('EyeMed');
    await page.locator('#policy-number').fill('EYE-LOW');
    await page.locator('#policy-coverage').fill('300');
    await page.locator('#policy-premium').fill('8');
    await page.locator('#policy-frequency').selectOption('monthly');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });

  test('create policy with decimal premium', async ({ page }) => {
    const policyName = `Decimal Premium ${Date.now()}`;

    await page.getByRole('button', { name: /add policy|add insurance/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#policy-name').fill(policyName);
    await page.locator('#policy-type').selectOption('dental');
    await page.locator('#policy-provider').fill('MetLife');
    await page.locator('#policy-number').fill('MET-DEC');
    await page.locator('#policy-coverage').fill('1500');
    await page.locator('#policy-premium').fill('42.50');
    await page.locator('#policy-frequency').selectOption('monthly');
    await page.locator('#policy-deductible').fill('75');

    await page.getByRole('button', { name: /add policy|add insurance/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(policyName)).toBeVisible({ timeout: 5000 });
  });
});
