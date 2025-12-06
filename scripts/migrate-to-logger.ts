#!/usr/bin/env tsx
/**
 * Automated script to migrate console.* statements to logger
 */

import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

// Get domain from file path
function getDomain(filePath: string): string {
  const parts = filePath.split('/');
  const filename = parts[parts.length - 1].replace(/\.(ts|tsx)$/, '');
  
  if (filePath.includes('/services/')) return filename.charAt(0).toUpperCase() + filename.slice(1);
  if (filePath.includes('/hooks/')) return filename.replace(/^use/, '');
  if (filePath.includes('/components/')) return filename;
  if (filePath.includes('/pages/')) return filename.replace(/Page$/, '');
  if (filePath.includes('/stores/')) return filename.replace(/(Store|use)/, '');
  
  return filename.charAt(0).toUpperCase() + filename.slice(1);
}

// Process file
function processFile(filePath: string): number {
  let content = readFileSync(filePath, 'utf-8');
  const original = content;
  const domain = getDomain(filePath);
  
  // Skip if no console statements
  if (!content.match(/console\.(log|error|warn|info|debug)\(/)) {
    return 0;
  }
  
  // Add logger import if needed
  const hasLoggerImport = content.includes("import { logger }");
  if (!hasLoggerImport) {
    const depth = filePath.split('/src/')[1]?.split('/').length - 1 || 0;
    const relativePath = '../'.repeat(depth) + 'services/logger';
    const importLine = `import { logger } from '${relativePath}';\n`;
    
    // Find last import
    const lines = content.split('\n');
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) lastImportIndex = i;
    }
    
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importLine);
      content = lines.join('\n');
    }
  }
  
  // Replace console statements
  content = content.replace(/console\.error\((.*?)\)/g, (match, args) => {
    if (args.match(/^(error|err|e)\b/)) {
      return `logger.error('${domain}', ${args})`;
    }
    return `logger.error('${domain}', new Error(${args}))`;
  });
  
  content = content.replace(/console\.warn\((.*?)\)/g, `logger.warn('${domain}', $1)`);
  content = content.replace(/console\.info\((.*?)\)/g, `logger.info('${domain}', $1)`);
  content = content.replace(/console\.debug\((.*?)\)/g, `logger.debug('${domain}', $1)`);
  content = content.replace(/console\.log\((.*?)\)/g, `logger.debug('${domain}', $1)`);
  
  if (content !== original) {
    writeFileSync(filePath, content, 'utf-8');
    return 1;
  }
  
  return 0;
}

// Main
const files = globSync('src/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*', '**/logger.ts']
});

console.log(`Processing ${files.length} files...`);
let modified = 0;

for (const file of files) {
  try {
    modified += processFile(file);
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
}

console.log(`Modified ${modified} files`);
