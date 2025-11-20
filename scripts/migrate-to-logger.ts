/**
 * Migration Script: Console to Logger
 *
 * Intelligently replaces console.* calls with logger.* calls
 * Preserves domain tags and context
 */

import * as fs from 'fs';
import * as path from 'path';

interface Replacement {
  file: string;
  line: number;
  from: string;
  to: string;
}

const replacements: Replacement[] = [];

/**
 * Extract domain from console message
 * Examples:
 *   "[LifeSync] message" -> "LifeSync"
 *   "[Store] message" -> "Store"
 *   "[75Hard] message" -> "75Hard"
 *   "Failed to load" -> "App" (default)
 */
function extractDomain(message: string): string {
  const tagMatch = message.match(/^\[([^\]]+)\]/);
  if (tagMatch) {
    return tagMatch[1];
  }

  // Try to infer from context
  if (message.includes('Supabase')) return 'Supabase';
  if (message.includes('Auth')) return 'Auth';
  if (message.includes('Store')) return 'Store';

  return 'App'; // Default domain
}

/**
 * Clean message by removing domain tag
 * "[LifeSync] Failed" -> "Failed"
 */
function cleanMessage(message: string): string {
  return message.replace(/^\[[^\]]+\]\s*/, '');
}

/**
 * Convert console.log to logger.debug
 */
function replaceConsoleLog(line: string): string {
  // Pattern: console.log('[Domain] message', ...args)
  const match = line.match(/console\.log\((.*?)\)/);
  if (!match) return line;

  const args = match[1];

  // Extract first argument (the message)
  const firstArgMatch = args.match(/^(['"`])(.+?)\1/);
  if (!firstArgMatch) {
    // Simple replacement if we can't parse
    return line.replace('console.log', 'logger.debug');
  }

  const message = firstArgMatch[2];
  const domain = extractDomain(message);
  const cleanedMessage = cleanMessage(message);
  const remainingArgs = args.substring(firstArgMatch[0].length).replace(/^,\s*/, '');

  // Build new logger call
  let newCall = `logger.debug('${domain}', '${cleanedMessage}'`;
  if (remainingArgs) {
    newCall += `, { data: ${remainingArgs} }`;
  }
  newCall += ')';

  return line.replace(/console\.log\(.*?\)/, newCall);
}

/**
 * Convert console.error to logger.error
 */
function replaceConsoleError(line: string): string {
  // Pattern: console.error('[Domain] message', error)
  const match = line.match(/console\.error\((.*?)\)/);
  if (!match) return line;

  const args = match[1];

  // Extract first argument (the message)
  const firstArgMatch = args.match(/^(['"`])(.+?)\1/);
  if (!firstArgMatch) {
    // Simple replacement if we can't parse
    return line.replace('console.error', 'logger.error');
  }

  const message = firstArgMatch[2];
  const domain = extractDomain(message);
  const cleanedMessage = cleanMessage(message);
  const remainingArgs = args.substring(firstArgMatch[0].length).replace(/^,\s*/, '');

  // Build new logger call
  let newCall = `logger.error('${domain}', `;

  // If second arg looks like an Error object, use it
  if (remainingArgs && (remainingArgs.includes('error') || remainingArgs.includes('Error') || remainingArgs.includes('e)'))) {
    newCall += `${remainingArgs.split(',')[0].trim()}`;
    const context = remainingArgs.split(',').slice(1).join(',').trim();
    if (context) {
      newCall += `, { context: '${cleanedMessage}', ${context} }`;
    } else {
      newCall += `, { context: '${cleanedMessage}' }`;
    }
  } else {
    newCall += `new Error('${cleanedMessage}')`;
    if (remainingArgs) {
      newCall += `, { data: ${remainingArgs} }`;
    }
  }

  newCall += ')';

  return line.replace(/console\.error\(.*?\)/, newCall);
}

/**
 * Convert console.warn to logger.warn
 */
function replaceConsoleWarn(line: string): string {
  // Similar to console.error
  const match = line.match(/console\.warn\((.*?)\)/);
  if (!match) return line;

  const args = match[1];
  const firstArgMatch = args.match(/^(['"`])(.+?)\1/);
  if (!firstArgMatch) {
    return line.replace('console.warn', 'logger.warn');
  }

  const message = firstArgMatch[2];
  const domain = extractDomain(message);
  const cleanedMessage = cleanMessage(message);
  const remainingArgs = args.substring(firstArgMatch[0].length).replace(/^,\s*/, '');

  let newCall = `logger.warn('${domain}', '${cleanedMessage}'`;
  if (remainingArgs) {
    newCall += `, { data: ${remainingArgs} }`;
  }
  newCall += ')';

  return line.replace(/console\.warn\(.*?\)/, newCall);
}

console.log('✅ Migration script created');
console.log('This script shows the pattern for replacing console statements');
console.log('Actual replacement will be done with sed commands for safety');
