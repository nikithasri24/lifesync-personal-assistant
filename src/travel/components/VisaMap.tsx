/**
 * Visa-Free Travel Map
 * Visualizes visa requirements for countries based on passport and visas
 * Supports date-based filtering and passport owner filtering (Me, Partner, Both)
 */

import React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getVisaRequirement } from '../data/visaRequirements';
import { getAdditionalAccessFromVisas } from '../data/visaBasedAccess';
import type { VisaRequirement, UserVisa, UserPassport } from '../types/visa';
import { logger } from '../../services/logger';

type PassportOwnerFilter = 'me' | 'partner' | 'both';

interface VisaMapProps {
  passportCountry: string;
  userVisas: UserVisa[]; // Array of user visa objects with expiry dates
  allPassports?: UserPassport[]; // All passports (including partner's in merged mode)
  currentUserId?: string | null; // Current user ID for ownership filtering
  mergedConnection?: { connectionId: string; partnerId: string; partnerName?: string } | null;
  travelDate?: string; // Optional travel date (defaults to today)
  onTravelDateChange?: (date: string) => void; // Callback when travel date changes
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

const VisaMap: React.FC<VisaMapProps> = ({
  passportCountry,
  userVisas,
  allPassports = [],
  currentUserId = null,
  mergedConnection = null,
  travelDate: externalTravelDate,
  onTravelDateChange
}) => {
  const [countries, setCountries] = React.useState<CountryFeature[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filterType, setFilterType] = React.useState<'all' | VisaRequirement>('all');

  // New filters for date and passport owner
  // Use external travel date if provided, otherwise use internal state
  const [internalTravelDate, setInternalTravelDate] = React.useState<string>(() => {
    // Default to today
    return new Date().toISOString().split('T')[0];
  });

  // Sync internal state with external prop
  React.useEffect(() => {
    if (externalTravelDate && externalTravelDate !== internalTravelDate) {
      setInternalTravelDate(externalTravelDate);
    }
  }, [externalTravelDate]);

  const travelDate = externalTravelDate ?? internalTravelDate;
  const setTravelDate = (date: string) => {
    setInternalTravelDate(date);
    onTravelDateChange?.(date);
  };
  const [passportOwnerFilter, setPassportOwnerFilter] = React.useState<PassportOwnerFilter>('both');

  // Debug logging
  React.useEffect(() => {
    console.log('[VisaMap] Props:', {
      mergedConnection,
      allPassportsCount: allPassports.length,
      currentUserId,
      passportCountry,
      userVisasCount: userVisas.length,
      travelDate,
      externalTravelDate,
      userVisas: userVisas.map(v => ({
        country: v.countryName,
        expiryDate: v.expiryDate,
        isValid: new Date(v.expiryDate) >= new Date(travelDate)
      }))
    });
  }, [mergedConnection, allPassports, currentUserId, passportCountry, userVisas, travelDate, externalTravelDate]);

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
            const hasValidCode = !!(f.properties.iso_a2 && f.properties.iso_a2.length === 2 && f.properties.iso_a2 !== '-99');
            const hasValidGeometry = !!(f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'));
            return hasValidCode && hasValidGeometry;
          });

        setCountries(countryFeatures);
        setError(null);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load map data';
        logger.error('VisaMap', err as Error, { context: 'loadMapData' });
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

  // Get filtered passports based on owner filter
  const getFilteredPassports = React.useCallback((): UserPassport[] => {
    if (!mergedConnection || !currentUserId || passportOwnerFilter === 'both') {
      return allPassports;
    }

    if (passportOwnerFilter === 'me') {
      return allPassports.filter(p => p.userId === currentUserId);
    }

    if (passportOwnerFilter === 'partner') {
      return allPassports.filter(p => p.userId === mergedConnection.partnerId);
    }

    return allPassports;
  }, [allPassports, currentUserId, mergedConnection, passportOwnerFilter]);

