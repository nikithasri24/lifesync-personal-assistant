import React, { type ReactElement } from 'react';

interface JournalEntry {
  mood?: string;
  [key: string]: unknown;
}

interface MoodTrendsSectionProps {
  journalEntries: JournalEntry[];
}

/**
 * Mood trends visualization section
 */
export function MoodTrendsSection({
  journalEntries,
}: MoodTrendsSectionProps): React.ReactElement | null {
  if (journalEntries.length === 0) {
    return null;
  }

  const moodEmojis: Record<string, string> = {
    excellent: '😄',
    good: '😊',
    neutral: '😐',
    bad: '😟',
    terrible: '😢'
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Trends</h3>
      <div className="grid grid-cols-5 gap-4">
        {(['excellent', 'good', 'neutral', 'bad', 'terrible'] as const).map((mood): ReactElement => {
          const count = journalEntries.filter((entry): boolean => entry.mood === mood).length;
          const percentage = journalEntries.length > 0 ? (count / journalEntries.length) * 100 : 0;

          return (
            <div key={mood} className="text-center">
              <div className="text-2xl mb-2">{moodEmojis[mood]}</div>
              <div className="text-sm font-medium text-gray-900 capitalize">{mood}</div>
              <div className="text-lg font-bold text-gray-600">{count}</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div
                  className="bg-blue-600 h-1 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
