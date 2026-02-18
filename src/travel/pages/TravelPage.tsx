/**
 * TravelPage - Interactive travel tracking with full OpenStreetMap integration
 * Shows cities, states, roads, and all geographic details
 */

import React from 'react';
import { X, Plus, Calendar, MapPin, Clock } from 'lucide-react';
import LeafletTravelMapV2 from '../components/LeafletTravelMapV2';
import { travelAPI, listTrips, createTrip, updateTrip, deleteTrip, categorizeTrip } from '../api/data';
import type { VisitStatus, CategorizedLocation, LocationVisitCategory, CategorizedTrip, Trip, TripInput } from '../types';
import { nationalParks, getParksByState } from '../data/nationalParks';
import { islands, getIslandsByState } from '../data/islands';
import { getEnhancedCountries } from '../components/countryData';
import { usStates } from '../data/geographicFeatures';
import { logger } from '@/services/logger';
import { useCurrentUserId, useMergedConnection, usePartnerName } from '@/hooks/useOwnerInfo';
import { useToast } from '@/hooks/useToast';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';
import TripEditor from '../components/TripEditor';
import ConfirmDialog from '../../components/DebtPayoffCalculator/ConfirmDialog';
import { TravelStatsBarV2, TripCardV2, TripFormModalV2, LocationCardV2 } from '../components/v2';
import { AllLocationsListCard } from '../components/AllLocationsListCard';

type LocationTypeFilter = 'all' | 'countries' | 'states' | 'parks' | 'islands';

