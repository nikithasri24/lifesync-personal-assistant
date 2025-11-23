/**
 * 75 Hard Journal Integration Actions
 *
 * Handles automatic journal entry creation from completed 75 Hard days
 */

import { startOfDay, isSameDay, format } from 'date-fns';
import { logger } from '../../services/logger';
import { getStore } from '../utils/storeHelpers';
import { createJournalEntry } from '../../api/journalAPI';
import type { SeventyFiveHardChallenge, DailyCheckIn } from '../../types/seventyFiveHard';
import type { Attachment } from '../../types';

/**
 * Create a journal entry from a completed 75 Hard day
 * Called when all tasks for a day are completed
 */
export async function create75HardJournalEntry(dayNumber: number): Promise<void> {
  const store = getStore();
  const challenge = store.sfhChallenge;
  const checkIns = store.sfhCheckIns;

  if (!challenge) return;

  const today = startOfDay(new Date());
  const todayCheckIn = checkIns.find((c: DailyCheckIn) => isSameDay(c.date, today));

  if (!todayCheckIn) {
    void logger.info('SeventyFiveHardActions', '[75Hard→Journal] No check-in for today, skipping journal entry');
    return;
  }

  // Only create entry if all tasks are complete
  const allComplete = todayCheckIn.taskCompletions.every((tc) => tc.completed);
  if (!allComplete) {
    void logger.info('SeventyFiveHardActions', '[75Hard→Journal] Not all tasks complete, skipping journal entry');
    return;
  }

  try {
    // Note: Journal entry check removed since we're now using the journal API directly
    // The API will handle duplicate detection if needed

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
${weightSection}${notesSection}---

*Keep pushing! ${75 - dayNumber} days to go!* 💪`;

    // Add photo as attachment if exists
    const attachments: Attachment[] = todayCheckIn.photo ? [
      {
        id: `75hard-day-${dayNumber}-photo`,
        name: `Day ${dayNumber} Progress Photo`,
        type: 'image' as const,
        url: todayCheckIn.photo,
      }
    ] : [];

    // Create journal entry using the API
    await createJournalEntry({
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

    void logger.info('75Hard→Journal', `✅ Created journal entry for Day ${dayNumber}`);
  } catch (error) {
    void logger.error('SeventyFiveHardActions', '[75Hard→Journal] Error creating journal entry:', error);
  }
}