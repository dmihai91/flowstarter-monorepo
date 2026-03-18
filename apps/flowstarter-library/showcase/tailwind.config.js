/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        purple: {
          50: 'hsl(241 93% 97%)',
          100: 'hsl(241 93% 94%)',
          200: 'hsl(241 93% 88%)',
          300: 'hsl(241 93% 78%)',
          400: 'hsl(241 93% 71%)',
          500: 'hsl(241 93% 61%)',
          600: 'hsl(241 92% 57%)',
          700: 'hsl(241 91% 50%)',
          800: 'hsl(241 91% 42%)',
          900: 'hsl(241 91% 35%)',
          950: 'hsl(241 91% 20%)',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      animation: {
        shimmer: 'shimmer 2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        glow: '0 0 40px -12px rgba(139, 92, 246, 0.35)',
        'glow-lg': '0 0 60px -12px rgba(139, 92, 246, 0.4)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
