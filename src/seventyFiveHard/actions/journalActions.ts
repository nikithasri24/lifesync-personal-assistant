/**
 * 75 Hard Journal Integration Actions
 *
 * Handles automatic journal entry creation from completed 75 Hard days
 */

import { startOfDay, isSameDay, format } from 'date-fns';
import { logger } from '../../services/logger';
import { getStore } from '../utils/storeHelpers';

/**
 * Create a journal entry from a completed 75 Hard day
 * Called when all tasks for a day are completed
 */
export async function create75HardJournalEntry(dayNumber: number) {
  const { sfhChallenge: challenge, sfhCheckIns: checkIns } = getStore();
  if (!challenge) return;

  const today = startOfDay(new Date());
  const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

  if (!todayCheckIn) {
    logger.info('SeventyFiveHardActions', '[75Hard→Journal] No check-in for today, skipping journal entry');
    return;
  }

  // Only create entry if all tasks are complete
  const allComplete = todayCheckIn.taskCompletions.every(tc => tc.completed);
  if (!allComplete) {
    logger.info('SeventyFiveHardActions', '[75Hard→Journal] Not all tasks complete, skipping journal entry');
    return;
  }

  try {
    const store = getStore();

    // Check if journal entry already exists for today
    const existingEntry = store.journalEntries.find(entry => {
      return entry.tags.includes('75hard') &&
        entry.tags.includes(`75hard:day-${dayNumber}`) &&
        isSameDay(entry.createdAt, today);
    });

    if (existingEntry) {
      logger.info('SeventyFiveHardActions', '[75Hard→Journal] Journal entry already exists for today');
      return;
    }

    // Build journal content
    const tasksList = challenge.tasks.map((task, index) => {
      return `${index + 1}. ✅ ${task.title}${task.description ? ` (${task.description})` : ''}`;
    }).join('\n');

    const weightSection = todayCheckIn.weight
      ? `\n**Weight:** ${todayCheckIn.weight.toFixed(1)} kg\n`
      : '';

    const notesSection = todayCheckIn.notes
      ? `\n**Notes:**\n${todayCheckIn.notes}\n`
      : '';

    const content = `# 75 Hard - Day ${dayNumber}

**Date:** ${format(today, 'MMMM d, yyyy')}

## Tasks Completed

${tasksList}
${weightSection}${notesSection}
---

*Keep pushing! ${75 - dayNumber} days to go!* 💪`;

    // Add photo as attachment if exists
    const attachments = todayCheckIn.photo ? [
      {
        id: `75hard-day-${dayNumber}-photo`,
        name: `Day ${dayNumber} Progress Photo`,
        type: 'image' as const,
        url: todayCheckIn.photo,
      }
    ] : [];

    // Create journal entry
    await store.addJournalEntry({
      title: `75 Hard - Day ${dayNumber}`,
      content,
      mood: 'good' as const, // Default to good mood for completing all tasks
      tags: [
        '75hard',
        `75hard:day-${dayNumber}`,
        `75hard:challenge-${challenge.id}`,
        'fitness',
        'challenge'
      ],
      attachments,
    });

    logger.info('75Hard→Journal', `✅ Created journal entry for Day ${dayNumber}`);
  } catch (error) {
    logger.error('SeventyFiveHardActions', '[75Hard→Journal] Error creating journal entry:', error);
  }
}
