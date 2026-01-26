import React from 'react';

const PersonalCarePage = React.lazy(() => import('../personal-care/pages/PersonalCarePage'));

const PersonalCare: React.FC = () => {
  return (
    <React.Suspense fallback={<div>Loading personal care...</div>}>
      <PersonalCarePage />
    </React.Suspense>
  );
};

export default PersonalCare;

