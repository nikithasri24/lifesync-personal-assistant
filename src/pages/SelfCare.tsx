import React from 'react';

const SelfCarePage = React.lazy(() => import('../skincare/pages/SkincarePage'));

const SelfCare: React.FC = () => {
  return (
    <React.Suspense fallback={<div>Loading self care...</div>}>
      <SelfCarePage />
    </React.Suspense>
  );
};

export default SelfCare;

