#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

const logger = {
  info: (domain, msg) => console.log(`[${domain}] ${msg}`),
};

logger.info('FixLoggerImports', '🔧 Fixing logger import paths...');

const files = glob.sync('src/**/*.{ts,tsx}', { absolute: true });

let totalFixes = 0;

files.forEach(filePath => {
  try {
    const content = readFileSync(filePath, 'utf8');

    // Only fix files that have incorrect imports
    if (content.includes("from 'services/logger'")) {
      // Calculate correct relative path based on file depth
      const relativePath = path.relative(path.dirname(filePath), path.join(path.dirname(filePath), '../../services/logger.ts'));
      const depth = filePath.split('/').filter(p => p !== '' && !p.includes('.')).length - 3; // Count depth from src/

      let correctPath;
      if (filePath.includes('/src/services/')) {
        correctPath = './logger';
      } else {
        const levels = filePath.split('/').indexOf('src');
        const upLevels = filePath.split('/').length - levels - 2;
        correctPath = '../'.repeat(upLevels) + 'services/logger';
      }

      const newContent = content.replace(/from 'services\/logger'/g, `from '${correctPath}'`);

      if (newContent !== content) {
        writeFileSync(filePath, newContent);
        totalFixes++;
        logger.info('FixLoggerImports', `✅ Fixed ${filePath.split('/').slice(-2).join('/')}`);
      }
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

logger.info('FixLoggerImports', `\n🎉 Fixed ${totalFixes} files!`);
