/**
 * External URLs — single source of truth.
 * Never hardcode these in components.
 */
export const EXTERNAL_URLS = {
  calendly: {
    discovery: 'https://calendly.com/flowstarter-app/discovery',
    checkIn: 'https://calendly.com/flowstarter-app/check-in',
  },
} as const;

/**
 * App routes — internal navigation paths.
 */
export const ROUTES = {
  dashboard: '/dashboard',
  teamDashboard: '/team/dashboard',
  profile: '/profile',
  settings: '/settings',
  help: '/help',
  pricing: '/pricing',
  contact: '/contact',
  login: '/login',
  teamLogin: '/team/login',
  editor: '/editor',
} as const;
