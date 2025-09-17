#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

console.log('🔧 Starting useState import fixes...');

// Get all TypeScript hook files
const files = glob.sync('src/hooks/*.{ts,tsx}', { 
  cwd: '/tmp/personalAssistant/lifesync',
  absolute: true 
});

let fixedFiles = 0;
let totalChanges = 0;

files.forEach(filePath => {
  try {
    const content = readFileSync(filePath, 'utf8');
    let newContent = content;
    let changes = 0;

    // Check if file uses useState but doesn't import it
    if (newContent.includes('useState') && !newContent.includes('import.*useState')) {
      // Check if there's already a React import line
      const reactImportMatch = newContent.match(/import\s*\{([^}]+)\}\s*from\s*['"]react['"];/);
      
      if (reactImportMatch) {
        // Add useState to existing import
        const currentImports = reactImportMatch[1];
        if (!currentImports.includes('useState')) {
          const newImports = currentImports.includes(',') 
            ? `useState, ${currentImports.trim()}`
            : `useState, ${currentImports.trim()}`;
          
          newContent = newContent.replace(
            /import\s*\{([^}]+)\}\s*from\s*['"]react['"];/,
            `import { ${newImports} } from 'react';`
          );
          changes++;
        }
      } else {
        // Add new React import at the top
        const firstImportMatch = newContent.match(/^import.*$/m);
        if (firstImportMatch) {
          newContent = newContent.replace(
            firstImportMatch[0],
            `import { useState } from 'react';\n${firstImportMatch[0]}`
          );
        } else {
          newContent = `import { useState } from 'react';\n${newContent}`;
        }
        changes++;
      }
    }

    if (changes > 0) {
      writeFileSync(filePath, newContent);
      console.log(`✅ Fixed useState import in ${filePath.split('/').pop()}`);
      fixedFiles++;
      totalChanges += changes;
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 useState import fixes complete!`);
console.log(`📁 Fixed ${fixedFiles} files`);
console.log(`🔧 Made ${totalChanges} total changes`);