const TravelPageContent: React.FC = () => {
  const colors = useThemeColors();
  const [loading, setLoading] = React.useState(true);
  const [visitedLocations, setVisitedLocations] = React.useState<CategorizedLocation[]>([]);
  const [trips, setTrips] = React.useState<CategorizedTrip[]>([]);
  const { showToast } = useToast();
  const [categoryFilter, setCategoryFilter] = React.useState<LocationVisitCategory | 'all'>('all');

  // Trip editor state
  const [isTripEditorOpen, setIsTripEditorOpen] = React.useState(false);
  const [editingTrip, setEditingTrip] = React.useState<Trip | undefined>(undefined);
  const [tripToDelete, setTripToDelete] = React.useState<string | null>(null);

  // Location type filter state (persisted in localStorage)
  const [locationTypeFilter, setLocationTypeFilter] = React.useState<LocationTypeFilter>(() => {
    const saved = localStorage.getItem('travel_location_type_filter');
    return (saved as LocationTypeFilter) || 'all';
  });

  // States count as countries toggle (persisted in localStorage)
  const [statesCountAsCountries, setStatesCountAsCountries] = React.useState(() => {
    const saved = localStorage.getItem('travel_states_count_as_countries');
    return saved === 'true';
  });

  // Use standardized hooks for merged mode support
  const { data: currentUserId } = useCurrentUserId();
  const { data: mergedConnection } = useMergedConnection('visa');
  const { data: partnerName } = usePartnerName('visa');
  const partnerId = mergedConnection?.partnerId ?? null;

  // Persist location type filter
  React.useEffect(() => {
    localStorage.setItem('travel_location_type_filter', locationTypeFilter);
  }, [locationTypeFilter]);

  // Persist states count toggle
  React.useEffect(() => {
    localStorage.setItem('travel_states_count_as_countries', String(statesCountAsCountries));
  }, [statesCountAsCountries]);

  // Load data
  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [locations, tripsData] = await Promise.all([
        travelAPI.listVisitedLocations(),
        listTrips(),
      ]);
      setVisitedLocations(locations);
      setTrips(tripsData);
    } catch (error) {
      logger.error('Travel', 'Error loading travel data', { error });
    } finally {
      setLoading(false);
    }
  };

  // Filter locations by category and type
  const filteredLocations = React.useMemo(() => {
    let filtered = visitedLocations;

    // Filter by category (mine/partner/both/all)
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(loc => loc.visitCategory === categoryFilter);
    }

    // Filter by location type
    if (locationTypeFilter !== 'all') {
      switch (locationTypeFilter) {
        case 'countries':
          filtered = filtered.filter(loc => loc.locationType === 'country');
          break;
        case 'states':
          filtered = filtered.filter(loc => loc.locationType === 'state');
          break;
        case 'parks':
          filtered = filtered.filter(loc => loc.locationType === 'national_park');
          break;
        case 'islands':
          filtered = filtered.filter(loc => loc.locationType === 'island');
          break;
      }
    }

    return filtered;
  }, [visitedLocations, categoryFilter, locationTypeFilter]);

  // Get visited countries map (always show ALL visited, regardless of filters)
  const visitedCountriesMap = React.useMemo(() => {
    const map: Record<string, VisitStatus> = {};
    visitedLocations
      .filter(loc => loc.locationType === 'country')
      .forEach(loc => {
        map[loc.countryCode] = loc.status;
      });
    return map;
  }, [visitedLocations]);

  // Get visited countries categories (for map coloring)
  const visitedCountriesCategories = React.useMemo(() => {
    const map: Record<string, LocationVisitCategory> = {};
    visitedLocations
      .filter(loc => loc.locationType === 'country')
      .forEach(loc => {
        map[loc.countryCode] = loc.visitCategory;
      });
    return map;
  }, [visitedLocations]);

  // Get visited states map (always show ALL visited, regardless of filters)
  const visitedStatesMap = React.useMemo(() => {
    const map: Record<string, VisitStatus> = {};
    visitedLocations
      .filter(loc => loc.locationType === 'state' && loc.stateCode)
      .forEach(loc => {
        map[loc.stateCode!] = loc.status;
      });
    return map;
  }, [visitedLocations]);

  // Get visited states categories (for map coloring)
  const visitedStatesCategories = React.useMemo(() => {
    const map: Record<string, LocationVisitCategory> = {};
    visitedLocations
      .filter(loc => loc.locationType === 'state' && loc.stateCode)
      .forEach(loc => {
        map[loc.stateCode!] = loc.visitCategory;
      });
    return map;
  }, [visitedLocations]);

  // Get visited parks map (always show ALL visited, regardless of filters)
  const visitedParksMap = React.useMemo(() => {
    const map: Record<string, VisitStatus> = {};
    visitedLocations
      .filter(loc => loc.locationType === 'national_park' && loc.nationalParkId)
      .forEach(loc => {
        map[loc.nationalParkId!] = loc.status;
      });
    return map;
  }, [visitedLocations]);

  // Get visited parks categories (for map coloring)
  const visitedParksCategories = React.useMemo(() => {
    const map: Record<string, LocationVisitCategory> = {};
    visitedLocations
      .filter(loc => loc.locationType === 'national_park' && loc.nationalParkId)
      .forEach(loc => {
        map[loc.nationalParkId!] = loc.visitCategory;
      });
    return map;
  }, [visitedLocations]);

  // Get visited islands map (always show ALL visited, regardless of filters)
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

  // Get visited islands categories (for map coloring)
  const visitedIslandsCategories = React.useMemo(() => {
    const map: Record<string, LocationVisitCategory> = {};
    visitedLocations
      .filter(loc => loc.locationType === 'island' && loc.islandName)
      .forEach(loc => {
        const key = loc.nationalParkId || `${loc.countryCode}-${loc.islandName}`;
        map[key] = loc.visitCategory;
      });
    return map;
  }, [visitedLocations]);

  // Count locations by category
  const categoryCounts = React.useMemo(() => {
    return {
      all: visitedLocations.length,
      mine: visitedLocations.filter(loc => loc.visitCategory === 'mine').length,
      partner: visitedLocations.filter(loc => loc.visitCategory === 'partner').length,
      both: visitedLocations.filter(loc => loc.visitCategory === 'both').length,
    };
  }, [visitedLocations]);

  // Calculate stats for TravelStatsBarV2
  const travelStats = React.useMemo(() => {
    return {
      countries: filteredLocations.filter(loc => loc.locationType === 'country').length,
      states: filteredLocations.filter(loc => loc.locationType === 'state').length,
      parks: filteredLocations.filter(loc => loc.locationType === 'national_park').length,
      islands: filteredLocations.filter(loc => loc.locationType === 'island').length,
    };
  }, [filteredLocations]);

  const handleCountryClick = async (countryCode: string, visitedByUserIds?: string[]) => {
    // Validate country code
    if (!countryCode || countryCode.length !== 2) {
      logger.error('Travel', 'Invalid country code', { countryCode });
      return;
    }

    try {
      // Check if country is already visited
      const existingLocation = visitedLocations.find(
        loc => loc.countryCode === countryCode && loc.locationType === 'country'
      );

      if (existingLocation) {
        // Optimistically remove from UI
        setVisitedLocations(prev => prev.filter(loc => loc.id !== existingLocation.id));

        // Remove from server
        await travelAPI.deleteLocation(existingLocation.id);
      } else {
        // Add to server
        const newLocation = await travelAPI.markLocation({
          locationType: 'country',
          countryCode,
          countryName: countryCode, // Will be enriched with proper name from API
          status: 'visited',
          visitCount: 1,
        }, visitedByUserIds);

        // Import categorizeLocation to add visitCategory
        const { categorizeLocation } = await import('../api/data');
        const categorizedLocation: CategorizedLocation = {
          ...newLocation,
          visitCategory: categorizeLocation(newLocation, currentUserId!, partnerId)
        };

        // Optimistically add to UI with proper category
        setVisitedLocations(prev => [...prev, categorizedLocation]);
      }
    } catch (error) {
      logger.error('Travel', 'Error toggling country', { error });
      showToast('Failed to update country. Please try again.', 'error');
      // Reload data to sync with server on error
      await loadData();
    }
  };

  const handleStateClick = async (stateCode: string, countryCode: string, visitedByUserIds?: string[]) => {
    // Validate codes
    if (!stateCode || !countryCode) {
      logger.error('Travel', 'Invalid state or country code', { stateCode, countryCode });
      return;
    }

    try {
      // Check if state is already visited
      const existingLocation = visitedLocations.find(
        loc => loc.stateCode === stateCode && loc.locationType === 'state'
      );

      if (existingLocation) {
        // Optimistically remove from UI
        setVisitedLocations(prev => prev.filter(loc => loc.id !== existingLocation.id));

        // Remove from server
        await travelAPI.deleteLocation(existingLocation.id);
      } else {
        // Add to server
        const newLocation = await travelAPI.markLocation({
          locationType: 'state',
          countryCode,
          countryName: countryCode, // Will be enriched
          stateCode,
          stateName: stateCode, // Will be enriched
          status: 'visited',
          visitCount: 1,
        }, visitedByUserIds);

        // Import categorizeLocation to add visitCategory
        const { categorizeLocation } = await import('../api/data');
        const categorizedLocation: CategorizedLocation = {
          ...newLocation,
          visitCategory: categorizeLocation(newLocation, currentUserId!, partnerId)
        };

        // Optimistically add to UI with proper category
        setVisitedLocations(prev => [...prev, categorizedLocation]);
      }
    } catch (error) {
      logger.error('Travel', 'Error toggling state', { error });
      showToast('Failed to update state. Please try again.', 'error');
      // Reload data to sync with server on error
      await loadData();
    }
  };

  const handleParkClick = async (parkId: string, visitedByUserIds?: string[]) => {
    // Find park details
    const park = nationalParks.find(p => p.id === parkId);
    if (!park) {
      logger.error('Travel', 'Park not found', { parkId });
      return;
    }

    try {
      // Check if park is already visited
      const existingLocation = visitedLocations.find(
        loc => loc.nationalParkId === parkId && loc.locationType === 'national_park'
      );

      if (existingLocation) {
        // Optimistically remove from UI
        setVisitedLocations(prev => prev.filter(loc => loc.id !== existingLocation.id));

        // Remove from server
        await travelAPI.deleteLocation(existingLocation.id);
      } else {
        // Add to server
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
        }, visitedByUserIds);

        // Import categorizeLocation to add visitCategory
        const { categorizeLocation } = await import('../api/data');
        const categorizedLocation: CategorizedLocation = {
          ...newLocation,
          visitCategory: categorizeLocation(newLocation, currentUserId!, partnerId)
        };

        // Optimistically add to UI with proper category
        setVisitedLocations(prev => [...prev, categorizedLocation]);
      }
    } catch (error) {
      logger.error('Travel', 'Error toggling park', { error });
      showToast('Failed to update park. Please try again.', 'error');
      // Reload data to sync with server on error
      await loadData();
    }
  };

  const handleIslandClick = async (islandId: string, visitedByUserIds?: string[]) => {
    // Find island details
    const island = islands.find(i => i.id === islandId);
    if (!island) {
      logger.error('Travel', 'Island not found', { islandId });
      return;
    }

    try {
      // Check if island is already visited (match by island ID using the key format)
      const existingLocation = visitedLocations.find(
        loc => loc.locationType === 'island' &&
        (loc.nationalParkId === islandId || `${loc.countryCode}-${loc.islandName}` === islandId)
      );

      if (existingLocation) {
        // Optimistically remove from UI
        setVisitedLocations(prev => prev.filter(loc => loc.id !== existingLocation.id));

        // Remove from server
        await travelAPI.deleteLocation(existingLocation.id);
      } else {
        // Add to server
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
        }, visitedByUserIds);

        // Import categorizeLocation to add visitCategory
        const { categorizeLocation } = await import('../api/data');
        const categorizedLocation: CategorizedLocation = {
          ...newLocation,
          visitCategory: categorizeLocation(newLocation, currentUserId!, partnerId)
        };

        // Optimistically add to UI with proper category
        setVisitedLocations(prev => [...prev, categorizedLocation]);
      }
    } catch (error) {
      logger.error('Travel', 'Error toggling island', { error });
      showToast('Failed to update island. Please try again.', 'error');
      // Reload data to sync with server on error
      await loadData();
    }
  };

  // Trip handlers
  const handleCreateTrip = () => {
    setEditingTrip(undefined);
    setIsTripEditorOpen(true);
  };

  const handleEditTrip = (trip: Trip) => {
    logger.debug('Travel', 'Opening trip editor', { tripId: trip.id });
    setEditingTrip(trip);
    setIsTripEditorOpen(true);
  };

  const handleSaveTrip = async (updates: Partial<Trip>) => {
    try {
      if (editingTrip) {
        // Edit mode
        const updated = await updateTrip(editingTrip.id, updates as TripInput);
        const categorized: CategorizedTrip = {
          ...updated,
          tripCategory: categorizeTrip(updated, currentUserId!, partnerId),
        };
        setTrips(prev => prev.map(t => t.id === updated.id ? categorized : t));
        logger.info('Travel', 'Trip updated', { tripId: updated.id });
        showToast('Trip updated successfully', 'success');
      } else {
        // Create mode
        const newTrip = await createTrip(
          updates as TripInput,
          partnerId && currentUserId ? [currentUserId, partnerId] : undefined
        );
        const categorized: CategorizedTrip = {
          ...newTrip,
          tripCategory: categorizeTrip(newTrip, currentUserId!, partnerId),
        };
        setTrips(prev => [categorized, ...prev]);
        logger.info('Travel', 'Trip created', { tripId: newTrip.id });
        showToast('Trip created successfully', 'success');
      }
      setIsTripEditorOpen(false);
      setEditingTrip(undefined);
    } catch (error) {
      logger.error('Travel', error instanceof Error ? error : new Error(String(error)), {
        context: 'saveTrip',
      });
      showToast('Failed to save trip. Please try again.', 'error');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await deleteTrip(tripId);
      setTrips(prev => prev.filter(t => t.id !== tripId));
      setTripToDelete(null);
      logger.info('Travel', 'Trip deleted', { tripId });
      showToast('Trip deleted successfully', 'success');
    } catch (error) {
      logger.error('Travel', error instanceof Error ? error : new Error(String(error)), {
        context: 'deleteTrip',
      });
      showToast('Failed to delete trip. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
          <div className="space-y-6">
            {/* Stats Bar Skeleton */}
            <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />

            {/* Location Cards Skeleton */}
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>

            {/* Map Skeleton */}
            <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />

            {/* Trips Skeleton */}
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded-xl animate-pulse" style={{ maxWidth: '200px' }} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      {/* Centered container following CLAUDE.md pattern */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Category Filter Tabs */}
        <div className="mb-6 p-1 rounded-xl flex gap-1" style={{ backgroundColor: colors.bg.secondary }}>
          <div className="flex space-x-1 overflow-x-auto w-full">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                categoryFilter === 'all' ? 'bg-white shadow-sm' : ''
              }`}
              style={{
                color: categoryFilter === 'all' ? colors.accent.end : colors.text.secondary,
              }}
              aria-label="Show all trips"
            >
              All ({categoryCounts.all})
            </button>
            <button
              onClick={() => setCategoryFilter('mine')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                categoryFilter === 'mine' ? 'bg-white shadow-sm' : ''
              }`}
              style={{
                color: categoryFilter === 'mine' ? colors.accent.end : colors.text.secondary,
              }}
              aria-label="Show my trips"
            >
              Mine ({categoryCounts.mine})
            </button>
            <button
              onClick={() => setCategoryFilter('partner')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                categoryFilter === 'partner' ? 'bg-white shadow-sm' : ''
              }`}
              style={{
                color: categoryFilter === 'partner' ? colors.accent.end : colors.text.secondary,
              }}
              aria-label="Show partner trips"
            >
              Partner ({categoryCounts.partner})
            </button>
            <button
              onClick={() => setCategoryFilter('both')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                categoryFilter === 'both' ? 'bg-white shadow-sm' : ''
              }`}
              style={{
                color: categoryFilter === 'both' ? colors.accent.end : colors.text.secondary,
              }}
              aria-label="Show trips by both"
            >
              Both ({categoryCounts.both})
            </button>
          </div>
        </div>

        {/* Location Type Filters and Settings */}
        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: colors.bg.white, borderColor: colors.border.light }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Location Type Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLocationTypeFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  locationTypeFilter === 'all'
                    ? 'text-white'
                    : 'border hover:bg-gray-50'
                }`}
                style={{
                  background: locationTypeFilter === 'all' ? 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' : 'white',
                  color: locationTypeFilter === 'all' ? 'white' : colors.text.primary,
                  borderColor: colors.border.medium,
                }}
                aria-label="Show all location types"
              >
                All Locations
              </button>
              <button
                onClick={() => setLocationTypeFilter('countries')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  locationTypeFilter === 'countries'
                    ? 'text-white'
                    : 'border hover:bg-gray-50'
                }`}
                style={{
                  background: locationTypeFilter === 'countries' ? 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' : 'white',
                  color: locationTypeFilter === 'countries' ? 'white' : colors.text.primary,
                  borderColor: colors.border.medium,
                }}
                aria-label="Filter by countries"
              >
                Countries
              </button>
              <button
                onClick={() => setLocationTypeFilter('states')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  locationTypeFilter === 'states'
                    ? 'text-white'
                    : 'border hover:bg-gray-50'
                }`}
                style={{
                  background: locationTypeFilter === 'states' ? 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' : 'white',
                  color: locationTypeFilter === 'states' ? 'white' : colors.text.primary,
                  borderColor: colors.border.medium,
                }}
                aria-label="Filter by US states"
              >
                States
              </button>
              <button
                onClick={() => setLocationTypeFilter('parks')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  locationTypeFilter === 'parks'
                    ? 'text-white'
                    : 'border hover:bg-gray-50'
                }`}
                style={{
                  background: locationTypeFilter === 'parks' ? 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' : 'white',
                  color: locationTypeFilter === 'parks' ? 'white' : colors.text.primary,
                  borderColor: colors.border.medium,
                }}
                aria-label="Filter by national parks"
              >
                Parks
              </button>
              <button
                onClick={() => setLocationTypeFilter('islands')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  locationTypeFilter === 'islands'
                    ? 'text-white'
                    : 'border hover:bg-gray-50'
                }`}
                style={{
                  background: locationTypeFilter === 'islands' ? 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' : 'white',
                  color: locationTypeFilter === 'islands' ? 'white' : colors.text.primary,
                  borderColor: colors.border.medium,
                }}
                aria-label="Filter by islands"
              >
                Islands
              </button>
            </div>

            {/* States Count as Countries Toggle */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
                style={{
                  backgroundColor: colors.bg.white,
                  borderColor: colors.border.medium,
                }}
              >
                <input
                  type="checkbox"
                  checked={statesCountAsCountries}
                  onChange={(e) => setStatesCountAsCountries(e.target.checked)}
                  className="h-4 w-4 text-terracotta-400 rounded focus:ring-terracotta-300"
                />
                <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  States count as country visits
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Travel Stats */}
        <div className="mb-6">
          <TravelStatsBarV2
            countriesVisited={travelStats.countries}
            statesVisited={travelStats.states}
            parksVisited={travelStats.parks}
            islandsVisited={travelStats.islands}
          />
        </div>

        {/* Location Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
        <LocationCardV2
          icon="🌐"
          title="Countries"
          count={travelStats.countries}
          total={195}
          onClick={() => setLocationTypeFilter('countries')}
        />
        <LocationCardV2
          icon="🏛️"
          title="US States"
          count={travelStats.states}
          total={50}
          onClick={() => setLocationTypeFilter('states')}
        />
        <LocationCardV2
          icon="🏞️"
          title="National Parks"
          count={travelStats.parks}
          total={63}
          onClick={() => setLocationTypeFilter('parks')}
        />
        <LocationCardV2
          icon="🏝️"
          title="Islands"
          count={travelStats.islands}
          total={42}
          onClick={() => setLocationTypeFilter('islands')}
        />
      </div>

        {/* Map */}
        <div className="h-[60vh] mb-6 rounded-xl overflow-hidden" style={{ borderColor: colors.border.light }}>
          <LeafletTravelMapV2
          visitedCountries={visitedCountriesMap}
          onCountryClick={handleCountryClick}
          visitedStates={visitedStatesMap}
          onStateClick={handleStateClick}
          visitedParks={visitedParksMap}
          onParkClick={handleParkClick}
          visitedIslands={visitedIslandsMap}
          onIslandClick={handleIslandClick}
          visitedCountriesCategories={visitedCountriesCategories}
          visitedStatesCategories={visitedStatesCategories}
          visitedParksCategories={visitedParksCategories}
          visitedIslandsCategories={visitedIslandsCategories}
          />
        </div>

        {/* Trips Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: colors.text.primary }}>Your Trips</h2>
            <button
              onClick={handleCreateTrip}
              className="inline-flex items-center gap-2 px-4 py-3 text-white rounded-xl font-semibold transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
              aria-label="Add new trip"
            >
              <Plus className="h-5 w-5" />
              Add Trip
            </button>
          </div>

          {trips.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed p-12 text-center"
              style={{
                backgroundColor: colors.bg.white,
                borderColor: colors.border.medium,
              }}
            >
              <Calendar className="h-12 w-12 mx-auto mb-4" style={{ color: colors.text.secondary }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>No trips yet</h3>
              <p className="mb-4" style={{ color: colors.text.secondary }}>Start planning your next adventure!</p>
              <button
                onClick={handleCreateTrip}
                className="inline-flex items-center gap-2 px-4 py-3 text-white rounded-xl font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                }}
                aria-label="Plan your first trip"
              >
                <Plus className="h-5 w-5" />
                Plan Your First Trip
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const isOwnTrip = trip.userId === currentUserId;
              const ownerDisplayName = trip.tripCategory === 'mine' ? 'Me' : (trip.tripCategory === 'partner' ? (partnerName || 'Partner') : 'Both');

              return (
                <TripCardV2
                  key={trip.id}
                  id={trip.id}
                  name={trip.name}
                  description={trip.description}
                  startDate={trip.startDate}
                  endDate={trip.endDate}
                  status={trip.status as any}
                  budget={trip.budget}
                  currency={trip.currency}
                  tags={trip.tags}
                  onClick={() => handleEditTrip(trip)}
                  showOwnerBadge={!!mergedConnection}
                  owner={{
                    isOwner: isOwnTrip,
                    displayName: ownerDisplayName,
                  }}
                />
              );
              })}
            </div>
          )}
        </div>

        {/* Location Lists */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-6" style={{ color: colors.text.primary }}>Track Your Locations</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Countries List */}
          <AllLocationsListCard
            title="Countries"
            allItems={getEnhancedCountries()}
            visitedLocations={filteredLocations.filter(loc => loc.locationType === 'country')}
            onToggle={(item, visitedByUserIds) => handleCountryClick(item.code, visitedByUserIds)}
            getItemKey={(item) => item.code}
            getItemName={(item) => item.name}
            getVisitedKey={(loc) => loc.countryCode}
            currentUserId={currentUserId || undefined}
            partnerId={partnerId}
          />

          {/* States List */}
          <AllLocationsListCard
            title="US States"
            allItems={usStates}
            visitedLocations={filteredLocations.filter(loc => loc.locationType === 'state')}
            onToggle={(item, visitedByUserIds) => handleStateClick(`US-${item.code}`, 'US', visitedByUserIds)}
            getItemKey={(item) => `US-${item.code}`}
            getItemName={(item) => item.name}
            getVisitedKey={(loc) => loc.stateCode!}
            currentUserId={currentUserId || undefined}
            partnerId={partnerId}
          />

          {/* National Parks List */}
          <AllLocationsListCard
            title="National Parks"
            allItems={nationalParks}
            visitedLocations={filteredLocations.filter(loc => loc.locationType === 'national_park')}
            onToggle={(item, visitedByUserIds) => handleParkClick(item.id, visitedByUserIds)}
            getItemKey={(item) => item.id}
            getItemName={(item) => item.name}
            getVisitedKey={(loc) => loc.nationalParkId!}
            currentUserId={currentUserId || undefined}
            partnerId={partnerId}
          />

          {/* Islands List */}
          <AllLocationsListCard
            title="Islands"
            allItems={islands}
            visitedLocations={filteredLocations.filter(loc => loc.locationType === 'island')}
            onToggle={(item, visitedByUserIds) => handleIslandClick(item.id, visitedByUserIds)}
            getItemKey={(item) => item.id}
            getItemName={(item) => item.name}
            getVisitedKey={(loc) => loc.nationalParkId || `${loc.countryCode}-${loc.islandName}`}
            currentUserId={currentUserId || undefined}
            partnerId={partnerId}
          />
          </div>
        </div>
      </div>

      {/* Trip Editor Modal - V2 */}
      <TripFormModalV2
        isOpen={isTripEditorOpen}
        onClose={() => {
          setIsTripEditorOpen(false);
          setEditingTrip(undefined);
        }}
        trip={editingTrip ? {
          id: editingTrip.id,
          name: editingTrip.name,
          description: editingTrip.description,
          startDate: editingTrip.startDate,
          endDate: editingTrip.endDate,
          status: editingTrip.status as any,
          budget: editingTrip.budget,
          currency: editingTrip.currency,
          tags: editingTrip.tags,
        } : undefined}
        isEditing={!!editingTrip}
        onSubmit={handleSaveTrip}
      />

      {/* Trip Deletion Confirmation */}
      {tripToDelete && (
        <ConfirmDialog
          title="Delete Trip"
          message="Are you sure you want to delete this trip? This action cannot be undone."
          onConfirm={() => {
            handleDeleteTrip(tripToDelete);
          }}
          onCancel={() => setTripToDelete(null)}
        />
      )}
    </div>
  );
};

// Wrap with error boundary for graceful error handling
const TravelPage: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Travel">
      <TravelPageContent />
    </FeatureErrorBoundary>
  );
};

export default TravelPage;
