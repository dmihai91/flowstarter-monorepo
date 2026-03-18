/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B6B',
          light: '#ff7a7a',
          dark: '#e66060',
        },
        secondary: {
          DEFAULT: '#FFF8F0',
        },
        accent: {
          DEFAULT: '#4ECDC4',
          100: '#dff4ef',
          500: '#4ECDC4',
        },
        background: '#FFFDF9',
        surface: '#FFFFFF',
        text: '#2D1B1B',
        'text-muted': '#806565',
        'secondary-light': '#fff9f2',
        'secondary-dark': '#e6dfd8',
        cream: '#FFFDF9',
        warm: {
          50: '#fffdf9',
          100: '#e6f6f2',
          200: '#d5f1ec',
          300: '#bcebe5',
        },
        sage: {
          50: '#fffdf9',
          100: '#ffebe8',
          200: '#ffe0dd',
        },
        cool: {
          50: '#fffdf9',
          100: '#fffdf8',
          200: '#fffcf7',
          300: '#fffcf6',
        },
        steel: {
          50: '#fffdf9',
          100: '#fffcf8',
          200: '#fffcf7',
          300: '#fffbf6',
        },
        ember: {
          300: '#9ea19c',
          400: '#80b2ab',
        },
      },
      fontFamily: {
        sans: ['Nunito Sans', 'sans-serif'],
        serif: ['Nunito', 'serif'],
        heading: ['Nunito', 'serif'],
        display: ['Nunito', 'serif'],
        body: ['Nunito Sans', 'sans-serif'],
        mono: ['Nunito Sans', 'monospace'],
      },
    },
  },
  plugins: [],
};
