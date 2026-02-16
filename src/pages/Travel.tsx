import React from 'react';
import { FeatureErrorBoundary } from '../components/FeatureErrorBoundary';

const TravelPage = React.lazy(() => import('../travel/pages/TravelPage'));

const Travel: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Travel">
      <React.Suspense fallback={<div>Loading travel...</div>}>
        <TravelPage />
      </React.Suspense>
    </FeatureErrorBoundary>
  );
};

export default Travel;
