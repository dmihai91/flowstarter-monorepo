/**
 * Shown to clients (non-team users) who land on the editor but have no project yet.
 * Directs them to book a discovery call so the Flowstarter team can build their site first.
 * Uses flow-design-system components exclusively.
 */

import { useStore } from '@nanostores/react';
import { FlowBackground, Logo, GlassPanel, ScrollAwareHeader, Footer, ThemeToggle, type FooterLink } from '@flowstarter/flow-design-system';
import { getCalendlyUrl, getMainPlatformHomepage } from '~/lib/config/domains';
import { themeStore, setTheme } from '~/lib/stores/theme';
import { useTranslation } from '~/lib/i18n/useTranslation';

export function ClientNoProjectScreen() {
  const calendlyUrl = getCalendlyUrl();
  const homeUrl = getMainPlatformHomepage();
  const { t } = useTranslation();
  const theme = useStore(themeStore);

  const footerLinks: FooterLink[] = [
    { label: t.footer.help, href: '/help' },
    { label: t.footer.blog, href: '/blog' },
    { label: t.footer.privacy, href: '/privacy' },
    { label: t.footer.terms, href: '/terms' },
    { label: t.footer.contact, href: '/contact' },
    { label: t.footer.teamDashboard, href: '/team/dashboard' },
    { label: t.footer.editor, href: 'https://editor.flowstarter.dev', external: true },
  ];

  return (
    <div className="min-h-screen w-full font-display relative overflow-hidden flex flex-col">
      <FlowBackground variant="dashboard" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />

      {/* Header — matches main platform AuthLayout */}
      <ScrollAwareHeader className="z-50" scrolledClass="bg-white/80 dark:bg-[#14141a]/85 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <a href={homeUrl} className="flex items-center gap-2 sm:gap-3 no-underline">
            <Logo size="md" />
          </a>
          <ThemeToggle theme={theme} onThemeChange={setTheme} />
        </div>
      </ScrollAwareHeader>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 mt-14">
        <div className="w-full max-w-md">
          {/* Title block — gradient on last word */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-3">
              <span className="text-gray-900 dark:text-white">{t.client.siteBeingBuilt.split(' ').slice(0, -1).join(' ')} </span>
              <span className="bg-gradient-to-r from-[var(--purple,#4d5dd9)] to-blue-500 bg-clip-text text-transparent">
                {t.client.siteBeingBuilt.split(' ').slice(-1)}
              </span>
            </h1>
            <p className="text-gray-500 dark:text-white/50 text-sm">
              {t.client.siteBeingBuiltDescription}
            </p>
          </div>

          <div className="relative">
            <GlassPanel padding="lg" shadow="glass" className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--purple,#4d5dd9)]/20 to-indigo-300/10 border border-indigo-300/20 dark:border-indigo-400/15 flex items-center justify-center mx-auto mb-6">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-[var(--purple,#4d5dd9)]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>

              {/* Notification message */}
              <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed mb-6">
                {t.client.notifyWhenReady}
              </p>

              {/* CTA */}
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[var(--purple,#4d5dd9)] to-indigo-500 text-white font-semibold text-[15px] text-center no-underline shadow-[0_4px_16px_rgba(77,93,217,0.35)] hover:shadow-[0_6px_20px_rgba(77,93,217,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mb-3"
              >
                {t.client.bookDiscoveryCall}
              </a>

              {/* Back link */}
              <a
                href={homeUrl}
                className="block text-sm text-gray-400 dark:text-white/40 no-underline hover:text-gray-600 dark:hover:text-white/60 transition-colors"
              >
                &larr; {t.client.backToFlowstarter}
              </a>
            </GlassPanel>
          </div>

          {/* Stats — matches editor login layout */}
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-center">
              {[
                { value: '1-2', label: t.auth.stats.weeksToLaunch },
                { value: '1', label: t.auth.stats.callNeeded },
                { value: '0', label: t.auth.stats.techSkillsRequired },
              ].map((stat, i) => (
                <div key={i} className="flex items-center">
                  <div className="text-center px-4">
                    <div className="text-lg font-bold bg-gradient-to-r from-[var(--purple,#4d5dd9)] to-blue-500 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-[9px] text-gray-400 dark:text-white/30 uppercase tracking-wide font-medium">
                      {stat.label}
                    </div>
                  </div>
                  {i < 2 && (
                    <div className="w-px h-6 bg-gray-200 dark:bg-white/10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer baseUrl={homeUrl} links={footerLinks} builtWithLabel={t.footer.builtWith} byTeamLabel={t.footer.byTeam} />
    </div>
  );
}
