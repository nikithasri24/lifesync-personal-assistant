/**
 * Meals State Hook
 * Manages tab navigation and view state for the meal planning feature
 */

import { useState } from 'react';

export type TabView = 'today' | 'week' | 'recipes' | 'grocery';

export function useMealsState() {
  const [activeTab, setActiveTab] = useState<TabView>('today');

  return {
    activeTab,
    setActiveTab,
  };
}
