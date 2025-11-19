/**
 * TravelPage - Interactive travel tracking with full OpenStreetMap integration
 * Shows cities, states, roads, and all geographic details
 */

import React from 'react';
import LeafletTravelMap from '../components/LeafletTravelMap';
import { travelAPI } from '../data';
import type { VisitStatus, VisitedLocation } from '../types';

const TravelPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [visitedLocations, setVisitedLocations] = React.useState<VisitedLocation[]>([]);

  // Load data
  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const locations = await travelAPI.listVisitedLocations();
      setVisitedLocations(locations);
    } catch (error) {
      console.error('Error loading travel data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get visited countries map
  const visitedCountriesMap = React.useMemo(() => {
    const map: Record<string, VisitStatus> = {};
    visitedLocations
      .filter(loc => loc.locationType === 'country')
      .forEach(loc => {
        map[loc.countryCode] = loc.status;
      });
    return map;
  }, [visitedLocations]);

  const handleCountryClick = async (countryCode: string) => {
    // Validate country code
    if (!countryCode || countryCode.length !== 2) {
      console.error('Invalid country code:', countryCode);
      return;
    }

    try {
      // Check if country is already visited
      const existingLocation = visitedLocations.find(
        loc => loc.countryCode === countryCode && loc.locationType === 'country'
      );

      if (existingLocation) {
        // Remove if already visited
        await travelAPI.deleteLocation(existingLocation.id);
      } else {
        // Add as visited
        await travelAPI.markLocation({
          locationType: 'country',
          countryCode,
          countryName: countryCode, // Will be enriched with proper name from API
          status: 'visited',
          visitCount: 1,
        });
      }

      await loadData();
    } catch (error) {
      console.error('Error toggling country:', error);
      alert('Failed to update country. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading travel data...</p>
        </div>
      </div>
    );
  }

  return (
    <LeafletTravelMap
      visitedCountries={visitedCountriesMap}
      onCountryClick={handleCountryClick}
    />
  );
};

export default TravelPage;