  // Calculate access for each country based on selected date and passport filter
  const getCountryAccess = React.useCallback((countryName: string): {
    requirement: VisaRequirement;
    daysAllowed?: number;
    viaVisa?: string;
    viaPassport?: string;
  } | null => {
    // Normalize the country name for lookup
    const normalizedName = normalizeCountryName(countryName);
    const checkDate = new Date(travelDate);

    // Get all filtered passports
    const filteredPassports = getFilteredPassports();

    // If no passports available, fall back to current passport
    const passportsToCheck = filteredPassports.length > 0
      ? filteredPassports
      : [{ countryName: passportCountry, userId: currentUserId || '' } as UserPassport];

    // Find the best access across all passports
    let bestAccess: {
      requirement: VisaRequirement;
      daysAllowed?: number;
      viaVisa?: string;
      viaPassport?: string;
    } | null = null;

    for (const passport of passportsToCheck) {
      // Get passport-based access
      const passportReq = getVisaRequirement(passport.countryName, normalizedName);
      if (!passportReq) continue;

      // Check if user has a valid visa for this specific country (valid on travel date)
      const activeVisaForCountry = userVisas.find(visa =>
        visa.countryName === normalizedName && new Date(visa.expiryDate) >= checkDate
      );

      // If user has a valid visa for this country, show it as visa-free (accessible)
      if (activeVisaForCountry) {
        const access = {
          requirement: 'visa-free' as VisaRequirement,
          daysAllowed: activeVisaForCountry.maxStayDays,
          viaVisa: `Valid ${activeVisaForCountry.visaType ?? 'visa'} until ${new Date(activeVisaForCountry.expiryDate).toLocaleDateString()}`,
          viaPassport: passport.countryName !== passportCountry ? passport.countryName : undefined,
        };

        if (!bestAccess || compareAccess(access, bestAccess) > 0) {
          bestAccess = access;
        }
        continue;
      }

      // Get visa-based bonus access (e.g., US H1B grants access to Mexico)
      // Only consider visas that are valid on the travel date
      const validVisaCountries = userVisas
        .filter(v => new Date(v.expiryDate) >= checkDate)
        .map(v => v.countryName);
      const additionalAccess = getAdditionalAccessFromVisas(validVisaCountries);
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
          const access = {
            requirement: visaAccess.accessType,
            daysAllowed: visaAccess.daysAllowed,
            viaVisa: visaAccess.viaVisa,
            viaPassport: passport.countryName !== passportCountry ? passport.countryName : undefined,
          };

          if (!bestAccess || compareAccess(access, bestAccess) > 0) {
            bestAccess = access;
          }
          continue;
        }
      }

      // Use passport-based access
      const access = {
        requirement: passportReq.requirement,
        daysAllowed: passportReq.daysAllowed,
        viaPassport: passport.countryName !== passportCountry ? passport.countryName : undefined,
      };

      if (!bestAccess || compareAccess(access, bestAccess) > 0) {
        bestAccess = access;
      }
    }

    return bestAccess;
  }, [passportCountry, userVisas, travelDate, getFilteredPassports, currentUserId]);

  // Helper to compare access quality (higher is better)
  const compareAccess = (a: { requirement: VisaRequirement; daysAllowed?: number }, b: { requirement: VisaRequirement; daysAllowed?: number }): number => {
    const priority: Record<VisaRequirement, number> = {
      'visa-free': 6,
      'visa-on-arrival': 5,
      'eta': 4,
      'e-visa': 3,
      'visa-required': 2,
      'no-admission': 1,
    };

    const aPriority = priority[a.requirement];
    const bPriority = priority[b.requirement];

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Same requirement type, compare days allowed
    const aDays = a.daysAllowed ?? Infinity;
    const bDays = b.daysAllowed ?? Infinity;
    return aDays - bDays;
  };

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
    const passportText = access.viaPassport ? `<div style="font-size: 13px; color: #2563EB; font-weight: 600; margin-top: 6px; padding: 6px 8px; background-color: #DBEAFE; border-radius: 4px;">🛂 Using ${access.viaPassport} passport</div>` : '';

    layer.bindPopup(`
      <div style="padding: 12px; min-width: 200px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">${countryName}</h3>
        <div style="display: inline-block; padding: 4px 10px; background-color: ${color}15; border-radius: 6px; border: 2px solid ${color};">
          <span style="color: ${color}; font-weight: 700; font-size: 14px;">${visaLabel}</span>
        </div>
        ${daysText}${passportText}${viaText}
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

        {/* Date and Passport Owner Filters */}
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-2">
            <label htmlFor="travel-date" className="text-sm font-medium text-gray-700">
              Travel Date:
            </label>
            <input
              id="travel-date"
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {mergedConnection && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Passport:
              </label>
              <div className="flex gap-1 bg-white border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setPassportOwnerFilter('me')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    passportOwnerFilter === 'me'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Me
                </button>
                <button
                  onClick={() => setPassportOwnerFilter('partner')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    passportOwnerFilter === 'partner'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {mergedConnection.partnerName || 'Partner'}
                </button>
                <button
                  onClick={() => setPassportOwnerFilter('both')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    passportOwnerFilter === 'both'
                      ? 'bg-pink-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Both
                </button>
              </div>
              {allPassports.length > 0 && (
                <span className="text-xs text-gray-500">
                  ({allPassports.length} passport{allPassports.length !== 1 ? 's' : ''})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Visa Requirement Filter buttons */}
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
            } as GeoJSON.FeatureCollection}
            onEachFeature={onEachCountry as (feature: GeoJSON.Feature, layer: L.Layer) => void}
            key={`visa-map-${passportCountry}-${userVisas.map(v => v.countryName).join(',')}-${filterType}-${travelDate}-${passportOwnerFilter}-${allPassports.map(p => p.id).join(',')}`}
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
