/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E8390E',
          light: '#ea4d26',
          dark: '#d1330d',
        },
        secondary: {
          DEFAULT: '#0A0A0A',
        },
        accent: {
          DEFAULT: '#F5C518',
          100: '#383011',
          500: '#F5C518',
        },
        background: '#0F0F0F',
        surface: '#181818',
        text: '#F5F5F5',
        'text-muted': '#B3B3B3',
        'secondary-light': '#1C1C1C',
        'secondary-dark': '#090909',
        cream: '#141414',
        warm: {
          50: '#F9F6EE',
          100: '#F0EBD8',
          200: '#E0D5BA',
          700: '#8B7355',
          800: '#5C4A2A',
          900: '#3D2E12',
        },
        sage: {
          50: '#161616',
          100: '#29140f',
          200: '#3a170f',
        },
        cool: {
          50: '#161616',
          100: '#0f0f0f',
          200: '#0e0e0e',
          300: '#0e0e0e',
        },
        steel: {
          50: '#161616',
          100: '#0e0e0e',
          200: '#0e0e0e',
          300: '#0d0d0d',
        },
        ember: {
          300: '#ef8614',
          400: '#f19e15',
        },
      },
      fontFamily: {
        sans: ['Barlow', 'sans-serif'],
        serif: ['Barlow Condensed', 'serif'],
        heading: ['Barlow Condensed', 'serif'],
        display: ['Barlow Condensed', 'serif'],
        body: ['Barlow', 'sans-serif'],
        mono: ['Barlow', 'monospace'],
      },
    },
  },
  plugins: [],
};
