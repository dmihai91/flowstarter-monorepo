/**
 * Shared Theme Utilities
 * 
 * Handles theme persistence across all Flowstarter apps using cookies.
 * Cookies are used instead of localStorage to enable cross-subdomain sharing.
 */

export type Theme = 'light' | 'dark' | 'system';

const THEME_COOKIE_NAME = 'flowstarter_theme';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

/**
 * Get the shared cookie domain based on hostname
 */
function getCookieDomain(): string {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  
  if (hostname.includes('flowstarter.app')) return '.flowstarter.app';
  if (hostname.includes('flowstarter.dev')) return '.flowstarter.dev';
  return ''; // localhost - no domain needed
}

/**
 * Get the current theme from cookie
 */
export function getTheme(): Theme {
  if (typeof document === 'undefined') return 'system';
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === THEME_COOKIE_NAME) {
      const theme = value as Theme;
      if (['light', 'dark', 'system', 'auto'].includes(theme)) {
        return theme === 'auto' ? 'system' : theme as Theme;
      }
    }
  }
  
  // Fallback to localStorage for migration
  const stored = localStorage.getItem('theme') || localStorage.getItem('flowstarter_theme');
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    // Migrate to cookie
    setTheme(stored as Theme);
    return stored as Theme;
  }
  
  return 'system';
}

/**
 * Set the theme and persist to cookie (shared across subdomains)
 */
export function setTheme(theme: Theme | 'auto'): void {
  if ((theme as string) === 'auto') theme = 'system' as Theme;
  if (typeof document === 'undefined') return;
  
  const domain = getCookieDomain();
  const domainPart = domain ? `; domain=${domain}` : '';
  
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${COOKIE_MAX_AGE}${domainPart}; SameSite=Lax`;
  
  // Also set in localStorage for backwards compatibility
  localStorage.setItem('theme', theme);
  localStorage.setItem('flowstarter_theme', theme);
}

/**
 * Get the effective theme (resolves 'system' to actual value)
 */
export function getEffectiveTheme(): 'light' | 'dark' {
  const theme = getTheme();
  
  if (theme === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  
  return theme;
}

/**
 * Apply theme to document
 */
export function applyTheme(theme?: Theme): void {
  if (typeof document === 'undefined') return;
  
  const effectiveTheme = theme ? 
    (theme === 'system' ? getEffectiveTheme() : theme) : 
    getEffectiveTheme();
  
  document.documentElement.setAttribute('data-theme', effectiveTheme);
  // Also toggle dark class for Tailwind class-based dark mode
  if (effectiveTheme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
  
  // Update favicon based on theme
  const iconLink = document.querySelector('link[rel="icon"]:not([media])') as HTMLLinkElement;
  if (iconLink) {
    iconLink.href = effectiveTheme === 'dark' ? '/icon-dark.png' : '/icon-light.png';
  }
}

/**
 * Initialize theme on page load
 * Call this in your app's entry point
 */
export function initTheme(): Theme {
  const theme = getTheme();
  applyTheme(theme);
  
  // Listen for system theme changes
  if (theme === 'system' && typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (getTheme() === 'system') {
        applyTheme('system');
      }
    });
  }
  
  return theme;
}
