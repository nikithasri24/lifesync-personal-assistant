/**
 * Finance State Hook
 * Manages tab navigation for the finance feature
 */

import { useState } from 'react';

export type FinanceTabView =
  | 'dashboard'
  | 'accounts'
  | 'transactions'
  | 'budgets'
  | 'recurring'
  | 'networth'
  | 'goals'
  | 'loans'
  | 'retirement'
  | 'projections'
  | 'calculators'
  | 'creditcards'
  | 'insurance'
  | 'timeline';

export function useFinanceState() {
  const [activeTab, setActiveTabState] = useState<FinanceTabView>(() => {
    const hash = window.location.hash.replace('#', '') as FinanceTabView;
    const valid: FinanceTabView[] = ['dashboard','accounts','transactions','budgets','recurring','networth','goals','loans','retirement','projections','calculators','creditcards','insurance','timeline'];
    return valid.includes(hash) ? hash : 'dashboard';
  });

  const setActiveTab = (tab: FinanceTabView) => {
    window.location.hash = tab;
    setActiveTabState(tab);
  };

  return { activeTab, setActiveTab };
}
