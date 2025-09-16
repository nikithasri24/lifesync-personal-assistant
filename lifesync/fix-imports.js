#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

console.log('🔧 Starting automated import cleanup...');

// Get all TypeScript React files
const files = glob.sync('src/**/*.{ts,tsx}', { 
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

    // Fix 1: Remove unused React import when no React-specific features are used
    // Only keep React import if we use React.something
    if (newContent.includes("import React,") && !newContent.includes("React.")) {
      newContent = newContent.replace(/import React,\s*{([^}]+)}\s*from\s*['"]react['"];/, "import {$1} from 'react';");
      changes++;
    }

    // Fix 2: Remove standalone React import if not used
    if (newContent.includes("import React from 'react';") && !newContent.includes("React.")) {
      newContent = newContent.replace(/import React from ['"]react['"];\s*\n/, "");
      changes++;
    }

    // Fix 3: Remove unused useState if not used
    if (newContent.includes("useState") && !newContent.includes("useState(")) {
      newContent = newContent.replace(/,?\s*useState,?/, "");
      changes++;
    }

    // Fix 4: Remove unused useEffect if not used
    if (newContent.includes("useEffect") && !newContent.includes("useEffect(")) {
      newContent = newContent.replace(/,?\s*useEffect,?/, "");
      changes++;
    }

    // Fix 5: Clean up empty import braces
    newContent = newContent.replace(/import\s*{\s*}\s*from\s*['"]react['"];\s*\n/, "");

    // Fix 6: Clean up trailing commas in imports
    newContent = newContent.replace(/{\s*,\s*([^}]+)}/g, "{ $1 }");
    newContent = newContent.replace(/{\s*([^}]+),\s*}/g, "{ $1 }");

    if (changes > 0) {
      writeFileSync(filePath, newContent);
      console.log(`✅ Fixed ${changes} import issues in ${filePath.split('/').pop()}`);
      fixedFiles++;
      totalChanges += changes;
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Import cleanup complete!`);
console.log(`📁 Fixed ${fixedFiles} files`);
console.log(`🔧 Made ${totalChanges} total changes`);