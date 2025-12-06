import React, { lazy, Suspense } from 'react';
import '../styles/leaflet-custom.css';

// Lazy load the map component to defer loading Leaflet
const NationalParksMap = lazy(() => import('../components/NationalParksMap'));

const NationalParks: React.FC = () => {
  return (
    <div className="w-full h-screen">
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">Loading map...</p>
          </div>
        </div>
      }>
        <NationalParksMap />
      </Suspense>
    </div>
  );
};

export default NationalParks;