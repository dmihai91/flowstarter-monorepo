'use client';

import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="py-6 border-t border-gray-200 dark:border-white/5 bg-white/50 dark:bg-transparent backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo + Copyright */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <span className="text-sm text-gray-400 dark:text-white/30">© {new Date().getFullYear()} Flowstarter</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-gray-400 dark:text-white/30">
            <a href="mailto:hello@flowstarter.dev" className="hover:text-gray-600 dark:hover:text-white/60 transition-colors">
              hello@flowstarter.dev
            </a>
            <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-white/60 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gray-600 dark:hover:text-white/60 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
