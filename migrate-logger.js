const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Get domain name from file path
function getDomainFromPath(filePath) {
  const parts = filePath.split('/');
  const filename = parts[parts.length - 1].replace(/\.(ts|tsx)$/, '');
  
  if (filePath.includes('/services/')) {
    return filename.charAt(0).toUpperCase() + filename.slice(1);
  }
  if (filePath.includes('/hooks/')) {
    return filename.replace(/^use/, '');
  }
  if (filePath.includes('/components/')) {
    return filename;
  }
  if (filePath.includes('/pages/')) {
    return filename.replace(/Page$/, '');
  }
  if (filePath.includes('/stores/')) {
    return filename.replace(/(Store|Actions|use)/g, '');
  }
  if (filePath.includes('/utils/')) {
    return 'Utils';
  }
  if (filePath.includes('/finance/')) {
    return 'Finance';
  }
  if (filePath.includes('/travel/')) {
    return 'Travel';
  }
  if (filePath.includes('/goals/')) {
    return 'Goals';
  }
  
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
  const original = content;
  const domain = getDomainFromPath(filePath);
  
  // Skip if no console statements
  if (!content.match(/console\.(log|error|warn|info|debug)\s*\(/)) {
    return { modified: false, changes: 0 };
  }
  
  let changes = 0;
  
  // Split into lines for processing
  const lines = content.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Skip comments
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      newLines.push(line);
      continue;
    }
    
    // Match console.error
    if (line.match(/console\.error\s*\(/)) {
      const match = line.match(/console\.error\s*\((.*)\);?$/);
      if (match) {
        const args = match[1];
        const indent = line.match(/^(\s*)/)[1];
        
        // Try to extract message and context
        const parts = args.split(',').map(s => s.trim());
        if (parts.length === 1) {
          line = `${indent}logger.error('${domain}', new Error(${parts[0]}));`;
        } else if (parts.length === 2) {
          // Check if second arg is an error object
          if (parts[1].match(/^(error|err|e)$/)) {
            line = `${indent}logger.error('${domain}', ${parts[1]}, { message: ${parts[0]} });`;
          } else {
            line = `${indent}logger.error('${domain}', new Error(${parts[0]}), { context: ${parts[1]} });`;
          }
        } else {
          const message = parts[0];
          const context = parts.slice(1).join(', ');
          line = `${indent}logger.error('${domain}', new Error(${message}), { ${context} });`;
        }
        changes++;
      }
    }
    
    // Match console.warn
    else if (line.match(/console\.warn\s*\(/)) {
      const match = line.match(/console\.warn\s*\((.*)\);?$/);
      if (match) {
        const args = match[1];
        const indent = line.match(/^(\s*)/)[1];
        const parts = args.split(',').map(s => s.trim());
        
        if (parts.length === 1) {
          line = `${indent}logger.warn('${domain}', ${parts[0]});`;
        } else {
          const message = parts[0];
          const context = parts.slice(1).join(', ');
          line = `${indent}logger.warn('${domain}', ${message}, { ${context} });`;
        }
        changes++;
      }
    }
    
    // Match console.info
    else if (line.match(/console\.info\s*\(/)) {
      const match = line.match(/console\.info\s*\((.*)\);?$/);
      if (match) {
        const args = match[1];
        const indent = line.match(/^(\s*)/)[1];
        const parts = args.split(',').map(s => s.trim());
        
        if (parts.length === 1) {
          line = `${indent}logger.info('${domain}', ${parts[0]});`;
        } else {
          const message = parts[0];
          const context = parts.slice(1).join(', ');
          line = `${indent}logger.info('${domain}', ${message}, { ${context} });`;
        }
        changes++;
      }
    }
    
    // Match console.debug
    else if (line.match(/console\.debug\s*\(/)) {
      const match = line.match(/console\.debug\s*\((.*)\);?$/);
      if (match) {
        const args = match[1];
        const indent = line.match(/^(\s*)/)[1];
        const parts = args.split(',').map(s => s.trim());
        
        if (parts.length === 1) {
          line = `${indent}logger.debug('${domain}', ${parts[0]});`;
        } else {
          const message = parts[0];
          const context = parts.slice(1).join(', ');
          line = `${indent}logger.debug('${domain}', ${message}, { ${context} });`;
        }
        changes++;
      }
    }
    
    // Match console.log
    else if (line.match(/console\.log\s*\(/)) {
      const match = line.match(/console\.log\s*\((.*)\);?$/);
      if (match) {
        const args = match[1];
        const indent = line.match(/^(\s*)/)[1];
        const parts = args.split(',').map(s => s.trim());
        
        if (parts.length === 1) {
          line = `${indent}logger.debug('${domain}', ${parts[0]});`;
        } else {
          const message = parts[0];
          const context = parts.slice(1).join(', ');
          line = `${indent}logger.debug('${domain}', ${message}, { ${context} });`;
        }
        changes++;
      }
    }
    
    newLines.push(line);
  }
  
  if (changes === 0) {
    return { modified: false, changes: 0 };
  }
  
  content = newLines.join('\n');
  
  // Add logger import if not present
  const hasLoggerImport = content.includes("import { logger }") || 
                          content.includes("from './logger'") ||
                          content.includes("from '../logger'") ||
                          content.includes("from '../../logger'") ||
                          content.includes("from '../../../logger'");
  
  if (!hasLoggerImport) {
    const importPath = getLoggerImportPath(filePath);
    const importLine = `import { logger } from '${importPath}';\n`;
    
    // Find last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importLine);
      content = lines.join('\n');
    }
  }
  
  // Write back
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
  console.log('\nNext steps:');
  console.log('1. Run: npm run build');
  console.log('2. Fix any TypeScript errors');
  console.log('3. Test the application');
  console.log('4. Commit the changes');
}

main().catch(console.error);
