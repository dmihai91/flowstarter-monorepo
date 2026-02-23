'use client';

import { safeGetItem, safeSetItem } from '@/lib/safe-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

// Add Clerk frontend API declaration
declare global {
  interface Window {
    __clerk_frontend_api?: {
      elements: {
        updateTheme?: (theme: 'light' | 'dark') => void;
      };
    };
  }
}

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Safely access localStorage to avoid SSR issues
const getStoredTheme = (): Theme | null => {
  return safeGetItem('theme') as Theme | null;
};

// Safely access window.matchMedia to avoid SSR issues
const getSystemThemePreference = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch (e) {
    console.error('Error accessing matchMedia:', e);
    return 'light';
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with a default state that will be the same on server and client
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('auto');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Function to get system theme preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    return getSystemThemePreference();
  }, []);

  // Update the resolved theme based on current theme setting
  const updateResolvedTheme = useCallback(
    (currentTheme: Theme) => {
      if (currentTheme === 'auto') {
        setResolvedTheme(getSystemTheme());
      } else {
        setResolvedTheme(currentTheme as 'light' | 'dark');
      }
    },
    [getSystemTheme]
  );

  // Initial client-side setup
  useEffect(() => {
    setMounted(true);

    // Only run theme detection and updates on the client side
    const storedTheme = getStoredTheme();

    if (storedTheme) {
      setTheme(storedTheme);
      updateResolvedTheme(storedTheme);
    } else {
      setTheme('auto');
      setResolvedTheme(getSystemTheme());
    }
  }, [getSystemTheme, updateResolvedTheme]);

  // Listen for system theme changes when theme is set to 'system'
  useEffect(() => {
    if (!mounted) return;

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = () => {
        setResolvedTheme(getSystemTheme());
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, getSystemTheme, mounted]);

  // Apply theme to document - only run client-side
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;

    // Directly set dark class based on resolved theme
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      // Try to update Clerk theme if available
      try {
        if (window.__clerk_frontend_api?.elements?.updateTheme) {
          window.__clerk_frontend_api.elements.updateTheme('dark');
        }

        // Also try alternative method for Clerk
        const event = new CustomEvent('clerk-theme-change', {
          detail: { theme: 'dark' },
        });
        window.dispatchEvent(event);
      } catch (e) {
        console.error('Error updating Clerk theme:', e);
      }
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      // Try to update Clerk theme if available
      try {
        if (window.__clerk_frontend_api?.elements?.updateTheme) {
          window.__clerk_frontend_api.elements.updateTheme('light');
        }

        // Also try alternative method for Clerk
        const event = new CustomEvent('clerk-theme-change', {
          detail: { theme: 'light' },
        });
        window.dispatchEvent(event);
      } catch (e) {
        console.error('Error updating Clerk theme:', e);
      }
    }

    // Save to localStorage - only do this client-side
    safeSetItem('theme', theme);
  }, [theme, resolvedTheme, mounted]);

  // Update theme function with more robust implementation
  const handleSetTheme = useCallback(
    (newTheme: Theme) => {
      if (!mounted) return;

      setTheme(newTheme);
      safeSetItem('theme', newTheme);

      // Immediately update the resolved theme
      if (newTheme === 'auto') {
        const systemTheme = getSystemThemePreference();
        setResolvedTheme(systemTheme);
      } else {
        setResolvedTheme(newTheme as 'light' | 'dark');
      }
    },
    [mounted]
  );

  const toggleTheme = useCallback(() => {
    handleSetTheme(
      theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light'
    );
  }, [theme, handleSetTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme: handleSetTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
