'use client';

import Footer from '@/components/Footer';
import { SupportHeader } from '@/components/SupportHeader';
import { Cookie, Shield, BarChart3, Settings, Check } from 'lucide-react';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { useTranslations } from '@/lib/i18n';

export default function CookiePolicyPage() {
  const { t } = useTranslations();
  const lastUpdated = 'February 27, 2026';

  const cookieTypes = [
    {
      icon: Shield,
      name: t('cookies.type.essential.name'),
      required: true,
      description: t('cookies.type.essential.description'),
      examples: [
        { name: 'session_id', purpose: t('cookies.cookie.sessionId.purpose'), duration: t('cookies.cookie.sessionId.duration') },
        { name: 'csrf_token', purpose: t('cookies.cookie.csrfToken.purpose'), duration: t('cookies.cookie.csrfToken.duration') },
        { name: 'cookie_consent', purpose: t('cookies.cookie.cookieConsent.purpose'), duration: t('cookies.cookie.cookieConsent.duration') },
        { name: 'theme', purpose: t('cookies.cookie.theme.purpose'), duration: t('cookies.cookie.theme.duration') },
      ],
    },
    {
      icon: BarChart3,
      name: t('cookies.type.analytics.name'),
      required: false,
      description: t('cookies.type.analytics.description'),
      examples: [
        { name: 'plausible_*', purpose: t('cookies.cookie.plausible.purpose'), duration: t('cookies.cookie.plausible.duration') },
      ],
    },
    {
      icon: Settings,
      name: t('cookies.type.functional.name'),
      required: false,
      description: t('cookies.type.functional.description'),
      examples: [
        { name: 'language', purpose: t('cookies.cookie.language.purpose'), duration: t('cookies.cookie.language.duration') },
        { name: 'sidebar_collapsed', purpose: t('cookies.cookie.sidebar.purpose'), duration: t('cookies.cookie.sidebar.duration') },
      ],
    },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display {
          font-family: 'Outfit', system-ui, sans-serif;
        }
      `}</style>

      <div className="min-h-screen font-display page-gradient">
        <FlowBackground variant="dashboard" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />

        <SupportHeader />

        {/* Content */}
        <main className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-16">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--purple)]/10 text-[var(--purple)] text-sm font-medium mb-6">
              <Cookie className="w-4 h-4" />
              {t('cookies.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t('cookies.title')}
            </h1>
            <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto mb-4">
              {t('cookies.description')}
            </p>
            <p className="text-sm text-gray-400 dark:text-white/30">
              {t('cookies.lastUpdated', { date: lastUpdated })}
            </p>
          </div>

          {/* Quick Summary */}
          <div className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-[var(--purple)]/5 via-white to-blue-500/5 dark:from-[var(--purple)]/10 dark:via-[#0f0f12] dark:to-blue-500/10 border border-[var(--purple)]/20">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Cookie className="w-5 h-5 text-[var(--purple)]" />
              {t('cookies.shortVersion.title')}
            </h2>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-white/60">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span><strong>{t('cookies.shortVersion.essential')}</strong>{t('cookies.shortVersion.essentialDesc')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span><strong>{t('cookies.shortVersion.analytics')}</strong>{t('cookies.shortVersion.analyticsDesc')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span><strong>{t('cookies.shortVersion.noAds')}</strong>{t('cookies.shortVersion.noAdsDesc')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span><strong>{t('cookies.shortVersion.control')}</strong>{t('cookies.shortVersion.controlDesc')}</span>
              </li>
            </ul>
          </div>

          {/* What Are Cookies */}
          <section className="mb-10 p-8 rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('cookies.whatAreCookies.title')}
            </h2>
            <p className="text-gray-600 dark:text-white/60 leading-relaxed mb-4">
              {t('cookies.whatAreCookies.p1')}
            </p>
            <p className="text-gray-600 dark:text-white/60 leading-relaxed">
              {t('cookies.whatAreCookies.p2')}
            </p>
          </section>

          {/* Cookie Types */}
          <div className="space-y-8 mb-10">
            {cookieTypes.map((type, index) => (
              <section
                key={index}
                className="p-8 rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[var(--purple)]/10 flex items-center justify-center flex-shrink-0">
                    <type.icon className="w-6 h-6 text-[var(--purple)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {type.name}
                      </h2>
                      {type.required ? (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60 rounded">
                          {t('cookies.label.required')}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded">
                          {t('cookies.label.optional')}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-white/60 leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                </div>

                {/* Cookie Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('cookies.table.cookie')}</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('cookies.table.purpose')}</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('cookies.table.duration')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {type.examples.map((cookie, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-white/5 last:border-0">
                          <td className="py-3 px-4 font-mono text-xs text-[var(--purple)]">{cookie.name}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-white/60">{cookie.purpose}</td>
                          <td className="py-3 px-4 text-gray-500 dark:text-white/40">{cookie.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>

          {/* Third-Party Cookies */}
          <section className="mb-10 p-8 rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('cookies.thirdParty.title')}
            </h2>
            <p className="text-gray-600 dark:text-white/60 leading-relaxed mb-4">
              {t('cookies.thirdParty.description')}
            </p>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-white/60">
              <li className="flex items-start gap-2">
                <span className="text-[var(--purple)]">•</span>
                <span><strong>{t('cookies.thirdParty.stripe')}</strong>{t('cookies.thirdParty.stripeDesc')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--purple)]">•</span>
                <span><strong>{t('cookies.thirdParty.supabase')}</strong>{t('cookies.thirdParty.supabaseDesc')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--purple)]">•</span>
                <span><strong>{t('cookies.thirdParty.cloudflare')}</strong>{t('cookies.thirdParty.cloudflareDesc')}</span>
              </li>
            </ul>
            <p className="text-gray-500 dark:text-white/40 text-sm mt-4">
              {t('cookies.thirdParty.footer')}
            </p>
          </section>

          {/* Managing Cookies */}
          <section className="mb-10 p-8 rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('cookies.managing.title')}
            </h2>
            <p className="text-gray-600 dark:text-white/60 leading-relaxed mb-4">
              {t('cookies.managing.description')}
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-white/60 mb-4">
              <li>• <strong>{t('cookies.managing.chrome')}</strong>{t('cookies.managing.chromeDesc')}</li>
              <li>• <strong>{t('cookies.managing.firefox')}</strong>{t('cookies.managing.firefoxDesc')}</li>
              <li>• <strong>{t('cookies.managing.safari')}</strong>{t('cookies.managing.safariDesc')}</li>
              <li>• <strong>{t('cookies.managing.edge')}</strong>{t('cookies.managing.edgeDesc')}</li>
            </ul>
            <p className="text-amber-600 dark:text-amber-400 text-sm">
              {t('cookies.managing.warning')}
            </p>
          </section>

          {/* Updates */}
          <section className="mb-10 p-8 rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('cookies.changes.title')}
            </h2>
            <p className="text-gray-600 dark:text-white/60 leading-relaxed">
              {t('cookies.changes.description')}
            </p>
          </section>

          {/* Contact */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-[var(--purple)]/5 via-blue-500/5 to-cyan-500/5 border border-[var(--purple)]/10 dark:border-[var(--purple)]/20 text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('cookies.contact.title')}
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-4">
              {t('cookies.contact.description', { link: '' })}<a href="/privacy" className="text-[var(--purple)] hover:underline">{t('cookies.contact.privacyLink')}</a>
            </p>
            <a
              href="mailto:privacy@flowstarter.dev"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--landing-btn-from)] via-[var(--landing-btn-via)] to-[var(--landing-btn-from)] text-white font-semibold hover:shadow-lg transition-all duration-300"
            >
              privacy@flowstarter.dev
            </a>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
