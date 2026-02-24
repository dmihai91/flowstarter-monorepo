'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

const CALENDLY_URL = 'https://calendly.com/flowstarter/discovery';

export default function LandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.fade-up').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] overflow-x-hidden">
      <style jsx global>{`
        .fade-up {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), 
                      transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fade-up.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
        .fade-up:nth-child(2) { transition-delay: 0.1s; }
        .fade-up:nth-child(3) { transition-delay: 0.2s; }
        .fade-up:nth-child(4) { transition-delay: 0.3s; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite; 
        }
        
        .glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .dark .glass {
          background: rgba(20, 20, 20, 0.8);
        }
      `}</style>

      {/* Gradient Orbs Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-[40%] -right-[20%] w-[80%] h-[80%] rounded-full animate-pulse-glow"
          style={{ 
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          }} 
        />
        <div 
          className="absolute -bottom-[30%] -left-[20%] w-[70%] h-[70%] rounded-full animate-pulse-glow"
          style={{ 
            background: 'radial-gradient(circle, rgba(20, 184, 166, 0.12) 0%, transparent 70%)',
            animationDelay: '2s',
          }} 
        />
        <div 
          className="absolute top-[20%] left-[10%] w-[40%] h-[40%] rounded-full animate-pulse-glow"
          style={{ 
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.08) 0%, transparent 70%)',
            animationDelay: '4s',
          }} 
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-shadow">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Flowstarter</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Sign In
              </Button>
            </Link>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white border-0 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all">
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
            <div className="fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              Now accepting new clients
            </div>
            
            <h1 className="fade-up text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-[1.05] tracking-tight mb-8">
              We build your
              <br />
              <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent animate-gradient">
                perfect website.
              </span>
            </h1>
            
            <p className="fade-up text-xl md:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed mb-12 max-w-2xl font-light">
              You focus on your business. We handle the design, development, 
              hosting, and ongoing updates. Simple as that.
            </p>
            
            <div className="fade-up flex flex-col sm:flex-row gap-4">
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="xl" className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white text-lg px-8 h-14 rounded-xl shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 transition-all border-0">
                  Book a Free Call
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </a>
              <Link href="/login">
                <Button size="xl" variant="outline" className="text-lg px-8 h-14 rounded-xl border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900">
                  Client Login
                </Button>
              </Link>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="hidden lg:block absolute right-12 top-48 animate-float">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl shadow-amber-500/30" />
          </div>
          <div className="hidden lg:block absolute right-48 top-80 animate-float" style={{ animationDelay: '1s' }}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-xl shadow-cyan-500/30" />
          </div>
          <div className="hidden lg:block absolute right-24 bottom-24 animate-float" style={{ animationDelay: '2s' }}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 shadow-xl shadow-rose-500/30" />
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="fade-up mb-16">
            <span className="text-teal-600 dark:text-teal-400 font-semibold text-sm uppercase tracking-wider">
              What you get
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-4 max-w-3xl leading-tight">
              Everything you need.
              <br />
              <span className="text-gray-400 dark:text-gray-600">Nothing you don't.</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="fade-up p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                What's included
              </h3>
              <ul className="space-y-4">
                {[
                  'Custom design tailored to your brand',
                  'Mobile-responsive on all devices',
                  'Fast hosting (under 2s load time)',
                  'SSL security certificate included',
                  'SEO basics configured',
                  'Working contact forms',
                  'Analytics dashboard',
                  'Ongoing maintenance & updates',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="fade-up p-8 rounded-3xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                What you skip
              </h3>
              <ul className="space-y-4">
                {[
                  'Learning website builders',
                  'Dealing with hosting & DNS',
                  'Worrying about security updates',
                  'Debugging slow performance',
                  'Chasing unreliable freelancers',
                  'Paying for 10 different tools',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-500 dark:text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    <span className="line-through">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="relative py-24 md:py-32 bg-gradient-to-b from-transparent via-teal-50/50 to-transparent dark:via-teal-950/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="fade-up mb-16 text-center">
            <span className="text-teal-600 dark:text-teal-400 font-semibold text-sm uppercase tracking-wider">
              Who it's for
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-4">
              Built for businesses like yours.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                ),
                title: 'Local Businesses',
                desc: 'Restaurants, salons, gyms, clinics. Get found online and look professional.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                  </svg>
                ),
                title: 'Service Providers',
                desc: 'Consultants, coaches, agencies. Showcase your expertise and convert visitors.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                ),
                title: 'Small Teams',
                desc: 'Startups and growing companies. Look established without the enterprise cost.',
              },
            ].map((item) => (
              <div key={item.title} className="fade-up group p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-teal-300 dark:hover:border-teal-800 transition-colors shadow-lg shadow-gray-200/50 dark:shadow-none hover:shadow-xl hover:shadow-teal-500/10">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6 text-gray-600 dark:text-gray-400 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="fade-up mb-16">
            <span className="text-teal-600 dark:text-teal-400 font-semibold text-sm uppercase tracking-wider">
              How it works
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-4">
              Live in 2-3 weeks.
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Discovery', desc: 'Free call to understand your goals and requirements.' },
              { num: '02', title: 'Design', desc: 'We create mockups. You give feedback until it's perfect.' },
              { num: '03', title: 'Build', desc: 'We develop with clean code and fast hosting.' },
              { num: '04', title: 'Launch', desc: 'We deploy, test, and hand you the keys.' },
            ].map((item, i) => (
              <div key={item.num} className="fade-up relative">
                <span className="text-7xl font-bold text-gray-100 dark:text-gray-900 absolute -top-4 -left-2">
                  {item.num}
                </span>
                <div className="relative pt-12">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-16 -right-4 w-8 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-700" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="fade-up relative rounded-[2.5rem] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-12 md:p-20 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 -right-1/4 w-full h-full rounded-full bg-gradient-to-br from-teal-500/20 to-transparent blur-3xl" />
              <div className="absolute -bottom-1/2 -left-1/4 w-full h-full rounded-full bg-gradient-to-tr from-cyan-500/20 to-transparent blur-3xl" />
            </div>
            
            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to get started?
              </h2>
              <p className="text-xl text-gray-400 mb-10">
                Book a free 30-minute call. No pressure, no obligations.
                <br className="hidden md:block" />
                Let's talk about what you need.
              </p>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="xl" className="bg-white hover:bg-gray-100 text-gray-900 text-lg px-10 h-14 rounded-xl shadow-2xl hover:shadow-white/25 transition-all">
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
