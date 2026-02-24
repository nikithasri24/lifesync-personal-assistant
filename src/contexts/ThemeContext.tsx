/**
 * Theme Context
 * Manages theme switching (light/dark mode) and design system
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      // Migration: Reset to light theme for everyone (v2.0)
      const migrationKey = 'lifesync-theme-migration-v2';
      const migrated = localStorage.getItem(migrationKey);

      if (!migrated) {
        // First time since migration - reset to light theme
        localStorage.setItem('lifesync-theme', 'light');
        localStorage.setItem(migrationKey, 'true');
        return 'light';
      }

      // Check localStorage for saved preference
      const stored = localStorage.getItem('lifesync-theme') as Theme;
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // ignore storage errors
    }

    // Default to light theme
    return 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('lifesync-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    // Also apply 'dark' class for compatibility with existing components
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

