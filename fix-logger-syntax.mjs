import fs from 'fs';
import { glob } from 'glob';

// Fix files with syntax errors
const fixes = {
  'src/finance/components/ImportCSVButton.tsx': [
    {from: /, { error } \)/g, to: ', error })'}
  ],
  'src/travel/utils/findMissingCountries.ts': [
    {from: /, { result } \)/g, to: ', result })'}
  ],
  'src/travel/utils/testVisaBasedAccess.ts': [
    {from: /, { result } \)/g, to: ', result })'}
  ],
  'src/travel/utils/testVisaData.ts': [
    {from: /import {\nimport { logger } from '[^']+';/g, to: "import { logger } from '../../../services/logger';"}
  ]
};

for (const [file, replacements] of Object.entries(fixes)) {
  try {
    let content = fs.readFileSync(file, 'utf-8');
    for (const {from, to} of replacements) {
      content = content.replace(from, to);
    }
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`✅ Fixed ${file}`);
  } catch (err) {
    console.log(`❌ Error fixing ${file}: ${err.message}`);
  }
}

// General fix: remove invalid logger patterns
const files = await glob('src/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/*.test.*', '**/logger.ts']
});

let fixed = 0;
for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf-8');
    const original = content;
    
    // Fix: { { x, y } } → { x, y }
    content = content.replace(/\{ \{/g, '{');
    content = content.replace(/\} \}/g, '}');
    
    // Fix: "string, { something } )" → "string", { something })
    content = content.replace(/logger\.(debug|info|warn|error)\('[^']*', '([^']*)', \{/g, "logger.$1('$2', {");
    
    // Fix duplicate logger imports in middle of other imports
    content = content.replace(/import \{\nimport \{ logger \} from '[^']+';/g, "import { logger } from '../services/logger';\nimport {");
    
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf-8');
      fixed++;
      console.log(`✅ Fixed ${file}`);
    }
  } catch (err) {
    // Ignore
  }
}

console.log(`\n✅ Fixed ${fixed} files with syntax errors`);
