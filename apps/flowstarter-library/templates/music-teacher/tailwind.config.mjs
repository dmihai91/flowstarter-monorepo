/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6B35A8',
          light: '#7a49b1',
          dark: '#603097',
        },
        secondary: {
          DEFAULT: '#1A0A2E',
        },
        accent: {
          DEFAULT: '#FF9F43',
          100: '#3a2326',
          500: '#FF9F43',
        },
        background: '#0F0820',
        surface: '#1B1231',
        text: '#F0E6FF',
        'text-muted': '#B7A6D2',
        'secondary-light': '#312343',
        'secondary-dark': '#170929',
        cream: '#0F0820',
        warm: {
          50: '#160f27',
          100: '#311d25',
          200: '#492c28',
          300: '#6a412d',
        },
        sage: {
          50: '#160f27',
          100: '#1a0d30',
          200: '#21113b',
        },
        cool: {
          50: '#160f27',
          100: '#100821',
          200: '#110823',
          300: '#120924',
        },
        steel: {
          50: '#160f27',
          100: '#110822',
          200: '#120823',
          300: '#130925',
        },
        ember: {
          300: '#bc6f70',
          400: '#d6815f',
        },
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        serif: ['Abril Fatface', 'serif'],
        heading: ['Abril Fatface', 'serif'],
        display: ['Abril Fatface', 'serif'],
        body: ['Lato', 'sans-serif'],
        mono: ['Lato', 'monospace'],
      },
    },
  },
  plugins: [],
};
