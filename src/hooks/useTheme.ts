import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const validThemes: Theme[] = ['light', 'dark', 'system'];

function readStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem('lifesync-theme');
    if (validThemes.includes(saved as Theme)) {
      return saved as Theme;
    }
  } catch {
    // ignore – fall back to system
  }
  return 'system';
}

function detectSystemTheme(): 'light' | 'dark' {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function useTheme(): {
  theme: Theme;
  currentTheme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  toggleTheme: () => void;
} {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme());

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => detectSystemTheme());

  const currentTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery: MediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent): void => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('lifesync-theme', theme);
    } catch {
      // ignore persistence issues in non-browser environments
    }

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (currentTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme, currentTheme]);

  const toggleTheme = (): void => {
    setTheme(current => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'system';
      return 'light';
    });
  };

  return {
    theme,
    currentTheme,
    setTheme,
    toggleTheme
  };
}
