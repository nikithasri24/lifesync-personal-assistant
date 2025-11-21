import fs from 'fs';

const rootScripts = [
  'api-server-mock.js',
  'test-db-connection.js',
  'add-travel-category.js',
  'fix-usestate-imports.js',
  'fix-imports.js'
];

const loggerDef = `const logger = {
  debug: (domain, msg, ctx) => console.log(\`[\${domain}] \${msg}\`, ctx || ''),
  info: (domain, msg, ctx) => console.log(\`[\${domain}] \${msg}\`, ctx || ''),
  warn: (domain, msg, ctx) => console.warn(\`[\${domain}] \${msg}\`, ctx || ''),
  error: (domain, err, ctx) => console.error(\`[\${domain}]\`, err, ctx || ''),
};

`;

function getDomain(filename) {
  return filename.replace(/\.(js|mjs)$/, '').split('-').map(w => 
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join('');
}

let totalChanges = 0;

for (const file of rootScripts) {
  try {
    if (!fs.existsSync(file)) continue;
    
    let content = fs.readFileSync(file, 'utf-8');
    const domain = getDomain(file);
    let changes = 0;
    
    // Skip if no console or already has logger  
    if (!content.includes('console.') || content.includes('const logger =')) {
      continue;
    }
    
    const lines = content.split('\n');
    const newLines = [];
    
    for (let line of lines) {
      // Replace console statements
      if (line.match(/console\.log\s*\(/)) {
        line = line.replace(/console\.log\(/g, `logger.info('${domain}', `);
        changes++;
      } else if (line.match(/console\.error\s*\(/)) {
        line = line.replace(/console\.error\(/g, `logger.error('${domain}', `);
        changes++;
      } else if (line.match(/console\.warn\s*\(/)) {
        line = line.replace(/console\.warn\(/g, `logger.warn('${domain}', `);
        changes++;
      } else if (line.match(/console\.info\s*\(/)) {
        line = line.replace(/console\.info\(/g, `logger.info('${domain}', `);
        changes++;
      }
      
      newLines.push(line);
    }
    
    if (changes > 0) {
      content = loggerDef + newLines.join('\n');
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`✅ ${file}: ${changes} changes`);
      totalChanges += changes;
    }
  } catch (err) {
    console.log(`❌ ${file}: ${err.message}`);
  }
}

console.log(`\n✅ Total changes in root scripts: ${totalChanges}`);
