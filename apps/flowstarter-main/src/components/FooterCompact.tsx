'use client';

import { useTranslations } from '@/lib/i18n';
import { CustomNavLink } from './ui/custom-nav-link';

export default function FooterCompact() {
  const { t } = useTranslations();

  return (
    <footer className="relative z-20">
      {/* Subtle top separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />

      <div className="bg-[rgba(243,243,243,0.30)] dark:bg-[rgba(58,58,74,0.30)] backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-between gap-3 lg:gap-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </div>

            <nav className="flex items-center flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-400 text-center">
              <CustomNavLink
                href="/help"
                className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                {t('footer.links.helpCenter')}
              </CustomNavLink>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <CustomNavLink
                href="/blog"
                className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                {t('footer.links.blog')}
              </CustomNavLink>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <CustomNavLink
                href="/privacy"
                className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                {t('footer.links.privacyPolicy')}
              </CustomNavLink>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <CustomNavLink
                href="/terms"
                className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                {t('footer.links.termsOfService')}
              </CustomNavLink>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <a
                href={process.env.NEXT_PUBLIC_EDITOR_URL || 'https://editor.flowstarter.dev'}
                className="hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                {t('footer.nav.editorLabel')}
              </a>
            </nav>

            <div className="flex items-center justify-center lg:justify-end gap-4 text-xs text-gray-500 dark:text-gray-400 w-full lg:w-auto flex-wrap">
              <div className="flex items-center gap-2">
                {/* Twitter */}
                <a
                  href="https://twitter.com/flowstarter"
                  className="group w-7 h-7 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-[var(--purple)]/10 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('footer.social.twitterAria')}
                >
                  <svg
                    className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-[var(--purple)] transition-colors duration-200"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                {/* GitHub */}
                <a
                  href="https://github.com/flowstarter"
                  className="group w-7 h-7 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-[var(--purple)]/10 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('footer.social.githubAria')}
                >
                  <svg
                    className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-[var(--purple)] transition-colors duration-200"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                {/* LinkedIn */}
                <a
                  href="https://linkedin.com/company/flowstarter"
                  className="group w-7 h-7 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-[var(--purple)]/10 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('footer.social.linkedinAria')}
                >
                  <svg
                    className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-[var(--purple)] transition-colors duration-200"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                {/* Discord */}
                <a
                  href="https://discord.gg/flowstarter"
                  className="group w-7 h-7 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-[var(--purple)]/10 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('footer.social.discordAria')}
                >
                  <svg
                    className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-[var(--purple)] transition-colors duration-200"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z" />
                  </svg>
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <span>{t('footer.buildWith')}</span>
                {/* Brand purple/red gradient heart */}
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id="heartGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="var(--purple)" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <path
                    fill="url(#heartGradient)"
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{t('footer.byTeam')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
