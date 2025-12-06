#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const logger = {
  info: (domain, msg) => console.log(`[${domain}] ${msg}`),
  error: (domain, err, ctx) => console.error(`[${domain}]`, err, ctx || ''),
};

logger.info('FixAllSyntax', '🔧 Fixing all remaining syntax issues...');

const files = glob.sync('src/**/*.{ts,tsx}', { absolute: true });

let totalFixes = 0;
const filesFix = [];

files.forEach(filePath => {
  try {
    const content = readFileSync(filePath, 'utf8');
    let newContent = content;
    let fixes = 0;

    // Fix 1: const { data: { user } = await -> const { data: { user } } = await
    const before1 = newContent;
    newContent = newContent.replace(/const { data: { user } = await/g, 'const { data: { user } } = await');
    if (newContent !== before1) fixes++;

    // Fix 2: Missing closing braces in arrow functions with try-catch
    // Pattern: } catch { return {} -> } catch { return {} } }
    const before2 = newContent;
    newContent = newContent.replace(/} catch { return {}\)/g, '} catch { return {} } })');
    if (newContent !== before2) fixes++;

    // Fix 3: Missing closing braces in object literals inside onChange
    // Pattern: { ...meta, [code]: { ...meta[code], key: value }; saveMeta
    // To: { ...meta, [code]: { ...meta[code], key: value } }; saveMeta
    const before3 = newContent;
    newContent = newContent.replace(
      /{ \.\.\.meta, \[(\w+)\.code\]: { \.\.\.meta\[\1\.code\], (\w+): ([^}]+) }; saveMeta/g,
      '{ ...meta, [$1.code]: { ...meta[$1.code], $2: $3 } }; saveMeta'
    );
    if (newContent !== before3) fixes++;

    // Fix 4: Missing closing braces in arrow functions
    // Pattern: () => { ... if (x) { ... } -> () => { ... if (x) { ... } }
    const before4 = newContent;
    newContent = newContent.replace(/\) => { ([^}]+) if \(inertiaId\) { cancelAnimationFrame\(inertiaId\); setInertiaId\(null\) }/g,
      ') => { $1 if (inertiaId) { cancelAnimationFrame(inertiaId); setInertiaId(null) } }');
    if (newContent !== before4) fixes++;

    if (fixes > 0 && newContent !== content) {
      writeFileSync(filePath, newContent);
      filesFix.push(filePath.split('/').pop());
      totalFixes += fixes;
      logger.info('FixAllSyntax', `✅ Fixed ${fixes} issues in ${filePath.split('/').pop()}`);
    }
  } catch (error) {
    logger.error('FixAllSyntax', `Error processing ${filePath}:`, error.message);
  }
});

logger.info('FixAllSyntax', `\n🎉 Fixed ${totalFixes} syntax issues across ${filesFix.length} files!`);
if (filesFix.length > 0) {
  logger.info('FixAllSyntax', `Files: ${filesFix.join(', ')}`);
}
