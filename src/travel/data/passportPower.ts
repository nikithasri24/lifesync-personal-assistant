/**
 * Passport Power Rankings 2025
 * Based on Henley Passport Index and Passport Index data
 *
 * This is a curated dataset for major countries.
 * For complete data, integrate with passport-index-dataset API
 */

export type PassportRanking = {
  rank: number;
  countryCode: string;
  countryName: string;
  visaFreeScore: number;  // Number of destinations accessible without prior visa
  mobility: 'Very High' | 'High' | 'Medium' | 'Low';
};

export const passportRankings2025: PassportRanking[] = [
  // Top Tier (Very High Mobility)
  { rank: 1, countryCode: 'SG', countryName: 'Singapore', visaFreeScore: 195, mobility: 'Very High' },
  { rank: 2, countryCode: 'JP', countryName: 'Japan', visaFreeScore: 193, mobility: 'Very High' },
  { rank: 3, countryCode: 'FR', countryName: 'France', visaFreeScore: 192, mobility: 'Very High' },
  { rank: 3, countryCode: 'DE', countryName: 'Germany', visaFreeScore: 192, mobility: 'Very High' },
  { rank: 3, countryCode: 'IT', countryName: 'Italy', visaFreeScore: 192, mobility: 'Very High' },
  { rank: 3, countryCode: 'ES', countryName: 'Spain', visaFreeScore: 192, mobility: 'Very High' },
  { rank: 4, countryCode: 'FI', countryName: 'Finland', visaFreeScore: 191, mobility: 'Very High' },
  { rank: 4, countryCode: 'KR', countryName: 'South Korea', visaFreeScore: 191, mobility: 'Very High' },
  { rank: 4, countryCode: 'SE', countryName: 'Sweden', visaFreeScore: 191, mobility: 'Very High' },
  { rank: 5, countryCode: 'AT', countryName: 'Austria', visaFreeScore: 190, mobility: 'Very High' },
  { rank: 5, countryCode: 'DK', countryName: 'Denmark', visaFreeScore: 190, mobility: 'Very High' },
  { rank: 5, countryCode: 'IE', countryName: 'Ireland', visaFreeScore: 190, mobility: 'Very High' },
  { rank: 5, countryCode: 'NL', countryName: 'Netherlands', visaFreeScore: 190, mobility: 'Very High' },
  { rank: 6, countryCode: 'BE', countryName: 'Belgium', visaFreeScore: 189, mobility: 'Very High' },
  { rank: 6, countryCode: 'LU', countryName: 'Luxembourg', visaFreeScore: 189, mobility: 'Very High' },
  { rank: 6, countryCode: 'NO', countryName: 'Norway', visaFreeScore: 189, mobility: 'Very High' },
  { rank: 6, countryCode: 'PT', countryName: 'Portugal', visaFreeScore: 189, mobility: 'Very High' },
  { rank: 6, countryCode: 'CH', countryName: 'Switzerland', visaFreeScore: 189, mobility: 'Very High' },
  { rank: 6, countryCode: 'GB', countryName: 'United Kingdom', visaFreeScore: 189, mobility: 'Very High' },
  { rank: 7, countryCode: 'AU', countryName: 'Australia', visaFreeScore: 188, mobility: 'Very High' },
  { rank: 7, countryCode: 'GR', countryName: 'Greece', visaFreeScore: 188, mobility: 'Very High' },
  { rank: 7, countryCode: 'NZ', countryName: 'New Zealand', visaFreeScore: 188, mobility: 'Very High' },
  { rank: 7, countryCode: 'US', countryName: 'United States', visaFreeScore: 188, mobility: 'Very High' },
  { rank: 8, countryCode: 'CA', countryName: 'Canada', visaFreeScore: 187, mobility: 'Very High' },
  { rank: 8, countryCode: 'CZ', countryName: 'Czech Republic', visaFreeScore: 187, mobility: 'Very High' },
  { rank: 8, countryCode: 'MT', countryName: 'Malta', visaFreeScore: 187, mobility: 'Very High' },
  { rank: 8, countryCode: 'PL', countryName: 'Poland', visaFreeScore: 187, mobility: 'Very High' },

  // High Mobility
  { rank: 9, countryCode: 'HU', countryName: 'Hungary', visaFreeScore: 185, mobility: 'High' },
  { rank: 9, countryCode: 'LT', countryName: 'Lithuania', visaFreeScore: 185, mobility: 'High' },
  { rank: 10, countryCode: 'EE', countryName: 'Estonia', visaFreeScore: 184, mobility: 'High' },
  { rank: 10, countryCode: 'LV', countryName: 'Latvia', visaFreeScore: 184, mobility: 'High' },
  { rank: 10, countryCode: 'SI', countryName: 'Slovenia', visaFreeScore: 184, mobility: 'High' },
  { rank: 10, countryCode: 'SK', countryName: 'Slovakia', visaFreeScore: 184, mobility: 'High' },

  // Major economies and regions
  { rank: 12, countryCode: 'AE', countryName: 'United Arab Emirates', visaFreeScore: 183, mobility: 'High' },
  { rank: 15, countryCode: 'CY', countryName: 'Cyprus', visaFreeScore: 180, mobility: 'High' },
  { rank: 18, countryCode: 'IL', countryName: 'Israel', visaFreeScore: 175, mobility: 'High' },
  { rank: 20, countryCode: 'AR', countryName: 'Argentina', visaFreeScore: 172, mobility: 'High' },
  { rank: 20, countryCode: 'BR', countryName: 'Brazil', visaFreeScore: 172, mobility: 'High' },
  { rank: 22, countryCode: 'MX', countryName: 'Mexico', visaFreeScore: 160, mobility: 'High' },
  { rank: 25, countryCode: 'CL', countryName: 'Chile', visaFreeScore: 158, mobility: 'High' },

  // Medium Mobility - Major Asian countries
  { rank: 30, countryCode: 'MY', countryName: 'Malaysia', visaFreeScore: 147, mobility: 'Medium' },
  { rank: 35, countryCode: 'TH', countryName: 'Thailand', visaFreeScore: 80, mobility: 'Medium' },
  { rank: 40, countryCode: 'CN', countryName: 'China', visaFreeScore: 85, mobility: 'Medium' },
  { rank: 45, countryCode: 'RU', countryName: 'Russia', visaFreeScore: 120, mobility: 'Medium' },
  { rank: 50, countryCode: 'ZA', countryName: 'South Africa', visaFreeScore: 105, mobility: 'Medium' },
  { rank: 55, countryCode: 'TR', countryName: 'Turkey', visaFreeScore: 115, mobility: 'Medium' },

  // South Asian countries
  { rank: 75, countryCode: 'IN', countryName: 'India', visaFreeScore: 62, mobility: 'Medium' },
  { rank: 80, countryCode: 'PH', countryName: 'Philippines', visaFreeScore: 68, mobility: 'Medium' },
  { rank: 82, countryCode: 'ID', countryName: 'Indonesia', visaFreeScore: 72, mobility: 'Medium' },
  { rank: 85, countryCode: 'VN', countryName: 'Vietnam', visaFreeScore: 57, mobility: 'Medium' },

  // Lower mobility
  { rank: 90, countryCode: 'PK', countryName: 'Pakistan', visaFreeScore: 34, mobility: 'Low' },
  { rank: 92, countryCode: 'BD', countryName: 'Bangladesh', visaFreeScore: 42, mobility: 'Low' },
  { rank: 95, countryCode: 'IQ', countryName: 'Iraq', visaFreeScore: 31, mobility: 'Low' },
  { rank: 98, countryCode: 'SY', countryName: 'Syria', visaFreeScore: 28, mobility: 'Low' },
  { rank: 99, countryCode: 'AF', countryName: 'Afghanistan', visaFreeScore: 27, mobility: 'Low' },
];

// Quick lookup functions
export function getPassportRanking(countryCode: string): PassportRanking | undefined {
  return passportRankings2025.find(p => p.countryCode === countryCode);
}

export function getPassportsByMobility(mobility: 'Very High' | 'High' | 'Medium' | 'Low'): PassportRanking[] {
  return passportRankings2025.filter(p => p.mobility === mobility);
}

export function getTopPassports(limit: number = 10): PassportRanking[] {
  return passportRankings2025.slice(0, limit);
}

// Visa-free access categories
export function categorizeAccess(score: number): string {
  if (score >= 180) return 'Excellent - Global mobility';
  if (score >= 150) return 'Very Good - Extensive travel freedom';
  if (score >= 100) return 'Good - Moderate travel freedom';
  if (score >= 50) return 'Limited - Significant visa requirements';
  return 'Very Limited - Extensive visa requirements';
}
