/**
 * Route Error Boundary
 * 
 * Wraps route components with FeatureErrorBoundary for better error isolation
 * Prevents errors in one route from crashing the entire application
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FeatureErrorBoundary } from './FeatureErrorBoundary';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  feature: string;
}

export const RouteErrorBoundary: React.FC<RouteErrorBoundaryProps> = ({ children, feature }) => {
  const navigate = useNavigate();

  const handleReset = React.useCallback(() => {
    // Reload the current route
    window.location.reload();
  }, []);

  const handleBack = React.useCallback(() => {
    // Navigate back to dashboard
    navigate('/');
  }, [navigate]);

  return (
    <FeatureErrorBoundary
      feature={feature}
      onReset={handleReset}
      onBack={handleBack}
    >
      {children}
    </FeatureErrorBoundary>
  );
};

