/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D6A4F',
          light: '#3D8A65',
          dark: '#1E4D39',
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
        surface: '#F8F3E8',
        text: '#1B2B1B',
        'text-muted': '#6B7B6B',
        'secondary-light': '#fdfaf4',
        'secondary-dark': '#eee4cf',
        cream: '#FDFAF4',
        warm: {
          50: '#fdfaf4',
          100: '#f8f3e8',
          200: '#eee4cf',
          300: '#dcc9af',
        },
        sage: {
          50: '#fdfaf4',
          100: '#edf3ee',
          200: '#d8e5db',
        },
        cool: {
          50: '#fdfaf4',
          100: '#fbf7ef',
          200: '#f5efe2',
          300: '#ece2d1',
        },
        steel: {
          50: '#fdfaf4',
          100: '#f7f2e7',
          200: '#ece5d6',
          300: '#ddd4c4',
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
