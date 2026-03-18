/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6B8E6B',
          light: '#7a997a',
          dark: '#608060',
        },
        secondary: {
          DEFAULT: '#F5F0EB',
        },
        accent: {
          DEFAULT: '#C4956A',
          100: '#f0e8de',
          500: '#C4956A',
        },
        background: '#FAFAF7',
        surface: '#FFFFFF',
        text: '#2D3B2D',
        'text-muted': '#667467',
        'secondary-light': '#f6f2ed',
        'secondary-dark': '#ddd8d4',
        cream: '#FAFAF7',
        warm: {
          50: '#fafaf7',
          100: '#f2ece3',
          200: '#ede2d5',
          300: '#e5d4c1',
        },
        sage: {
          50: '#fafaf7',
          100: '#e9ede6',
          200: '#dde4db',
        },
        cool: {
          50: '#fafaf7',
          100: '#faf9f6',
          200: '#f9f8f5',
          300: '#f9f7f4',
        },
        steel: {
          50: '#fafaf7',
          100: '#f9f9f5',
          200: '#f9f8f4',
          300: '#f8f6f3',
        },
        ember: {
          300: '#9c926a',
          400: '#ab936a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
        heading: ['Cormorant Garamond', 'serif'],
        display: ['Cormorant Garamond', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['Inter', 'monospace'],
      },
    },
  },
  plugins: [],
};
