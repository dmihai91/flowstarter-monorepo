'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
            <a href="mailto:hello@flowstarter.app">
              <Button size="sm" className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900">
                Get in Touch
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
              We design and build
              <br />
              <span className="text-gray-400 dark:text-gray-500">websites that work.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-10 max-w-xl">
              Professional web development for businesses who want results. 
              Fast turnaround. Clean code. No bloat.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="mailto:hello@flowstarter.app">
                <Button size="xl" className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-base px-8 h-12">
                  Start a Project
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

      {/* What We Do */}
      <section className="py-20 md:py-28 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              What we do
            </h2>
            <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white max-w-2xl">
              We handle the technical stuff so you can focus on your business.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div>
              <div className="w-10 h-10 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center mb-5">
                <svg className="w-5 h-5 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Web Design
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Custom designs that reflect your brand. No templates, no cookie-cutter solutions. Every site is built specifically for you.
              </p>
            </div>

            <div>
              <div className="w-10 h-10 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center mb-5">
                <svg className="w-5 h-5 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Development
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Clean, fast, maintainable code. We build sites that load quickly, rank well, and won't break when you need them most.
              </p>
            </div>

            <div>
              <div className="w-10 h-10 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center mb-5">
                <svg className="w-5 h-5 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Ongoing Support
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We don't disappear after launch. Updates, maintenance, and support whenever you need it. Your site keeps working.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              How it works
            </h2>
            <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white max-w-2xl">
              Simple process. Fast results.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Discovery', desc: 'We learn about your business, goals, and what you need.' },
              { step: '02', title: 'Design', desc: 'We create mockups and iterate until you love it.' },
              { step: '03', title: 'Build', desc: 'We develop your site with clean, fast code.' },
              { step: '04', title: 'Launch', desc: 'We deploy, test, and hand over the keys.' },
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

      {/* CTA */}
      <section className="py-20 md:py-28 bg-gray-900 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Tell us about your project. We'll get back to you within 24 hours.
          </p>
          <a href="mailto:hello@flowstarter.app">
            <Button size="xl" className="bg-white hover:bg-gray-100 text-gray-900 text-base px-8 h-12">
              hello@flowstarter.app
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
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            Client Login
          </Link>
        </div>
      </footer>
    </div>
  );
}
