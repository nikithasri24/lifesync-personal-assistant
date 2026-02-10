import { useQuery } from '@tanstack/react-query';
import { logger } from '@/services/logger';
import { NetworkError } from '@/lib/errors';

interface GeoJsonFeature {
  type: string;
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

interface GeoJsonData {
  type: string;
  features: GeoJsonFeature[];
}

export const useMapData = () => {
  return useQuery<GeoJsonData>({
    queryKey: ['travel', 'mapData', 'countries'],
    queryFn: async () => {
      try {
        logger.debug('Travel', 'Fetching GeoJSON map data');
        const response = await fetch(
          'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
        );

        if (!response.ok) {
          throw new NetworkError(`Failed to fetch map data: ${response.statusText}`);
        }

        const data = await response.json();
        logger.info('Travel', 'GeoJSON map data loaded successfully');
        return data;
      } catch (error) {
        logger.error('Travel', error instanceof Error ? error : new Error(String(error)), {
          context: 'fetchMapData'
        });
        throw error;
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (renamed from cacheTime in React Query v5)
    retry: 3,
  });
};
