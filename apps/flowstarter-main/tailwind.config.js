/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './node_modules/fumadocs-ui/dist/**/*.js',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.mdx',
  ],
  prefix: '',
  theme: {
    transparent: 'transparent',
    current: 'currentColor',
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        md: '2rem',
        tablet: '3rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        tablet: '900px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
    screens: {
      sm: '640px',
      md: '768px',
      tablet: '900px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'sans-serif'],
        mono: ['var(--font-roboto-mono)', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Override violet with custom purple #4d5dd9
        violet: {
          50: '#f2f3fe',
          100: '#e6e8fd',
          200: '#d2d6fb',
          300: '#b5bbf8',
          400: '#9098f2',
          500: '#6d75eb',
          600: '#4d5dd9',  // Exact brand color
          700: '#4046c4',
          800: '#363a9f',
          900: '#30347f',
          950: '#1f204b',
        },
        // Figma Design Tokens
        'ui-bg': {
          base: 'var(--ui-bg-base)',
          subtle: 'var(--ui-bg-subtle)',
          elevated: 'var(--ui-bg-elevated)',
          overlay: 'var(--ui-bg-overlay)',
          'overlay-hover': 'var(--ui-bg-overlay-hover)',
          input: 'var(--ui-bg-input)',
        },
        'ui-border': {
          base: 'var(--ui-border-base)',
          strong: 'var(--ui-border-strong)',
          focus: 'var(--ui-border-focus)',
        },
        'ui-text': {
          primary: 'var(--ui-text-primary)',
          secondary: 'var(--ui-text-secondary)',
          tertiary: 'var(--ui-text-tertiary)',
          dark: 'var(--ui-text-dark)',
          placeholder: 'var(--ui-text-placeholder)',
        },
        'ui-accent': {
          purple: 'var(--ui-accent-purple)',
          'purple-light': 'var(--ui-accent-purple-light)',
          'purple-bg': 'var(--ui-accent-purple-bg)',
          green: 'var(--ui-accent-green)',
          'green-bg': 'var(--ui-accent-green-bg)',
          orange: 'var(--ui-accent-orange)',
          blue: 'var(--ui-accent-blue)',
        },
        status: {
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          error: 'var(--status-error)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      keyframes: {
        accordionDown: {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        accordionUp: {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-100% - 1rem))' },
        },
        orbit: {
          '0%': {
            transform:
              'rotate(0deg) translateY(calc(var(--radius) * 1px)) rotate(0deg)',
          },
          '100%': {
            transform:
              'rotate(360deg) translateY(calc(var(--radius) * 1px)) rotate(-360deg)',
          },
        },
        gradientSlow: {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
        },
        // Bot animations - calm and professional
        'bot-breathe': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        'bot-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(-2deg)' },
          '50%': { transform: 'translateY(-4px) rotate(2deg)' },
        },
        'bot-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'bot-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '25%': { transform: 'translateY(-8px)' },
          '50%': { transform: 'translateY(0)' },
        },
        'bot-blink-slow': {
          '0%, 92%, 100%': { transform: 'scaleY(1)' },
          '96%': { transform: 'scaleY(0.1)' },
        },
        'bot-blink-attentive': {
          '0%, 88%, 100%': { transform: 'scaleY(1)' },
          '94%': { transform: 'scaleY(0.1)' },
        },
        'bot-blink-focused': {
          '0%, 96%, 100%': { transform: 'scaleY(1)' },
          '98%': { transform: 'scaleY(0.1)' },
        },
        'bot-blink-happy': {
          '0%, 85%, 100%': { transform: 'scaleY(1)' },
          '92%': { transform: 'scaleY(0.1)' },
        },
        'bot-blink-double': {
          '0%, 100%': { transform: 'scaleY(1)' },
          '15%': { transform: 'scaleY(0.1)' },
          '30%': { transform: 'scaleY(1)' },
          '55%': { transform: 'scaleY(0.1)' },
          '70%': { transform: 'scaleY(1)' },
        },
        'bot-pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.6' },
        },
        'bot-pulse-fast': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        accordionDown: 'accordion-down 0.2s ease-out',
        accordionUp: 'accordion-up 0.2s ease-out',
        marquee: 'marquee 30s linear infinite',
        orbit: 'orbit calc(var(--duration)*1s) linear infinite',
        'gradient-slow': 'gradientSlow 15s ease infinite',
        // Bot animations with professional timing
        'bot-breathe': 'bot-breathe 4s ease-in-out infinite',
        'bot-float': 'bot-float 2s ease-in-out infinite',
        'bot-pulse': 'bot-pulse 1.5s ease-in-out infinite',
        'bot-bounce': 'bot-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'bot-blink-slow': 'bot-blink-slow 6s ease-in-out infinite',
        'bot-blink-attentive': 'bot-blink-attentive 3.5s ease-in-out infinite',
        'bot-blink-focused': 'bot-blink-focused 8s ease-in-out infinite',
        'bot-blink-happy': 'bot-blink-happy 2.5s ease-in-out infinite',
        'bot-blink-double': 'bot-blink-double 0.6s ease-in-out',
        'bot-pulse-glow': 'bot-pulse-glow 1.5s ease-in-out infinite',
        'bot-pulse-fast': 'bot-pulse-fast 0.8s ease-in-out infinite',
      },
      maxWidth: {
        '8xl': '88rem',
      },
    },
  },
};
