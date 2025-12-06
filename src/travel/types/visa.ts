/**
 * Visa and passport types for travel requirements
 */

export type VisaRequirement =
  | 'visa-free'           // Can enter without visa
  | 'visa-on-arrival'     // Can get visa at airport/border
  | 'eta'                 // Electronic Travel Authorization required
  | 'e-visa'              // Electronic visa (apply online before travel)
  | 'visa-required'       // Must obtain visa before travel
  | 'no-admission';       // Entry prohibited

export type VisaAccess = {
  destinationCountry: string;  // ISO 3166-1 alpha-2 code
  requirement: VisaRequirement;
  daysAllowed?: number;        // Number of visa-free days (7-360)
  notes?: string;              // Additional requirements or notes
};

export type PassportData = {
  countryCode: string;         // ISO 3166-1 alpha-2
  countryName: string;
  rank?: number;               // Global passport power ranking
  visaFreeScore?: number;      // Total destinations accessible without visa
  visaFreeAccess: VisaAccess[];
};

export type UserVisa = {
  id: string;
  userId: string;
  countryCode: string;         // Country that issued the visa
  countryName: string;
  visaType: string;            // Tourist, Business, Student, etc.
  issueDate: string;           // ISO date
  expiryDate: string;          // ISO date
  multipleEntry: boolean;
  maxStayDays?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserPassport = {
  id: string;
  userId: string;
  countryCode: string;         // Passport nationality
  countryName: string;
  passportNumber?: string;     // Optional, encrypted
  issueDate?: string;
  expiryDate?: string;
  isPrimary: boolean;          // Primary passport (can have multiple)
  createdAt: string;
  updatedAt: string;
};

export type TravelAccessSummary = {
  passportCountry: string;
  totalDestinations: number;
  visaFree: number;
  visaOnArrival: number;
  etaRequired: number;
  eVisaRequired: number;
  visaRequired: number;
  noAdmission: number;
  // With existing visas, how many additional countries accessible
  bonusAccessFromVisas: number;
};

export type DestinationAccess = {
  countryCode: string;
  countryName: string;
  accessType: VisaRequirement;
  daysAllowed?: number;
  source: 'passport' | 'visa';  // How you get access (passport or existing visa)
  visaCountry?: string;         // If access is via visa, which visa grants it
};
