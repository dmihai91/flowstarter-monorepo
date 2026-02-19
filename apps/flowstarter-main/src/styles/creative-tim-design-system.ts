/**
 * Unified Creative Tim Design System
 * Combining best features from Argon Dashboard, Material Dashboard, Notus, and Soft UI
 *
 * This design system provides professional, cohesive styling for all templates
 */

export const CreativeTimDesignSystem = {
  // Professional Color Palette (muted, not cartoonish)
  colors: {
    // Primary Blues (Argon-inspired)
    blue: {
      primary: '#5e72e4',
      secondary: '#2152ff',
      dark: '#1171ef',
    },
    // Success Greens (professional teal-green)
    green: {
      primary: '#2dce89',
      secondary: '#2dcecc',
      dark: '#1aae6f',
    },
    // Warning Oranges (soft, not vivid)
    orange: {
      primary: '#fb6340',
      secondary: '#fbb140',
      dark: '#ea3005',
    },
    // Purples (soft and elegant)
    purple: {
      primary: '#8965e0',
      secondary: '#825ee4',
      dark: '#7928ca',
    },
    // Pinks (muted rose tones)
    pink: {
      primary: '#f3a4b5',
      secondary: '#ff0080',
    },
    // Reds (professional, not bright)
    red: {
      primary: '#f5365c',
      secondary: '#f53939',
    },
    // Neutrals (sophisticated grays)
    gray: {
      text: '#344767',
      bg: '#f8f9fa',
      darkBg: '#1a2035',
      darker: '#111c44',
    },
  },

  // Professional Gradients
  gradients: {
    // Primary gradient (blue to violet)
    primary: 'bg-gradient-to-br from-[#5e72e4] via-[#825ee4] to-[#8965e0]',

    // Success gradient (emerald to teal)
    success: 'bg-gradient-to-br from-[#2dce89] to-[#2dcecc]',

    // Warning gradient (orange to soft yellow)
    warning: 'bg-gradient-to-br from-[#fb6340] to-[#fbb140]',

    // Restaurant/Local Business (sophisticated warm tones)
    restaurant: 'bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600',

    // Service Business (professional blues)
    service: 'bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500',

    // SaaS/Tech (modern purples)
    tech: 'bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600',

    // Personal Brand (elegant grays with color accent)
    personal: 'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50',

    // Dark backgrounds
    darkHero: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700',
  },

  // Soft Shadows (Argon-style)
  shadows: {
    soft: 'shadow-[0_2px_12px_0_rgba(0,0,0,0.09)]',
    softSm: 'shadow-[0_2px_9px_0_rgba(0,0,0,0.06)]',
    softMd: 'shadow-[0_4px_20px_0_rgba(0,0,0,0.1)]',
    softLg: 'shadow-[0_8px_26px_-4px_rgba(0,0,0,0.15)]',
    softXl: 'shadow-[0_20px_27px_0_rgba(0,0,0,0.05)]',
    soft2xl: 'shadow-[0_23px_45px_0_rgba(0,0,0,0.07)]',
    blur: 'shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]',
  },

  // Cards (professional rounded corners)
  cards: {
    base: 'bg-white dark:bg-slate-800 rounded-2xl',
    elevated:
      'bg-white dark:bg-slate-800 rounded-2xl shadow-[0_20px_27px_0_rgba(0,0,0,0.05)]',
    hover:
      'transition-all duration-300 hover:shadow-[0_20px_27px_0_rgba(0,0,0,0.05)] hover:-translate-y-1',
    tiltHover:
      'transition-transform duration-300 hover:rotate-[2deg] hover:-translate-y-1',
  },

  // Glassmorphism (modern and elegant)
  glass: {
    light: 'backdrop-blur-md bg-white/10 border border-white/40',
    dark: 'backdrop-blur-md bg-black/10 border border-black/20',
    badge:
      'backdrop-blur-md bg-white/10 border border-white/40 px-4 py-2 rounded-full',
  },

  // Icon Shapes (gradient backgrounds)
  iconShapes: {
    primary:
      'flex items-center justify-center w-12 h-12 rounded-xl shadow-lg bg-gradient-to-br from-[#5e72e4] to-[#825ee4] text-white',
    success:
      'flex items-center justify-center w-12 h-12 rounded-xl shadow-lg bg-gradient-to-br from-[#2dce89] to-[#2dcecc] text-white',
    warning:
      'flex items-center justify-center w-12 h-12 rounded-xl shadow-lg bg-gradient-to-br from-[#fb6340] to-[#fbb140] text-white',
    info: 'flex items-center justify-center w-12 h-12 rounded-xl shadow-lg bg-gradient-to-br from-cyan-500 to-blue-500 text-white',
  },

  // Buttons (professional with gradients)
  buttons: {
    primary:
      'px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-gradient-to-br from-[#5e72e4] to-[#825ee4] text-white hover:shadow-[0_20px_27px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5',
    success:
      'px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-gradient-to-br from-[#2dce89] to-[#2dcecc] text-white hover:shadow-[0_20px_27px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5',
    warning:
      'px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg bg-gradient-to-br from-[#fb6340] to-[#fbb140] text-white hover:shadow-[0_20px_27px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5',
    ghost:
      'px-6 py-3 rounded-xl font-semibold transition-all duration-300 backdrop-blur-md bg-white/10 border border-white/40 text-white hover:bg-white/20',
  },

  // Text Gradients
  textGradients: {
    primary:
      'bg-gradient-to-r from-[#5e72e4] via-[#8965e0] to-[#f3a4b5] bg-clip-text text-transparent',
    success:
      'bg-gradient-to-r from-[#2dce89] to-[#2dcecc] bg-clip-text text-transparent',
    warm: 'bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 bg-clip-text text-transparent',
  },

  // Animations
  animations: {
    float: 'animate-[float_4s_ease-in-out_infinite]',
    fadeIn: 'animate-[fadeIn_0.6s_ease-in-out]',
    shimmer:
      'relative overflow-hidden after:content-[""] after:absolute after:inset-0 after:translate-x-[-100%] after:bg-gradient-to-r after:from-transparent after:via-white/35 after:to-transparent after:animate-[shimmer_1.5s_infinite]',
  },
};

// Template-specific presets
export const TemplatePresets = {
  localBusiness: {
    hero: 'bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600',
    accent: '#fb6340',
    iconColor: 'from-orange-500 to-orange-600',
    cardBg:
      'from-orange-50 to-rose-50 dark:from-orange-900/20 dark:to-rose-900/20',
  },

  service: {
    hero: 'bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500',
    accent: '#5e72e4',
    iconColor: 'from-slate-600 to-slate-700',
    cardBg:
      'from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20',
  },

  saas: {
    hero: 'bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600',
    accent: '#8965e0',
    iconColor: 'from-purple-600 to-indigo-600',
    cardBg:
      'from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
  },

  personalBrand: {
    hero: 'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50',
    accent: '#344767',
    iconColor: 'from-slate-600 to-slate-700',
    cardBg:
      'from-slate-50 to-zinc-50 dark:from-slate-900/20 dark:to-zinc-900/20',
  },
};

export default CreativeTimDesignSystem;
