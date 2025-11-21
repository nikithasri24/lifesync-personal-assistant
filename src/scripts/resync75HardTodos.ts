/**
 * Re-sync 75 Hard todos to fix undefined task names
 * Run this once to update existing todos with correct task titles
 */

import { ensure75HardTodosForToday } from '../seventyFiveHard/actions';
import { logger } from '../services/logger';

async function resync() {
  logger.debug('Resync75HardTodos', 'Re-syncing 75 Hard todos...');

  try {
    await ensure75HardTodosForToday();
    logger.debug('Resync75HardTodos', '✅ Re-sync complete!');
  } catch (error) {
    logger.error('❌ Re-sync failed:', { error });
  }
}

// Run the resync
resync();
