/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5',
          light: '#818cf8',
          dark: '#3730a3',
        },
        secondary: {
          DEFAULT: '#d97706',
          light: '#fbbf24',
          dark: '#b45309',
        },
        cream: '#faf9f7',
        warm: {
          50: '#fdfcfb',
          100: '#f7f5f2',
          200: '#f0ebe4',
          300: '#e5ddd2',
          400: '#d5c9b8',
          500: '#c4b49e',
        },
        sage: {
          50: '#f5f5f8',
          100: '#e8e8f0',
          200: '#d4d4e0',
          300: '#b5b5cc',
          400: '#8f8fb0',
          500: '#7c7ca0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
      },
    },
  },
  plugins: [],
};
