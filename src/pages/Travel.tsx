/**
 * Travel Page
 * Track visited locations, trips, and visa requirements
 */

import React from 'react';
import { Plane } from 'lucide-react';
import { FeatureErrorBoundary } from '../components/FeatureErrorBoundary';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useTravelState, type TravelTabView } from '@/travel/hooks/useTravelState';

// Lazy load page components
const TravelMapPage = React.lazy(() => import('../travel/pages/TravelPage'));
const VisaPage = React.lazy(() => import('../travel/pages/VisaPage'));

const Travel: React.FC = () => {
  const colors = useThemeColors();
  const { activeTab, setActiveTab } = useTravelState();

  return (
    <FeatureErrorBoundary feature="Travel">
      <div
        style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}
        data-testid="travel-container"
      >
        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: colors.bg.primary }}>
          <div className="px-6 pt-4 pb-3">
            <div className="flex items-center gap-2 mb-4">
              <Plane size={24} style={{ color: colors.accent.start }} />
              <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                Travel
              </h1>
            </div>

            {/* Tab Navigation */}
            <SegmentedControl
              segments={[
                { value: 'map', label: 'Map' },
                { value: 'visa', label: 'Visa' },
                { value: 'bucketlist', label: 'Bucket List' },
              ]}
              value={activeTab}
              onChange={(value) => setActiveTab(value as TravelTabView)}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-6">
          <React.Suspense
            fallback={
              <div className="text-center py-12" style={{ color: colors.text.tertiary }}>
                Loading...
              </div>
            }
          >
            {activeTab === 'map' && <TravelMapPage />}
            {activeTab === 'visa' && <VisaPage />}
            {activeTab === 'bucketlist' && (
              <div className="px-6 py-12 text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
                  Bucket List Coming Soon
                </h3>
                <p className="text-sm" style={{ color: colors.text.tertiary }}>
                  Create and track your dream destinations
                </p>
              </div>
            )}
          </React.Suspense>
        </div>
      </div>
    </FeatureErrorBoundary>
  );
};

export default Travel;
