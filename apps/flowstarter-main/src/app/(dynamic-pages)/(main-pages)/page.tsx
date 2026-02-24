'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const CALENDLY_URL = 'https://calendly.com/flowstarter/discovery';

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
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

  const mouseParallax = (factor: number) => {
    if (typeof window === 'undefined') return {};
    return {
      transform: `translate(${(mousePosition.x - window.innerWidth / 2) * factor}px, ${(mousePosition.y - window.innerHeight / 2) * factor}px)`,
    };
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FAFAFB] dark:bg-[#08080A]">
      {/* Dynamic gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Morphing gradient blob */}
        <div 
          className="absolute w-[1200px] h-[1200px] rounded-full opacity-[0.15] dark:opacity-[0.08] transition-all duration-[2000ms] ease-out"
          style={{ 
            background: 'conic-gradient(from 180deg at 50% 50%, #A55AAC 0deg, #4D5DD9 120deg, #38BDF8 240deg, #A55AAC 360deg)',
            filter: 'blur(120px)',
            top: `calc(-30% + ${scrollY * 0.1}px)`,
            left: '-20%',
            ...mouseParallax(0.02),
          }}
        />
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-[0.12] dark:opacity-[0.06] transition-all duration-[2000ms] ease-out"
          style={{ 
            background: 'conic-gradient(from 0deg at 50% 50%, #4D5DD9 0deg, #A55AAC 180deg, #4D5DD9 360deg)',
            filter: 'blur(100px)',
            bottom: '-20%',
            right: '-10%',
            ...mouseParallax(-0.015),
          }}
        />
      </div>

      {/* Dot grid pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.15]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.07) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="m-4">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between rounded-2xl bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative w-9 h-9 bg-gradient-to-br from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
              </div>
              <span className="text-[15px] font-semibold text-gray-900 dark:text-white">Flowstarter</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">
                  Sign In
                </Button>
              </Link>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-medium px-4">
                  Book a Call
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="text-center max-w-4xl mx-auto">
            {/* Animated badge */}
            <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/90 dark:bg-white/[0.08] backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.1] shadow-[0_2px_20px_rgba(0,0,0,0.04)] mb-10 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Now in Beta</span>
              </div>
              <div className="w-px h-4 bg-gray-200 dark:bg-white/20" />
              <span className="text-sm text-gray-600 dark:text-gray-400">50% off for early adopters</span>
            </div>
            
            {/* Main headline */}
            <h1 className={`text-[clamp(3rem,8vw,6rem)] font-bold leading-[0.95] tracking-[-0.03em] mb-8 transition-all duration-1000 delay-100 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <span className="text-gray-900 dark:text-white">We build your</span>
              <br />
              <span className="relative">
                <span className="bg-gradient-to-r from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] bg-clip-text text-transparent">
                  perfect website
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round" className="animate-draw" />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="300" y2="0">
                      <stop stopColor="#A55AAC" />
                      <stop offset="0.5" stopColor="#7B6AD8" />
                      <stop offset="1" stopColor="#4D5DD9" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>
            
            <p className={`text-xl md:text-2xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto mb-12 transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              One call. One week. One beautiful website.
              <br className="hidden sm:block" />
              Then customize it anytime with our AI editor.
            </p>
            
            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-20 transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="group relative overflow-hidden bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] hover:opacity-90 text-white px-8 h-14 rounded-2xl text-lg font-medium shadow-[0_8px_40px_rgba(165,90,172,0.35)] hover:shadow-[0_12px_50px_rgba(165,90,172,0.5)] transition-all hover:scale-[1.02]">
                  <span className="relative z-10 flex items-center">
                    Start for €99.50
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4D5DD9] to-[#A55AAC] opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </a>
              <Button variant="outline" size="lg" className="px-8 h-14 rounded-2xl text-lg border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl hover:bg-white dark:hover:bg-white/10">
                Watch Demo
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Button>
            </div>

            {/* Floating preview cards */}
            <div className={`relative h-[400px] md:h-[500px] transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
              {/* Main browser mockup */}
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[700px] transition-transform duration-700"
                style={mouseParallax(0.01)}
              >
                <div className="rounded-2xl bg-white dark:bg-[#141417] border border-black/[0.08] dark:border-white/[0.1] shadow-[0_40px_100px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden">
                  {/* Browser header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-white/[0.03] border-b border-black/[0.04] dark:border-white/[0.06]">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                      <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                      <div className="w-3 h-3 rounded-full bg-[#28CA42]" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="w-full max-w-xs mx-auto h-7 rounded-lg bg-white dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] flex items-center px-3">
                        <svg className="w-3 h-3 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-xs text-gray-500">yourbusiness.com</span>
                      </div>
                    </div>
                  </div>
                  {/* Browser content */}
                  <div className="p-6 md:p-10 bg-gradient-to-br from-gray-50 to-white dark:from-[#0f0f12] dark:to-[#141417]">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9]" />
                        <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded-lg" />
                      </div>
                      <div className="h-32 rounded-2xl bg-gradient-to-br from-[#A55AAC]/10 to-[#4D5DD9]/10 dark:from-[#A55AAC]/20 dark:to-[#4D5DD9]/20 flex items-center justify-center">
                        <span className="text-3xl font-bold bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] bg-clip-text text-transparent">Your Hero Section</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating AI chat card */}
              <div 
                className="absolute -right-4 md:right-[5%] top-[20%] w-64 transition-transform duration-700 animate-float-slow"
                style={mouseParallax(-0.025)}
              >
                <div className="p-4 rounded-2xl bg-white/90 dark:bg-white/[0.08] backdrop-blur-2xl border border-black/[0.04] dark:border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">AI</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">AI Editor</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Done! I updated the headline and added your new phone number to the footer.
                  </p>
                </div>
              </div>

              {/* Floating stats card */}
              <div 
                className="absolute -left-4 md:left-[5%] bottom-[15%] transition-transform duration-700 animate-float-slow"
                style={{ ...mouseParallax(0.02), animationDelay: '1s' }}
              >
                <div className="p-4 rounded-2xl bg-white/90 dark:bg-white/[0.08] backdrop-blur-2xl border border-black/[0.04] dark:border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Page Speed</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">98/100</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#A55AAC]/10 text-[#A55AAC] dark:text-[#c17dc7] text-sm font-medium mb-6">
              How it works
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              Three steps to your
              <br />
              <span className="bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] bg-clip-text text-transparent">dream website</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Discovery Call',
                desc: 'We hop on a 30-minute video call to understand your business, brand, and goals. You talk, we listen.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'We Build It',
                desc: 'Our team crafts a stunning, fast website tailored to you. Domain, hosting, email, everything handled.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'You Own It',
                desc: 'Your site goes live. Make changes anytime with our AI editor. Just describe what you want.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div key={i} className="group relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#A55AAC]/20 to-[#4D5DD9]/20 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
                <div className="relative p-8 rounded-3xl bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.08] hover:border-[#A55AAC]/30 transition-all duration-500 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center text-white shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <span className="text-5xl font-bold text-gray-100 dark:text-white/[0.05]">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="relative py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#4D5DD9]/10 text-[#4D5DD9] text-sm font-medium mb-6">
                Everything included
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-8">
                Focus on your business.
                <br />
                <span className="text-gray-400 dark:text-gray-500">We handle the tech.</span>
              </h2>
              <div className="space-y-6">
                {[
                  { title: 'Custom Design', desc: 'Unique to your brand, not a template' },
                  { title: 'Global Hosting', desc: 'Fast CDN, SSL certificate, 99.9% uptime' },
                  { title: 'Professional Email', desc: 'you@yourbusiness.com (2 mailboxes)' },
                  { title: 'AI Editor Access', desc: 'Update content anytime by chatting' },
                  { title: 'Domain Setup', desc: 'We configure everything for you' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{item.title}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual side */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#A55AAC]/20 to-[#4D5DD9]/20 rounded-[3rem] blur-3xl" />
              <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="p-6 rounded-3xl bg-white/90 dark:bg-white/[0.06] backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.08] shadow-xl">
                    <div className="text-4xl font-bold bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] bg-clip-text text-transparent">3-5</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Days to launch</div>
                  </div>
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] text-white shadow-xl shadow-purple-500/25">
                    <div className="text-4xl font-bold">€9.50</div>
                    <div className="text-white/70 text-sm mt-1">Per month</div>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="p-6 rounded-3xl bg-white/90 dark:bg-white/[0.06] backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.08] shadow-xl">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">0</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Code required</div>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/90 dark:bg-white/[0.06] backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.08] shadow-xl">
                    <div className="text-4xl font-bold text-emerald-500">∞</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI edits included</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative py-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
              Limited time offer
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              Simple, honest pricing
            </h2>
          </div>

          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] rounded-[2.5rem] blur-xl opacity-25 group-hover:opacity-40 transition-opacity" />
            
            <div className="relative p-10 md:p-12 rounded-[2rem] bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.08] shadow-2xl">
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="px-5 py-2 bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] rounded-full text-white text-sm font-semibold shadow-lg">
                  BETA: 50% OFF
                </div>
              </div>

              <div className="text-center mb-10 pt-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Launch Plan</h3>
                <p className="text-gray-500 dark:text-gray-400">Everything you need to get online</p>
              </div>

              <div className="flex justify-center items-baseline gap-8 mb-10 pb-10 border-b border-gray-100 dark:border-white/[0.06]">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">One-time setup</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">€99.50</span>
                    <span className="text-xl text-gray-300 dark:text-gray-600 line-through">€199</span>
                  </div>
                </div>
                <div className="text-4xl text-gray-200 dark:text-gray-700">+</div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">Monthly</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">€9.50</span>
                    <span className="text-xl text-gray-300 dark:text-gray-600 line-through">€19</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-10">
                {[
                  '30-minute discovery call',
                  'Custom website design',
                  'Domain configuration',
                  'Professional email (2)',
                  'Global CDN hosting',
                  'SSL certificate',
                  'AI Editor access',
                  'Live in 3-5 days',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#A55AAC]/20 to-[#4D5DD9]/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-[#7B6AD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>

              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full h-14 rounded-2xl bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]">
                  Book Your Discovery Call
                </Button>
              </a>
              
              <p className="mt-6 text-center text-sm text-gray-500">
                First month free • No contracts • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Common questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How long until my site is live?', a: 'Most sites launch within 3-5 business days after your discovery call.' },
              { q: 'Can I make changes after launch?', a: 'Yes! Your subscription includes our AI Editor. Just describe what you want changed in plain English.' },
              { q: 'What happens when beta ends?', a: 'Prices move to standard rates (€199 setup, €19/month). You will get 30 days notice before any changes.' },
              { q: 'Do I need technical skills?', a: 'None at all. We handle all the technical work. The AI Editor is designed for anyone to use.' },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.06] hover:bg-white dark:hover:bg-white/[0.05] transition-all">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.q}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">
            Ready to launch your
            <br />
            <span className="bg-gradient-to-r from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] bg-clip-text text-transparent">dream website?</span>
          </h2>
          <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-xl mx-auto">
            Book a free 30-minute call. No pressure, no obligations. Just a conversation about your business.
          </p>
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] hover:opacity-90 text-white px-10 h-14 rounded-2xl text-lg font-medium shadow-[0_8px_40px_rgba(165,90,172,0.35)] hover:shadow-[0_12px_50px_rgba(165,90,172,0.5)] transition-all hover:scale-[1.02]">
              Book Your Free Call
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100 dark:border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">F</span>
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

      {/* Styles */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
        @keyframes draw {
          0% { stroke-dasharray: 0 1000; }
          100% { stroke-dasharray: 1000 0; }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-draw { animation: draw 2s ease-out forwards; stroke-dasharray: 0 1000; }
      `}</style>
    </div>
  );
}
