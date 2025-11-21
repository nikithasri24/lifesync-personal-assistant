#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const logger = {
  info: (domain, msg) => console.log(`[${domain}] ${msg}`),
  error: (domain, err) => console.error(`[${domain}]`, err),
};

logger.info('MigrateRemaining', '🔧 Migrating remaining files to logger...');

const files = [
  'src/stores/seventyFiveHardActions.ts',
  'src/stores/seventyFiveHardStore.ts',
  'src/stores/useRealAppStore.ts',
  'src/pages/MealPlanning.tsx',
  'src/pages/ShoppingSmart.tsx',
  'src/travel/components/LeafletTravelMap.tsx',
  'src/travel/components/MappackerStyleMap.tsx',
  'src/travel/components/InteractiveWorldMap.tsx',
  'src/travel/utils/findMissingCountries.ts',
  'src/finance/components/ImportCSVButton.tsx',
  'src/finance/components/budgets/BudgetEditor.tsx',
  'src/finance/pages/BudgetsPage.tsx',
  'src/finance/utils/budgetRecommendations.ts',
  'src/services/focus/FocusService.ts',
  'src/hooks/useFocus.ts',
  'src/hooks/useConversationalVoice.ts',
  'src/shared/api/connectionsAPI.ts',
  'src/scripts/runFinanceMigrations.ts',
  'src/scripts/cleanup75HardDuplicates.ts',
  'src/scripts/importFinanceCSV.ts',
  'src/scripts/addTravelCategory.ts',
];

function getDomain(filePath) {
  const fileName = path.basename(filePath, path.extname(filePath));
  // Convert camelCase/PascalCase to proper domain name
  return fileName
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function getRelativePath(filePath) {
  const depth = filePath.split('/').length - 2; // Count from src/
  return '../'.repeat(depth) + 'services/logger';
}

let totalChanges = 0;
let filesChanged = 0;

files.forEach(filePath => {
  try {
    const fullPath = filePath;
    const content = readFileSync(fullPath, 'utf8');
    let newContent = content;
    const domain = getDomain(filePath);

    // Check if logger is already imported
    const hasLoggerImport = content.includes("from '../services/logger") ||
                           content.includes("from '../../services/logger") ||
                           content.includes("from '../../../services/logger") ||
                           content.includes("from '../../../../services/logger");

    // Add logger import if needed
    if (!hasLoggerImport && !content.includes('import { logger }')) {
      const relativePath = getRelativePath(filePath);
      const importStatement = `import { logger } from '${relativePath}';\n`;

      // Find first import statement and add after it
      const importMatch = content.match(/^import .+;$/m);
      if (importMatch) {
        const firstImport = importMatch[0];
        newContent = newContent.replace(firstImport, `${firstImport}\n${importStatement}`);
      } else {
        // No imports, add at top
        newContent = importStatement + newContent;
      }
    }

    // Replace console statements
    const changes = [
      // console.log -> logger.info
      { from: /console\.log\(\s*`\[([^\]]+)\]\s*([^`]+)`/g, to: "logger.info('$1', `$2`" },
      { from: /console\.log\(\s*`\[([^\]]+)\]([^`]*)`\s*,\s*([^)]+)\)/g, to: "logger.info('$1', `$2`, $3)" },
      { from: /console\.log\(\s*'([^']+)'\s*,\s*([^)]+)\)/g, to: `logger.info('${domain}', '$1', $2)` },
      { from: /console\.log\(\s*"([^"]+)"\s*,\s*([^)]+)\)/g, to: `logger.info('${domain}', "$1", $2)` },
      { from: /console\.log\(\s*'([^']+)'\s*\)/g, to: `logger.info('${domain}', '$1')` },
      { from: /console\.log\(\s*"([^"]+)"\s*\)/g, to: `logger.info('${domain}', "$1")` },
      { from: /console\.log\(/g, to: `logger.debug('${domain}', ` },

      // console.error -> logger.error
      { from: /console\.error\(\s*`\[([^\]]+)\]\s*([^`]+)`/g, to: "logger.error('$1', `$2`" },
      { from: /console\.error\(\s*`\[([^\]]+)\]([^`]*)`\s*,\s*([^)]+)\)/g, to: "logger.error('$1', `$2`, $3)" },
      { from: /console\.error\(\s*'([^']+)'\s*,\s*([^)]+)\)/g, to: `logger.error('${domain}', '$1', $2)` },
      { from: /console\.error\(\s*"([^"]+)"\s*,\s*([^)]+)\)/g, to: `logger.error('${domain}', "$1", $2)` },
      { from: /console\.error\(/g, to: `logger.error('${domain}', ` },

      // console.warn -> logger.warn
      { from: /console\.warn\(\s*`\[([^\]]+)\]\s*([^`]+)`/g, to: "logger.warn('$1', `$2`" },
      { from: /console\.warn\(/g, to: `logger.warn('${domain}', ` },

      // console.debug -> logger.debug
      { from: /console\.debug\(/g, to: `logger.debug('${domain}', ` },
    ];

    let changeCount = 0;
    changes.forEach(({ from, to }) => {
      const before = newContent;
      newContent = newContent.replace(from, to);
      if (newContent !== before) changeCount++;
    });

    if (newContent !== content) {
      writeFileSync(fullPath, newContent);
      logger.info('MigrateRemaining', `✅ Migrated ${filePath} (${changeCount} patterns)`);
      filesChanged++;
      totalChanges += changeCount;
    }
  } catch (error) {
    logger.error('MigrateRemaining', `Error processing ${filePath}: ${error.message}`);
  }
});

logger.info('MigrateRemaining', `\n🎉 Migration complete!`);
logger.info('MigrateRemaining', `Files changed: ${filesChanged}`);
logger.info('MigrateRemaining', `Total changes: ${totalChanges}`);
