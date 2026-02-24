'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

const CALENDLY_URL = 'https://calendly.com/flowstarter/discovery';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-gray-900 font-bold text-sm">F</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Flowstarter</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300">
                Sign In
              </Button>
            </Link>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900">
                Book a Call
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Taking on new projects
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6">
              We build your website.
              <br />
              <span className="text-gray-400 dark:text-gray-500">You run your business.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-10 max-w-xl">
              Tell us what you need. We handle everything — design, development, 
              hosting, and updates. You get a professional website without the headache.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="xl" className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-base px-8 h-12">
                  Book a Free Call
                </Button>
              </a>
              <Link href="/login">
                <Button size="xl" variant="outline" className="text-base px-8 h-12 border-gray-200 dark:border-gray-700">
                  Client Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do - Detailed */}
      <section className="py-20 md:py-28 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              What we do
            </h2>
            <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white max-w-3xl">
              A complete web presence service for businesses who don't want to deal with tech.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Here's exactly what you get:
              </h3>
              <ul className="space-y-4">
                {[
                  'Custom-designed website tailored to your brand and goals',
                  'Mobile-responsive — looks great on phones, tablets, and desktops',
                  'Fast hosting included — your site loads in under 2 seconds',
                  'SSL certificate (the padlock) for security and SEO',
                  'Basic SEO setup so Google can find you',
                  'Contact forms that actually work and notify you',
                  'Analytics so you know who's visiting',
                  'Ongoing updates and maintenance included',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                What you don't have to do:
              </h3>
              <ul className="space-y-4">
                {[
                  'Learn WordPress, Wix, Squarespace, or any other tool',
                  'Deal with hosting companies, DNS, or technical jargon',
                  'Worry about security updates or your site breaking',
                  'Figure out why your site is slow or not ranking',
                  'Chase freelancers who ghost after the first payment',
                  'Pay separately for hosting, domains, SSL, maintenance',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              Who it's for
            </h2>
            <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white max-w-2xl">
              Perfect for businesses that need a website but not the complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Local Businesses',
                desc: 'Restaurants, salons, gyms, clinics, shops. You need a professional online presence to show up in local searches and look credible.',
                examples: 'Restaurants • Salons • Clinics • Retail',
              },
              {
                title: 'Service Providers',
                desc: 'Consultants, coaches, freelancers, agencies. You need a site that explains what you do and makes it easy for clients to contact you.',
                examples: 'Consultants • Coaches • Agencies • Freelancers',
              },
              {
                title: 'Small Teams',
                desc: 'Startups and small companies who want a polished site without hiring a full-time developer or wasting time on DIY builders.',
                examples: 'Startups • Small businesses • Non-profits',
              },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  {item.desc}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {item.examples}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 md:py-28 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              How it works
            </h2>
            <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white max-w-2xl">
              From first call to live site in 2-3 weeks.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Discovery Call', desc: 'Free 30-minute call to understand your business, goals, and what you need.' },
              { step: '02', title: 'Design', desc: 'We create a mockup. You give feedback. We refine until you love it.' },
              { step: '03', title: 'Build', desc: 'We develop your site with clean code, fast hosting, and everything configured.' },
              { step: '04', title: 'Launch', desc: 'We deploy, test, and hand you the keys. You're live and ready for business.' },
            ].map((item) => (
              <div key={item.step}>
                <span className="text-4xl font-bold text-gray-200 dark:text-gray-800 mb-4 block">
                  {item.step}
                </span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Hint */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, transparent pricing.
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              One-time setup fee + small monthly for hosting and support. 
              No hidden costs. No surprises. We'll give you exact numbers on our call.
            </p>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-gray-200 dark:border-gray-700">
                Get a Quote →
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-gray-900 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to get your website sorted?
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Book a free 30-minute discovery call. No pressure, no obligations. 
            Just a conversation about what you need.
          </p>
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
            <Button size="xl" className="bg-white hover:bg-gray-100 text-gray-900 text-base px-8 h-12">
              Book Your Free Call
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © 2026 Flowstarter. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="mailto:hello@flowstarter.app" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              hello@flowstarter.app
            </a>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Client Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
