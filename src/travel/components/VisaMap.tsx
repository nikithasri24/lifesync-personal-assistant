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

interface VisaMapProps {
  passportCountry: string;
  userVisas: UserVisa[]; // Array of user visa objects with expiry dates
}

interface CountryFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
    iso_a2: string;
    iso_a3: string;
  };
  geometry: any;
}

const VisaMap: React.FC<VisaMapProps> = ({ passportCountry, userVisas }) => {
  const [countries, setCountries] = React.useState<CountryFeature[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filterType, setFilterType] = React.useState<'all' | VisaRequirement>('all');

  // Load countries data
  React.useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch map data: ${response.status}`);
        }

        const geoJsonData: any = await response.json();

        const countryFeatures = geoJsonData.features
          .map((f: any) => ({
            type: 'Feature' as const,
            id: f.id || f.properties?.ISO_A2 || `country-${Math.random()}`,
            properties: {
              name: f.properties?.NAME || f.properties?.name || 'Unknown',
              iso_a2: f.properties?.ISO_A2 || f.properties?.iso_a2 || '',
              iso_a3: f.properties?.ISO_A3 || f.properties?.iso_a3 || '',
            },
            geometry: f.geometry,
          }))
          .filter((f: any) => {
            const hasValidCode = f.properties.iso_a2 && f.properties.iso_a2.length === 2 && f.properties.iso_a2 !== '-99';
            const hasValidGeometry = f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
            return hasValidCode && hasValidGeometry;
          });

        setCountries(countryFeatures);
        setError(null);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load map data';
        console.error('Error loading map data:', err);
        setError(errorMessage);
        setLoading(false);
      }
    };

    loadMapData();
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
    const activeVisaForCountry = userVisas.find(visa => {
      const expiryDate = new Date(visa.expiryDate);
      return visa.countryName === normalizedName && expiryDate > today;
    });

    // If user has a valid visa for this country, show it as visa-free (accessible)
    if (activeVisaForCountry) {
      return {
        requirement: 'visa-free',
        daysAllowed: activeVisaForCountry.maxStayDays,
        viaVisa: `Valid ${activeVisaForCountry.visaType || 'visa'} until ${new Date(activeVisaForCountry.expiryDate).toLocaleDateString()}`,
      };
    }

    // Get visa-based bonus access (e.g., US H1B grants access to Mexico)
    const visaCountries = userVisas.map(v => v.countryName);
    const additionalAccess = getAdditionalAccessFromVisas(visaCountries);
    const visaAccess = additionalAccess.find(a => a.country === countryName);

    // Determine which access to use (visa if better than passport)
    if (visaAccess) {
      // Passport requires visa, but visa-holder gets visa-free/visa-on-arrival
      if (passportReq.requirement === 'visa-required' || passportReq.requirement === 'no-admission') {
        return {
          requirement: visaAccess.accessType,
          daysAllowed: visaAccess.daysAllowed,
          viaVisa: visaAccess.viaVisa,
        };
      }
      // Both grant visa-free, but visa grants MORE days
      else if (passportReq.requirement === 'visa-free' && visaAccess.accessType === 'visa-free') {
        const passportDays = passportReq.daysAllowed || Infinity;
        const visaDays = visaAccess.daysAllowed || Infinity;
        if (visaDays > passportDays) {
          return {
            requirement: visaAccess.accessType,
            daysAllowed: visaAccess.daysAllowed,
            viaVisa: visaAccess.viaVisa,
          };
        }
      }
      // Passport requires e-visa/eta, but visa grants visa-free
      else if (passportReq.requirement === 'e-visa' || passportReq.requirement === 'eta') {
        if (visaAccess.accessType === 'visa-free' || visaAccess.accessType === 'visa-on-arrival') {
          return {
            requirement: visaAccess.accessType,
            daysAllowed: visaAccess.daysAllowed,
            viaVisa: visaAccess.viaVisa,
          };
        }
      }
      // Passport grants visa-on-arrival, but visa grants visa-free
      else if (passportReq.requirement === 'visa-on-arrival' && visaAccess.accessType === 'visa-free') {
        return {
          requirement: visaAccess.accessType,
          daysAllowed: visaAccess.daysAllowed,
          viaVisa: visaAccess.viaVisa,
        };
      }
    }

    // Use passport-based access
    return {
      requirement: passportReq.requirement,
      daysAllowed: passportReq.daysAllowed,
    };
  }, [passportCountry, userVisas]);

  // Get color for visa requirement
  const getColor = (requirement: VisaRequirement): string => {
    switch (requirement) {
      case 'visa-free': return '#10B981'; // Green
      case 'visa-on-arrival': return '#3B82F6'; // Blue
      case 'eta': return '#06B6D4'; // Cyan
      case 'e-visa': return '#F59E0B'; // Yellow
      case 'visa-required': return '#F97316'; // Orange
      case 'no-admission': return '#EF4444'; // Red
      default: return '#9CA3AF'; // Gray
    }
  };

  // Country style function
  const getCountryStyle = (countryName: string): L.PathOptions => {
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
  };

  // Country layer setup
  const onEachCountry = React.useCallback((feature: any, layer: L.Layer) => {
    const countryName = feature.properties.name;
    const access = getCountryAccess(countryName);

    if (!access) return;

    const requirementLabels: Record<VisaRequirement, string> = {
      'visa-free': 'Visa Free',
      'visa-on-arrival': 'Visa on Arrival',
      'eta': 'ETA Required',
      'e-visa': 'E-Visa',
      'visa-required': 'Visa Required',
      'no-admission': 'No Admission',
    };

    if (layer instanceof L.Path) {
      layer.setStyle(getCountryStyle(countryName));
    }

    const daysText = access.daysAllowed ? `<div style="font-size: 13px; color: #4B5563; margin-top: 4px;">📅 ${access.daysAllowed} days allowed</div>` : '';
    const viaText = access.viaVisa ? `<div style="font-size: 13px; color: #7C3AED; font-weight: 600; margin-top: 6px; padding: 6px 8px; background-color: #F3E8FF; border-radius: 4px;">✨ ${access.viaVisa}</div>` : '';

    layer.bindPopup(`
      <div style="padding: 12px; min-width: 200px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">${countryName}</h3>
        <div style="display: inline-block; padding: 4px 10px; background-color: ${getColor(access.requirement)}15; border-radius: 6px; border: 2px solid ${getColor(access.requirement)};">
          <span style="color: ${getColor(access.requirement)}; font-weight: 700; font-size: 14px;">
            ${requirementLabels[access.requirement]}
          </span>
        </div>
        ${daysText}
        ${viaText}
      </div>
    `);
  }, [getCountryAccess, filterType]);

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
              filterType === 'all'
                ? 'bg-gray-700 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Countries
          </button>
          <button
            onClick={() => setFilterType('visa-free')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'visa-free'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Visa Free ({stats['visa-free']})
          </button>
          <button
            onClick={() => setFilterType('visa-on-arrival')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'visa-on-arrival'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Visa on Arrival ({stats['visa-on-arrival']})
          </button>
          <button
            onClick={() => setFilterType('eta')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'eta'
                ? 'bg-cyan-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            ETA ({stats['eta']})
          </button>
          <button
            onClick={() => setFilterType('e-visa')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'e-visa'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            E-Visa ({stats['e-visa']})
          </button>
          <button
            onClick={() => setFilterType('visa-required')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'visa-required'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Visa Required ({stats['visa-required']})
          </button>
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
            key={`visa-map-${passportCountry}-${userVisas.join(',')}-${filterType}`}
          />
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#10B981' }}></div>
            <div>
              <div className="text-xs font-medium text-gray-900">Visa Free</div>
              <div className="text-xs text-gray-600">{stats['visa-free']}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
            <div>
              <div className="text-xs font-medium text-gray-900">Visa on Arrival</div>
              <div className="text-xs text-gray-600">{stats['visa-on-arrival']}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#06B6D4' }}></div>
            <div>
              <div className="text-xs font-medium text-gray-900">ETA Required</div>
              <div className="text-xs text-gray-600">{stats['eta']}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
            <div>
              <div className="text-xs font-medium text-gray-900">E-Visa</div>
              <div className="text-xs text-gray-600">{stats['e-visa']}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#F97316' }}></div>
            <div>
              <div className="text-xs font-medium text-gray-900">Visa Required</div>
              <div className="text-xs text-gray-600">{stats['visa-required']}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#EF4444' }}></div>
            <div>
              <div className="text-xs font-medium text-gray-900">No Admission</div>
              <div className="text-xs text-gray-600">{stats['no-admission']}</div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Click on any country to see detailed visa requirements. Countries with visa-based access are highlighted.
        </p>
      </div>
    </div>
  );
};

export default VisaMap;
