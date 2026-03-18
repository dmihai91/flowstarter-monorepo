/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF4500',
          light: '#ff581a',
          dark: '#e63e00',
        },
        secondary: {
          DEFAULT: '#0A0A0A',
        },
        accent: {
          DEFAULT: '#F5F5F0',
          100: '#363635',
          500: '#F5F5F0',
        },
        background: '#0C0C0C',
        surface: '#181818',
        text: '#F0EDE8',
        'text-muted': '#AAA59B',
        'secondary-light': '#232323',
        'secondary-dark': '#090909',
        cream: '#0C0C0C',
        warm: {
          50: '#131313',
          100: '#2d2d2c',
          200: '#444443',
          300: '#656563',
        },
        sage: {
          50: '#131313',
          100: '#29130b',
          200: '#3d170a',
        },
        cool: {
          50: '#131313',
          100: '#0c0c0c',
          200: '#0c0c0c',
          300: '#0b0b0b',
        },
        steel: {
          50: '#131313',
          100: '#0c0c0c',
          200: '#0c0c0c',
          300: '#0b0b0b',
        },
        ember: {
          300: '#faa684',
          400: '#f8c4ad',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Bebas Neue', 'serif'],
        heading: ['Bebas Neue', 'serif'],
        display: ['Bebas Neue', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['Inter', 'monospace'],
      },
    },
  },
  plugins: [],
};
