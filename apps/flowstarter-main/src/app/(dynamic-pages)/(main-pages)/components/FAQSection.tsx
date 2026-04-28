'use client';

import { useState } from 'react';

const FAQ_ITEMS = [
  {
    question: 'How fast can you actually deliver?',
    answer:
      'Most projects launch in 5 days after the discovery call. Larger scopes can take longer, but we confirm timeline before we start.',
  },
  {
    question: 'What is the Smart Editor exactly?',
    answer:
      'It lets you request site updates in plain language. We review each update before it goes live, so quality stays consistent.',
  },
  {
    question: 'Do I own my website?',
    answer:
      'Yes. Your business owns the website content and brand assets. If you ever leave, we coordinate a clean handover.',
  },
  {
    question: "What's in the monthly fee?",
    answer:
      'Hosting, SSL, backups, monitoring, support, and Smart Editor access are included. It covers the ongoing technical work and update workflow.',
  },
  {
    question: 'Can I cancel the monthly plan?',
    answer:
      'Yes, you can cancel. We will explain the handover options so your website can continue running with minimal disruption.',
  },
  {
    question: 'What if I change my mind after signing?',
    answer:
      'Before build begins, EUR 200 of your deposit is refundable. Once build starts, we allocate design and development capacity to your project.',
  },
  {
    question: 'What if I need something not listed?',
    answer:
      'That is common. We scope custom work as an add-on and confirm price and timeline before implementation.',
  },
  {
    question: 'Why limited to 4 projects per month?',
    answer:
      'This keeps quality and response times high for every client. We only onboard what our team can deliver at a premium standard.',
  },
  {
    question: 'How do payments work?',
    answer:
      'Payments are split 50/50: deposit to reserve your slot, then balance on launch. Stripe-backed checkout is planned as part of our payments rollout.',
  },
] as const;

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);
  const toggle = (idx: number) =>
    setOpenIndex((current) => (current === idx ? -1 : idx));

  return (
    <section id="faq" className="ls-scope ls-section ls-section--pad">
      <div className="ls-mesh" aria-hidden />{' '}
      <div className="ls-grain" aria-hidden />
      <div className="ls-container">
        <div className="text-center max-w-3xl mx-auto">
          <div className="ls-eyebrow inline-flex items-center justify-center gap-3">
            <span className="num">08</span>
            <span>FAQ</span>
          </div>
          <h2 className="ls-display mt-7" style={{ textWrap: 'balance' }}>
            <span className="line">Clear answers before you decide.</span>
          </h2>
        </div>

        <div className="ls-faq-list mx-auto mt-14 max-w-3xl">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={item.question}
                className={`ls-faq-item ${isOpen ? 'open' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="ls-faq-trigger"
                  aria-expanded={isOpen}
                >
                  <span className="ls-faq-idx">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="ls-faq-q">{item.question}</span>
                  <span className="ls-faq-chev" aria-hidden>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
                <div className="ls-faq-body">
                  <p>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
