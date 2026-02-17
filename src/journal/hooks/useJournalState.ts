/**
 * Journal State Hook
 * Manages tab navigation for the journal feature
 */

import { useState } from 'react';

export type JournalTabView = 'entries' | 'calendar' | 'insights' | 'tags';

export function useJournalState() {
  const [activeTab, setActiveTab] = useState<JournalTabView>('entries');

  return {
    activeTab,
    setActiveTab,
  };
}
