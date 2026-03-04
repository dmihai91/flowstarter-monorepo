'use client';

import Footer from '@/components/Footer';
import { SupportHeader } from '@/components/SupportHeader';
import { Sparkles, Package, DoorOpen, FileText, Mail } from 'lucide-react';
import { FlowBackground } from '@flowstarter/flow-design-system';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';

export default function TermsPage() {
  const { t } = useTranslations();
  const lastUpdated = 'February 25, 2026';

  const sections = [
    { title: t('terms.s1.title'), items: [
      { subtitle: t('terms.s1.i1.subtitle'), text: t('terms.s1.i1.text') },
      { subtitle: t('terms.s1.i2.subtitle'), text: t('terms.s1.i2.text') },
      { subtitle: t('terms.s1.i3.subtitle'), text: t('terms.s1.i3.text') },
    ] },
    { title: t('terms.s2.title'), items: [
      { subtitle: t('terms.s2.i1.subtitle'), text: t('terms.s2.i1.text') },
      { subtitle: t('terms.s2.i2.subtitle'), text: t('terms.s2.i2.text') },
      { subtitle: t('terms.s2.i3.subtitle'), text: t('terms.s2.i3.text') },
    ] },
    { title: t('terms.s3.title'), items: [
      { subtitle: t('terms.s3.i1.subtitle'), text: t('terms.s3.i1.text') },
      { subtitle: t('terms.s3.i2.subtitle'), text: t('terms.s3.i2.text') },
      { subtitle: t('terms.s3.i3.subtitle'), text: t('terms.s3.i3.text') },
      { subtitle: t('terms.s3.i4.subtitle'), text: t('terms.s3.i4.text') },
    ] },
    { title: t('terms.s4.title'), items: [
      { subtitle: t('terms.s4.i1.subtitle'), text: t('terms.s4.i1.text') },
      { subtitle: t('terms.s4.i2.subtitle'), text: t('terms.s4.i2.text') },
      { subtitle: t('terms.s4.i3.subtitle'), text: t('terms.s4.i3.text') },
    ] },
    { title: t('terms.s5.title'), items: [
      { subtitle: t('terms.s5.i1.subtitle'), text: t('terms.s5.i1.text') },
      { subtitle: t('terms.s5.i2.subtitle'), text: t('terms.s5.i2.text') },
    ] },
    { title: t('terms.s6.title'), items: [
      { subtitle: t('terms.s6.i1.subtitle'), text: t('terms.s6.i1.text') },
      { subtitle: t('terms.s6.i2.subtitle'), text: t('terms.s6.i2.text') },
      { subtitle: t('terms.s6.i3.subtitle'), text: t('terms.s6.i3.text') },
    ] },
    { title: t('terms.s7.title'), items: [
      { subtitle: t('terms.s7.i1.subtitle'), text: t('terms.s7.i1.text') },
      { subtitle: t('terms.s7.i2.subtitle'), text: t('terms.s7.i2.text') },
    ] },
    { title: t('terms.s8.title'), items: [
      { subtitle: t('terms.s8.i1.subtitle'), text: t('terms.s8.i1.text') },
      { subtitle: t('terms.s8.i2.subtitle'), text: t('terms.s8.i2.text') },
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
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--purple)]/10 text-[var(--purple)] text-sm font-medium mb-6">
              <FileText className="w-4 h-4" />
              {t('terms.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t('terms.title')}
            </h1>
            <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto mb-4">
              {t('terms.description')}
            </p>
            <p className="text-sm text-gray-400 dark:text-white/30">
              {t('terms.lastUpdated', { date: lastUpdated })}
            </p>
          </div>

          {/* Quick Summary */}
          <div className="grid sm:grid-cols-3 gap-4 mb-16">
            {[
              {
                Icon: Sparkles,
                title: t('terms.summary.pricing.title'),
                desc: t('terms.summary.pricing.desc'),
              },
              {
                Icon: Package,
                title: t('terms.summary.content.title'),
                desc: t('terms.summary.content.desc'),
              },
              {
                Icon: DoorOpen,
                title: t('terms.summary.cancel.title'),
                desc: t('terms.summary.cancel.desc'),
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--purple)]/10 flex items-center justify-center mx-auto mb-3">
                  <item.Icon className="w-6 h-6 text-[var(--purple)]" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-white/50">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <section
                key={index}
                className="p-8 rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center text-sm font-bold text-[var(--purple)]">
                    {index + 1}
                  </span>
                  {section.title}
                </h2>
                <div className="space-y-6">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {item.subtitle}
                      </h3>
                      <p className="text-gray-600 dark:text-white/60 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-[var(--purple)]/5 via-blue-500/5 to-cyan-500/5 border border-[var(--purple)]/10 dark:border-[var(--purple)]/20 text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('terms.contact.title')}
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-4">
              {t('terms.contact.description')}
            </p>
            <a
              href="mailto:hello@flowstarter.app"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--landing-btn-from)] via-[var(--landing-btn-via)] to-[var(--landing-btn-from)] text-white font-semibold hover:shadow-lg transition-all duration-300"
            >
              <Mail className="w-4 h-4" />
              hello@flowstarter.app
            </a>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
