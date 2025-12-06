/**
 * Visa-Free Travel Map
 * Visualizes visa requirements for countries based on passport and visas
 */

import React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getVisaRequirement } from '../data/visaRequirements';
import { getAdditionalAccessFromVisas } from '../data/visaBasedAccess';
import type { VisaRequirement, UserVisa } from '../types/visa';
import { logger } from '../../services/logger';

interface VisaMapProps {
  passportCountry: string;
  userVisas: UserVisa[]; // Array of user visa objects with expiry dates
}

interface GeoJSONGeometry {
  type: string;
  coordinates: unknown;
}

interface CountryFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
    iso_a2: string;
    iso_a3: string;
  };
  geometry: GeoJSONGeometry;
}

const VisaMap: React.FC<VisaMapProps> = ({ passportCountry, userVisas }) => {
  const [countries, setCountries] = React.useState<CountryFeature[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filterType, setFilterType] = React.useState<'all' | VisaRequirement>('all');

  // Load countries data
  React.useEffect(() => {
    const loadMapData = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch(
          'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch map data: ${response.status}`);
        }

        interface RawGeoJSONFeature {
          id?: string;
          properties?: {
            NAME?: string;
            name?: string;
            ISO_A2?: string;
            iso_a2?: string;
            ISO_A3?: string;
            iso_a3?: string;
          };
          geometry?: {
            type?: string;
            coordinates?: unknown;
          };
        }

        interface RawGeoJSON {
          features: RawGeoJSONFeature[];
        }

        const geoJsonData = await response.json() as RawGeoJSON;

        const countryFeatures = geoJsonData.features
          .map((f: RawGeoJSONFeature): CountryFeature => ({
            type: 'Feature' as const,
            id: f.id ?? f.properties?.ISO_A2 ?? `country-${Math.random()}`,
            properties: {
              name: f.properties?.NAME ?? f.properties?.name ?? 'Unknown',
              iso_a2: f.properties?.ISO_A2 ?? f.properties?.iso_a2 ?? '',
              iso_a3: f.properties?.ISO_A3 ?? f.properties?.iso_a3 ?? '',
            },
            geometry: {
              type: f.geometry?.type ?? 'Unknown',
              coordinates: f.geometry?.coordinates ?? null,
            },
          }))
          .filter((f: CountryFeature): boolean => {
            const hasValidCode = f.properties.iso_a2 && f.properties.iso_a2.length === 2 && f.properties.iso_a2 !== '-99';
            const hasValidGeometry = f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
            return hasValidCode && hasValidGeometry;
          });

        setCountries(countryFeatures);
        setError(null);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load map data';
        logger.error('Error loading map data:', { err });
        setError(errorMessage);
        setLoading(false);
      }
    };

    void loadMapData();
  }, []);

  // Normalize country names to match visa data
  const normalizeCountryName = (name: string): string => {
    const nameMap: Record<string, string> = {
      'United States of America': 'United States',
      'United Kingdom': 'United Kingdom',
      'Russia': 'Russian Federation',
      'South Korea': 'Korea (South)',
      'North Korea': 'Korea (North)',
      'Czech Republic': 'Czech Republic',
      'Republic of the Congo': 'Congo',
      'Democratic Republic of the Congo': 'Congo (Dem. Rep.)',
      'East Timor': 'Timor-Leste',
    };
    return nameMap[name] || name;
  };

  // Calculate access for each country
  const getCountryAccess = React.useCallback((countryName: string): {
    requirement: VisaRequirement;
    daysAllowed?: number;
    viaVisa?: string;
  } | null => {
    // Normalize the country name for lookup
    const normalizedName = normalizeCountryName(countryName);

    // Get passport-based access
    const passportReq = getVisaRequirement(passportCountry, normalizedName);

    if (!passportReq) return null;

    // Check if user has a valid visa for this specific country
    const today = new Date();
    const activeVisaForCountry = userVisas.find(visa =>
      visa.countryName === normalizedName && new Date(visa.expiryDate) > today
    );

    // If user has a valid visa for this country, show it as visa-free (accessible)
    if (activeVisaForCountry) {
      return {
        requirement: 'visa-free',
        daysAllowed: activeVisaForCountry.maxStayDays,
        viaVisa: `Valid ${activeVisaForCountry.visaType ?? 'visa'} until ${new Date(activeVisaForCountry.expiryDate).toLocaleDateString()}`,
      };
    }

    // Get visa-based bonus access (e.g., US H1B grants access to Mexico)
    const visaCountries = userVisas.map(v => v.countryName);
    const additionalAccess = getAdditionalAccessFromVisas(visaCountries);
    const visaAccess = additionalAccess.find(a => a.country === countryName);

    // Determine which access to use (visa if better than passport)
    if (visaAccess) {
      const shouldUseVisaAccess =
        passportReq.requirement === 'visa-required' || passportReq.requirement === 'no-admission' ||
        (passportReq.requirement === 'visa-free' && visaAccess.accessType === 'visa-free' &&
          (visaAccess.daysAllowed ?? Infinity) > (passportReq.daysAllowed ?? Infinity)) ||
        ((passportReq.requirement === 'e-visa' || passportReq.requirement === 'eta') &&
          (visaAccess.accessType === 'visa-free' || visaAccess.accessType === 'visa-on-arrival')) ||
        (passportReq.requirement === 'visa-on-arrival' && visaAccess.accessType === 'visa-free');

      if (shouldUseVisaAccess) {
        return { requirement: visaAccess.accessType, daysAllowed: visaAccess.daysAllowed, viaVisa: visaAccess.viaVisa };
      }
    }

    // Use passport-based access
    return { requirement: passportReq.requirement, daysAllowed: passportReq.daysAllowed };
  }, [passportCountry, userVisas]);

  // Visa requirement metadata
  const visaTypes = React.useMemo(() => [
    { type: 'visa-free' as const, label: 'Visa Free', color: '#10B981', bgColor: 'bg-green-600' },
    { type: 'visa-on-arrival' as const, label: 'Visa on Arrival', color: '#3B82F6', bgColor: 'bg-blue-600' },
    { type: 'eta' as const, label: 'ETA Required', color: '#06B6D4', bgColor: 'bg-cyan-600' },
    { type: 'e-visa' as const, label: 'E-Visa', color: '#F59E0B', bgColor: 'bg-yellow-600' },
    { type: 'visa-required' as const, label: 'Visa Required', color: '#F97316', bgColor: 'bg-orange-600' },
    { type: 'no-admission' as const, label: 'No Admission', color: '#EF4444', bgColor: 'bg-red-600' },
  ], []);

  // Get color for visa requirement
  const getColor = React.useCallback((requirement: VisaRequirement): string => {
    return visaTypes.find(v => v.type === requirement)?.color ?? '#9CA3AF';
  }, [visaTypes]);

  // Country style function
  const getCountryStyle = React.useCallback((countryName: string): L.PathOptions => {
    const access = getCountryAccess(countryName);

    if (!access) {
      // Countries without visa data (Antarctica, territories, etc.)
      return {
        fillColor: '#F3F4F6',
        fillOpacity: 0.5,
        color: '#9CA3AF',
        weight: 0.5,
        dashArray: '3, 3', // Dashed border for territories/no data
      };
    }

    // Apply filter if set
    if (filterType !== 'all' && access.requirement !== filterType) {
      return {
        fillColor: '#F9FAFB',
        fillOpacity: 0.3,
        color: '#D1D5DB',
        weight: 0.5,
      };
    }

    return {
      fillColor: getColor(access.requirement),
      fillOpacity: 0.6,
      color: '#FFFFFF',
      weight: 0.8,
    };
  }, [getCountryAccess, filterType, getColor]);

  // Country layer setup
  const onEachCountry = React.useCallback((feature: CountryFeature, layer: L.Layer): void => {
    const countryName = feature.properties.name;
    const access = getCountryAccess(countryName);
    if (!access) return;

    if (layer instanceof L.Path) {
      layer.setStyle(getCountryStyle(countryName));
    }

    const visaLabel = visaTypes.find(v => v.type === access.requirement)?.label ?? 'Unknown';
    const color = getColor(access.requirement);
    const daysText = access.daysAllowed ? `<div style="font-size: 13px; color: #4B5563; margin-top: 4px;">📅 ${access.daysAllowed} days allowed</div>` : '';
    const viaText = access.viaVisa ? `<div style="font-size: 13px; color: #7C3AED; font-weight: 600; margin-top: 6px; padding: 6px 8px; background-color: #F3E8FF; border-radius: 4px;">✨ ${access.viaVisa}</div>` : '';

    layer.bindPopup(`
      <div style="padding: 12px; min-width: 200px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">${countryName}</h3>
        <div style="display: inline-block; padding: 4px 10px; background-color: ${color}15; border-radius: 6px; border: 2px solid ${color};">
          <span style="color: ${color}; font-weight: 700; font-size: 14px;">${visaLabel}</span>
        </div>
        ${daysText}${viaText}
      </div>
    `);
  }, [getCountryAccess, getCountryStyle, getColor, visaTypes]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const counts: Record<VisaRequirement, number> = {
      'visa-free': 0,
      'visa-on-arrival': 0,
      'eta': 0,
      'e-visa': 0,
      'visa-required': 0,
      'no-admission': 0,
    };

    countries.forEach(country => {
      const access = getCountryAccess(country.properties.name);
      if (access) {
        counts[access.requirement]++;
      }
    });

    return counts;
  }, [countries, getCountryAccess]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-white rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading visa map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-white rounded-lg border border-gray-200">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Map</h3>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header with filters */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900">Visa Requirements Map</h2>
          <div className="text-sm text-gray-600">
            {passportCountry} Passport {userVisas.length > 0 && `+ ${userVisas.length} visa${userVisas.length > 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all' ? 'bg-gray-700 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Countries
          </button>
          {visaTypes.map(({ type, label, bgColor }) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterType === type ? `${bgColor} text-white` : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {label} ({stats[type]})
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div style={{ height: '600px', width: '100%' }}>
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
          maxBounds={[[-90, -180], [90, 180]]}
          maxBoundsViscosity={1.0}
          minZoom={2}
          maxZoom={6}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <GeoJSON
            data={{
              type: 'FeatureCollection',
              features: countries,
            }}
            onEachFeature={onEachCountry}
            key={`visa-map-${passportCountry}-${userVisas.map(v => v.countryName).join(',')}-${filterType}`}
          />
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {visaTypes.map(({ type, label, color }) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: color }}></div>
              <div>
                <div className="text-xs font-medium text-gray-900">{label}</div>
                <div className="text-xs text-gray-600">{stats[type]}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Click on any country to see detailed visa requirements. Countries with visa-based access are highlighted.
        </p>
      </div>
    </div>
  );
};

export default VisaMap;
