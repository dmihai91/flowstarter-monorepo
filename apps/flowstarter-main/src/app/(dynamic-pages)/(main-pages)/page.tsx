'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';

const CALENDLY_URL = 'https://calendly.com/flowstarter/discovery';

export default function LandingPage() {
  return (
    <div className="min-h-screen relative bg-white dark:bg-[#0A0A0B]">
      {/* Subtle gradient accent */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full blur-[150px] opacity-30 dark:opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(165, 90, 172, 0.4) 0%, rgba(77, 93, 217, 0.2) 50%, transparent 70%)' }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 dark:border-white/[0.06] bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-base font-semibold text-gray-900 dark:text-white">Flowstarter</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Sign In
              </Button>
            </Link>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg">
                Book a Call
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero - Asymmetric, bold */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32">
        <div className="max-w-6xl mx-auto px-6">
          {/* Beta badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#A55AAC]/10 to-[#4D5DD9]/10 border border-[#A55AAC]/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A55AAC] animate-pulse" />
            <span className="text-sm font-medium bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] bg-clip-text text-transparent">
              Beta — 50% off for early adopters
            </span>
          </div>
          
          <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-bold text-gray-900 dark:text-white leading-[1.05] tracking-tight max-w-4xl">
            We build your website.
            <br />
            <span className="bg-gradient-to-r from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] bg-clip-text text-transparent">
              You run your business.
            </span>
          </h1>
          
          <p className="mt-8 text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
            A 30-minute call. A professional website in days. 
            Then customize it yourself with AI — no code needed.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] hover:opacity-90 text-white px-8 h-12 rounded-lg text-base font-medium shadow-[0_0_24px_rgba(165,90,172,0.3)]">
                Get Started — €99.50
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
            </a>
            <Button variant="outline" size="lg" className="px-8 h-12 rounded-lg text-base border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
              See how it works
            </Button>
          </div>

          {/* Stats row */}
          <div className="mt-20 pt-10 border-t border-gray-100 dark:border-white/[0.06] grid grid-cols-3 gap-8 max-w-2xl">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">3-5</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">days to launch</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">€9.50</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">per month</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">0</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">code required</div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid - What you get */}
      <section className="relative py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Large card - Discovery */}
            <div className="md:col-span-2 p-8 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center mb-6">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">We start with you</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    A 30-minute discovery call to understand your business, brand, and goals. We handle everything from there.
                  </p>
                </div>
                <div className="hidden md:block text-6xl font-bold text-gray-100 dark:text-white/[0.03]">01</div>
              </div>
            </div>

            {/* Small card - Speed */}
            <div className="p-8 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center mb-6">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Live in days</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Most sites launch within 3-5 business days. Not weeks.
              </p>
            </div>

            {/* Small card - Hosting */}
            <div className="p-8 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center mb-6">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Global hosting</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Fast CDN, SSL included, 99.9% uptime. We handle it.
              </p>
            </div>

            {/* Large card - AI Editor */}
            <div className="md:col-span-2 p-8 rounded-2xl bg-gradient-to-br from-[#A55AAC]/5 to-[#4D5DD9]/5 dark:from-[#A55AAC]/10 dark:to-[#4D5DD9]/10 border border-[#A55AAC]/10 dark:border-[#A55AAC]/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center mb-6">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Then customize with AI</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    After launch, update your site by chatting. &quot;Add a contact form&quot;, &quot;Change the colors&quot;, &quot;Add a new page&quot; — just say it.
                  </p>
                </div>
                <div className="hidden md:block text-6xl font-bold bg-gradient-to-br from-[#A55AAC]/10 to-[#4D5DD9]/10 bg-clip-text text-transparent">AI</div>
              </div>
            </div>

            {/* Small card - Email */}
            <div className="p-8 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center mb-6">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Pro email included</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                2 mailboxes at your domain. you@yourbusiness.com
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - Clean, single plan */}
      <section className="relative py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                One plan. Everything included. No surprises.
              </p>
            </div>

            <div className="p-8 md:p-10 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 pb-8 border-b border-gray-200 dark:border-white/[0.06]">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#A55AAC]/10 text-[#A55AAC] text-xs font-semibold mb-4">
                    BETA PRICING — 50% OFF
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Launch Plan</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">Everything you need to get online</p>
                </div>
                <div className="flex items-baseline gap-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Setup</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">€99.50</span>
                      <span className="text-lg text-gray-400 line-through">€199</span>
                    </div>
                  </div>
                  <div className="text-center pl-6 border-l border-gray-200 dark:border-white/10">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">€9.50</span>
                      <span className="text-lg text-gray-400 line-through">€19</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 pt-8">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Setup includes</h4>
                  <ul className="space-y-3">
                    {['30-min discovery call', 'Custom site built for you', 'Domain configuration', 'Professional email (2 mailboxes)', 'Global CDN hosting', 'Goes live in 3-5 days'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 text-[#A55AAC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Monthly includes</h4>
                  <ul className="space-y-3">
                    {['Hosting + SSL', 'Email (2 mailboxes)', '1GB cloud storage', 'AI Editor access', 'Platform updates', 'Cancel anytime'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 text-[#A55AAC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/[0.06]">
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full h-12 rounded-lg bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-base font-medium">
                    Book Your Discovery Call
                  </Button>
                </a>
                <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  First month free. No lock-in. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - Minimal */}
      <section className="relative py-24 border-t border-gray-100 dark:border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-12">Questions</h2>
          <div className="space-y-8">
            {[
              { q: 'How long until my site is live?', a: 'Most sites launch within 3-5 business days after your discovery call.' },
              { q: 'Can I make changes after launch?', a: 'Yes. Your subscription includes our AI Editor — just tell it what to change in plain English. No coding required.' },
              { q: 'What happens when beta ends?', a: 'Your price moves to standard rates (€199 setup / €19/month). You\'ll get 30 days notice.' },
              { q: 'Do I need technical skills?', a: 'None. We handle the technical setup. The AI Editor is designed for non-technical users.' },
            ].map((item, i) => (
              <div key={i} className="pb-8 border-b border-gray-100 dark:border-white/[0.06] last:border-0">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">{item.q}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Clean */}
      <section className="relative py-24 bg-gray-50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
            Book a free call. No pressure, no obligations.
          </p>
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] hover:opacity-90 text-white px-8 h-12 rounded-lg text-base font-medium shadow-[0_0_24px_rgba(165,90,172,0.3)]">
              Book Your Free Call
            </Button>
          </a>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-8 border-t border-gray-100 dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">© 2026 Flowstarter</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <a href="mailto:hello@flowstarter.app" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              hello@flowstarter.app
            </a>
            <Link href="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Client Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
