/**
 * Travel State Hook
 * Manages tab navigation for the travel feature
 */

import { useState } from 'react';

export type TravelTabView = 'map' | 'trips' | 'visa' | 'bucketlist';

export function useTravelState() {
  const [activeTab, setActiveTab] = useState<TravelTabView>('map');

  return {
    activeTab,
    setActiveTab,
  };
}
