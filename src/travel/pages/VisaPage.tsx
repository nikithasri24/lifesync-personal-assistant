/**
 * Visa Calculator Page
 * Main page for visa-free travel calculations
 */

import React from 'react';
import VisaCalculator from '../components/VisaCalculator';

const VisaPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <VisaCalculator />
    </div>
  );
};

export default VisaPage;
