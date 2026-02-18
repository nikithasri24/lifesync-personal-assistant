/**
 * Visa Calculator Page
 * Main page for visa-free travel calculations
 *
 * Note: This page can be accessed via:
 * 1. Direct route: /travel/visa (needs full container with padding)
 * 2. Tab in Travel.tsx: already has container (just needs content)
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { useThemeColors } from '@/hooks/useThemeColors';
import VisaCalculator from '../components/VisaCalculator';

const VisaPage: React.FC = () => {
  const colors = useThemeColors();
  const location = useLocation();

  // Check if accessed via direct route /travel/visa
  const isDirectRoute = location.pathname === '/travel/visa';

  // If accessed directly, provide full container with padding
  // If accessed via tabs, Travel.tsx already provides the container
  if (isDirectRoute) {
    return (
      <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
          <VisaCalculator />
        </div>
      </div>
    );
  }

  // When accessed via tabs, just return the component
  return <VisaCalculator />;
};

export default VisaPage;
