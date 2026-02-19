const fs = require('fs');
const path = require('path');
const base = __dirname;

// 1. tailwind.config.mjs
fs.writeFileSync(path.join(base, 'tailwind.config.mjs'), `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0891b2',
          light: '#22d3ee',
          dark: '#0e7490',
        },
        secondary: {
          DEFAULT: '#7c3aed',
          light: '#a78bfa',
          dark: '#6d28d9',
        },
        cream: '#f8fafc',
        cool: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
`);
console.log('tailwind.config.mjs written');

// 2. src/styles/global.css
fs.writeFileSync(path.join(base, 'src/styles/global.css'), `@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-cream dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-sans antialiased transition-colors duration-300;
}

h1, h2, h3, h4, h5, h6 {
  @apply font-display text-slate-800 dark:text-white;
}

/* Button Styles */
.btn-primary {
  @apply inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5;
}

.btn-secondary {
  @apply inline-flex items-center justify-center px-8 py-4 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary-dark transition-all duration-300;
}

.btn-outline {
  @apply inline-flex items-center justify-center px-8 py-4 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-all duration-300;
}

/* Card Styles */
.card {
  @apply bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm dark:shadow-none dark:border dark:border-slate-700 hover:shadow-lg dark:hover:border-slate-600 transition-all duration-300;
}

.card-cool {
  @apply bg-cool-100 dark:bg-slate-800 rounded-2xl p-8 border border-cool-200 dark:border-slate-700;
}

/* Section Divider */
.section-divider {
  @apply w-20 h-1 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto;
}

/* Input Styles */
.input {
  @apply w-full px-5 py-4 rounded-xl bg-white dark:bg-slate-700 border border-cool-300 dark:border-slate-600 text-slate-700 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all;
}

.textarea {
  @apply w-full px-5 py-4 rounded-xl bg-white dark:bg-slate-700 border border-cool-300 dark:border-slate-600 text-slate-700 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none;
}

/* Grid/book decorative pattern */
.grid-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Crect width='60' height='60' fill='none'/%3E%3Cpath d='M0 30h60M30 0v60' stroke='%230891b2' stroke-opacity='0.06' stroke-width='1'/%3E%3Ccircle cx='30' cy='30' r='1.5' fill='%230891b2' fill-opacity='0.08'/%3E%3C/g%3E%3C/svg%3E");
}

/* Notebook lines pattern */
.lines-pattern {
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 31px,
    rgba(8, 145, 178, 0.06) 31px,
    rgba(8, 145, 178, 0.06) 32px
  );
}

/* Theme toggle */
.theme-toggle {
  @apply w-9 h-9 flex items-center justify-center rounded-full border border-cool-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer transition-all hover:border-primary;
}
.theme-toggle svg {
  @apply w-[1.125rem] h-[1.125rem] text-slate-700 dark:text-slate-300;
}
.icon-sun { @apply block; }
.icon-moon { @apply hidden; }
:global(html.dark) .icon-sun { @apply hidden; }
:global(html.dark) .icon-moon { @apply block; }
`);
console.log('global.css written');

console.log('Done with batch 1');
