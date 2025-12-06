import fs from 'fs';
import { glob } from 'glob';

// Get domain name from file path
function getDomainFromPath(filePath) {
  const parts = filePath.split('/');
  const filename = parts[parts.length - 1].replace(/\.(ts|tsx)$/, '');
  
  if (filePath.includes('/services/')) return filename.charAt(0).toUpperCase() + filename.slice(1);
  if (filePath.includes('/hooks/')) return filename.replace(/^use/, '');
  if (filePath.includes('/components/')) return filename;
  if (filePath.includes('/pages/')) return filename.replace(/Page$/, '');
  if (filePath.includes('/stores/')) return filename.replace(/(Store|Actions|use)/g, '');
  if (filePath.includes('/utils/')) return 'Utils';
  if (filePath.includes('/finance/')) return 'Finance';
  if (filePath.includes('/travel/')) return 'Travel';
  if (filePath.includes('/goals/')) return 'Goals';
  
  return filename.charAt(0).toUpperCase() + filename.slice(1);
}

// Calculate relative path to logger
function getLoggerImportPath(filePath) {
  const depth = filePath.split('/src/')[1]?.split('/').length - 1 || 0;
  return '../'.repeat(depth) + 'services/logger';
}

// Migrate a single file
function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const domain = getDomainFromPath(filePath);
  
  // Skip if no console statements
  if (!content.match(/console\.(log|error|warn|info|debug)\s*\(/)) {
    return { modified: false, changes: 0 };
  }
  
  let changes = 0;
  const lines = content.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      newLines.push(line);
      continue;
    }
    
    // Match and replace console statements
    const consoleMatch = line.match(/console\.(error|warn|info|debug|log)\s*\((.*)\);?$/);
    if (consoleMatch) {
      const logType = consoleMatch[1];
      const args = consoleMatch[2];
      const indent = line.match(/^(\s*)/)[1];
      const parts = args.split(',').map(s => s.trim());
      
      // Determine logger method
      const loggerMethod = logType === 'log' ? 'debug' : logType;
      
      if (parts.length === 1) {
        line = `${indent}logger.${loggerMethod}('${domain}', ${parts[0]});`;
      } else {
        const message = parts[0];
        const context = parts.slice(1).join(', ');
        line = `${indent}logger.${loggerMethod}('${domain}', ${message}, { ${context} });`;
      }
      changes++;
    }
    
    newLines.push(line);
  }
  
  if (changes === 0) {
    return { modified: false, changes: 0 };
  }
  
  content = newLines.join('\n');
  
  // Add logger import if not present
  const hasLogger = content.includes("import { logger }");
  
  if (!hasLogger) {
    const importPath = getLoggerImportPath(filePath);
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, `import { logger } from '${importPath}';`);
      content = lines.join('\n');
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
  return { modified: true, changes };
}

// Main execution
async function main() {
  console.log('🚀 Starting console → logger migration...\n');
  
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/logger.ts',
      '**/test/**',
      '**/setup.ts'
    ]
  });
  
  console.log(`Found ${files.length} files to process\n`);
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  let totalChanges = 0;
  const errors = [];
  
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
      errors.push({ file, error: error.message });
      console.log(`❌ ${file}: ${error.message}`);
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`  Total files scanned: ${totalFiles}`);
  console.log(`  Files modified: ${modifiedFiles}`);
  console.log(`  Total changes: ${totalChanges}`);
  console.log(`  Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(({ file, error }) => {
      console.log(`  ${file}: ${error}`);
    });
  }
  
  console.log('\n✅ Migration complete!');
}

main().catch(console.error);
