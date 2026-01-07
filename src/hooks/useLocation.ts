/**
 * useLocation - React hook for location services
 * Provides location context, commute estimates, and nearby errands
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLocationProvider } from '@/lib/location';
import { locationService } from '@/services/location/LocationService';
import type {
  Coordinates,
  SavedLocation,
  LocationContext,
  CommuteEstimate,
  LocationPreferences,
} from '@/lib/location/types';

export const locationKeys = {
  all: ['location'] as const,
  context: () => [...locationKeys.all, 'context'] as const,
  preferences: () => [...locationKeys.all, 'preferences'] as const,
  commuteToWork: () => [...locationKeys.all, 'commute', 'work'] as const,
  commuteToHome: () => [...locationKeys.all, 'commute', 'home'] as const,
};

/**
 * Hook for current location context
 */
export function useLocationContext() {
  const [isWatching, setIsWatching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);

  const query = useQuery({
    queryKey: locationKeys.context(),
    queryFn: () => locationService.getLocationContext(),
    staleTime: 60000, // 1 minute
    refetchInterval: isWatching ? 30000 : false, // Refetch every 30s when watching
  });

  const startWatching = useCallback(async () => {
    const provider = getLocationProvider();
    const permission = await provider.requestPermission();
    if (permission === 'granted') {
      await provider.startWatching();
      provider.onLocationUpdate((coords) => {
        setCurrentLocation(coords);
      });
      setIsWatching(true);
    }
  }, []);

  const stopWatching = useCallback(() => {
    const provider = getLocationProvider();
    provider.stopWatching();
    setIsWatching(false);
  }, []);

  useEffect(() => {
    return () => {
      if (isWatching) {
        stopWatching();
      }
    };
  }, [isWatching, stopWatching]);

  return {
    context: query.data,
    currentLocation: currentLocation ?? query.data?.currentLocation ?? null,
    isLoading: query.isLoading,
    error: query.error,
    isWatching,
    startWatching,
    stopWatching,
    refetch: query.refetch,
  };
}

/**
 * Hook for location preferences
 */
export function useLocationPreferences() {
  return useQuery({
    queryKey: locationKeys.preferences(),
    queryFn: () => locationService.getPreferences(),
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Hook for commute estimates
 */
export function useCommuteEstimate(destination: 'work' | 'home') {
  return useQuery({
    queryKey: destination === 'work' ? locationKeys.commuteToWork() : locationKeys.commuteToHome(),
    queryFn: () =>
      destination === 'work'
        ? locationService.getCommuteToWork()
        : locationService.getCommuteToHome(),
    staleTime: 300000, // 5 minutes
    enabled: true,
  });
}

/**
 * Hook for saving locations
 */
export function useSaveLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (location: SavedLocation) => locationService.saveLocation(location),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: locationKeys.preferences() });
    },
  });
}

/**
 * Hook for removing locations
 */
export function useRemoveLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId: string) => locationService.removeLocation(locationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: locationKeys.preferences() });
    },
  });
}

/**
 * Hook for checking if location services are available
 */
export function useLocationAvailability() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  useEffect(() => {
    const provider = getLocationProvider();
    setIsAvailable(provider.isAvailable());

    void provider.checkPermission().then(setPermission);
  }, []);

  const requestPermission = useCallback(async () => {
    const provider = getLocationProvider();
    const result = await provider.requestPermission();
    setPermission(result);
    return result;
  }, []);

  return {
    isAvailable,
    permission,
    requestPermission,
  };
}

