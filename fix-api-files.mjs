import fs from 'fs';
import { glob } from 'glob';

const files = await glob('src/api/**/*.ts');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  const original = content;
  
  // Fix: const { data: { user } = await ... → const { data: { user } } = await ...
  content = content.replace(/const { data: { user } = await/g, 'const { data: { user } } = await');
  
  // Fix: const { data = await ... → const { data } = await ...
  content = content.replace(/const { data = await/g, 'const { data } = await');
  
  // Fix: const { data: note = await ... → const { data: note } = await ...
  content = content.replace(/const { data: (\w+) = await/g, 'const { data: $1 } = await');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`✅ Fixed ${file}`);
  }
}

console.log('✅ All API files fixed');
