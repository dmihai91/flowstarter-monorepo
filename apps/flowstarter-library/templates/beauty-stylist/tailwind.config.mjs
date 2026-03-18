/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C9607A',
          light: '#ce7087',
          dark: '#b5566e',
        },
        secondary: {
          DEFAULT: '#FBF5F7',
        },
        accent: {
          DEFAULT: '#8B5E3C',
          100: '#eaddd8',
          500: '#8B5E3C',
        },
        background: '#FFF9FA',
        surface: '#FFFFFF',
        text: '#2A1520',
        'text-muted': '#7C616D',
        'secondary-light': '#fbf6f8',
        'secondary-dark': '#e2ddde',
        cream: '#FFF9FA',
        warm: {
          50: '#fff9fa',
          100: '#efe3df',
          200: '#e3d4cc',
          300: '#d3beb2',
        },
        sage: {
          50: '#fff9fa',
          100: '#f9e7eb',
          200: '#f4dae0',
        },
        cool: {
          50: '#fff9fa',
          100: '#fff9fa',
          200: '#fef8f9',
          300: '#fef8f9',
        },
        steel: {
          50: '#fff9fa',
          100: '#fef8fa',
          200: '#fef8f9',
          300: '#fef8f9',
        },
        ember: {
          300: '#a75f58',
          400: '#9c5f4d',
        },
      },
      fontFamily: {
        sans: ['Jost', 'sans-serif'],
        serif: ['Cormorant', 'serif'],
        heading: ['Cormorant', 'serif'],
        display: ['Cormorant', 'serif'],
        body: ['Jost', 'sans-serif'],
        mono: ['Jost', 'monospace'],
      },
    },
  },
  plugins: [],
};
