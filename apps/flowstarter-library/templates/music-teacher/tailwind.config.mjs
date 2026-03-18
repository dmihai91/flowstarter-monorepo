/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6B35A8',
          light: '#8B55C8',
          dark: '#4B1580',
        },
        secondary: {
          DEFAULT: '#FAF7FF',
        },
        accent: {
          DEFAULT: '#FF9F43',
          100: '#3a2326',
          500: '#FF9F43',
        },
        background: '#FAF7FF',
        surface: '#FFFFFF',
        'surface-2': '#F4EEFF',
        text: '#1A0A2E',
        'text-muted': '#6B5A7A',
        border: 'rgba(107,53,168,0.12)',
        'secondary-light': '#FFFFFF',
        'secondary-dark': '#EEE6FA',
        cream: '#FAF7FF',
        warm: {
          50: '#faf7ff',
          100: '#f3eefe',
          200: '#eadffc',
          300: '#dbc4f6',
        },
        sage: {
          50: '#faf7ff',
          100: '#f2ebfd',
          200: '#e6dafb',
        },
        cool: {
          50: '#faf7ff',
          100: '#f7f3ff',
          200: '#f1e9ff',
          300: '#e6d8ff',
        },
        steel: {
          50: '#faf7ff',
          100: '#f4effd',
          200: '#ebe1fb',
          300: '#ddd0f5',
        },
        ember: {
          300: '#bc6f70',
          400: '#d6815f',
        },
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        serif: ['Abril Fatface', 'serif'],
        heading: ['Abril Fatface', 'serif'],
        display: ['Abril Fatface', 'serif'],
        body: ['Lato', 'sans-serif'],
        mono: ['Lato', 'monospace'],
      },
    },
  },
  plugins: [],
};
