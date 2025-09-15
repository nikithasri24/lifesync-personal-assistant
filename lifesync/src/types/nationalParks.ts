/**
 * Type definitions for the National Parks Map component
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface NationalPark {
  id: string;
  name: string;
  state: string;
  coordinates: [number, number]; // [latitude, longitude]
  established: string;
  description: string;
  visitors: string;
  features: string[];
}

export interface MapBounds {
  southwest: [number, number];
  northeast: [number, number];
}

export interface ResponsiveConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  markerSize: number;
  popupMaxWidth: number;
  zoomLevel: number;
  sidebarWidth: string;
}

export interface MapViewport {
  center: [number, number];
  zoom: number;
}

export interface SearchFilters {
  searchTerm: string;
  stateFilter?: string;
  featuresFilter?: string[];
}

export interface MapComponentProps {
  className?: string;
  initialZoom?: number;
  initialCenter?: [number, number];
  showSearch?: boolean;
  showSidebar?: boolean;
  showLegend?: boolean;
  parks?: NationalPark[];
  onParkSelect?: (park: NationalPark) => void;
  onMapMove?: (viewport: MapViewport) => void;
}

export interface ParkModalProps {
  park: NationalPark | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface MarkerIconOptions {
  size: number;
  color: string;
  bgColor: string;
  borderColor: string;
  borderWidth: number;
}

export type MapTheme = 'light' | 'dark' | 'satellite' | 'terrain';

export interface MapThemeConfig {
  tileUrl: string;
  attribution: string;
  maxZoom: number;
  className?: string;
}

// US geographic bounds including Alaska and Hawaii
export const US_GEOGRAPHIC_BOUNDS: MapBounds = {
  southwest: [18.91, -179.13],
  northeast: [71.35, -66.96]
};

// Default map configuration
export const DEFAULT_MAP_CONFIG = {
  center: [39.8283, -98.5795] as [number, number], // Geographic center of US
  zoom: 4,
  minZoom: 2,
  maxZoom: 18,
  scrollWheelZoom: true,
  doubleClickZoom: true,
  dragging: true,
  touchZoom: true,
  boxZoom: true,
  keyboard: true,
};

// Responsive breakpoints
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;