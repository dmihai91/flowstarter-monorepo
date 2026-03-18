/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7B9E87',
          light: '#88a893',
          dark: '#6f8e7a',
        },
        secondary: {
          DEFAULT: '#F7F3EE',
        },
        accent: {
          DEFAULT: '#D4956A',
          100: '#f6e8dd',
          500: '#D4956A',
        },
        background: '#FDFAF6',
        surface: '#FFFFFF',
        text: '#2C3E2D',
        'text-muted': '#728274',
        'secondary-light': '#f8f4f0',
        'secondary-dark': '#dedbd6',
        cream: '#FDFAF6',
        warm: {
          50: '#fdfaf6',
          100: '#f7ece2',
          200: '#f3e2d4',
          300: '#edd4c1',
        },
        sage: {
          50: '#fdfaf6',
          100: '#edefe9',
          200: '#e3e8e0',
        },
        cool: {
          50: '#fdfaf6',
          100: '#fcf9f5',
          200: '#fcf9f5',
          300: '#fbf8f4',
        },
        steel: {
          50: '#fdfaf6',
          100: '#fcf9f5',
          200: '#fcf8f4',
          300: '#fbf7f3',
        },
        ember: {
          300: '#ac9977',
          400: '#bb9872',
        },
      },
      fontFamily: {
        sans: ['Mulish', 'sans-serif'],
        serif: ['Gilda Display', 'serif'],
        heading: ['Gilda Display', 'serif'],
        display: ['Gilda Display', 'serif'],
        body: ['Mulish', 'sans-serif'],
        mono: ['Mulish', 'monospace'],
      },
    },
  },
  plugins: [],
};
