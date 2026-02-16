/**
 * LifeSync Design System - Terracotta Accent Color Palette
 * Warm beige tones with terracotta gradient accents
 * Support for both light and dark modes
 */

// Shared accent colors (same in both modes)
const accentColors = {
  start: '#D4A574',          // Warm terracotta
  end: '#C18B5E',            // Burnt orange/tan
};

const statusColors = {
  success: '#8B7355',        // Earthy brown (checked items)
};

const iosColors = {
  green: '#34C759',          // iOS green for partner badges
  lightGray: '#C7C7CC',      // iOS light gray for chevrons
  textSecondary: '#8E8E93',  // iOS secondary text
};

// Light Mode Colors
export const lightColors = {
  // Background colors
  bg: {
    primary: '#FAF8F5',        // Off-white, warm cream
    secondary: '#F5F0EA',      // Light beige
    tertiary: '#E8DCC8',       // Soft tan
    white: '#FFFFFF',          // Pure white
  },

  // Text colors
  text: {
    primary: '#5C4A3A',        // Dark brown
    secondary: '#6B5847',      // Medium brown
    tertiary: '#9B8B7A',       // Light brown/gray
  },

  // Accent colors - included in both themes
  accent: accentColors,

  // Border colors
  border: {
    light: '#E8DCC8',          // Soft tan borders
    medium: '#D4C5B0',         // Medium tan borders
  },

  // Badge colors
  badge: {
    bg: 'rgba(212, 165, 116, 0.15)',   // Light terracotta wash
    text: '#C18B5E',                    // Terracotta text
  },

  // Status colors
  status: statusColors,

  // iOS colors
  ios: iosColors,
};

// Dark Mode Colors (warm, rich dark palette)
export const darkColors = {
  // Background colors - Rich, warm darks
  bg: {
    primary: '#1A1512',        // Deep warm black (not pure black)
    secondary: '#2A221C',      // Dark chocolate brown
    tertiary: '#3A2F26',       // Medium dark brown
    white: '#2F2820',          // Dark card background
  },

  // Text colors - Warm, high contrast
  text: {
    primary: '#F5E6D3',        // Warm off-white
    secondary: '#D4C5B0',      // Light tan
    tertiary: '#9B8B7A',       // Medium tan/gray
  },

  // Accent colors - included in both themes
  accent: accentColors,

  // Border colors
  border: {
    light: '#3A2F26',          // Subtle dark borders
    medium: '#4A3F36',         // Medium dark borders
  },

  // Badge colors
  badge: {
    bg: 'rgba(212, 165, 116, 0.25)',   // Brighter terracotta wash for dark mode
    text: '#E5B88A',                    // Lighter terracotta for readability
  },

  // Status colors
  status: statusColors,

  // iOS colors
  ios: iosColors,
};

// Shared colors export (for backward compatibility)
export const sharedColors = {
  accent: accentColors,
  status: statusColors,
  ios: iosColors,
};

// Legacy export for backward compatibility
export const colors = lightColors;

/**
 * CSS gradient definitions
 */
export const gradients = {
  // Primary terracotta gradient
  primary: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',

  // Gradient for text (use with background-clip)
  text: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
};

/**
 * Shadow definitions with terracotta tones
 */
export const shadows = {
  card: '0 2px 8px rgba(139, 111, 71, 0.08)',
  fab: '0 4px 16px rgba(212, 165, 116, 0.35)',
};

/**
 * Export as CSS custom properties format for easy integration
 */
export const cssVars = {
  '--bg-primary': colors.bg.primary,
  '--bg-secondary': colors.bg.secondary,
  '--bg-tertiary': colors.bg.tertiary,
  '--bg-white': colors.bg.white,

  '--text-primary': colors.text.primary,
  '--text-secondary': colors.text.secondary,
  '--text-tertiary': colors.text.tertiary,

  '--accent-start': sharedColors.accent.start,
  '--accent-end': sharedColors.accent.end,

  '--border-light': colors.border.light,
  '--border-medium': colors.border.medium,

  '--status-success': sharedColors.status.success,

  '--badge-bg': colors.badge.bg,
  '--badge-text': colors.badge.text,
};
