'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Wrench, Rocket, Phone, Mail, HelpCircle, ChevronDown } from 'lucide-react';
import { EXTERNAL_URLS } from '@/lib/constants';
import { useTranslations } from '@/lib/i18n';

/**
 * Shared help page content. Used by both public /help and logged-in /dashboard/help.
 * @param showHero - Show the hero section (false for logged-in, where header provides context)
 * @param showCta - Show the bottom CTA (false for logged-in, where sidebar has the CTA)
 */
export function HelpContent({ showHero = true, showCta = true }: { showHero?: boolean; showCta?: boolean }) {
  const { t } = useTranslations();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { question: t('help.faq1.question'), answer: t('help.faq1.answer') },
    { question: t('help.faq2.question'), answer: t('help.faq2.answer') },
    { question: t('help.faq3.question'), answer: t('help.faq3.answer') },
    { question: t('help.faq4.question'), answer: t('help.faq4.answer') },
    { question: t('help.faq5.question'), answer: t('help.faq5.answer') },
    { question: t('help.faq6.question'), answer: t('help.faq6.answer') },
    { question: t('help.faq7.question'), answer: t('help.faq7.answer') },
    { question: t('help.faq8.question'), answer: t('help.faq8.answer') },
    { question: t('help.faq9.question'), answer: t('help.faq9.answer') },
    { question: t('help.faq10.question'), answer: t('help.faq10.answer') },
  ];

  const steps = [
    { number: t('help.step1.number'), title: t('help.step1.title'), description: t('help.step1.description'), Icon: MessageCircle },
    { number: t('help.step2.number'), title: t('help.step2.title'), description: t('help.step2.description'), Icon: Wrench },
    { number: t('help.step3.number'), title: t('help.step3.title'), description: t('help.step3.description'), Icon: Rocket },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
      {/* Hero */}
      {showHero && (
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--purple)]/10 text-[var(--purple)] text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            {t('help.badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('help.title')}
          </h1>
          <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto">
            {t('help.description')}
          </p>
        </div>
      )}

      {!showHero && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('help.loggedInTitle')}</h1>
          <p className="text-sm text-gray-500 dark:text-white/50">{t('help.loggedInDescription')}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-12 sm:mb-16">
        <a href={EXTERNAL_URLS.calendly.discovery} target="_blank" rel="noopener noreferrer" className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[var(--purple)]/10 to-blue-500/10 border border-[var(--purple)]/20 hover:border-[var(--purple)]/40 transition-all group">
          <div className="w-11 h-11 rounded-xl bg-[var(--purple)]/10 flex items-center justify-center mb-3 group-hover:bg-[var(--purple)]/20 transition-colors">
            <Phone className="w-5 h-5 text-[var(--purple)]" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-[var(--purple)] transition-colors">{t('help.quickAction.discovery.title')}</h3>
          <p className="text-sm text-gray-500 dark:text-white/50">{t('help.quickAction.discovery.desc')}</p>
        </a>
        <a href="mailto:hello@flowstarter.app" className="p-5 sm:p-6 rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 hover:border-[var(--purple)]/40 transition-all group">
          <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3 group-hover:bg-[var(--purple)]/10 transition-colors">
            <Mail className="w-5 h-5 text-gray-600 dark:text-white/60 group-hover:text-[var(--purple)] transition-colors" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-[var(--purple)] transition-colors">{t('help.quickAction.email.title')}</h3>
          <p className="text-sm text-gray-500 dark:text-white/50">{t('help.quickAction.email.desc')}</p>
        </a>
      </div>

      {/* How It Works */}
      <section className="mb-12 sm:mb-16">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 text-center">{t('help.howItWorks')}</h2>
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {steps.map((step, i) => (
            <div key={i} className="p-5 sm:p-6 rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/10 flex items-center justify-center">
                  <step.Icon className="w-5 h-5 text-[var(--purple)]" />
                </div>
                <span className="text-sm font-bold text-[var(--purple)]">{step.number}</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5">{step.title}</h3>
              <p className="text-sm text-gray-500 dark:text-white/50">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="mb-12 sm:mb-16">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 text-center">{t('help.faqTitle')}</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-5 sm:px-6 py-4 text-left flex items-center justify-between gap-4">
                <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 sm:px-6 pb-4">
                  <p className="text-sm sm:text-base text-gray-500 dark:text-white/50 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {showCta && (
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[var(--purple)]/5 via-blue-500/5 to-cyan-500/5 border border-[var(--purple)]/10 dark:border-[var(--purple)]/20 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('help.cta.title')}</h2>
          <p className="text-gray-500 dark:text-white/50 mb-6">{t('help.cta.description')}</p>
          <a href={EXTERNAL_URLS.calendly.discovery} target="_blank" rel="noopener noreferrer">
            <Button variant="brand-gradient" className="rounded-xl px-8 h-12 shadow-lg">
              {t('help.cta.button')}
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
