/**
 * TravelPage - Interactive travel tracking with full OpenStreetMap integration
 * Shows cities, states, roads, and all geographic details
 */

import React, { lazy, Suspense } from 'react';
import { travelAPI } from '../data';
import type { VisitStatus, VisitedLocation } from '../types';
import { nationalParks, getParksByState } from '../data/nationalParks';
import { islands, getIslandsByState } from '../data/islands';
import { logger } from '../../services/logger';

// Lazy load the map component to defer loading Leaflet
const LeafletTravelMapV2 = lazy(() => import('../components/LeafletTravelMapV2'));

const TravelPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [visitedLocations, setVisitedLocations] = React.useState<VisitedLocation[]>([]);

  // Load data
  const loadData = React.useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const locations = await travelAPI.listVisitedLocations();
      setVisitedLocations(locations);
    } catch (error) {
      logger.error('Error loading travel data:', { error });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

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

  // Get visited states map
  const visitedStatesMap = React.useMemo(() => {
    const map: Record<string, VisitStatus> = {};
    visitedLocations
      .filter(loc => loc.locationType === 'state' && loc.stateCode)
      .forEach(loc => {
        map[loc.stateCode!] = loc.status;
      });
    return map;
  }, [visitedLocations]);

  // Get visited parks map
  const visitedParksMap = React.useMemo(() => {
    const map: Record<string, VisitStatus> = {};
    visitedLocations
      .filter(loc => loc.locationType === 'national_park' && loc.nationalParkId)
      .forEach(loc => {
        map[loc.nationalParkId!] = loc.status;
      });
    return map;
  }, [visitedLocations]);

  // Get visited islands map
  const visitedIslandsMap = React.useMemo(() => {
    const map: Record<string, VisitStatus> = {};
    visitedLocations
      .filter(loc => loc.locationType === 'island' && loc.islandName)
      .forEach(loc => {
        // Use a composite key: countryCode-islandName or just the island ID if available
        const key = loc.nationalParkId || `${loc.countryCode}-${loc.islandName}`;
        map[key] = loc.status;
      });
    return map;
  }, [visitedLocations]);

  const handleCountryClick = React.useCallback(async (countryCode: string): Promise<void> => {
    // Validate country code
    if (!countryCode || countryCode.length !== 2) {
      logger.error('Invalid country code:', { countryCode });
      return;
    }

    try {
      // Check if country is already visited
      const existingLocation = visitedLocations.find(
        loc => loc.countryCode === countryCode && loc.locationType === 'country'
      );

      if (existingLocation) {
        // Optimistically update UI immediately
        setVisitedLocations(prev => prev.filter(loc => loc.id !== existingLocation.id));

        // Remove if already visited
        await travelAPI.deleteLocation(existingLocation.id);
      } else {
        // Add as visited
        const newLocation = await travelAPI.markLocation({
          locationType: 'country',
          countryCode,
          countryName: countryCode, // Will be enriched with proper name from API
          status: 'visited',
          visitCount: 1,
        });

        // Optimistically update UI immediately
        setVisitedLocations(prev => [...prev, newLocation]);
      }
    } catch (error) {
      logger.error('Error toggling country:', { error });
      // eslint-disable-next-line no-alert
      alert('Failed to update country. Please try again.');
      // Reload data to sync with server on error
      await loadData();
    }
  }, [visitedLocations, loadData]);

  const handleStateClick = React.useCallback(async (stateCode: string, countryCode: string): Promise<void> => {
    // Validate codes
    if (!stateCode || !countryCode) {
      logger.error('Invalid state or country code:', { stateCode, countryCode });
      return;
    }

    try {
      // Check if state is already visited
      const existingLocation = visitedLocations.find(
        loc => loc.stateCode === stateCode && loc.locationType === 'state'
      );

      if (existingLocation) {
        // Optimistically update UI immediately
        setVisitedLocations(prev => prev.filter(loc => loc.id !== existingLocation.id));

        // Remove if already visited
        await travelAPI.deleteLocation(existingLocation.id);
      } else {
        // Add as visited
        const newLocation = await travelAPI.markLocation({
          locationType: 'state',
          countryCode,
          countryName: countryCode, // Will be enriched
          stateCode,
          stateName: stateCode, // Will be enriched
          status: 'visited',
          visitCount: 1,
        });

        // Optimistically update UI immediately
        setVisitedLocations(prev => [...prev, newLocation]);

        // Auto-mark all parks in this state as visited
        const stateParks = getParksByState(stateCode);
        const newParkLocations: VisitedLocation[] = [];

        for (const park of stateParks) {
          // Check if park is not already visited
          const parkAlreadyVisited = visitedLocations.some(
            loc => loc.nationalParkId === park.id && loc.locationType === 'national_park'
          );

          if (!parkAlreadyVisited) {
            try {
              const parkLocation = await travelAPI.markLocation({
                locationType: 'national_park',
                countryCode: park.countryCode,
                countryName: park.countryCode,
                stateCode: park.stateCode,
                stateName: park.stateCode,
                nationalParkId: park.id,
                nationalParkName: park.name,
                status: 'visited',
                visitCount: 1,
              });
              newParkLocations.push(parkLocation);
            } catch (err) {
              logger.error('Travel', `Failed to auto-mark park ${park.name}:`, { err });
            }
          }
        }

        // Auto-mark all islands in this state as visited
        const stateIslands = getIslandsByState(stateCode);
        const newIslandLocations: VisitedLocation[] = [];

        for (const island of stateIslands) {
          // Check if island is not already visited
          const islandAlreadyVisited = visitedLocations.some(
            loc => loc.locationType === 'island' &&
            (loc.nationalParkId === island.id || `${loc.countryCode}-${loc.islandName}` === island.id)
          );

          if (!islandAlreadyVisited) {
            try {
              const islandLocation = await travelAPI.markLocation({
                locationType: 'island',
                countryCode: island.countryCode,
                countryName: island.countryCode,
                stateCode: island.stateCode,
                stateName: island.stateCode,
                islandName: island.name,
                nationalParkId: island.id,
                status: 'visited',
                visitCount: 1,
              });
              newIslandLocations.push(islandLocation);
            } catch (err) {
              logger.error('Travel', `Failed to auto-mark island ${island.name}:`, { err });
            }
          }
        }

        // Update UI with all new locations
        if (newParkLocations.length > 0 || newIslandLocations.length > 0) {
          setVisitedLocations(prev => [...prev, ...newParkLocations, ...newIslandLocations]);
          logger.debug('Travel', `Auto-marked ${newParkLocations.length} parks and ${newIslandLocations.length} islands in ${stateCode}`);
        }
      }
    } catch (error) {
      logger.error('Error toggling state:', { error });
      // eslint-disable-next-line no-alert
      alert('Failed to update state. Please try again.');
      // Reload data to sync with server on error
      await loadData();
    }
  }, [visitedLocations, getParksByState, getIslandsByState, loadData]);

  const handleParkClick = React.useCallback(async (parkId: string): Promise<void> => {
    // Find park details
    const park = nationalParks.find(p => p.id === parkId);
    if (!park) {
      logger.error('Park not found:', { parkId });
      return;
    }

    try {
      // Check if park is already visited
      const existingLocation = visitedLocations.find(
        loc => loc.nationalParkId === parkId && loc.locationType === 'national_park'
      );

      if (existingLocation) {
        // Optimistically update UI immediately
        setVisitedLocations(prev => prev.filter(loc => loc.id !== existingLocation.id));

        // Remove if already visited
        await travelAPI.deleteLocation(existingLocation.id);
      } else {
        // Add as visited
        const newLocation = await travelAPI.markLocation({
          locationType: 'national_park',
          countryCode: park.countryCode,
          countryName: park.countryCode, // Will be enriched
          stateCode: park.stateCode,
          stateName: park.stateCode,
          nationalParkId: park.id,
          nationalParkName: park.name,
          status: 'visited',
          visitCount: 1,
        });

        // Optimistically update UI immediately
        setVisitedLocations(prev => [...prev, newLocation]);

        // Check if all parks in this state are now visited
        if (park.stateCode) {
          const stateParks = getParksByState(park.stateCode);
          const visitedParksInState = visitedLocations.filter(
            loc => loc.locationType === 'national_park' && loc.stateCode === park.stateCode
          );

          // If all parks in state are now visited (including the one just added), auto-mark the state
          if (stateParks.length > 0 && visitedParksInState.length + 1 >= stateParks.length) {
            // Check if state isn't already marked
            const stateAlreadyMarked = visitedLocations.some(
              loc => loc.locationType === 'state' && loc.stateCode === park.stateCode
            );

            if (!stateAlreadyMarked) {
              logger.debug('Travel', `All parks in ${park.stateCode} visited! Auto-marking state.`);
              const stateLocation = await travelAPI.markLocation({
                locationType: 'state',
                countryCode: park.countryCode,
                countryName: park.countryCode,
                stateCode: park.stateCode,
                stateName: park.stateCode,
                status: 'visited',
                visitCount: 1,
              });
              setVisitedLocations(prev => [...prev, stateLocation]);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error toggling park:', { error });
      // eslint-disable-next-line no-alert
      alert('Failed to update park. Please try again.');
      // Reload data to sync with server on error
      await loadData();
    }
  }, [nationalParks, visitedLocations, getParksByState, loadData]);

  const handleIslandClick = async (islandId: string) => {
    // Find island details
    const island = islands.find(i => i.id === islandId);
    if (!island) {
      logger.error('Island not found:', { islandId });
      return;
    }

    try {
      // Check if island is already visited (match by island ID using the key format)
      const existingLocation = visitedLocations.find(
        loc => loc.locationType === 'island' &&
        (loc.nationalParkId === islandId || `${loc.countryCode}-${loc.islandName}` === islandId)
      );

      if (existingLocation) {
        // Optimistically update UI immediately
        setVisitedLocations(prev => prev.filter(loc => loc.id !== existingLocation.id));

        // Remove if already visited
        await travelAPI.deleteLocation(existingLocation.id);
      } else {
        // Add as visited
        const newLocation = await travelAPI.markLocation({
          locationType: 'island',
          countryCode: island.countryCode,
          countryName: island.countryCode, // Will be enriched
          stateCode: island.stateCode,
          stateName: island.stateCode,
          islandName: island.name,
          nationalParkId: island.id, // Store island ID here for easy lookup
          status: 'visited',
          visitCount: 1,
        });

        // Optimistically update UI immediately
        setVisitedLocations(prev => [...prev, newLocation]);

        // Check if all islands in this state are now visited
        if (island.stateCode) {
          const stateIslands = getIslandsByState(island.stateCode);
          const visitedIslandsInState = visitedLocations.filter(
            loc => loc.locationType === 'island' && loc.stateCode === island.stateCode
          );

          // If all islands in state are now visited (including the one just added), auto-mark the state
          if (stateIslands.length > 0 && visitedIslandsInState.length + 1 >= stateIslands.length) {
            // Check if state isn't already marked
            const stateAlreadyMarked = visitedLocations.some(
              loc => loc.locationType === 'state' && loc.stateCode === island.stateCode
            );

            if (!stateAlreadyMarked) {
              logger.debug('Travel', `All islands in ${island.stateCode} visited! Auto-marking state.`);
              const stateLocation = await travelAPI.markLocation({
                locationType: 'state',
                countryCode: island.countryCode,
                countryName: island.countryCode,
                stateCode: island.stateCode,
                stateName: island.stateCode,
                status: 'visited',
                visitCount: 1,
              });
              setVisitedLocations(prev => [...prev, stateLocation]);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error toggling island:', { error });
      // eslint-disable-next-line no-alert
      alert('Failed to update island. Please try again.');
      // Reload data to sync with server on error
      await loadData();
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
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    }>
      <LeafletTravelMapV2
        visitedCountries={visitedCountriesMap}
        onCountryClick={handleCountryClick}
        visitedStates={visitedStatesMap}
        onStateClick={handleStateClick}
        visitedParks={visitedParksMap}
        onParkClick={handleParkClick}
        visitedIslands={visitedIslandsMap}
        onIslandClick={handleIslandClick}
      />
    </Suspense>
  );
};

export default TravelPage;
