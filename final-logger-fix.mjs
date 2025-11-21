import fs from 'fs';
import { glob } from 'glob';

const errorPatterns = [
  // Fix: logger.debug('Domain', 'message', { { var } }) → logger.debug('Domain', 'message', { var })
  { from: /logger\.(debug|info|warn|error)\('([^']+)', '([^']+)', \{ \{/g, to: "logger.$1('$2', '$3', {" },
  
  // Fix: logger.debug('Domain', 'message', var } }) → logger.debug('Domain', 'message', var })
  { from: /} \}/g, to: "}" },
  
  // Fix: .join(', { ') → .join(', ')
  { from: /\.join\(', \{ '\)/g, to: ".join(', ')" },
  
  // Fix: .slice(0, { N) → .slice(0, N)
  { from: /\.slice\(0, \{ (\d+)\)/g, to: ".slice(0, $1)" },
  
  // Fix: trailing ` })
  { from: /\n` \}\);/g, to: "\n`);" },
  
  // Fix: logger.debug('Domain', 'message, { var' }) → logger.debug('Domain', 'message', { var })
  { from: /logger\.(debug|info|warn|error)\('([^']+)', '([^']+), \{/g, to: "logger.$1('$2', '$3', {" },
];

const files = await glob('src/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/*.test.*', '**/logger.ts']
});

let fixed = 0;
for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf-8');
    const original = content;
    
    for (const { from, to } of errorPatterns) {
      content = content.replace(from, to);
    }
    
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf-8');
      fixed++;
      console.log(`✅ Fixed ${file}`);
    }
  } catch (err) {
    // Ignore
  }
}

console.log(`\n✅ Fixed ${fixed} files`);
