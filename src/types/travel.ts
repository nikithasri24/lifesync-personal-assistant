export interface WorldProgress {
  countries: { total: number; visited: number; list: string[] };
  states: { total: number; visited: number; list: string[] };
  continents: Record<string, number>;
}

export interface MoonPhase {
  date: Date;
  phase: 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous' | 'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent';
  illumination: number;
  isNewMoon: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface Country {
  id: string;
  code: string;
  name: string;
  continent: string;
  visited: boolean;
  visitDate?: string | Date;
  rating?: number;
  tripCount: number;
  photos?: string[];
  notes?: string;
}

export interface USState {
  id: string;
  code: string;
  name: string;
  capital?: string;
  visited: boolean;
  visitDate?: string | Date;
  rating?: number;
  tripCount: number;
  nationalParks?: string[];
  photos?: string[];
  notes?: string;
}

export interface IndiaState {
  id: string;
  code: string;
  name: string;
  capital?: string;
  visited: boolean;
  visitDate?: string | Date;
  rating?: number;
  tripCount: number;
  photos?: string[];
  notes?: string;
}

export interface NationalPark {
  id: string;
  name: string;
  state: string;
  coordinates?: { lat: number; lng: number };
  visited?: boolean;
  rating?: number;
  visitDate?: string | Date;
  photos?: string[];
  notes?: string;
}
