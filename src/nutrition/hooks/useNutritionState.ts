/**
 * Nutrition State Hook
 * Manages tab navigation for nutrition tracking
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NutritionTabView = 'tracker' | 'dashboard';

interface NutritionState {
  activeTab: NutritionTabView;
  setActiveTab: (tab: NutritionTabView) => void;
}

export const useNutritionState = create<NutritionState>()(
  persist(
    (set) => ({
      activeTab: 'tracker',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'nutrition-state',
    }
  )
);
