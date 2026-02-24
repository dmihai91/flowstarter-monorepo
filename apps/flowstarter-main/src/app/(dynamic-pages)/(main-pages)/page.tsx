'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

const CALENDLY_URL = 'https://calendly.com/flowstarter/discovery';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Flowstarter</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                Sign In
              </Button>
            </Link>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white border-0 shadow-lg shadow-teal-500/25">
                Book a Call
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-36">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              Now accepting new clients
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight mb-8">
              We build your
              <br />
              <span className="bg-gradient-to-r from-teal-600 via-cyan-500 to-teal-600 bg-clip-text text-transparent">
                perfect website.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed mb-12 max-w-2xl font-light">
              You focus on your business. We handle the design, development, 
              hosting, and ongoing updates. Simple as that.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="xl" className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white text-lg px-8 h-14 rounded-xl shadow-xl shadow-teal-500/25 border-0">
                  Book a Free Call
                </Button>
              </a>
              <Link href="/login">
                <Button size="xl" variant="outline" className="text-lg px-8 h-14 rounded-xl border-gray-300 dark:border-gray-700">
                  Client Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <span className="text-teal-600 dark:text-teal-400 font-semibold text-sm uppercase tracking-wider">
              What you get
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-4 max-w-3xl leading-tight">
              Everything you need. Nothing you don&apos;t.
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                What&apos;s included
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                  Custom design tailored to your brand
                </li>
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                  Mobile-responsive on all devices
                </li>
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                  Fast hosting (under 2s load time)
                </li>
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                  SSL security certificate included
                </li>
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                  Ongoing maintenance and updates
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                What you skip
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-500 line-through">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                  Learning website builders
                </li>
                <li className="flex items-center gap-3 text-gray-500 line-through">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                  Dealing with hosting and DNS
                </li>
                <li className="flex items-center gap-3 text-gray-500 line-through">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                  Worrying about security updates
                </li>
                <li className="flex items-center gap-3 text-gray-500 line-through">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                  Chasing unreliable freelancers
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="relative py-24 md:py-32 bg-gradient-to-b from-transparent via-teal-50/50 to-transparent dark:via-teal-950/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16 text-center">
            <span className="text-teal-600 dark:text-teal-400 font-semibold text-sm uppercase tracking-wider">
              Who it&apos;s for
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-4">
              Built for businesses like yours.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-6">🏪</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Local Businesses
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Restaurants, salons, gyms, clinics. Get found online and look professional.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-6">💼</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Service Providers
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Consultants, coaches, agencies. Showcase your expertise and convert visitors.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-6">👥</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Small Teams
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Startups and growing companies. Look established without the enterprise cost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <span className="text-teal-600 dark:text-teal-400 font-semibold text-sm uppercase tracking-wider">
              How it works
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-4">
              Live in 2-3 weeks.
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="relative">
              <span className="text-7xl font-bold text-gray-100 dark:text-gray-900 absolute -top-4 -left-2">01</span>
              <div className="relative pt-12">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Discovery</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Free call to understand your goals.</p>
              </div>
            </div>
            <div className="relative">
              <span className="text-7xl font-bold text-gray-100 dark:text-gray-900 absolute -top-4 -left-2">02</span>
              <div className="relative pt-12">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Design</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">We create mockups until you love it.</p>
              </div>
            </div>
            <div className="relative">
              <span className="text-7xl font-bold text-gray-100 dark:text-gray-900 absolute -top-4 -left-2">03</span>
              <div className="relative pt-12">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Build</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Clean code, fast hosting configured.</p>
              </div>
            </div>
            <div className="relative">
              <span className="text-7xl font-bold text-gray-100 dark:text-gray-900 absolute -top-4 -left-2">04</span>
              <div className="relative pt-12">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Launch</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Deploy, test, and hand you the keys.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-12 md:p-20 overflow-hidden">
            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to get started?
              </h2>
              <p className="text-xl text-gray-400 mb-10">
                Book a free 30-minute call. No pressure, no obligations.
              </p>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="xl" className="bg-white hover:bg-gray-100 text-gray-900 text-lg px-10 h-14 rounded-xl shadow-2xl">
                  Book Your Free Call
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <span className="text-sm text-gray-500">© 2026 Flowstarter</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="mailto:hello@flowstarter.app" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              hello@flowstarter.app
            </a>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              Client Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
