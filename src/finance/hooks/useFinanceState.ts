/**
 * Finance State Hook
 * Manages tab navigation for the finance feature
 */

import { useState } from 'react';

export type FinanceTabView = 'dashboard' | 'accounts' | 'transactions' | 'budgets';

export function useFinanceState() {
  const [activeTab, setActiveTab] = useState<FinanceTabView>('dashboard');

  return {
    activeTab,
    setActiveTab,
  };
}
