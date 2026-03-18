/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A3A6B',
          light: '#314e7a',
          dark: '#173460',
        },
        secondary: {
          DEFAULT: '#EEF3FB',
        },
        accent: {
          DEFAULT: '#E84040',
          100: '#fbdddd',
          500: '#E84040',
        },
        background: '#FFFFFF',
        surface: '#FFFFFF',
        text: '#1A2744',
        'text-muted': '#5B6B89',
        'secondary-light': '#f0f4fb',
        'secondary-dark': '#d6dbe2',
        cream: '#FFFFFF',
        warm: {
          50: '#ffffff',
          100: '#fce4e4',
          200: '#f9d1d1',
          300: '#f6b6b6',
        },
        sage: {
          50: '#ffffff',
          100: '#e4e7ed',
          200: '#d1d8e1',
        },
        cool: {
          50: '#ffffff',
          100: '#fdfeff',
          200: '#fcfdfe',
          300: '#fafcfe',
        },
        steel: {
          50: '#ffffff',
          100: '#fdfdfe',
          200: '#fbfcfe',
          300: '#f9fbfe',
        },
        ember: {
          300: '#8b3d53',
          400: '#ae3e4c',
        },
      },
      fontFamily: {
        sans: ['Source Sans 3', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        heading: ['Merriweather', 'serif'],
        display: ['Merriweather', 'serif'],
        body: ['Source Sans 3', 'sans-serif'],
        mono: ['Source Sans 3', 'monospace'],
      },
    },
  },
  plugins: [],
};
