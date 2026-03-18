/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B1F3A',
          light: '#32354e',
          dark: '#181c34',
        },
        secondary: {
          DEFAULT: '#F8F4EF',
        },
        accent: {
          DEFAULT: '#E8A838',
          100: '#fbefdb',
          500: '#E8A838',
        },
        background: '#FFFFFF',
        surface: '#FFFFFF',
        text: '#1B1F3A',
        'text-muted': '#5C617C',
        'secondary-light': '#f9f5f1',
        'secondary-dark': '#dfdcd7',
        cream: '#FFFFFF',
        warm: {
          50: '#ffffff',
          100: '#fcf3e3',
          200: '#f9eacf',
          300: '#f6deb3',
        },
        sage: {
          50: '#ffffff',
          100: '#e4e4e7',
          200: '#d1d2d8',
        },
        cool: {
          50: '#ffffff',
          100: '#fefefd',
          200: '#fefdfc',
          300: '#fdfcfb',
        },
        steel: {
          50: '#ffffff',
          100: '#fefdfd',
          200: '#fdfcfb',
          300: '#fcfbf9',
        },
        ember: {
          300: '#8c6a39',
          400: '#af8239',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        heading: ['Playfair Display', 'serif'],
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['DM Sans', 'monospace'],
      },
    },
  },
  plugins: [],
};
