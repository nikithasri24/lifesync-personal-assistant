/**
 * Shared State Hook
 * Manages tab navigation for the shared feature
 */

import { useState } from 'react';

export type SharedTabView = 'partner' | 'invites' | 'activity';

export function useSharedState() {
  const [activeTab, setActiveTab] = useState<SharedTabView>('partner');

  return {
    activeTab,
    setActiveTab,
  };
}
