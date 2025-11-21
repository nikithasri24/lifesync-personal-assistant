#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const logger = {
  info: (domain, msg) => console.log(`[${domain}] ${msg}`),
  error: (domain, err, ctx) => console.error(`[${domain}]`, err, ctx || ''),
};

logger.info('FixDestructuring', '🔧 Fixing destructuring syntax...');

const files = glob.sync('src/api/*.ts', { absolute: true });

let totalFixes = 0;

files.forEach(filePath => {
  try {
    const content = readFileSync(filePath, 'utf8');

    // Fix: const { data: { user } = await
    // To:   const { data: { user } } = await
    const newContent = content.replace(
      /const { data: { user } = await/g,
      'const { data: { user } } = await'
    );

    if (newContent !== content) {
      const fixes = (content.match(/const { data: { user } = await/g) || []).length;
      writeFileSync(filePath, newContent);
      logger.info('FixDestructuring', `✅ Fixed ${fixes} occurrences in ${filePath.split('/').pop()}`);
      totalFixes += fixes;
    }
  } catch (error) {
    logger.error('FixDestructuring', `Error processing ${filePath}:`, error.message);
  }
});

logger.info('FixDestructuring', `\n🎉 Fixed ${totalFixes} total destructuring issues!`);
