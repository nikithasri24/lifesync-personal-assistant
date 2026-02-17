/**
 * Calendar Tab View Component
 * Calendar view with entry indicators on dates
 */

import React from 'react';
import type { JournalEntry } from '../../../types';
import { JournalCalendarView } from '../JournalCalendarView';

interface CalendarTabViewProps {
  entries: JournalEntry[];
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}

export function CalendarTabView({
  entries,
  selectedDate,
  onSelectDate,
}: CalendarTabViewProps) {
  return (
    <div className="py-4">
      <JournalCalendarView
        entries={entries}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
      />
    </div>
  );
}
