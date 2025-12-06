/**
 * Re-sync 75 Hard todos to fix undefined task names
 * Run this once to update existing todos with correct task titles
 */

import { ensureSFHTodosForToday } from '../stores/seventyFiveHardActions';

async function resync() {
  console.log('Re-syncing 75 Hard todos...');

  try {
    await ensureSFHTodosForToday();
    console.log('✅ Re-sync complete!');
  } catch (error) {
    console.error('❌ Re-sync failed:', error);
  }
}

// Run the resync
resync();
