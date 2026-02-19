/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7c9885',
          light: '#9cb5a4',
          dark: '#5c7865',
        },
        secondary: {
          DEFAULT: '#d4a574',
          light: '#e5c4a5',
          dark: '#b88a55',
        },
        cream: '#faf8f5',
        warm: {
          50: '#fdfcfb',
          100: '#f7f4f0',
          200: '#f0ebe3',
          300: '#e5ddd0',
          400: '#d5c7b5',
          500: '#c4b19a',
        },
        sage: {
          50: '#f6f8f6',
          100: '#e8ede9',
          200: '#d4ddd6',
          300: '#b5c5b8',
          400: '#8fa896',
          500: '#7c9885',
        },
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
};
