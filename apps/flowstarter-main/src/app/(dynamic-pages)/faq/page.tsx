'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { SupportHeader } from '@/components/SupportHeader';
import Footer from '@/components/Footer';
import { useTranslations } from '@/lib/i18n';

function AccordionItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200/50 dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-base font-medium text-foreground">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="pb-5 text-muted-foreground text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const { t } = useTranslations();

  const faqs = [
    { q: t('faq.items.whatIs.q'), a: t('faq.items.whatIs.a') },
    { q: t('faq.items.howLong.q'), a: t('faq.items.howLong.a') },
    { q: t('faq.items.customDomain.q'), a: t('faq.items.customDomain.a') },
    { q: t('faq.items.editMyself.q'), a: t('faq.items.editMyself.a') },
    { q: t('faq.items.pricing.q'), a: t('faq.items.pricing.a') },
    { q: t('faq.items.support.q'), a: t('faq.items.support.a') },
  ];

  return (
    <div className="relative flex min-h-screen flex-col page-gradient">
      <FlowBackground
        variant="dashboard"
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      />
      <SupportHeader />

      <main className="relative z-10 flex-1 w-full mx-auto">
        {/* Hero */}
        <section className="pt-28 pb-12 md:pt-36 md:pb-16 text-center">
          <div className="max-w-3xl mx-auto px-4">
            <div className="w-24 h-2 bg-[--purple-primary] rounded-full mb-6 mx-auto" />
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 text-foreground">
              {t('faq.title')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {t('faq.subtitle')}
            </p>
          </div>
        </section>

        {/* FAQ List */}
        <section className="pb-20 px-4">
          <div className="max-w-3xl mx-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-[--purple-primary]/30 shadow-xl p-8 md:p-12">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
