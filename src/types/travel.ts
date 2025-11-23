export type TravelType = 'vacation' | 'business' | 'weekend' | 'adventure';

export interface TravelItineraryItem {
  id: string;
  date: Date;
  time?: string;
  type?: 'flight' | 'hotel' | 'activity' | 'transport' | 'note';
  title: string;
  location?: string;
  notes?: string;
}

export interface TravelTrip {
  id: string;
  title: string;
  destination: string;
  country?: string;
  startDate: Date;
  endDate: Date;
  type: TravelType;
  status: 'planning' | 'ongoing' | 'completed' | 'cancelled';
  budget?: number;
  spent?: number;
  notes?: string;
  itinerary: TravelItineraryItem[];
  creditCardTrip?: boolean;
  rating?: number;
  memories?: string[];
}

export interface CreditCardTrip {
  id: string;
  cardName: string;
  description: string;
  pointsEarned: number;
  pointsUsed: number;
  earnedDate: Date;
  redeemedDate?: Date;
  bonusCategory?: string;
}

export interface PTOEntry {
  id: string;
  startDate: Date;
  endDate: Date;
  days: number;
  type: 'approved' | 'pending' | 'planned' | 'taken';
  reason?: string;
}

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

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  type: 'trip' | 'pto' | 'event';
}

export interface TravelStats {
  totalTrips: number;
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
