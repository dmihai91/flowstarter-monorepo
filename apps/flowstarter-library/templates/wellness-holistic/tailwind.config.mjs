/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0d9488',
          light: '#2dd4bf',
          dark: '#0f766e',
        },
        secondary: {
          DEFAULT: '#a855f7',
          light: '#c084fc',
          dark: '#7c3aed',
        },
        cream: '#faf5ff',
        warm: {
          50: '#fdf8ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
        },
        sage: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
    },
  },
  plugins: [],
};
