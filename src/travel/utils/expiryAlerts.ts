/**
 * Visa and Passport Expiry Alert System
 * Checks expiry dates and generates alerts
 */

import type { UserPassport, UserVisa } from '../types/visa';

export interface ExpiryAlert {
  id: string;
  type: 'passport' | 'visa';
  itemId: string;
  itemName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  action: string;
}

/**
 * Calculate days until expiry
 */
function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Determine alert severity based on days remaining
 */
function getSeverity(days: number): 'critical' | 'warning' | 'info' {
  if (days < 0) return 'critical'; // Expired
  if (days <= 30) return 'critical'; // Less than 1 month
  if (days <= 90) return 'warning'; // Less than 3 months
  if (days <= 180) return 'info'; // Less than 6 months
  return 'info';
}

/**
 * Check passport expiry and generate alerts
 */
export function checkPassportExpiry(passports: UserPassport[]): ExpiryAlert[] {
  const alerts: ExpiryAlert[] = [];
  const today = new Date();

  passports.forEach(passport => {
    if (!passport.expiryDate) return;

    const daysUntilExpiry = getDaysUntilExpiry(passport.expiryDate);

    // Alert if expiring within 6 months (many countries require 6 months validity)
    if (daysUntilExpiry <= 180) {
      const severity = getSeverity(daysUntilExpiry);

      let message = '';
      let action = '';

      if (daysUntilExpiry < 0) {
        message = `Your ${passport.countryName} passport expired ${Math.abs(daysUntilExpiry)} days ago`;
        action = 'Renew immediately';
      } else if (daysUntilExpiry <= 30) {
        message = `Your ${passport.countryName} passport expires in ${daysUntilExpiry} days`;
        action = 'Renew urgently';
      } else if (daysUntilExpiry <= 90) {
        message = `Your ${passport.countryName} passport expires in ${daysUntilExpiry} days`;
        action = 'Start renewal process';
      } else {
        message = `Your ${passport.countryName} passport expires in ${daysUntilExpiry} days`;
        action = 'Consider renewing soon (many countries require 6 months validity)';
      }

      alerts.push({
        id: `passport-${passport.id}`,
        type: 'passport',
        itemId: passport.id,
        itemName: `${passport.countryName} Passport`,
        expiryDate: passport.expiryDate,
        daysUntilExpiry,
        severity,
        message,
        action,
      });
    }
  });

  return alerts;
}

/**
 * Check visa expiry and generate alerts
 */
export function checkVisaExpiry(visas: UserVisa[]): ExpiryAlert[] {
  const alerts: ExpiryAlert[] = [];

  visas.forEach(visa => {
    const daysUntilExpiry = getDaysUntilExpiry(visa.expiryDate);

    // Alert if expiring within 3 months
    if (daysUntilExpiry <= 90) {
      const severity = getSeverity(daysUntilExpiry);

      let message = '';
      let action = '';

      if (daysUntilExpiry < 0) {
        message = `Your ${visa.countryName} visa expired ${Math.abs(daysUntilExpiry)} days ago`;
        action = 'Visa no longer valid';
      } else if (daysUntilExpiry <= 30) {
        message = `Your ${visa.countryName} ${visa.visaType || 'visa'} expires in ${daysUntilExpiry} days`;
        action = 'Renew or plan travel soon';
      } else {
        message = `Your ${visa.countryName} ${visa.visaType || 'visa'} expires in ${daysUntilExpiry} days`;
        action = 'Plan to renew if needed';
      }

      alerts.push({
        id: `visa-${visa.id}`,
        type: 'visa',
        itemId: visa.id,
        itemName: `${visa.countryName} ${visa.visaType || 'Visa'}`,
        expiryDate: visa.expiryDate,
        daysUntilExpiry,
        severity,
        message,
        action,
      });
    }
  });

  return alerts;
}

/**
 * Get all expiry alerts (passports + visas)
 */
export function getAllExpiryAlerts(
  passports: UserPassport[],
  visas: UserVisa[]
): ExpiryAlert[] {
  const passportAlerts = checkPassportExpiry(passports);
  const visaAlerts = checkVisaExpiry(visas);

  // Combine and sort by severity and days remaining
  const allAlerts = [...passportAlerts, ...visaAlerts];

  allAlerts.sort((a, b) => {
    // Sort by severity first
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    // Then by days remaining (most urgent first)
    return a.daysUntilExpiry - b.daysUntilExpiry;
  });

  return allAlerts;
}

/**
 * Get upcoming travel restrictions based on passport validity
 * Many countries require 6 months validity to enter
 */
export function getUpcomingTravelRestrictions(passport: UserPassport): {
  sixMonthCutoff: string;
  threeMonthCutoff: string;
  message: string;
} | null {
  if (!passport.expiryDate) return null;

  const expiryDate = new Date(passport.expiryDate);
  const sixMonthsBefore = new Date(expiryDate);
  sixMonthsBefore.setMonth(sixMonthsBefore.getMonth() - 6);

  const threeMonthsBefore = new Date(expiryDate);
  threeMonthsBefore.setMonth(threeMonthsBefore.getMonth() - 3);

  const today = new Date();
  const daysUntilSixMonths = Math.ceil((sixMonthsBefore.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let message = '';
  if (daysUntilSixMonths <= 0) {
    message = 'Your passport has less than 6 months validity. Many countries will not allow entry.';
  } else if (daysUntilSixMonths <= 30) {
    message = `In ${daysUntilSixMonths} days, your passport will have less than 6 months validity, restricting travel to many countries.`;
  } else if (daysUntilSixMonths <= 90) {
    message = `Your passport will have less than 6 months validity in ${daysUntilSixMonths} days. Consider renewing before international travel.`;
  }

  return {
    sixMonthCutoff: sixMonthsBefore.toISOString().split('T')[0],
    threeMonthCutoff: threeMonthsBefore.toISOString().split('T')[0],
    message,
  };
}
