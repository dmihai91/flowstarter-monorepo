/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0EA271',
          light: '#26ab7f',
          dark: '#0d9266',
        },
        secondary: {
          DEFAULT: '#F0FBF6',
        },
        accent: {
          DEFAULT: '#FF6B35',
          100: '#ffe4db',
          500: '#FF6B35',
        },
        background: '#FFFFFF',
        surface: '#FFFFFF',
        text: '#1A2E1A',
        'text-muted': '#5A715A',
        'secondary-light': '#f2fbf7',
        'secondary-dark': '#d8e2dd',
        cream: '#FFFFFF',
        warm: {
          50: '#ffffff',
          100: '#ffeae3',
          200: '#ffdbcf',
          300: '#ffc7b2',
        },
        sage: {
          50: '#ffffff',
          100: '#e2f4ee',
          200: '#cfece3',
        },
        cool: {
          50: '#ffffff',
          100: '#fefffe',
          200: '#fcfefd',
          300: '#fbfefc',
        },
        steel: {
          50: '#ffffff',
          100: '#fdfefe',
          200: '#fbfefd',
          300: '#fafefc',
        },
        ember: {
          300: '#938450',
          400: '#bc7a46',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Plus Jakarta Sans', 'serif'],
        heading: ['Plus Jakarta Sans', 'serif'],
        display: ['Plus Jakarta Sans', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['Inter', 'monospace'],
      },
    },
  },
  plugins: [],
};
