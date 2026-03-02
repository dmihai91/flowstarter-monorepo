'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle, Wrench, Rocket, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { EXTERNAL_URLS } from '@/lib/constants';


const faqs = [
  {
    question: 'How does the process work?',
    answer:
      "It's simple! Book a free discovery call with our team. We'll learn about your business, goals, and design preferences. Then we build your professional website in 1-2 weeks. Once it's live, you can customize it anytime using our AI editor.",
  },
  {
    question: 'How long does it take to build my website?',
    answer:
      "Most websites are completed within 1-2 weeks after your discovery call. We'll keep you updated throughout the process and let you know when it's ready for review.",
  },
  {
    question: 'What happens during the discovery call?',
    answer:
      "We spend 30 minutes learning about your business, your goals, and your brand. You don't need to prepare anything, just show up and tell us about what you do. After the call, we'll send you a summary and start building within 24 hours.",
  },
  {
    question: 'Can I make changes after my site is live?',
    answer:
      "That's the whole point! Your subscription includes our AI editor: update text, add pages, change your branding, improve your SEO. All without writing a single line of code.",
  },
  {
    question: "What's included in my website?",
    answer:
      'Every Starter plan includes: up to 7 professionally designed pages, custom domain setup, mobile-responsive design, hosting on global CDN, SSL certificate, 1 professional email, contact form, analytics dashboard, Google Analytics integration, and 300 AI credits per month for ongoing customization.',
  },
  {
    question: 'Do I need any technical skills?',
    answer:
      "Zero. We handle the technical setup. The AI editor is built for people who've never touched code. Just describe what you want to change, and the AI handles the rest.",
  },
  {
    question: 'What are AI credits?',
    answer:
      'Each AI credit lets you make one edit to your site: update text, change colors, add a section, tweak your layout, improve SEO, and more. Your Starter plan includes 300 credits per month, which is more than enough for most businesses (the average client uses about 30-50 per month). If you ever need more, you can top up with 100 extra credits for €5.',
  },
  {
    question: 'What if I want to cancel?',
    answer:
      "No lock-in. Cancel your subscription anytime. If you share feedback with us, we'll refund 50% of your setup fee. Either way, you can download all your site assets to use elsewhere.",
  },
  {
    question: 'Can I use my existing domain?',
    answer:
      "Absolutely. We'll help you connect your existing domain to your new site at no extra cost. If you don't have a domain yet, we can help you pick and set one up during the discovery call.",
  },
  {
    question: 'What kind of websites can you build?',
    answer:
      "We specialize in professional websites for freelancers, consultants, small businesses, restaurants, agencies, coaches, and creators. Whether you need a portfolio, a service page, a landing page, or a multi-page business site, we've got you covered.",
  },
];

const steps = [
  {
    number: '01',
    title: 'We talk',
    description:
      'Book a free 30-minute discovery call. We learn about your business, your brand, and your goals.',
    Icon: MessageCircle,
  },
  {
    number: '02',
    title: 'We build',
    description:
      'Our AI engine generates your site from premium templates, tailored to your brand. Ready in 1-2 weeks.',
    Icon: Wrench,
  },
  {
    number: '03',
    title: 'You own it',
    description:
      'Your site goes live. Use the AI editor to update content, add pages, and tweak your design anytime.',
    Icon: Rocket,
  },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display {
          font-family: 'Outfit', system-ui, sans-serif;
        }
      `}</style>

      <div className="min-h-screen font-display bg-[#FAFAFA] dark:bg-[#0a0a0c]">
        {/* Flow lines background */}
        <div className="fixed inset-0 pointer-events-none">
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.08] dark:opacity-[0.06]"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <linearGradient
                id="helpFlowGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="var(--purple)" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <g stroke="url(#helpFlowGradient)" strokeWidth="1">
              <path d="M-100,100 Q200,80 400,120 T800,100 T1300,140" />
              <path d="M-100,200 Q150,220 350,180 T750,220 T1300,200" />
              <path d="M-100,300 Q250,280 450,320 T850,290 T1300,330" />
              <path d="M-100,400 Q180,420 380,380 T780,420 T1300,400" />
              <path d="M-100,500 Q220,480 420,520 T820,490 T1300,530" />
              <path d="M-100,600 Q200,620 400,580 T800,620 T1300,600" />
              <path d="M-100,700 Q250,680 450,720 T850,690 T1300,730" />
            </g>
          </svg>
        </div>

  
        {/* Content */}
        <main className="relative z-10 max-w-5xl mx-auto px-6 py-16">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--purple)]/10 text-[var(--purple)] text-sm font-medium mb-6">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Help Center
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              How can we help?
            </h1>
            <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto">
              Everything you need to know about getting your website built and
              customized.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-2 gap-4 mb-16">
            <a
              href={EXTERNAL_URLS.calendly.discovery}
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 rounded-2xl bg-gradient-to-br from-[var(--purple)]/10 to-blue-500/10 border border-[var(--purple)]/20 hover:border-[var(--purple)]/40 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--purple)]/10 flex items-center justify-center mb-3 group-hover:bg-[var(--purple)]/20 transition-colors">
                <Phone className="w-6 h-6 text-[var(--purple)]" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-[var(--purple)] transition-colors">
                Book a Discovery Call
              </h3>
              <p className="text-sm text-gray-500 dark:text-white/50">
                Free 30-minute call to discuss your project
              </p>
            </a>
            <a
              href="mailto:hello@flowstarter.app"
              className="p-6 rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 hover:border-[var(--purple)]/40 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3 group-hover:bg-[var(--purple)]/10 transition-colors">
                <Mail className="w-6 h-6 text-gray-600 dark:text-white/60 group-hover:text-[var(--purple)] transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-[var(--purple)] transition-colors">
                Email Support
              </h3>
              <p className="text-sm text-gray-500 dark:text-white/50">
                hello@flowstarter.app • 48h response
              </p>
            </a>
          </div>

          {/* How It Works */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              How It Works
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/10 flex items-center justify-center">
                      <step.Icon className="w-5 h-5 text-[var(--purple)]" />
                    </div>
                    <span className="text-sm font-bold text-[var(--purple)]">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-white/50">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQs */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        openFaq === i ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-500 dark:text-white/50 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-[var(--purple)]/5 via-blue-500/5 to-cyan-500/5 border border-[var(--purple)]/10 dark:border-[var(--purple)]/20 text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Ready to get started?
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-6">
              Book a free discovery call and let's build your website together.
            </p>
            <a href={EXTERNAL_URLS.calendly.discovery} target="_blank" rel="noopener noreferrer">
              <Button className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 hover:from-[#232342] hover:via-[#1e2a4a] hover:to-[#232342] dark:hover:from-gray-100 dark:hover:via-white dark:hover:to-gray-100 rounded-xl px-8 h-12 text-base font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300">
                Book Free Discovery Call
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Button>
            </a>
          </div>
        </main>

        </div>
    </>
  );
}
