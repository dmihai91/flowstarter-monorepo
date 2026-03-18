/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D6A4F',
          light: '#427961',
          dark: '#295f47',
        },
        secondary: {
          DEFAULT: '#F8F3E8',
        },
        accent: {
          DEFAULT: '#E76F51',
          100: '#f9e1d7',
          500: '#E76F51',
        },
        background: '#FDFAF4',
        surface: '#FFFFFF',
        text: '#1B2B1B',
        'text-muted': '#687468',
        'secondary-light': '#f9f4ea',
        'secondary-dark': '#dfdbd1',
        cream: '#FDFAF4',
        warm: {
          50: '#fdfaf4',
          100: '#fae7dd',
          200: '#f8d9cd',
          300: '#f5c5b6',
        },
        sage: {
          50: '#fdfaf4',
          100: '#e4e9e0',
          200: '#d3ddd3',
        },
        cool: {
          50: '#fdfaf4',
          100: '#fdf9f3',
          200: '#fcf9f2',
          300: '#fcf8f1',
        },
        steel: {
          50: '#fdfaf4',
          100: '#fcf9f2',
          200: '#fcf8f1',
          300: '#fbf7f0',
        },
        ember: {
          300: '#936d50',
          400: '#b36e50',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
        heading: ['Fraunces', 'serif'],
        display: ['Fraunces', 'serif'],
        body: ['Outfit', 'sans-serif'],
        mono: ['Outfit', 'monospace'],
      },
    },
  },
  plugins: [],
};
