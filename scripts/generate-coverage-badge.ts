/**
 * Generate Coverage Badge
 *
 * Reads coverage summary and generates a local coverage badge
 *
 * Usage:
 *   npx tsx scripts/generate-coverage-badge.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CoverageSummary {
  total: {
    lines: { total: number; covered: number; skipped: number; pct: number };
    statements: { total: number; covered: number; skipped: number; pct: number };
    functions: { total: number; covered: number; skipped: number; pct: number };
    branches: { total: number; covered: number; skipped: number; pct: number };
  };
}

function getColor(percentage: number): string {
  if (percentage >= 80) return 'brightgreen';
  if (percentage >= 60) return 'yellow';
  if (percentage >= 40) return 'orange';
  return 'red';
}

function generateBadge(label: string, message: string, color: string): string {
  return `https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(message)}-${color}`;
}

function main() {
  const summaryPath = path.join(__dirname, '../coverage/coverage-summary.json');

  if (!fs.existsSync(summaryPath)) {
    console.error('❌ Coverage summary not found. Run `npm run test:coverage` first.');
    process.exit(1);
  }

  const summary: CoverageSummary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  const { lines, statements, functions, branches } = summary.total;

  console.log('\n📊 Coverage Summary:');
  console.log('==========================================');
  console.log(`Lines:      ${lines.pct.toFixed(2)}% (${lines.covered}/${lines.total})`);
  console.log(`Statements: ${statements.pct.toFixed(2)}% (${statements.covered}/${statements.total})`);
  console.log(`Functions:  ${functions.pct.toFixed(2)}% (${functions.covered}/${functions.total})`);
  console.log(`Branches:   ${branches.pct.toFixed(2)}% (${branches.covered}/${branches.total})`);
  console.log('==========================================\n');

  // Generate badge URLs
  const badges = {
    overall: generateBadge('coverage', `${lines.pct.toFixed(1)}%`, getColor(lines.pct)),
    lines: generateBadge('lines', `${lines.pct.toFixed(1)}%`, getColor(lines.pct)),
    statements: generateBadge('statements', `${statements.pct.toFixed(1)}%`, getColor(statements.pct)),
    functions: generateBadge('functions', `${functions.pct.toFixed(1)}%`, getColor(functions.pct)),
    branches: generateBadge('branches', `${branches.pct.toFixed(1)}%`, getColor(branches.pct)),
  };

  // Save badges to file
  const badgesPath = path.join(__dirname, '../coverage/badges.json');
  fs.writeFileSync(badgesPath, JSON.stringify(badges, null, 2));

  console.log('✅ Coverage badges generated!');
  console.log(`📁 Saved to: ${badgesPath}\n`);

  // Generate markdown for README
  const markdown = `
## Test Coverage

![Coverage](${badges.overall})
![Lines](${badges.lines})
![Statements](${badges.statements})
![Functions](${badges.functions})
![Branches](${badges.branches})

| Metric | Coverage |
|--------|----------|
| Lines | ${lines.pct.toFixed(2)}% |
| Statements | ${statements.pct.toFixed(2)}% |
| Functions | ${functions.pct.toFixed(2)}% |
| Branches | ${branches.pct.toFixed(2)}% |
`;

  const readmePath = path.join(__dirname, '../coverage/COVERAGE_BADGE.md');
  fs.writeFileSync(readmePath, markdown);

  console.log('📝 Markdown badges saved to: coverage/COVERAGE_BADGE.md');
  console.log('   Copy this to your README.md:\n');
  console.log(markdown);

  // Check thresholds
  const thresholds = {
    lines: 60,
    statements: 60,
    functions: 55,
    branches: 50,
  };

  let failed = false;
  console.log('\n🎯 Threshold Check:');
  console.log('==========================================');

  Object.entries(thresholds).forEach(([metric, threshold]) => {
    const actual = summary.total[metric as keyof typeof summary.total].pct;
    const pass = actual >= threshold;
    const icon = pass ? '✅' : '❌';
    console.log(`${icon} ${metric.padEnd(12)} ${actual.toFixed(2)}% (threshold: ${threshold}%)`);
    if (!pass) failed = true;
  });

  console.log('==========================================\n');

  if (failed) {
    console.error('🚨 Coverage is below threshold! Add more tests.\n');
    process.exit(1);
  } else {
    console.log('✅ All coverage thresholds met!\n');
  }
}

main();
