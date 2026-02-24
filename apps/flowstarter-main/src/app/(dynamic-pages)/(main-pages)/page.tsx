'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const CALENDLY_URL = 'https://calendly.com/flowstarter/discovery';

export default function LandingPage() {
  const [activeChat, setActiveChat] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  const chatExamples = [
    { user: "Add a testimonials section with 3 cards", ai: "Done! I added a testimonials section below the features. Want me to help you write the actual testimonials?" },
    { user: "Change the header background to white", ai: "Updated! The header is now white with a subtle shadow on scroll. How does it look?" },
    { user: "Add my phone number to the footer", ai: "Added your phone number next to the email. I also made it clickable on mobile." },
  ];

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setActiveChat((prev) => (prev + 1) % chatExamples.length);
    }, 4000);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleScroll = () => setScrollY(window.scrollY);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const mouseParallax = (factor: number) => {
    if (typeof window === 'undefined') return {};
    return {
      transform: `translate(${(mousePos.x - window.innerWidth / 2) * factor}px, ${(mousePos.y - window.innerHeight / 2) * factor}px)`,
    };
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#FAFAFB] dark:bg-[#08080A]">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[1000px] h-[1000px] rounded-full blur-[180px] transition-transform duration-[3000ms] ease-out"
          style={{ 
            background: 'radial-gradient(circle, rgba(165, 90, 172, 0.15) 0%, transparent 70%)',
            top: '-40%',
            left: '-20%',
            ...mouseParallax(0.01),
          }}
        />
        <div 
          className="absolute w-[800px] h-[800px] rounded-full blur-[150px] transition-transform duration-[3000ms] ease-out"
          style={{ 
            background: 'radial-gradient(circle, rgba(77, 93, 217, 0.12) 0%, transparent 70%)',
            top: '20%',
            right: '-15%',
            ...mouseParallax(-0.01),
          }}
        />
      </div>

      {/* Dot pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Header - Glassmorphism */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="m-3 sm:m-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between rounded-2xl bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl border border-white/50 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative w-9 h-9 bg-gradient-to-br from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white hidden sm:block">Flowstarter</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">Sign In</Button>
              </Link>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl shadow-sm">
                  Book a Call
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-24 pb-12 sm:pt-28 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border border-white/60 dark:border-white/[0.1] shadow-lg mb-6 sm:mb-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-sm font-medium bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] bg-clip-text text-transparent">
                  Beta: 50% off for early adopters
                </span>
              </div>
              
              {/* Headline */}
              <h1 className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight mb-6 transition-all duration-1000 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <span className="text-gray-900 dark:text-white">We build your</span>
                <br />
                <span className="bg-gradient-to-r from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] bg-clip-text text-transparent">
                  perfect website.
                </span>
              </h1>
              
              {/* Subheadline */}
              <p className={`text-lg sm:text-xl text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto lg:mx-0 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                One call. One week. One beautiful website. Then customize it anytime with our AI editor.
              </p>
              
              {/* CTA */}
              <div className={`flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-10 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="h-14 px-8 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-lg font-medium shadow-lg hover:shadow-xl transition-all">
                    Book Free Call
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                </a>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-xs">50% OFF</span>
                  <span className="text-gray-400 line-through">€199</span>
                  <span className="font-semibold text-gray-900 dark:text-white">€99.50</span>
                  <span className="text-gray-400">+</span>
                  <span className="text-gray-400 line-through">€19</span>
                  <span className="font-semibold text-gray-900 dark:text-white">€9.50<span className="font-normal text-gray-500">/mo</span></span>
                </div>
              </div>

              {/* Stats */}
              <div className={`flex justify-center lg:justify-start gap-8 sm:gap-12 transition-all duration-1000 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {[
                  { value: '3-5', label: 'days' },
                  { value: '€9.50', label: '/month' },
                  { value: '0', label: 'code' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Editor Preview */}
            <div className={`relative transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* Floating elements */}
              <div 
                className="absolute -top-8 -left-8 w-24 h-24 rounded-2xl bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border border-white/60 dark:border-white/[0.1] shadow-xl p-4 hidden lg:flex flex-col justify-center animate-float z-10"
                style={mouseParallax(-0.03)}
              >
                <div className="text-2xl font-bold bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] bg-clip-text text-transparent">98</div>
                <div className="text-xs text-gray-500">PageSpeed</div>
              </div>

              <div 
                className="absolute -bottom-4 -right-4 w-28 h-20 rounded-2xl bg-gray-900 dark:bg-white shadow-xl p-4 hidden lg:flex flex-col justify-center animate-float z-10"
                style={{ ...mouseParallax(0.02), animationDelay: '1s' }}
              >
                <div className="text-xl font-bold text-white dark:text-gray-900">Live</div>
                <div className="text-xs text-white/70 dark:text-gray-500">in 3-5 days</div>
              </div>

              {/* Main Editor Card */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gray-900/5 dark:bg-white/5 rounded-[2rem] blur-2xl" />
                
                <div className="relative rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#111114]/90 backdrop-blur-xl border border-white/60 dark:border-white/[0.08] shadow-2xl overflow-hidden">
                  {/* Editor Header */}
                  <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-gray-50/80 dark:bg-white/[0.02] border-b border-black/[0.04] dark:border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F57]" />
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E]" />
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#28CA42]" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">AI Editor</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400">Live</span>
                    </div>
                  </div>
                  
                  {/* Chat Content */}
                  <div className="p-4 sm:p-6 space-y-4 min-h-[280px] sm:min-h-[320px]">
                    <div className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Chat with your website</div>
                    
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] px-4 py-2.5 sm:py-3 rounded-2xl rounded-tr-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm shadow-lg">
                        {chatExamples[activeChat].user}
                      </div>
                    </div>
                    
                    {/* AI response */}
                    <div className="flex gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0 shadow-lg">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                      <div className="flex-1 px-4 py-2.5 sm:py-3 rounded-2xl rounded-tl-md bg-white dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-sm text-gray-700 dark:text-gray-300">
                        {chatExamples[activeChat].ai}
                      </div>
                    </div>

                    {/* Input */}
                    <div className="flex items-center gap-2 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
                      <input 
                        type="text" 
                        placeholder="Tell me what to change..." 
                        className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400 px-2"
                        readOnly
                      />
                      <Button size="sm" className="h-8 sm:h-9 px-3 sm:px-4 rounded-lg sm:rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900">
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Try prompts */}
              <div className="flex flex-wrap justify-center gap-2 mt-4 sm:mt-6">
                {['Contact form', 'New colors', 'Add page'].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveChat(i % chatExamples.length)}
                    className="px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06] text-xs sm:text-sm text-gray-600 dark:text-gray-400 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get - Glass Cards */}
      <section className="relative py-20 sm:py-28 lg:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
              Here is what you get
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">No hidden fees. The complete package.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Setup Card */}
            <div className="group relative">
              <div className="absolute -inset-px bg-gray-900/5 dark:bg-white/10 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-white/60 dark:border-white/[0.06] shadow-xl h-full">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Setup</h3>
                    <p className="text-sm text-gray-500 mt-1">One-time fee</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">€199</div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mt-1">
                      <span>BETA: 50% OFF</span>
                      <span className="font-bold">→ €99.50</span>
                    </div>
                  </div>
                </div>
                <ul className="space-y-3">
                  {['30-minute discovery call', 'Custom website design and build', 'Domain configuration', '2 professional email addresses', 'Global hosting setup', 'Live in 3-5 business days'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Monthly Card */}
            <div className="group relative">
              <div className="absolute -inset-px bg-gray-900/5 dark:bg-white/10 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-white/60 dark:border-white/[0.06] shadow-xl h-full">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Monthly</h3>
                    <p className="text-sm text-gray-500 mt-1">First month free</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">€19<span className="text-lg font-normal text-gray-400">/mo</span></div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mt-1">
                      <span>BETA: 50% OFF</span>
                      <span className="font-bold">→ €9.50/mo</span>
                    </div>
                  </div>
                </div>
                <ul className="space-y-3">
                  {['Website hosting (fast and secure)', 'SSL certificate included', 'Your 2 email addresses', 'AI Editor to update your site', '1GB storage for images', 'Cancel anytime'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Beta CTA */}
          <div className="mt-8 sm:mt-12 p-5 sm:p-6 rounded-2xl bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Beta pricing ends soon</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Lock in 50% off before launch</div>
              </div>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button className="w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl shadow-sm">
                  Book Your Call
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* AI Editor Examples */}
      <section className="relative py-20 sm:py-28 lg:py-32 bg-gray-50/50 dark:bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
              Just tell the AI what you want
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">No coding. No design skills. Type and watch it happen.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: 'Change content', examples: ['Update the homepage text', 'Add a new team member', 'Change my phone number'] },
              { title: 'Add features', examples: ['Add a contact form', 'Create a pricing table', 'Add an FAQ section'] },
              { title: 'Adjust design', examples: ['Make the header sticky', 'Change the button colors', 'Use a different font'] },
            ].map((category, i) => (
              <div key={i} className="p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-white/[0.02] backdrop-blur-xl border border-white/60 dark:border-white/[0.06]">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">{category.title}</h3>
                <ul className="space-y-2">
                  {category.examples.map((example, j) => (
                    <li key={j} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <span className="text-[#7B6AD8]">&ldquo;</span>
                      {example}
                      <span className="text-[#7B6AD8]">&rdquo;</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-20 sm:py-28 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 sm:mb-12 text-center">Common questions</h2>
          <div className="space-y-4">
            {[
              { q: 'What happens on the discovery call?', a: 'We talk about your business, your customers, and what you want your website to do. Takes about 30 minutes.' },
              { q: 'How long until my site is ready?', a: '3 to 5 business days after the call. We send you a preview before going live.' },
              { q: 'Can I make changes after you build it?', a: 'Yes. The AI Editor lets you change text, images, colors, add pages, forms, anything. Just describe what you want.' },
              { q: 'What happens after the beta?', a: 'Prices go to €199 setup and €19/month. If you sign up during beta, you keep the beta price forever.' },
            ].map((item, i) => (
              <div key={i} className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-white/[0.02] backdrop-blur-xl border border-white/60 dark:border-white/[0.06]">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.q}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 sm:py-28 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">
            Ready to get started?
          </h2>
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 mb-10">
            Book a free 30-minute call. No pressure.
          </p>
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="h-14 px-10 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-lg font-medium shadow-lg hover:shadow-xl transition-all">
              Book Free Discovery Call
            </Button>
          </a>
          <p className="mt-6 text-sm text-gray-400">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-black/[0.04] dark:border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <span className="text-sm text-gray-500">© 2026 Flowstarter</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="mailto:hello@flowstarter.app" className="hover:text-gray-900 dark:hover:text-white transition-colors">hello@flowstarter.app</a>
            <Link href="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">Client Login</Link>
          </div>
        </div>
      </footer>

      {/* Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
