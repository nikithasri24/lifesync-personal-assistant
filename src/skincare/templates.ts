/**
 * Personal Care Templates
 * Pre-defined frequency categories and suggested items
 */

import type { FrequencyType, TrackingMode } from './personalCareTypes';

// =====================================================
// CATEGORY TEMPLATES
// =====================================================

export type CategoryTemplate = {
  name: string;
  frequencyType: FrequencyType;
  icon: string;
  color: string;
  sortOrder: number;
};

export const CATEGORY_TEMPLATES: CategoryTemplate[] = [
  { name: 'Daily', frequencyType: 'daily', icon: '☀️', color: '#f59e0b', sortOrder: 0 },
  { name: 'Weekly', frequencyType: 'weekly', icon: '📅', color: '#3b82f6', sortOrder: 1 },
  { name: 'Bi-weekly to Monthly', frequencyType: 'biweekly_monthly', icon: '🌙', color: '#8b5cf6', sortOrder: 2 },
  { name: 'Every 2-8 Weeks', frequencyType: 'every_2_8_weeks', icon: '✨', color: '#ec4899', sortOrder: 3 },
];

// =====================================================
// ITEM TEMPLATES
// =====================================================

export type ItemTemplate = {
  name: string;
  icon: string;
  categoryFrequency: FrequencyType; // Which category this belongs to
  trackingMode: TrackingMode;
  scheduleIntervalDays?: number;
  notes?: string;
};

export const ITEM_TEMPLATES: ItemTemplate[] = [
  // ===== DAILY =====
  { name: 'Skincare AM', icon: '🌅', categoryFrequency: 'daily', trackingMode: 'manual' },
  { name: 'Skincare PM', icon: '🌙', categoryFrequency: 'daily', trackingMode: 'manual' },
  { name: 'Hair Oiling', icon: '💧', categoryFrequency: 'daily', trackingMode: 'manual', notes: 'Optional daily or weekly' },
  { name: 'Face Exercises', icon: '💆', categoryFrequency: 'daily', trackingMode: 'manual' },
  { name: 'Sunscreen', icon: '☀️', categoryFrequency: 'daily', trackingMode: 'manual' },
  
  // ===== WEEKLY =====
  { name: 'Hair Wash', icon: '🚿', categoryFrequency: 'weekly', trackingMode: 'scheduled', scheduleIntervalDays: 3, notes: '1-3x per week depending on hair type' },
  { name: 'Deep Conditioning', icon: '✨', categoryFrequency: 'weekly', trackingMode: 'scheduled', scheduleIntervalDays: 7 },
  { name: 'Face Mask', icon: '🎭', categoryFrequency: 'weekly', trackingMode: 'scheduled', scheduleIntervalDays: 7 },
  { name: 'Exfoliation', icon: '🧴', categoryFrequency: 'weekly', trackingMode: 'scheduled', scheduleIntervalDays: 7 },
  { name: 'At-home Manicure', icon: '💅', categoryFrequency: 'weekly', trackingMode: 'scheduled', scheduleIntervalDays: 7 },
  { name: 'At-home Pedicure', icon: '🦶', categoryFrequency: 'weekly', trackingMode: 'scheduled', scheduleIntervalDays: 7 },
  { name: 'Hair Mask', icon: '💇', categoryFrequency: 'weekly', trackingMode: 'scheduled', scheduleIntervalDays: 7 },
  
  // ===== BI-WEEKLY TO MONTHLY =====
  { name: 'Eyebrow Threading', icon: '👁️', categoryFrequency: 'biweekly_monthly', trackingMode: 'scheduled', scheduleIntervalDays: 21, notes: '2-4 weeks' },
  { name: 'Upper Lip Threading', icon: '👄', categoryFrequency: 'biweekly_monthly', trackingMode: 'scheduled', scheduleIntervalDays: 21, notes: '2-4 weeks' },
  { name: 'Underarms Waxing', icon: '🪒', categoryFrequency: 'biweekly_monthly', trackingMode: 'manual', notes: 'Track to learn your pattern' },
  { name: 'Arms Waxing', icon: '💪', categoryFrequency: 'biweekly_monthly', trackingMode: 'manual', notes: 'Track to learn your pattern' },
  { name: 'Legs Waxing', icon: '🦵', categoryFrequency: 'biweekly_monthly', trackingMode: 'manual', notes: 'Track to learn your pattern' },
  { name: 'Bikini Waxing', icon: '👙', categoryFrequency: 'biweekly_monthly', trackingMode: 'scheduled', scheduleIntervalDays: 14, notes: 'Every 2 weeks' },
  { name: 'Haircut/Trim', icon: '✂️', categoryFrequency: 'biweekly_monthly', trackingMode: 'scheduled', scheduleIntervalDays: 42, notes: '4-8 weeks' },
  { name: 'Hair Coloring', icon: '🎨', categoryFrequency: 'biweekly_monthly', trackingMode: 'scheduled', scheduleIntervalDays: 42, notes: '4-8 weeks' },
  { name: 'Professional Facial', icon: '🧖', categoryFrequency: 'biweekly_monthly', trackingMode: 'scheduled', scheduleIntervalDays: 30 },
  
  // ===== EVERY 2-8 WEEKS =====
  { name: 'Laser Hair Removal', icon: '⚡', categoryFrequency: 'every_2_8_weeks', trackingMode: 'scheduled', scheduleIntervalDays: 42, notes: 'Sessions every 4-6 weeks' },
  { name: 'IPL Treatment', icon: '💡', categoryFrequency: 'every_2_8_weeks', trackingMode: 'scheduled', scheduleIntervalDays: 28, notes: 'Sessions every 2-4 weeks' },
  { name: 'Dermaplaning', icon: '🪒', categoryFrequency: 'every_2_8_weeks', trackingMode: 'scheduled', scheduleIntervalDays: 28, notes: 'Every 3-4 weeks' },
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get items for a specific frequency category
 */
export function getItemsForFrequency(frequency: FrequencyType): ItemTemplate[] {
  return ITEM_TEMPLATES.filter(item => item.categoryFrequency === frequency);
}

/**
 * Get display name for frequency type
 */
export function getFrequencyDisplayName(frequency: FrequencyType): string {
  switch (frequency) {
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'biweekly_monthly': return 'Bi-weekly to Monthly';
    case 'every_2_8_weeks': return 'Every 2-8 Weeks';
    case 'custom': return 'Custom';
  }
}

/**
 * Get color for frequency type
 */
export function getFrequencyColor(frequency: FrequencyType): string {
  const template = CATEGORY_TEMPLATES.find(c => c.frequencyType === frequency);
  return template?.color ?? '#6366f1';
}

