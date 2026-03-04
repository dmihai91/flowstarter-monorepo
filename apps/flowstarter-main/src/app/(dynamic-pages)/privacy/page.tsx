'use client';

import Footer from '@/components/Footer';
import { SupportHeader } from '@/components/SupportHeader';
import { Shield, Bot, Download, Eye, Clock, Lock, Mail } from 'lucide-react';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { useTranslations } from '@/lib/i18n';

export default function PrivacyPage() {
  const { t } = useTranslations();
  const effectiveDate = 'February 27, 2026';
  const lastUpdated = 'February 27, 2026';
  const privacyEmail = 'privacy@flowstarter.dev';
  const supportEmail = 'hello@flowstarter.app';

  const glanceSummary = [
    { icon: Shield, title: t('privacy.glance.dataProtected.title'), desc: t('privacy.glance.dataProtected.desc') },
    { icon: Bot, title: t('privacy.glance.aiTransparent.title'), desc: t('privacy.glance.aiTransparent.desc') },
    { icon: Download, title: t('privacy.glance.ownContent.title'), desc: t('privacy.glance.ownContent.desc') },
    { icon: Eye, title: t('privacy.glance.noTracking.title'), desc: t('privacy.glance.noTracking.desc') },
    { icon: Clock, title: t('privacy.glance.retention.title'), desc: t('privacy.glance.retention.desc') },
    { icon: Lock, title: t('privacy.glance.gdpr.title'), desc: t('privacy.glance.gdpr.desc') },
  ];

  const sections = [
    { id: 'who-we-are', title: t('privacy.s1.title'), content: [
      { subtitle: t('privacy.s1.c1.subtitle'), text: t('privacy.s1.c1.text') },
      { subtitle: t('privacy.s1.c2.subtitle'), text: t('privacy.s1.c2.text') },
      { subtitle: t('privacy.s1.c3.subtitle'), text: t('privacy.s1.c3.text', { email: privacyEmail }) },
    ] },
    { id: 'lawful-basis', title: t('privacy.s2.title'), content: [
      { subtitle: t('privacy.s2.c1.subtitle'), text: t('privacy.s2.c1.text') },
      { subtitle: t('privacy.s2.c2.subtitle'), text: t('privacy.s2.c2.text') },
      { subtitle: t('privacy.s2.c3.subtitle'), text: t('privacy.s2.c3.text') },
      { subtitle: t('privacy.s2.c4.subtitle'), text: t('privacy.s2.c4.text') },
    ] },
    { id: 'data-collection', title: t('privacy.s3.title'), content: [
      { subtitle: t('privacy.s3.c1.subtitle'), text: t('privacy.s3.c1.text') },
      { subtitle: t('privacy.s3.c2.subtitle'), text: t('privacy.s3.c2.text') },
      { subtitle: t('privacy.s3.c3.subtitle'), text: t('privacy.s3.c3.text') },
      { subtitle: t('privacy.s3.c4.subtitle'), text: t('privacy.s3.c4.text') },
    ] },
    { id: 'data-use', title: t('privacy.s4.title'), content: [
      { subtitle: t('privacy.s4.c1.subtitle'), text: t('privacy.s4.c1.text') },
      { subtitle: t('privacy.s4.c2.subtitle'), text: t('privacy.s4.c2.text') },
      { subtitle: t('privacy.s4.c3.subtitle'), text: t('privacy.s4.c3.text') },
      { subtitle: t('privacy.s4.c4.subtitle'), text: t('privacy.s4.c4.text') },
    ] },
    { id: 'ai-data', title: t('privacy.s5.title'), highlight: true, content: [
      { subtitle: t('privacy.s5.c1.subtitle'), text: t('privacy.s5.c1.text') },
      { subtitle: t('privacy.s5.c2.subtitle'), text: t('privacy.s5.c2.text') },
      { subtitle: t('privacy.s5.c3.subtitle'), text: t('privacy.s5.c3.text') },
      { subtitle: t('privacy.s5.c4.subtitle'), text: t('privacy.s5.c4.text') },
    ] },
    { id: 'ai-training', title: t('privacy.s6.title'), highlight: true, content: [
      { subtitle: t('privacy.s6.c1.subtitle'), text: t('privacy.s6.c1.text') },
      { subtitle: t('privacy.s6.c2.subtitle'), text: t('privacy.s6.c2.text') },
      { subtitle: t('privacy.s6.c3.subtitle'), text: t('privacy.s6.c3.text', { email: privacyEmail }) },
      { subtitle: t('privacy.s6.c4.subtitle'), text: t('privacy.s6.c4.text') },
    ] },
    { id: 'third-parties', title: t('privacy.s7.title'), content: [
      { subtitle: t('privacy.s7.c1.subtitle'), text: t('privacy.s7.c1.text') },
      { subtitle: t('privacy.s7.c2.subtitle'), text: t('privacy.s7.c2.text') },
      { subtitle: t('privacy.s7.c3.subtitle'), text: t('privacy.s7.c3.text') },
      { subtitle: t('privacy.s7.c4.subtitle'), text: t('privacy.s7.c4.text') },
      { subtitle: t('privacy.s7.c5.subtitle'), text: t('privacy.s7.c5.text') },
    ] },
    { id: 'hosted-sites', title: t('privacy.s8.title'), content: [
      { subtitle: t('privacy.s8.c1.subtitle'), text: t('privacy.s8.c1.text') },
      { subtitle: t('privacy.s8.c2.subtitle'), text: t('privacy.s8.c2.text') },
      { subtitle: t('privacy.s8.c3.subtitle'), text: t('privacy.s8.c3.text') },
      { subtitle: t('privacy.s8.c4.subtitle'), text: t('privacy.s8.c4.text') },
    ] },
    { id: 'data-security', title: t('privacy.s9.title'), content: [
      { subtitle: t('privacy.s9.c1.subtitle'), text: t('privacy.s9.c1.text') },
      { subtitle: t('privacy.s9.c2.subtitle'), text: t('privacy.s9.c2.text') },
      { subtitle: t('privacy.s9.c3.subtitle'), text: t('privacy.s9.c3.text') },
      { subtitle: t('privacy.s9.c4.subtitle'), text: t('privacy.s9.c4.text') },
    ] },
    { id: 'gdpr-rights', title: t('privacy.s10.title'), content: [
      { subtitle: t('privacy.s10.c1.subtitle'), text: t('privacy.s10.c1.text') },
      { subtitle: t('privacy.s10.c2.subtitle'), text: t('privacy.s10.c2.text') },
      { subtitle: t('privacy.s10.c3.subtitle'), text: t('privacy.s10.c3.text') },
      { subtitle: t('privacy.s10.c4.subtitle'), text: t('privacy.s10.c4.text') },
      { subtitle: t('privacy.s10.c5.subtitle'), text: t('privacy.s10.c5.text') },
      { subtitle: t('privacy.s10.c6.subtitle'), text: t('privacy.s10.c6.text') },
      { subtitle: t('privacy.s10.c7.subtitle'), text: t('privacy.s10.c7.text') },
      { subtitle: t('privacy.s10.c8.subtitle'), text: t('privacy.s10.c8.text') },
      { subtitle: t('privacy.s10.c9.subtitle'), text: t('privacy.s10.c9.text', { email: privacyEmail }) },
    ] },
    { id: 'data-retention', title: t('privacy.s11.title'), content: [
      { subtitle: t('privacy.s11.c1.subtitle'), text: t('privacy.s11.c1.text') },
      { subtitle: t('privacy.s11.c2.subtitle'), text: t('privacy.s11.c2.text') },
      { subtitle: t('privacy.s11.c3.subtitle'), text: t('privacy.s11.c3.text') },
      { subtitle: t('privacy.s11.c4.subtitle'), text: t('privacy.s11.c4.text') },
      { subtitle: t('privacy.s11.c5.subtitle'), text: t('privacy.s11.c5.text') },
    ] },
    { id: 'international', title: t('privacy.s12.title'), content: [
      { subtitle: t('privacy.s12.c1.subtitle'), text: t('privacy.s12.c1.text') },
      { subtitle: t('privacy.s12.c2.subtitle'), text: t('privacy.s12.c2.text') },
      { subtitle: t('privacy.s12.c3.subtitle'), text: t('privacy.s12.c3.text') },
    ] },
    { id: 'cookies', title: t('privacy.s13.title'), content: [
      { subtitle: t('privacy.s13.c1.subtitle'), text: t('privacy.s13.c1.text') },
      { subtitle: t('privacy.s13.c2.subtitle'), text: t('privacy.s13.c2.text') },
      { subtitle: t('privacy.s13.c3.subtitle'), text: t('privacy.s13.c3.text') },
      { subtitle: t('privacy.s13.c4.subtitle'), text: t('privacy.s13.c4.text') },
    ] },
    { id: 'children', title: t('privacy.s14.title'), content: [
      { subtitle: t('privacy.s14.c1.subtitle'), text: t('privacy.s14.c1.text') },
      { subtitle: t('privacy.s14.c2.subtitle'), text: t('privacy.s14.c2.text', { email: privacyEmail }) },
    ] },
    { id: 'changes', title: t('privacy.s15.title'), content: [
      { subtitle: t('privacy.s15.c1.subtitle'), text: t('privacy.s15.c1.text') },
      { subtitle: t('privacy.s15.c2.subtitle'), text: t('privacy.s15.c2.text') },
      { subtitle: t('privacy.s15.c3.subtitle'), text: t('privacy.s15.c3.text') },
    ] },
    { id: 'contact', title: t('privacy.s16.title'), content: [
      { subtitle: t('privacy.s16.c1.subtitle'), text: t('privacy.s16.c1.text', { email: privacyEmail }) },
      { subtitle: t('privacy.s16.c2.subtitle'), text: t('privacy.s16.c2.text', { email: supportEmail }) },
      { subtitle: t('privacy.s16.c3.subtitle'), text: t('privacy.s16.c3.text') },
    ] },
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
              <Shield className="w-4 h-4" />
              {t('privacy.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t('privacy.title')}
            </h1>
            <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto mb-6">
              {t('privacy.description')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-400 dark:text-white/30">
              <span>{t('privacy.effective', { date: effectiveDate })}</span>
              <span className="hidden sm:inline">•</span>
              <span>{t('privacy.lastUpdated', { date: lastUpdated })}</span>
            </div>
          </div>

          {/* Privacy at a Glance */}
          <div className="mb-16 p-8 rounded-2xl bg-gradient-to-br from-[var(--purple)]/5 via-white to-blue-500/5 dark:from-[var(--purple)]/10 dark:via-[#0f0f12] dark:to-blue-500/10 border border-[var(--purple)]/20">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-[var(--purple)]" />
              {t('privacy.glance.title')}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {glanceSummary.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white/55 dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--purple)]/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-[var(--purple)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-white/50">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table of Contents */}
          <div className="mb-12 p-6 rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('privacy.contents')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-gray-600 dark:text-white/60 hover:text-[var(--purple)] dark:hover:text-[var(--purple)] transition-colors"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </div>

          {/* Important AI Notice */}
          <div className="mb-12 p-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  {t('privacy.aiNotice.title')}
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300/80 leading-relaxed mb-3">
                  {t('privacy.aiNotice.description')}
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-300/80 space-y-1">
                  <li>• {t('privacy.aiNotice.item1')}</li>
                  <li>• {t('privacy.aiNotice.item2')}</li>
                  <li>• {t('privacy.aiNotice.item3')}</li>
                  <li>• {t('privacy.aiNotice.item4')}</li>
                </ul>
                <p className="text-sm text-amber-700 dark:text-amber-300/80 mt-3">
                  {t('privacy.aiNotice.footer')}
                </p>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className={`p-8 rounded-2xl border ${
                  section.highlight
                    ? 'bg-[var(--purple)]/5 dark:bg-[var(--purple)]/10 border-[var(--purple)]/20'
                    : 'bg-white/55 dark:bg-white/[0.02] border-gray-200/50 dark:border-white/5'
                }`}
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {section.title}
                </h2>
                <div className="space-y-5">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                        {item.subtitle}
                      </h3>
                      <p className="text-gray-600 dark:text-white/60 leading-relaxed text-sm">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Terms of Service Reference */}
          <div className="mt-12 p-6 rounded-2xl bg-gray-100 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 text-center">
            <p className="text-sm text-gray-500 dark:text-white/50">
              {t('privacy.termsRef', { link: '' })}
              <a href="/terms" className="text-[var(--purple)] hover:underline">
                {t('privacy.termsRefLink')}
              </a>
            </p>
          </div>

          {/* Contact CTA */}
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-[var(--purple)]/5 via-blue-500/5 to-cyan-500/5 border border-[var(--purple)]/10 dark:border-[var(--purple)]/20 text-center">
            <Mail className="w-10 h-10 text-[var(--purple)] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('privacy.contact.title')}
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-4">
              {t('privacy.contact.description')}
            </p>
            <a
              href={`mailto:${privacyEmail}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--landing-btn-from)] via-[var(--landing-btn-via)] to-[var(--landing-btn-from)] text-white font-semibold hover:shadow-lg transition-all duration-300"
            >
              {privacyEmail}
            </a>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
