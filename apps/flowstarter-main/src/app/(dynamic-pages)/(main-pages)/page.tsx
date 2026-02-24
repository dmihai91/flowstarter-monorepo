'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';

const CALENDLY_URL = 'https://calendly.com/flowstarter/discovery';

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#fafafa] dark:bg-[hsl(240,8%,8%)]">
      {/* Animated Gradient Mesh Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Primary Pink/Magenta Orb - Top Left */}
        <div 
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[100px] animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(165, 90, 172, 0.5) 0%, rgba(165, 90, 172, 0.2) 40%, transparent 70%)',
            animationDuration: '8s',
          }}
        />
        {/* Purple Orb - Top Right */}
        <div 
          className="absolute -top-[10%] -right-[10%] w-[55%] h-[55%] rounded-full blur-[90px] animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(77, 93, 217, 0.45) 0%, rgba(77, 93, 217, 0.15) 40%, transparent 70%)',
            animationDuration: '10s',
            animationDelay: '1s',
          }}
        />
        {/* Cyan accent - Middle Right */}
        <div 
          className="absolute top-[30%] -right-[5%] w-[35%] h-[35%] rounded-full blur-[80px] animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, transparent 70%)',
            animationDuration: '12s',
            animationDelay: '2s',
          }}
        />
        {/* Warm accent - Bottom */}
        <div 
          className="absolute -bottom-[15%] left-[20%] w-[50%] h-[40%] rounded-full blur-[100px] animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, transparent 70%)',
            animationDuration: '9s',
            animationDelay: '3s',
          }}
        />
        {/* Secondary pink - Bottom Left */}
        <div 
          className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[80px] animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
            animationDuration: '11s',
            animationDelay: '4s',
          }}
        />
      </div>

      {/* Noise texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header - Premium Glassmorphism */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-4">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between rounded-2xl bg-white/50 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/60 dark:border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
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
                <Button size="sm" className="bg-gradient-to-r from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] hover:opacity-90 text-white border-0 shadow-lg shadow-purple-500/30 rounded-xl">
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
            {/* Status badge - Glass */}
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/50 dark:bg-white/[0.04] backdrop-blur-2xl border border-white/60 dark:border-white/[0.08] text-sm font-medium mb-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A55AAC] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9]"></span>
              </span>
              <span className="bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] bg-clip-text text-transparent font-semibold">Now accepting new clients</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-[1.08] tracking-tight mb-8">
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
                <Button size="xl" className="bg-gradient-to-r from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] hover:opacity-90 text-white text-lg px-8 h-14 rounded-2xl shadow-[0_8px_32px_rgba(165,90,172,0.35)] border-0 transition-all hover:shadow-[0_12px_40px_rgba(165,90,172,0.45)] hover:scale-[1.02]">
                  Book a Free Call
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </a>
              <Link href="/login">
                <Button size="xl" variant="outline" className="text-lg px-8 h-14 rounded-2xl bg-white/50 dark:bg-white/[0.04] backdrop-blur-2xl border-white/60 dark:border-white/[0.08] hover:bg-white/70 dark:hover:bg-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
                  Client Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get - Premium Glass Cards */}
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
            {/* What's included - Glass Card */}
            <div className="p-8 rounded-3xl bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/70 dark:border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.2)]">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] flex items-center justify-center mb-6 shadow-lg shadow-purple-500/25">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">What&apos;s included</h3>
              <ul className="space-y-4">
                {['Custom design tailored to your brand', 'Mobile-responsive on all devices', 'Fast hosting (under 2s load time)', 'SSL security certificate included', 'Ongoing maintenance and updates'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What you skip - Subtle Glass */}
            <div className="p-8 rounded-3xl bg-white/30 dark:bg-white/[0.015] backdrop-blur-xl border border-white/50 dark:border-white/[0.04]">
              <div className="w-14 h-14 rounded-2xl bg-gray-200/80 dark:bg-white/[0.06] flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">What you skip</h3>
              <ul className="space-y-4">
                {['Learning website builders', 'Dealing with hosting and DNS', 'Worrying about security updates', 'Chasing unreliable freelancers'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-400 dark:text-gray-500 line-through">
                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For - Glass Cards with Gradient Borders */}
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
            {/* Local Businesses */}
            <div className="group relative p-[1px] rounded-3xl bg-gradient-to-br from-[#A55AAC]/50 via-transparent to-[#4D5DD9]/50 hover:from-[#A55AAC] hover:to-[#4D5DD9] transition-all duration-500">
              <div className="h-full p-8 rounded-3xl bg-white/80 dark:bg-[hsl(240,8%,10%)] backdrop-blur-2xl">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A55AAC]/10 to-[#4D5DD9]/10 dark:from-[#A55AAC]/20 dark:to-[#4D5DD9]/20 flex items-center justify-center mb-6 group-hover:from-[#A55AAC]/20 group-hover:to-[#4D5DD9]/20 transition-colors">
                  <svg className="w-7 h-7 text-[#7B6AD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Local Businesses</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Restaurants, salons, gyms, clinics. Get found online and look professional.</p>
              </div>
            </div>

            {/* Service Providers */}
            <div className="group relative p-[1px] rounded-3xl bg-gradient-to-br from-[#A55AAC]/50 via-transparent to-[#4D5DD9]/50 hover:from-[#A55AAC] hover:to-[#4D5DD9] transition-all duration-500">
              <div className="h-full p-8 rounded-3xl bg-white/80 dark:bg-[hsl(240,8%,10%)] backdrop-blur-2xl">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A55AAC]/10 to-[#4D5DD9]/10 dark:from-[#A55AAC]/20 dark:to-[#4D5DD9]/20 flex items-center justify-center mb-6 group-hover:from-[#A55AAC]/20 group-hover:to-[#4D5DD9]/20 transition-colors">
                  <svg className="w-7 h-7 text-[#7B6AD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Service Providers</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Consultants, coaches, agencies. Showcase your expertise and convert visitors.</p>
              </div>
            </div>

            {/* Small Teams */}
            <div className="group relative p-[1px] rounded-3xl bg-gradient-to-br from-[#A55AAC]/50 via-transparent to-[#4D5DD9]/50 hover:from-[#A55AAC] hover:to-[#4D5DD9] transition-all duration-500">
              <div className="h-full p-8 rounded-3xl bg-white/80 dark:bg-[hsl(240,8%,10%)] backdrop-blur-2xl">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A55AAC]/10 to-[#4D5DD9]/10 dark:from-[#A55AAC]/20 dark:to-[#4D5DD9]/20 flex items-center justify-center mb-6 group-hover:from-[#A55AAC]/20 group-hover:to-[#4D5DD9]/20 transition-colors">
                  <svg className="w-7 h-7 text-[#7B6AD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Small Teams</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Startups and growing companies. Look established without the enterprise cost.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Detailed */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <span className="text-transparent bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] bg-clip-text font-semibold text-sm uppercase tracking-wider">
              How it works
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-4">
              From idea to live site in 2-3 weeks.
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mt-6 max-w-2xl">
              No templates. No DIY builders. Just tell us what you need, and we&apos;ll build it for you.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: '01', title: 'Discovery Call', desc: 'We hop on a free 30-minute call to understand your business, goals, and vision.' },
              { num: '02', title: 'Design & Revise', desc: 'We create custom designs and iterate until you\'re 100% happy.' },
              { num: '03', title: 'Build & Test', desc: 'We develop your site with clean code, fast hosting, and thorough testing.' },
              { num: '04', title: 'Launch & Support', desc: 'We deploy your site and provide ongoing maintenance and updates.' },
            ].map((item) => (
              <div key={item.num} className="relative p-6 rounded-2xl bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl border border-white/50 dark:border-white/[0.04]">
                <span className="text-5xl font-bold bg-gradient-to-br from-[#A55AAC]/20 to-[#4D5DD9]/20 bg-clip-text text-transparent">{item.num}</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Platform Features */}
          <div className="mt-20 p-8 md:p-12 rounded-3xl bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/70 dark:border-white/[0.06]">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">What makes us different</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A55AAC]/20 to-[#4D5DD9]/20 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[#7B6AD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Real Human Support</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">No chatbots. Direct access to your designer via our client portal.</p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A55AAC]/20 to-[#4D5DD9]/20 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[#7B6AD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Unlimited Revisions</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">We iterate until you love it. No extra charges for design changes.</p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A55AAC]/20 to-[#4D5DD9]/20 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[#7B6AD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Lightning Fast</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sites load in under 2 seconds. Optimized for SEO and conversions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16 text-center">
            <span className="text-transparent bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] bg-clip-text font-semibold text-sm uppercase tracking-wider">
              Simple pricing
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-4">
              One price. Everything included.
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mt-6 max-w-2xl mx-auto">
              No hidden fees. No surprise invoices. Just a simple monthly subscription.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="p-8 rounded-3xl bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/70 dark:border-white/[0.06]">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Starter</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Perfect for small businesses</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$149</span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <ul className="mt-8 space-y-4">
                {['Up to 5 pages', 'Mobile responsive', 'Contact form', 'Basic SEO setup', 'SSL certificate', 'Monthly updates'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 text-[#7B6AD8] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="block mt-8">
                <Button className="w-full rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-900 dark:text-white border-0">
                  Get Started
                </Button>
              </a>
            </div>

            {/* Professional - Featured */}
            <div className="relative p-[1px] rounded-3xl bg-gradient-to-br from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] rounded-full text-white text-sm font-medium">
                Most Popular
              </div>
              <div className="h-full p-8 rounded-3xl bg-white dark:bg-[hsl(240,8%,10%)]">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Professional</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">For growing businesses</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">$299</span>
                  <span className="text-gray-500 dark:text-gray-400">/month</span>
                </div>
                <ul className="mt-8 space-y-4">
                  {['Up to 15 pages', 'Everything in Starter', 'Blog functionality', 'Advanced SEO', 'Analytics dashboard', 'Priority support', 'Weekly updates'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-5 h-5 text-[#7B6AD8] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="block mt-8">
                  <Button className="w-full rounded-xl bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] hover:opacity-90 text-white border-0 shadow-lg shadow-purple-500/25">
                    Get Started
                  </Button>
                </a>
              </div>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-3xl bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/70 dark:border-white/[0.06]">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Enterprise</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">For established companies</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$499</span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <ul className="mt-8 space-y-4">
                {['Unlimited pages', 'Everything in Professional', 'E-commerce ready', 'Custom integrations', 'Dedicated account manager', 'Same-day updates', '99.9% uptime SLA'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 text-[#7B6AD8] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="block mt-8">
                <Button className="w-full rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-900 dark:text-white border-0">
                  Get Started
                </Button>
              </a>
            </div>
          </div>

          {/* FAQ-style note */}
          <div className="mt-16 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">No setup fees.</span> No contracts. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* CTA - Gradient Glass */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative rounded-[2.5rem] p-12 md:p-20 overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9]" />
            {/* Glass overlay */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
            {/* Decorative orbs */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
            
            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to get started?
              </h2>
              <p className="text-xl text-white/80 mb-10">
                Book a free 30-minute call. No pressure, no obligations.
              </p>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="xl" className="bg-white hover:bg-white/95 text-gray-900 text-lg px-10 h-14 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] transition-all hover:scale-[1.02]">
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
      <footer className="relative py-12 border-t border-gray-200/50 dark:border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] rounded-lg flex items-center justify-center">
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
