/**
 * Theme Colors Hook
 * Returns appropriate colors based on light/dark mode
 * Accent colors are now included in the theme colors object
 */

import { useEffect, useState } from 'react';
import { lightColors, darkColors } from '../styles/colors';

export function useThemeColors() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      const htmlElement = document.documentElement;
      const isDarkMode = htmlElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };

    // Initial check
    checkDarkMode();

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Return the appropriate color palette
  // Accent colors are included in both lightColors and darkColors
  return isDark ? darkColors : lightColors;
}
