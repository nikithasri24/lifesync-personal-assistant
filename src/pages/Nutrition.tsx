/**
 * Nutrition Page
 * Food logging with photo upload, AI nutrition analysis, and goal tracking
 */

import React from 'react';
import { Utensils } from 'lucide-react';
import { FeatureErrorBoundary } from '../components/FeatureErrorBoundary';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useNutritionState, type NutritionTabView } from '@/nutrition/hooks/useNutritionState';
import { NutritionTracker } from '@/components/nutrition/NutritionTracker';
import { NutritionDashboard } from '@/components/nutrition/NutritionDashboard';

const Nutrition: React.FC = () => {
  const colors = useThemeColors();
  const { activeTab, setActiveTab } = useNutritionState();

  return (
    <FeatureErrorBoundary feature="Nutrition">
      <div
        style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}
        data-testid="nutrition-container"
      >
        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: colors.bg.primary }}>
          <div className="px-6 pt-4 pb-3">
            <div className="flex items-center gap-2 mb-4">
              <Utensils size={24} style={{ color: colors.accent.start }} />
              <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                Nutrition
              </h1>
            </div>

            {/* Tab Navigation */}
            <SegmentedControl
              segments={[
                { value: 'tracker', label: 'Log Food' },
                { value: 'dashboard', label: 'Dashboard' },
              ]}
              value={activeTab}
              onChange={(value) => setActiveTab(value as NutritionTabView)}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-6">
          {activeTab === 'tracker' && <NutritionTracker />}
          {activeTab === 'dashboard' && <NutritionDashboard />}
        </div>
      </div>
    </FeatureErrorBoundary>
  );
};

export default Nutrition;

