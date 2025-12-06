import React from 'react';

const SkincarePage = React.lazy(() => import('../skincare/pages/SkincarePage'));

const Skincare: React.FC = () => {
  return (
    <React.Suspense fallback={<div>Loading skincare...</div>}>
      <SkincarePage />
    </React.Suspense>
  );
};

export default Skincare;
