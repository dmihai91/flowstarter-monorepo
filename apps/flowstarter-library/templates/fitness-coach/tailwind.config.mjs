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
        text: '#FFFFFF',
        'text-muted': '#B3B3B3',
        'secondary-light': '#232323',
        'secondary-dark': '#090909',
        cream: '#0F0F0F',
        warm: {
          50: '#161616',
          100: '#2f2810',
          200: '#463b11',
          300: '#665412',
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
