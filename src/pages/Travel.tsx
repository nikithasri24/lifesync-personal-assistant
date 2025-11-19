import React from 'react';

const TravelPage = React.lazy(() => import('../travel/pages/TravelPage'));

const Travel: React.FC = () => {
  return (
    <React.Suspense fallback={<div>Loading travel...</div>}>
      <TravelPage />
    </React.Suspense>
  );
};

export default Travel;
