/**
 * Visa Calculator Page
 * Main page for visa-free travel calculations
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import VisaCalculator from '../components/VisaCalculator';

const VisaPage: React.FC = () => {
  const colors = useThemeColors();

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      {/* All content centered with max width */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        <VisaCalculator />
      </div>
    </div>
  );
};

export default VisaPage;
