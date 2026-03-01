import { atom } from 'nanostores';
import { logStore } from './logs';
import { 
  getTheme as getSharedTheme, 
  setTheme as setSharedTheme,
  getEffectiveTheme as getSharedEffectiveTheme,
  applyTheme,
  type Theme,
} from '@flowstarter/flow-design-system';

export type { Theme };

export const kTheme = 'flowstarter_theme';

export function themeIsDark() {
  const theme = themeStore.get();

  if (theme === 'system') {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  return theme === 'dark';
}

export function getEffectiveTheme(): 'dark' | 'light' {
  return getSharedEffectiveTheme();
}

export const DEFAULT_THEME: Theme = 'dark';

export const themeStore = atom<Theme>(initStore());

function initStore(): Theme {
  // Editor is always dark mode
  return 'dark';
}

export function setTheme(newTheme: Theme) {
  // Editor is always dark — ignore theme changes
  // Still persist to cookie for main platform
  themeStore.set('dark');

  // Use shared utility to persist to cookie (shared across subdomains)
  setSharedTheme(newTheme);

  // Apply theme to document
  applyTheme(newTheme);

  // Update user profile if it exists
  try {
    const userProfile = localStorage.getItem('flowstarter_user_profile');

    if (userProfile) {
      const profile = JSON.parse(userProfile);
      profile.theme = newTheme;
      localStorage.setItem('flowstarter_user_profile', JSON.stringify(profile));
    }
  } catch (error) {
    console.error('Error updating user profile theme:', error);
  }

  logStore.logSystem(`Theme changed to ${newTheme} mode`);
}

export function toggleTheme() {
  const currentTheme = themeStore.get();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// Listen for system theme changes when in 'system' mode
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (themeStore.get() === 'system') {
      const effectiveTheme = e.matches ? 'dark' : 'light';
      document.querySelector('html')?.setAttribute('data-theme', effectiveTheme);
    }
  });
}
