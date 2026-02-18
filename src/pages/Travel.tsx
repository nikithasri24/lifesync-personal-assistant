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
const BucketListPage = React.lazy(() => import('../travel/pages/BucketListPage'));

const Travel: React.FC = () => {
  const colors = useThemeColors();
  const { activeTab, setActiveTab } = useTravelState();

  return (
    <FeatureErrorBoundary feature="Travel">
      <div
        style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}
        data-testid="travel-container"
      >
        {/* All content centered with max width */}
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '5rem' }}>
          {/* Header with Terracotta Gradient */}
          <div
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              padding: '60px 1.5rem 20px',
              color: 'white',
              marginBottom: '16px',
              borderRadius: '0 0 16px 16px',
            }}
          >
            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
              ✈️ Travel
            </h1>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Track your adventures worldwide
            </div>
          </div>

          <div style={{ padding: '0 1.5rem' }}>
            {/* Tab Navigation */}
            <div
              style={{
                background: 'rgba(92, 74, 58, 0.1)',
                borderRadius: '12px',
                padding: '4px',
                marginBottom: '16px',
              }}
            >
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

            {/* Tab Content */}
            <div>
              <React.Suspense
                fallback={
                  <div className="text-center py-12" style={{ color: colors.text.tertiary }}>
                    Loading...
                  </div>
                }
              >
                {activeTab === 'map' && <TravelMapPage />}
                {activeTab === 'visa' && <VisaPage />}
                {activeTab === 'bucketlist' && <BucketListPage />}
              </React.Suspense>
            </div>
          </div>
        </div>
      </div>
    </FeatureErrorBoundary>
  );
};

export default Travel;
