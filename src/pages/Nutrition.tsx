/**
 * Nutrition Page
 * Food logging with photo upload, AI nutrition analysis, and goal tracking
 */

import React from 'react';
import { FeatureErrorBoundary } from '../components/FeatureErrorBoundary';
import { useThemeColors } from '@/hooks/useThemeColors';
import { NutritionTracker } from '@/components/nutrition/NutritionTracker';

const Nutrition: React.FC = () => {
  const colors = useThemeColors();

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
            padding: '60px 0 20px',
            color: 'white',
            marginBottom: '16px',
          }}
        >
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
              🍽️ Nutrition
            </h1>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Track your meals & macros
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem 5rem' }}>
          <NutritionTracker />
        </div>
      </div>
    </FeatureErrorBoundary>
  );
};

export default Nutrition;

