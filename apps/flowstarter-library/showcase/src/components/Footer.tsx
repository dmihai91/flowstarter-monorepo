import React from 'react';
import { Github, Twitter } from 'lucide-react';
import { useTranslation } from '../i18n';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center">
                <span className="text-white font-display font-bold text-lg">F</span>
              </div>
              <span className="font-display text-xl font-semibold text-surface-900 dark:text-white">
                {t('brand.name')}
              </span>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400 mb-6 max-w-md leading-relaxed">
              {t('hero.description')}
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display font-semibold text-surface-900 dark:text-white mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-surface-600 dark:text-surface-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
                  {t('footer.docs')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-surface-600 dark:text-surface-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
                  {t('footer.github')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-surface-900 dark:text-white mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-surface-600 dark:text-surface-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
                  {t('footer.about')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-surface-600 dark:text-surface-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
                  {t('footer.contact')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-surface-500 dark:text-surface-500">
            {t('footer.copyright', { year: currentYear })}
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-500">
            {t('footer.tagline')}
          </p>
        </div>
      </div>
    </footer>
  );
}
