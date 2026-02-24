'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';

const CALENDLY_URL = 'https://calendly.com/flowstarter/discovery';

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-[hsl(240,8%,12%)]">
      {/* Gradient Orbs Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Pink/Magenta - Top Left */}
        <div 
          className="absolute -top-[30%] -left-[15%] w-[70%] h-[70%] rounded-full opacity-60 dark:opacity-40 blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(165, 90, 172, 0.4) 0%, transparent 70%)' }}
        />
        {/* Purple - Top Right */}
        <div 
          className="absolute -top-[20%] -right-[15%] w-[60%] h-[60%] rounded-full opacity-50 dark:opacity-35 blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(77, 93, 217, 0.35) 0%, transparent 70%)' }}
        />
        {/* Amber - Bottom Center */}
        <div 
          className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full opacity-40 dark:opacity-25 blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(180, 160, 60, 0.3) 0%, transparent 70%)' }}
        />
      </div>

      {/* Header - Glassmorphism */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-4">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between rounded-2xl bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl border border-white/50 dark:border-white/[0.08] shadow-lg shadow-black/[0.03]">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-base font-semibold text-gray-900 dark:text-white">Flowstarter</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle className="mr-2" />
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  Sign In
                </Button>
              </Link>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] hover:opacity-90 text-white border-0 shadow-lg shadow-purple-500/25 rounded-xl">
                  Book a Call
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-36 pb-24 md:pt-48 md:pb-36">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/[0.08] backdrop-blur-xl border border-white/50 dark:border-white/[0.1] text-sm font-medium mb-8 shadow-lg shadow-black/[0.03]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A55AAC] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9]"></span>
              </span>
              <span className="text-gray-700 dark:text-gray-300">Now accepting new clients</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-8">
              We build your
              <br />
              <span className="bg-gradient-to-r from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] bg-clip-text text-transparent">
                perfect website.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed mb-12 max-w-2xl">
              You focus on your business. We handle the design, development, 
              hosting, and ongoing updates. Simple as that.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="xl" className="bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] hover:opacity-90 text-white text-lg px-8 h-14 rounded-xl shadow-xl shadow-purple-500/25 border-0">
                  Book a Free Call
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </a>
              <Link href="/login">
                <Button size="xl" variant="outline" className="text-lg px-8 h-14 rounded-xl bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl border-white/50 dark:border-white/[0.1] hover:bg-white/80 dark:hover:bg-white/[0.1]">
                  Client Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get - Glass Cards */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <span className="text-transparent bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] bg-clip-text font-semibold text-sm uppercase tracking-wider">
              What you get
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-4 max-w-3xl leading-tight">
              Everything you need. Nothing you don&apos;t.
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* What's included */}
            <div className="p-8 rounded-3xl bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-white/60 dark:border-white/[0.08] shadow-xl shadow-black/[0.03]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">What&apos;s included</h3>
              <ul className="space-y-4">
                {['Custom design tailored to your brand', 'Mobile-responsive on all devices', 'Fast hosting (under 2s load time)', 'SSL security certificate included', 'Ongoing maintenance and updates'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What you skip */}
            <div className="p-8 rounded-3xl bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl border border-white/40 dark:border-white/[0.06]">
              <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-white/[0.08] flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">What you skip</h3>
              <ul className="space-y-4">
                {['Learning website builders', 'Dealing with hosting and DNS', 'Worrying about security updates', 'Chasing unreliable freelancers'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-400 dark:text-gray-500 line-through">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16 text-center">
            <span className="text-transparent bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] bg-clip-text font-semibold text-sm uppercase tracking-wider">
              Who it&apos;s for
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-4">
              Built for businesses like yours.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🏪', title: 'Local Businesses', desc: 'Restaurants, salons, gyms, clinics. Get found online and look professional.' },
              { icon: '💼', title: 'Service Providers', desc: 'Consultants, coaches, agencies. Showcase your expertise and convert visitors.' },
              { icon: '👥', title: 'Small Teams', desc: 'Startups and growing companies. Look established without the enterprise cost.' },
            ].map((item) => (
              <div key={item.title} className="p-8 rounded-3xl bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-white/60 dark:border-white/[0.08] shadow-lg shadow-black/[0.03] hover:shadow-xl hover:bg-white/80 dark:hover:bg-white/[0.06] transition-all group">
                <div className="text-4xl mb-6">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <span className="text-transparent bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] bg-clip-text font-semibold text-sm uppercase tracking-wider">
              How it works
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-4">
              Live in 2-3 weeks.
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Discovery', desc: 'Free call to understand your goals.' },
              { num: '02', title: 'Design', desc: 'We create mockups until you love it.' },
              { num: '03', title: 'Build', desc: 'Clean code, fast hosting configured.' },
              { num: '04', title: 'Launch', desc: 'Deploy, test, and hand you the keys.' },
            ].map((item) => (
              <div key={item.num} className="relative">
                <span className="text-7xl font-bold text-gray-100 dark:text-white/[0.05] absolute -top-4 -left-2">{item.num}</span>
                <div className="relative pt-12">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Glass Card */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative rounded-[2rem] p-12 md:p-20 overflow-hidden bg-gradient-to-br from-[#A55AAC]/90 to-[#4D5DD9]/90 backdrop-blur-xl shadow-2xl">
            {/* Glass overlay */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
            
            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to get started?
              </h2>
              <p className="text-xl text-white/80 mb-10">
                Book a free 30-minute call. No pressure, no obligations.
              </p>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="xl" className="bg-white hover:bg-white/90 text-gray-900 text-lg px-10 h-14 rounded-xl shadow-2xl">
                  Book Your Free Call
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-gray-200/50 dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">© 2026 Flowstarter</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="mailto:hello@flowstarter.app" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              hello@flowstarter.app
            </a>
            <Link href="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Client Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
