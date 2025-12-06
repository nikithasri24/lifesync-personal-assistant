import fs from 'fs';
import { glob } from 'glob';

// Get domain from file path
function getDomain(filePath) {
  const parts = filePath.split('/');
  const filename = parts[parts.length - 1].replace(/\.(ts|tsx|js|mjs)$/, '');
  
  if (filePath.includes('/cli/')) return 'CLI';
  if (filePath.includes('/scripts/')) return 'Scripts';
  if (filePath.includes('/src/')) {
    if (filePath.includes('/services/')) return filename.charAt(0).toUpperCase() + filename.slice(1);
    if (filePath.includes('/hooks/')) return filename.replace(/^use/, '');
    if (filePath.includes('/components/')) return filename;
    if (filePath.includes('/pages/')) return filename.replace(/Page$/, '');
  }
  
  return filename.charAt(0).toUpperCase() + filename.slice(1);
}

// Calculate relative path to logger (or create simple logger for non-src files)
function getLoggerImport(filePath) {
  if (filePath.startsWith('src/')) {
    const depth = filePath.split('/').length - 2;
    const relativePath = '../'.repeat(depth) + 'services/logger';
    return `import { logger } from '${relativePath}';`;
  } else {
    // For CLI and scripts, use a simple console wrapper
    return `const logger = {
  debug: (domain, msg, ctx) => console.log(\`[\${domain}] \${msg}\`, ctx || ''),
  info: (domain, msg, ctx) => console.log(\`[\${domain}] \${msg}\`, ctx || ''),
  warn: (domain, msg, ctx) => console.warn(\`[\${domain}] \${msg}\`, ctx || ''),
  error: (domain, err, ctx) => console.error(\`[\${domain}]\`, err, ctx || ''),
};`;
  }
}

// Migrate a single file
function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  const domain = getDomain(filePath);
  
  // Skip if no console statements or already has logger
  if (!content.match(/console\.(log|error|warn|info|debug)\s*\(/)) {
    return { modified: false, changes: 0 };
  }
  
  let changes = 0;
  const lines = content.split('\n');
  const newLines = [];
  
  for (let line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and logger.ts itself
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || filePath.includes('logger.ts')) {
      newLines.push(line);
      continue;
    }
    
    // Replace console.error
    if (line.match(/console\.error\s*\(/)) {
      const match = line.match(/console\.error\s*\((.*)\);?$/);
      if (match) {
        const args = match[1];
        const indent = line.match(/^(\s*)/)[1];
        line = `${indent}logger.error('${domain}', ${args});`;
        changes++;
      }
    }
    // Replace console.warn
    else if (line.match(/console\.warn\s*\(/)) {
      const match = line.match(/console\.warn\s*\((.*)\);?$/);
      if (match) {
        const args = match[1];
        const indent = line.match(/^(\s*)/)[1];
        line = `${indent}logger.warn('${domain}', ${args});`;
        changes++;
      }
    }
    // Replace console.info
    else if (line.match(/console\.info\s*\(/)) {
      const match = line.match(/console\.info\s*\((.*)\);?$/);
      if (match) {
        const args = match[1];
        const indent = line.match(/^(\s*)/)[1];
        line = `${indent}logger.info('${domain}', ${args});`;
        changes++;
      }
    }
    // Replace console.debug
    else if (line.match(/console\.debug\s*\(/)) {
      const match = line.match(/console\.debug\s*\((.*)\);?$/);
      if (match) {
        const args = match[1];
        const indent = line.match(/^(\s*)/)[1];
        line = `${indent}logger.debug('${domain}', ${args});`;
        changes++;
      }
    }
    // Replace console.log
    else if (line.match(/console\.log\s*\(/)) {
      const match = line.match(/console\.log\s*\((.*)\);?$/);
      if (match) {
        const args = match[1];
        const indent = line.match(/^(\s*)/)[1];
        line = `${indent}logger.info('${domain}', ${args});`;
        changes++;
      }
    }
    
    newLines.push(line);
  }
  
  if (changes === 0) {
    return { modified: false, changes: 0 };
  }
  
  content = newLines.join('\n');
  
  // Add logger import/definition if not present
  const hasLogger = content.includes('logger');
  if (!hasLogger || changes > 0) {
    const loggerCode = getLoggerImport(filePath);
    
    // Find appropriate place to add logger
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find last import or first non-comment line
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('const ') || lines[i].trim().startsWith('require(')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() && !lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('/*')) {
        break;
      }
    }
    
    if (!content.includes('logger')) {
      lines.splice(insertIndex, 0, loggerCode, '');
      content = lines.join('\n');
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
  return { modified: true, changes };
}

// Main execution
async function main() {
  console.log('🚀 Migrating ALL console statements to logger...\n');
  
  const files = await glob('{scripts,cli/src}/**/*.{ts,tsx,js,mjs}', {
    ignore: ['**/node_modules/**']
  });
  
  console.log(`Found ${files.length} files to process\n`);
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  let totalChanges = 0;
  
  for (const file of files) {
    try {
      totalFiles++;
      const result = migrateFile(file);
      
      if (result.modified) {
        modifiedFiles++;
        totalChanges += result.changes;
        console.log(`✅ ${file}: ${result.changes} changes`);
      }
    } catch (error) {
      console.log(`❌ ${file}: ${error.message}`);
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`  Total files scanned: ${totalFiles}`);
  console.log(`  Files modified: ${modifiedFiles}`);
  console.log(`  Total changes: ${totalChanges}`);
  console.log('\n✅ Migration complete!');
}

main().catch(console.error);
