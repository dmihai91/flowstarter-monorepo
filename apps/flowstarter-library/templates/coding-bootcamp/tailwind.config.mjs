/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00D4FF',
          light: '#1ad8ff',
          dark: '#00bfe6',
        },
        secondary: {
          DEFAULT: '#0A0F1E',
        },
        accent: {
          DEFAULT: '#7B2FBE',
          100: '#1b1136',
          500: '#7B2FBE',
        },
        background: '#060B18',
        surface: '#10182B',
        text: '#E8F4FD',
        'text-muted': '#8EA7BE',
        'secondary-light': '#232735',
        'secondary-dark': '#090e1b',
        cream: '#060B18',
        warm: {
          50: '#0d121f',
          100: '#16102f',
          200: '#221440',
          300: '#321957',
        },
        sage: {
          50: '#0d121f',
          100: '#052334',
          200: '#053346',
        },
        cool: {
          50: '#0d121f',
          100: '#060b19',
          200: '#070c19',
          300: '#070c1a',
        },
        steel: {
          50: '#0d121f',
          100: '#070c19',
          200: '#070c19',
          300: '#070c1a',
        },
        ember: {
          300: '#4479db',
          400: '#595dd0',
        },
      },
      fontFamily: {
        sans: ['JetBrains Mono', 'sans-serif'],
        serif: ['Space Grotesk', 'serif'],
        heading: ['Space Grotesk', 'serif'],
        display: ['Space Grotesk', 'serif'],
        body: ['JetBrains Mono', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
