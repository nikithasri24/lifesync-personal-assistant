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
        {/* Header with Terracotta Gradient */}
        <div
          style={{
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            padding: '60px 20px 20px',
            color: 'white',
            marginBottom: '16px',
          }}
        >
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
            🍽️ Nutrition
          </h1>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Track your meals & macros
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            background: 'rgba(92, 74, 58, 0.1)',
            borderRadius: '12px',
            padding: '4px',
            margin: '16px 20px',
          }}
        >
          <SegmentedControl
            segments={[
              { value: 'tracker', label: 'Log Food' },
              { value: 'dashboard', label: 'Dashboard' },
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as NutritionTabView)}
          />
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

