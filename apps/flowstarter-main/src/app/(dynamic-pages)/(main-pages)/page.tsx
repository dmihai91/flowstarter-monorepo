'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const CALENDLY_URL = 'https://calendly.com/flowstarter/discovery';

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    const handleScroll = () => setScrollY(window.scrollY);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const parallaxOffset = (factor: number) => ({
    transform: `translateY(${scrollY * factor}px)`,
  });

  const mouseParallax = (factor: number) => ({
    transform: `translate(${(mousePosition.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * factor}px, ${(mousePosition.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * factor}px)`,
  });

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-40 dark:opacity-30 transition-transform duration-[3000ms] ease-out"
          style={{ 
            background: 'radial-gradient(circle, rgba(165, 90, 172, 0.5) 0%, transparent 70%)',
            top: '-20%',
            left: '-10%',
            ...mouseParallax(0.02),
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-30 dark:opacity-20 transition-transform duration-[3000ms] ease-out"
          style={{ 
            background: 'radial-gradient(circle, rgba(77, 93, 217, 0.5) 0%, transparent 70%)',
            top: '10%',
            right: '-5%',
            ...mouseParallax(-0.015),
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-25 dark:opacity-15 transition-transform duration-[3000ms] ease-out"
          style={{ 
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, transparent 70%)',
            bottom: '10%',
            left: '20%',
            ...mouseParallax(0.01),
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#A55AAC]/30 dark:bg-[#A55AAC]/20"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animation: `float ${6 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Header - Glass */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="m-4">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between rounded-2xl bg-white/70 dark:bg-white/[0.05] backdrop-blur-2xl border border-white/50 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-shadow">
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
                <Button size="sm" className="bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] hover:opacity-90 text-white rounded-xl border-0 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-[1.02]">
                  Book a Call
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-20">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8" style={parallaxOffset(-0.1)}>
              {/* Animated badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/[0.06] backdrop-blur-2xl border border-white/60 dark:border-white/[0.1] shadow-lg animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A55AAC] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9]"></span>
                </span>
                <span className="text-sm font-medium bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] bg-clip-text text-transparent">
                  Beta — 50% off for early adopters
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-[1.05] tracking-tight animate-fade-in-up animation-delay-100">
                We build your
                <br />
                <span className="bg-gradient-to-r from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] bg-clip-text text-transparent animate-gradient">
                  perfect website.
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg animate-fade-in-up animation-delay-200">
                A 30-minute call. A professional website in days. 
                Then customize it yourself with AI — no code needed.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-300">
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="group bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] hover:opacity-90 text-white px-8 h-14 rounded-2xl text-lg font-medium shadow-[0_8px_32px_rgba(165,90,172,0.35)] hover:shadow-[0_12px_40px_rgba(165,90,172,0.5)] transition-all hover:scale-[1.02]">
                    Get Started — €99.50
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                </a>
              </div>

              {/* Stats */}
              <div className="flex gap-10 pt-8 animate-fade-in-up animation-delay-400">
                {[
                  { value: '3-5', label: 'days to launch' },
                  { value: '€9.50', label: 'per month' },
                  { value: '0', label: 'code required' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating glass cards - Hero visual */}
            <div className="relative h-[500px] hidden lg:block" style={parallaxOffset(0.05)}>
              {/* Main card */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-48 rounded-3xl bg-white/70 dark:bg-white/[0.06] backdrop-blur-2xl border border-white/60 dark:border-white/[0.1] shadow-2xl p-6 transition-transform duration-500 hover:scale-105"
                style={mouseParallax(0.02)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">AI Editor</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-gray-200/50 dark:bg-white/10 overflow-hidden">
                    <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] animate-pulse" />
                  </div>
                  <div className="h-2 w-2/3 rounded-full bg-gray-200/50 dark:bg-white/10" />
                </div>
              </div>

              {/* Floating card 1 */}
              <div 
                className="absolute top-10 right-10 w-44 h-28 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl border border-white/50 dark:border-white/[0.08] shadow-xl p-4 animate-float"
                style={{ ...mouseParallax(-0.03), animationDelay: '0s' }}
              >
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-xs font-medium text-gray-900 dark:text-white">Site Live!</div>
                <div className="text-[10px] text-gray-500">yoursite.com</div>
              </div>

              {/* Floating card 2 */}
              <div 
                className="absolute bottom-16 left-0 w-52 h-32 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl border border-white/50 dark:border-white/[0.08] shadow-xl p-4 animate-float"
                style={{ ...mouseParallax(0.025), animationDelay: '1s' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9]" />
                  <div className="text-xs font-medium text-gray-900 dark:text-white">Discovery Call</div>
                </div>
                <div className="text-[10px] text-gray-500 mb-2">30 min • Video call</div>
                <div className="h-1.5 w-full rounded-full bg-gray-200/50 dark:bg-white/10">
                  <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9]" />
                </div>
              </div>

              {/* Floating card 3 */}
              <div 
                className="absolute bottom-8 right-16 w-36 h-24 rounded-2xl bg-gradient-to-br from-[#A55AAC]/20 to-[#4D5DD9]/20 dark:from-[#A55AAC]/10 dark:to-[#4D5DD9]/10 backdrop-blur-xl border border-[#A55AAC]/20 shadow-xl p-4 animate-float"
                style={{ ...mouseParallax(-0.02), animationDelay: '2s' }}
              >
                <div className="text-2xl font-bold bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] bg-clip-text text-transparent">€9.50</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">/month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-gray-300 dark:border-white/20 flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-gray-400 dark:bg-white/40 animate-scroll" />
          </div>
        </div>
      </section>

      {/* Features - Bento Glass Grid */}
      <section className="relative py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need.
              <span className="bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] bg-clip-text text-transparent"> Nothing you don&apos;t.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Large feature card */}
            <div className="md:col-span-2 group p-8 rounded-3xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/60 dark:border-white/[0.06] shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <span className="text-7xl font-bold text-gray-100 dark:text-white/[0.03] group-hover:text-gray-200 dark:group-hover:text-white/[0.05] transition-colors">01</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">We start with you</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                A 30-minute discovery call to understand your business, brand, and goals. No templates — we build something unique.
              </p>
            </div>

            {/* Speed card */}
            <div className="group p-8 rounded-3xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/60 dark:border-white/[0.06] shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Live in days</h3>
              <p className="text-gray-600 dark:text-gray-400">3-5 business days. Not weeks or months.</p>
            </div>

            {/* AI Editor card - highlighted */}
            <div className="md:col-span-2 group p-8 rounded-3xl bg-gradient-to-br from-[#A55AAC]/10 via-transparent to-[#4D5DD9]/10 dark:from-[#A55AAC]/20 dark:to-[#4D5DD9]/20 backdrop-blur-2xl border border-[#A55AAC]/20 dark:border-[#A55AAC]/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#A55AAC]/10 to-[#4D5DD9]/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] text-white text-xs font-semibold">AI-POWERED</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Then customize with AI</h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-6">
                  After launch, update your site by chatting. &quot;Add a contact form&quot;, &quot;Change the colors&quot;, &quot;Add a new page&quot; — just say it.
                </p>
                {/* Mock chat */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/[0.05] border border-white/40 dark:border-white/[0.08]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-white font-bold">AI</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Done! I&apos;ve updated your homepage headline and added the contact form...</div>
                </div>
              </div>
            </div>

            {/* Email card */}
            <div className="group p-8 rounded-3xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/60 dark:border-white/[0.06] shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pro email included</h3>
              <p className="text-gray-600 dark:text-gray-400">2 mailboxes at your domain. Look professional.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Simple pricing
              </h2>
              <p className="text-xl text-gray-500 dark:text-gray-400">
                One plan. Everything included.
              </p>
            </div>

            {/* Pricing card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] rounded-[2rem] blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative p-10 rounded-3xl bg-white/90 dark:bg-[#0f0f11] backdrop-blur-2xl border border-white/60 dark:border-white/[0.1]">
                {/* Beta badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] rounded-full text-white text-sm font-semibold shadow-lg">
                  BETA — 50% OFF
                </div>

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-8 pt-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Launch Plan</h3>
                    <p className="text-gray-500 dark:text-gray-400">Everything to get online</p>
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">One-time setup</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">€99.50</span>
                        <span className="text-lg text-gray-400 line-through">€199</span>
                      </div>
                    </div>
                    <div className="pl-8 border-l border-gray-200 dark:border-white/10">
                      <div className="text-sm text-gray-500 mb-1">Monthly</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">€9.50</span>
                        <span className="text-lg text-gray-400 line-through">€19</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 py-8 border-y border-gray-200 dark:border-white/10">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Setup includes</h4>
                    <ul className="space-y-3">
                      {['30-min discovery call', 'Custom site built for you', 'Domain configuration', 'Professional email (2 mailboxes)', 'Global CDN hosting', 'Live in 3-5 days'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#A55AAC]/20 to-[#4D5DD9]/20 flex items-center justify-center">
                            <svg className="w-3 h-3 text-[#7B6AD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Monthly includes</h4>
                    <ul className="space-y-3">
                      {['Hosting + SSL', 'Email (2 mailboxes)', '1GB cloud storage', 'AI Editor access', 'Platform updates', 'Cancel anytime'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#A55AAC]/20 to-[#4D5DD9]/20 flex items-center justify-center">
                            <svg className="w-3 h-3 text-[#7B6AD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8">
                  <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] hover:opacity-90 text-white text-lg font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-[1.01]">
                      Book Your Discovery Call
                    </Button>
                  </a>
                  <p className="mt-4 text-center text-sm text-gray-500">
                    ✨ First month free. No lock-in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How long until my site is live?', a: 'Most sites launch within 3-5 business days after your discovery call.' },
              { q: 'Can I make changes after launch?', a: 'Yes! Your subscription includes our AI Editor — just tell it what to change in plain English.' },
              { q: 'What happens when beta ends?', a: 'Your price moves to standard rates (€199 setup / €19/month). You\'ll get 30 days notice.' },
              { q: 'Do I need technical skills?', a: 'None. We handle the technical setup. The AI Editor is designed for non-technical users.' },
            ].map((item, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-white/60 dark:border-white/[0.06] hover:bg-white/90 dark:hover:bg-white/[0.05] transition-all">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-[#7B6AD8] transition-colors">{item.q}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative rounded-[2.5rem] p-16 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9]" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to get started?
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-lg mx-auto">
                Book a free 30-minute call. We&apos;ll learn about your business and show you what&apos;s possible.
              </p>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-white hover:bg-white/95 text-gray-900 px-10 h-14 rounded-2xl text-lg font-medium shadow-2xl hover:scale-[1.02] transition-all">
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

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes scroll {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(6px); opacity: 0; }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-scroll { animation: scroll 1.5s ease-out infinite; }
        .animate-gradient { background-size: 200% 200%; animation: gradient 8s ease infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; opacity: 0; }
        .animation-delay-100 { animation-delay: 0.1s; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-400 { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
}
