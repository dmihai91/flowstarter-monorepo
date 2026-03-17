'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionWrapper, SectionHeading } from './SectionWrapper';
import { LANDING } from './landing-content';

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--landing-card-border)]">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-5 text-left">
        <span className="text-base font-medium text-gray-900 dark:text-white pr-4">{q}</span>
        <svg className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <p className="pb-5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQSection() {
  return (
    <SectionWrapper tinted>
      <SectionHeading className="text-center">{LANDING.faq.title}</SectionHeading>
      <div className="mx-auto mt-16 max-w-3xl">
        {LANDING.faq.items.map((item) => <FAQItem key={item.q} q={item.q} a={item.a} />)}
      </div>
    </SectionWrapper>
  );
}
