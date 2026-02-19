const fs = require('fs');
const path = require('path');
const base = 'd:/Projects/flowstarter/flowstarter-monorepo/apps/flowstarter-library/templates/fitness-coach';

const layout = `---
import { Icon } from 'astro-icon/components';
import '../styles/global.css';

interface Props {
  title?: string;
  description?: string;
}

const { 
  title = "Mike Torres - Certified Personal Trainer & Fitness Coach",
  description = "Transform your body and mind with personalized training programs. NASM certified personal trainer specializing in strength, weight loss, and athletic performance."
} = Astro.props;

const navLinks = [
  { label: "Home", href: "#" },
  { label: "About", href: "#about" },
  { label: "Programs", href: "#programs" },
  { label: "Results", href: "#results" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content={description} />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <title>{title}</title>
    <script is:inline>
      (function() {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (saved === 'dark' || (!saved && prefersDark)) {
          document.documentElement.classList.add('dark');
        }
      })();
    </script>
  </head>
  <body class="min-h-screen">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-cream/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-steel-200 dark:border-slate-800 transition-colors">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          <!-- Logo -->
          <a href="#" class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center">
              <Icon name="lucide:dumbbell" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <span class="text-lg font-display font-semibold text-slate-800 dark:text-white">Mike Torres</span>
              <span class="hidden sm:inline text-sm text-primary font-medium ml-2">Fitness</span>
            </div>
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden lg:flex items-center gap-8">
            {navLinks.map((link: { label: string; href: string }) => (
              <a href={link.href} class="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors text-sm font-medium">
                {link.label}
              </a>
            ))}
          </div>

          <!-- CTA Button -->
          <div class="hidden md:flex items-center gap-4">
            <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode">
              <svg class="icon-sun" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
              <svg class="icon-moon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
            </button>
            <a href="tel:+15553456789" class="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors text-sm flex items-center gap-2">
              <Icon name="lucide:phone" class="w-4 h-4" />
              (555) 345-6789
            </a>
            <a href="#contact" class="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors shadow-md hover:shadow-primary/25">
              Start Training
            </a>
          </div>

          <!-- Mobile Actions -->
          <div class="flex items-center gap-2 lg:hidden">
            <button class="theme-toggle" id="theme-toggle-mobile" aria-label="Toggle dark mode">
              <svg class="icon-sun" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
              <svg class="icon-moon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
            </button>
            <button id="mobile-menu-btn" class="p-2 text-slate-700 dark:text-slate-300" aria-label="Toggle menu">
              <svg class="w-6 h-6 icon-menu" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
              <svg class="w-6 h-6 icon-close hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div id="mobile-menu" class="hidden lg:hidden bg-cream dark:bg-slate-900 border-t border-steel-200 dark:border-slate-800">
        <div class="px-4 py-6 space-y-4">
          {navLinks.map((link: { label: string; href: string }) => (
            <a href={link.href} class="block text-slate-600 dark:text-slate-300 hover:text-primary transition-colors font-medium">
              {link.label}
            </a>
          ))}
          <div class="pt-4 border-t border-steel-200 dark:border-slate-800 space-y-3">
            <a href="tel:+15553456789" class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Icon name="lucide:phone" class="w-4 h-4" />
              (555) 345-6789
            </a>
            <a href="#contact" class="block w-full text-center px-5 py-3 bg-primary text-white font-semibold rounded-lg">
              Start Training
            </a>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-secondary-dark dark:bg-slate-950 border-t border-slate-700 dark:border-slate-800 transition-colors">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <!-- Brand Column -->
          <div class="lg:col-span-2">
            <a href="#" class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Icon name="lucide:dumbbell" class="w-5 h-5 text-primary" />
              </div>
              <div>
                <span class="text-lg font-display font-semibold text-white">Mike Torres</span>
                <span class="text-sm text-primary font-medium ml-2">Fitness</span>
              </div>
            </a>
            <p class="text-slate-400 mb-6 max-w-sm">
              Helping people transform their bodies and build lasting strength through science-backed training programs and dedicated coaching.
            </p>
            <div class="flex gap-4">
              <a href="#" class="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                <Icon name="lucide:instagram" class="w-5 h-5" />
              </a>
              <a href="#" class="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                <Icon name="lucide:youtube" class="w-5 h-5" />
              </a>
              <a href="#" class="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                <Icon name="lucide:facebook" class="w-5 h-5" />
              </a>
              <a href="#" class="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                <Icon name="lucide:twitter" class="w-5 h-5" />
              </a>
            </div>
          </div>

          <!-- Quick Links -->
          <div>
            <h4 class="font-display font-semibold text-white mb-4">Quick Links</h4>
            <ul class="space-y-3">
              <li><a href="#about" class="text-slate-400 hover:text-primary transition-colors">About Coach</a></li>
              <li><a href="#programs" class="text-slate-400 hover:text-primary transition-colors">Programs</a></li>
              <li><a href="#results" class="text-slate-400 hover:text-primary transition-colors">Client Results</a></li>
              <li><a href="#faq" class="text-slate-400 hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#contact" class="text-slate-400 hover:text-primary transition-colors">Book Session</a></li>
            </ul>
          </div>

          <!-- Contact Info -->
          <div>
            <h4 class="font-display font-semibold text-white mb-4">Contact</h4>
            <ul class="space-y-3">
              <li class="flex items-start gap-3">
                <Icon name="lucide:map-pin" class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span class="text-slate-400">456 Iron Street<br>Fitness District<br>Austin, TX 78701</span>
              </li>
              <li class="flex items-center gap-3">
                <Icon name="lucide:phone" class="w-5 h-5 text-primary" />
                <a href="tel:+15553456789" class="text-slate-400 hover:text-primary transition-colors">(555) 345-6789</a>
              </li>
              <li class="flex items-center gap-3">
                <Icon name="lucide:mail" class="w-5 h-5 text-primary" />
                <a href="mailto:mike@torresfit.com" class="text-slate-400 hover:text-primary transition-colors">mike@torresfit.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-12 pt-8 border-t border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Mike Torres Fitness. All rights reserved.
          </p>
          <div class="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" class="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" class="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" class="hover:text-primary transition-colors">Waiver</a>
          </div>
        </div>
      </div>
    </footer>

    <script>
      // Dark mode toggle
      function toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      }
      document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
      document.getElementById('theme-toggle-mobile')?.addEventListener('click', toggleTheme);

      // Mobile menu
      const mobileMenuBtn = document.getElementById('mobile-menu-btn');
      const mobileMenu = document.getElementById('mobile-menu');
      const menuIcon = mobileMenuBtn?.querySelector('.icon-menu');
      const closeIcon = mobileMenuBtn?.querySelector('.icon-close');

      mobileMenuBtn?.addEventListener('click', () => {
        mobileMenu?.classList.toggle('hidden');
        menuIcon?.classList.toggle('hidden');
        closeIcon?.classList.toggle('hidden');
      });

      mobileMenu?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu?.classList.add('hidden');
          menuIcon?.classList.remove('hidden');
          closeIcon?.classList.add('hidden');
        });
      });

      window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
          mobileMenu?.classList.add('hidden');
          menuIcon?.classList.remove('hidden');
          closeIcon?.classList.add('hidden');
        }
      });
    </script>
  </body>
</html>
`;

fs.writeFileSync(path.join(base, 'src', 'layouts', 'Layout.astro'), layout);
console.log('Layout.astro written successfully');
