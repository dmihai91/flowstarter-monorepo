import { atom } from 'nanostores';
import { logStore } from './logs';

export type Theme = 'dark' | 'light' | 'system';

export const kTheme = 'flowstarter_theme';

export function themeIsDark() {
  const theme = themeStore.get();

  if (theme === 'system') {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  return theme === 'dark';
}

export function getEffectiveTheme(): 'dark' | 'light' {
  const theme = themeStore.get();

  if (theme === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    return 'light';
  }

  return theme;
}

export const DEFAULT_THEME: Theme = 'dark';

export const themeStore = atom<Theme>(initStore());

function initStore(): Theme {
  if (!import.meta.env.SSR) {
    const persistedTheme = localStorage.getItem(kTheme) as Theme | undefined;
    const themeAttribute = document.querySelector('html')?.getAttribute('data-theme');

    return persistedTheme ?? (themeAttribute as Theme) ?? DEFAULT_THEME;
  }

  return DEFAULT_THEME;
}

export function setTheme(newTheme: Theme) {
  // Update the theme store
  themeStore.set(newTheme);

  // Update localStorage
  localStorage.setItem(kTheme, newTheme);

  // Get the effective theme for the HTML attribute
  const effectiveTheme = newTheme === 'system' ? getEffectiveTheme() : newTheme;

  // Update the HTML attribute
  document.querySelector('html')?.setAttribute('data-theme', effectiveTheme);

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

