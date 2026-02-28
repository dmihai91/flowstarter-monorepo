'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle as SharedThemeToggle, type Theme } from '@flowstarter/flow-design-system';

interface ThemeToggleProps {
  className?: string;
}

/**
 * Main platform wrapper for the shared ThemeToggle.
 * Maps between main platform's 'auto' and shared component's 'system'.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  // Map main platform's 'auto' → design system's 'system'
  const sharedTheme: Theme = theme === 'auto' ? 'system' : theme;

  const handleThemeChange = (newTheme: Theme) => {
    // Map design system's 'system' → main platform's 'auto'
    setTheme(newTheme === 'system' ? 'auto' : newTheme);
  };

  return (
    <SharedThemeToggle
      theme={sharedTheme}
      onThemeChange={handleThemeChange}
      className={className}
    />
  );
}
