import React from 'react';
import NationalParksMap from '../components/NationalParksMap';
import '../styles/leaflet-custom.css';

/**
 * Example implementation of the National Parks Map component
 * 
 * This demonstrates how to integrate the interactive map into your application.
 * The component is fully self-contained and handles all internal state management.
 */

const NationalParksExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Optional: Add your own header/navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900">
            My National Parks Explorer
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Discover and explore America's most beautiful national parks
          </p>
        </div>
      </header>

      {/* The main map component */}
      <main className="h-[calc(100vh-88px)]">
        <NationalParksMap />
      </main>

      {/* Optional: Add footer or additional content */}
    </div>
  );
};

// Alternative: Fullscreen implementation
export const FullscreenNationalParksMap: React.FC = () => {
  return (
    <div className="w-full h-screen">
      <NationalParksMap />
    </div>
  );
};

// Alternative: Embedded implementation with fixed height
export const EmbeddedNationalParksMap: React.FC = () => {
  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <NationalParksMap />
    </div>
  );
};

export default NationalParksExample;