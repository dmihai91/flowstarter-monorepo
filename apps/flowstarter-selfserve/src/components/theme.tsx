'use client';

// Theme handling ported from the prototype's app.jsx: mode cycles
// auto → studio (light) → midnight (dark), persisted, follows the OS in auto.
import React from 'react';

type Mode = 'auto' | 'studio' | 'midnight';
type Theme = 'studio' | 'midnight';

export const ThemeCtx = React.createContext<{
  theme: Theme;
  mode: Mode;
  setMode: (m: Mode) => void;
}>({ theme: 'studio', mode: 'auto', setMode: () => {} });

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'studio';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'midnight' : 'studio';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<Mode>('auto');
  const [sysTheme, setSysTheme] = React.useState<Theme>('studio');

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('fs-theme-mode') as Mode | null;
      if (saved === 'auto' || saved === 'studio' || saved === 'midnight') setMode(saved);
    } catch {}
    setSysTheme(systemTheme());
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const on = () => setSysTheme(mq.matches ? 'midnight' : 'studio');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const theme: Theme = mode === 'auto' ? sysTheme : mode;

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const changeMode = (m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem('fs-theme-mode', m);
    } catch {}
  };

  return (
    <ThemeCtx.Provider value={{ theme, mode, setMode: changeMode }}>{children}</ThemeCtx.Provider>
  );
}

// responsive hook — true under `bp` px (default 760)
export function useIsMobile(bp = 760) {
  const [m, setM] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [bp]);
  return m;
}
