const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'tests/e2e/finance/transactions-crud.spec.ts',
    replacements: [
      {
        from: "await page.getByRole('button', { name: /^Transactions$/i }).click();",
        to: "await page.getByRole('tab', { name: 'Transactions' }).click();"
      }
    ]
  },
  {
    file: 'tests/e2e/finance/budgets-crud.spec.ts',
    replacements: [
      {
        from: "await page.getByRole('button', { name: /^Budgets$/i }).click();",
        to: "await page.getByRole('tab', { name: 'Budgets' }).click();"
      }
    ]
  },
  {
    file: 'tests/e2e/finance/goals-crud.spec.ts',
    replacements: [
      {
        from: "await page.getByRole('button', { name: /^Goals$/i }).click();",
        to: "await page.getByRole('tab', { name: 'Goals' }).click();"
      }
    ]
  },
  {
    file: 'tests/e2e/finance/loans-crud.spec.ts',
    replacements: [
      {
        from: "await page.getByRole('button', { name: /^Loans$/i }).click();",
        to: "await page.getByRole('tab', { name: 'Loans' }).click();"
      }
    ]
  },
  {
    file: 'tests/e2e/finance/credit-cards-crud.spec.ts',
    replacements: [
      {
        from: "await page.getByRole('button', { name: /^Credit Cards$/i }).click();",
        to: "await page.getByRole('tab', { name: 'Credit Cards' }).click();"
      }
    ]
  },
  {
    file: 'tests/e2e/finance/insurance-crud.spec.ts',
    replacements: [
      {
        from: "await page.getByRole('button', { name: /^Insurance$/i }).click();",
        to: "await page.getByRole('tab', { name: 'Insurance' }).click();"
      }
    ]
  }
];

fixes.forEach(({ file, replacements }) => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  replacements.forEach(({ from, to }) => {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✓ Fixed ${path.basename(file)}`);
  } else {
    console.log(`⚠ No changes needed in ${path.basename(file)}`);
  }
});

console.log('\nAll files processed!');
