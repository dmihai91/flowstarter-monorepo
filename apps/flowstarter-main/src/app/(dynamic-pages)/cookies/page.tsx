'use client';

import Footer from '@/components/Footer';
import { SupportHeader } from '@/components/SupportHeader';
import { Cookie, Shield, BarChart3, Settings } from 'lucide-react';

export default function CookiePolicyPage() {
  const lastUpdated = 'February 27, 2026';

  const cookieTypes = [
    {
      icon: Shield,
      name: 'Essential Cookies',
      required: true,
      description: 'These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions you take, such as setting your privacy preferences, logging in, or filling in forms.',
      examples: [
        { name: 'session_id', purpose: 'Maintains your login session', duration: 'Session' },
        { name: 'csrf_token', purpose: 'Security token to prevent cross-site attacks', duration: 'Session' },
        { name: 'cookie_consent', purpose: 'Remembers your cookie preferences', duration: '1 year' },
        { name: 'theme', purpose: 'Remembers your light/dark mode preference', duration: '1 year' },
      ],
    },
    {
      icon: BarChart3,
      name: 'Analytics Cookies',
      required: false,
      description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our service.',
      examples: [
        { name: 'plausible_*', purpose: 'Privacy-focused analytics (no personal data)', duration: 'Session' },
      ],
    },
    {
      icon: Settings,
      name: 'Functional Cookies',
      required: false,
      description: 'These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.',
      examples: [
        { name: 'language', purpose: 'Remembers your language preference', duration: '1 year' },
        { name: 'sidebar_collapsed', purpose: 'Remembers dashboard sidebar state', duration: '1 year' },
      ],
    },
  ];

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
              <linearGradient id="cookieFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--purple)" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <g stroke="url(#cookieFlowGradient)" strokeWidth="1">
              <path d="M-100,100 Q200,80 400,120 T800,100 T1300,140" />
              <path d="M-100,200 Q150,220 350,180 T750,220 T1300,200" />
              <path d="M-100,300 Q250,280 450,320 T850,290 T1300,330" />
              <path d="M-100,400 Q180,420 380,380 T780,420 T1300,400" />
              <path d="M-100,500 Q220,480 420,520 T820,490 T1300,530" />
              <path d="M-100,600 Q200,620 400,580 T800,620 T1300,600" />
            </g>
          </svg>
        </div>

        <SupportHeader />

        {/* Content */}
        <main className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--purple)]/10 text-[var(--purple)] text-sm font-medium mb-6">
              <Cookie className="w-4 h-4" />
              Transparency First
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Cookie Policy
            </h1>
            <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto mb-4">
              We use cookies to make Flowstarter work and to understand how you use it. 
              Here's exactly what we use and why.
            </p>
            <p className="text-sm text-gray-400 dark:text-white/30">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Quick Summary */}
          <div className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-[var(--purple)]/5 via-white to-blue-500/5 dark:from-[var(--purple)]/10 dark:via-[#0f0f12] dark:to-blue-500/10 border border-[var(--purple)]/20">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              🍪 The Short Version
            </h2>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-white/60">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span><strong>Essential cookies</strong> keep you logged in and the site working. Can't be disabled.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span><strong>Analytics cookies</strong> help us improve. Privacy-focused, no personal tracking.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span><strong>No advertising cookies.</strong> We don't serve ads or track you across sites.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span><strong>You're in control.</strong> Manage preferences anytime via browser settings.</span>
              </li>
            </ul>
          </div>

          {/* What Are Cookies */}
          <section className="mb-10 p-8 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              What Are Cookies?
            </h2>
            <p className="text-gray-600 dark:text-white/60 leading-relaxed mb-4">
              Cookies are small text files stored on your device when you visit a website. 
              They help websites remember your preferences, keep you logged in, and understand 
              how you use the site.
            </p>
            <p className="text-gray-600 dark:text-white/60 leading-relaxed">
              We use cookies to provide you with a better experience on Flowstarter. 
              We don't use cookies to track you across other websites or serve you advertisements.
            </p>
          </section>

          {/* Cookie Types */}
          <div className="space-y-8 mb-10">
            {cookieTypes.map((type, index) => (
              <section
                key={index}
                className="p-8 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[var(--purple)]/10 flex items-center justify-center flex-shrink-0">
                    <type.icon className="w-6 h-6 text-[var(--purple)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {type.name}
                      </h2>
                      {type.required ? (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60 rounded">
                          Required
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-white/60 leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                </div>

                {/* Cookie Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Cookie</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Purpose</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {type.examples.map((cookie, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-white/5 last:border-0">
                          <td className="py-3 px-4 font-mono text-xs text-[var(--purple)]">{cookie.name}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-white/60">{cookie.purpose}</td>
                          <td className="py-3 px-4 text-gray-500 dark:text-white/40">{cookie.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>

          {/* Third-Party Cookies */}
          <section className="mb-10 p-8 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Third-Party Cookies
            </h2>
            <p className="text-gray-600 dark:text-white/60 leading-relaxed mb-4">
              Some features may involve third-party services that set their own cookies:
            </p>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-white/60">
              <li className="flex items-start gap-2">
                <span className="text-[var(--purple)]">•</span>
                <span><strong>Stripe</strong> (payments) - Sets cookies for fraud prevention and secure checkout.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--purple)]">•</span>
                <span><strong>Supabase</strong> (authentication) - Sets cookies to maintain your login session.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--purple)]">•</span>
                <span><strong>Cloudflare</strong> (security) - May set cookies for bot protection and performance.</span>
              </li>
            </ul>
            <p className="text-gray-500 dark:text-white/40 text-sm mt-4">
              These providers have their own cookie policies. We only work with trusted, 
              privacy-respecting services.
            </p>
          </section>

          {/* Managing Cookies */}
          <section className="mb-10 p-8 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Managing Your Cookie Preferences
            </h2>
            <p className="text-gray-600 dark:text-white/60 leading-relaxed mb-4">
              You can control cookies through your browser settings:
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-white/60 mb-4">
              <li>• <strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
              <li>• <strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
              <li>• <strong>Safari:</strong> Preferences → Privacy → Cookies</li>
              <li>• <strong>Edge:</strong> Settings → Cookies and Site Permissions</li>
            </ul>
            <p className="text-amber-600 dark:text-amber-400 text-sm">
              Note: Blocking essential cookies may prevent you from using Flowstarter properly.
            </p>
          </section>

          {/* Updates */}
          <section className="mb-10 p-8 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Changes to This Policy
            </h2>
            <p className="text-gray-600 dark:text-white/60 leading-relaxed">
              We may update this Cookie Policy from time to time. We'll notify you of significant 
              changes by updating the date at the top of this page. For major changes, we may also 
              show you a new consent banner.
            </p>
          </section>

          {/* Contact */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-[var(--purple)]/5 via-blue-500/5 to-cyan-500/5 border border-[var(--purple)]/10 dark:border-[var(--purple)]/20 text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Questions about cookies?
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-4">
              Read our full <a href="/privacy" className="text-[var(--purple)] hover:underline">Privacy Policy</a> or contact us.
            </p>
            <a
              href="mailto:privacy@flowstarter.dev"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 font-semibold hover:shadow-lg transition-all duration-300"
            >
              privacy@flowstarter.dev
            </a>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
