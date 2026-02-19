'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
  };

  const getActivePosition = () => {
    if (theme === 'light') return 'left-1';
    if (theme === 'auto') return 'left-[calc(100%-40px)]';
    return 'left-[calc(50%-18px)]';
  };

  // Render a placeholder initially to ensure consistent hydration
  if (!isMounted) {
    return (
      <div
        className={cn(
          'relative inline-flex items-center rounded-full bg-white/[0.08] dark:bg-white/[0.06] border border-white/[0.15] dark:border-white/[0.12] shadow-sm backdrop-blur-xl p-1',
          className
        )}
        style={{ width: '120px', height: '40px' }}
      />
    );
  }

  return (
    <div
      className={cn(
        'relative inline-flex items-center rounded-full bg-white/[0.08] dark:bg-white/[0.06] border border-white/[0.15] dark:border-white/[0.12] shadow-sm backdrop-blur-xl p-1',
        className
      )}
    >
      {/* Sliding indicator background */}
      <div
        className={cn(
          'absolute h-8 w-9 rounded-full bg-white/80 dark:bg-white/[0.15] border-2 border-gray-900 dark:border-white transition-all duration-300 ease-out',
          getActivePosition()
        )}
      />

      {/* Light button */}
      <button
        onClick={() => handleThemeChange('light')}
        className={cn(
          'relative z-10 h-8 w-9 flex items-center justify-center rounded-full transition-colors duration-200',
          theme === 'light'
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-900 dark:text-white/40'
        )}
        aria-label="Light theme"
      >
        <Sun className="h-4 w-4" />
      </button>

      {/* Dark button */}
      <button
        onClick={() => handleThemeChange('dark')}
        className={cn(
          'relative z-10 h-8 w-9 flex items-center justify-center rounded-full transition-colors duration-200',
          theme === 'dark'
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-900 dark:text-white/40'
        )}
        aria-label="Dark theme"
      >
        <Moon className="h-4 w-4" />
      </button>

      {/* Auto button */}
      <button
        onClick={() => handleThemeChange('auto')}
        className={cn(
          'relative z-10 h-8 w-9 flex items-center justify-center rounded-full transition-colors duration-200',
          theme === 'auto'
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-900 dark:text-white/40'
        )}
        aria-label="System theme"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
}
