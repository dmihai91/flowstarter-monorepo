'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="w-full px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3L4 14h7v7l9-11h-7V3z" />
            </svg>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Flowstarter</span>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm">
              Team Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-20 md:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            Now accepting new clients
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            We build beautiful websites
            <span className="text-purple-600"> for your business</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Professional, custom websites built by our expert team. From concept to launch in weeks, not months.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:hello@flowstarter.app">
              <Button size="xl" variant="default" className="text-lg px-8">
                Get in touch
              </Button>
            </a>
          </div>
        </div>

        {/* Services */}
        <div className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Custom Design</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Unique designs tailored to your brand. No templates, no compromises.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Fast Delivery</h3>
            <p className="text-gray-600 dark:text-gray-400">
              From kickoff to launch in 2-4 weeks. We move fast without cutting corners.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Ongoing Support</h3>
            <p className="text-gray-600 dark:text-gray-400">
              We don't disappear after launch. Updates, maintenance, and support included.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Let's discuss your project and see how we can help.
          </p>
          <a href="mailto:hello@flowstarter.app">
            <Button size="lg" variant="default">
              Contact us →
            </Button>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © 2026 Flowstarter. All rights reserved.
          </p>
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            Team Login
          </Link>
        </div>
      </footer>
    </div>
  );
}
