/**
 * External URLs - single source of truth.
 * Never hardcode these in components.
 */
export const EXTERNAL_URLS = {
  calendly: {
    discovery: 'https://calendly.com/flowstarter-app/discovery',
    checkIn: 'https://calendly.com/flowstarter-app/check-in',
  },
} as const;

/**
 * App routes - internal navigation paths.
 */
export const ROUTES = {
  dashboard: '/dashboard',
  teamDashboard: '/admin/dashboard',
  profile: '/profile',
  teamProfile: '/admin/dashboard/profile',
  settings: '/profile',
  teamSettings: '/admin/dashboard/services',
  help: '/help',
  pricing: '/pricing',
  contact: '/contact',
  login: '/login',
  teamLogin: '/admin/login',
  editor: '/editor',
} as const;
