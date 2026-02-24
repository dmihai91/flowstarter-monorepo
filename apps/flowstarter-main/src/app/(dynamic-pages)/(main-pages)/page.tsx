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

  const chatExamples = [
    { user: "Add a testimonials section with 3 cards", ai: "Done! I added a testimonials section below the features. I used your brand colors and added placeholder text. Want me to help you write the actual testimonials?" },
    { user: "Change the header background to white", ai: "Updated! The header is now white with a subtle shadow on scroll. I also adjusted the logo and nav links to stay visible." },
    { user: "Add my phone number to the footer", ai: "Added your phone number to the footer next to the email. I also made it clickable on mobile so visitors can tap to call." },
  ];

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setActiveChat((prev) => (prev + 1) % chatExamples.length);
    }, 5000);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] overflow-x-hidden">
      {/* Premium gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute w-[1000px] h-[1000px] rounded-full opacity-30 dark:opacity-20 blur-[150px] transition-transform duration-[3000ms]"
          style={{ 
            background: 'radial-gradient(circle, #A55AAC 0%, transparent 70%)',
            top: '-30%',
            left: '-20%',
            transform: `translate(${mousePos.x * 0.01}px, ${mousePos.y * 0.01}px)`,
          }}
        />
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-25 dark:opacity-15 blur-[150px] transition-transform duration-[3000ms]"
          style={{ 
            background: 'radial-gradient(circle, #4D5DD9 0%, transparent 70%)',
            top: '20%',
            right: '-20%',
            transform: `translate(${-mousePos.x * 0.008}px, ${mousePos.y * 0.008}px)`,
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 dark:opacity-10 blur-[150px]"
          style={{ 
            background: 'radial-gradient(circle, #7B6AD8 0%, transparent 70%)',
            bottom: '-10%',
            left: '30%',
          }}
        />
      </div>

      {/* Subtle grid */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.08]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6 rounded-2xl bg-white/80 dark:bg-white/[0.04] backdrop-blur-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-lg shadow-black/[0.02]">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] rounded-xl blur-lg opacity-40" />
                <div className="relative w-9 h-9 bg-gradient-to-br from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white hidden sm:block">Flowstarter</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Client Login
                </Button>
              </Link>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl shadow-lg shadow-black/10 px-4 sm:px-5">
                  <span className="hidden sm:inline">Book a Call</span>
                  <span className="sm:hidden">Book</span>
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-36 lg:pt-44 pb-16 sm:pb-20 lg:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-12 lg:mb-20">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.08] shadow-lg shadow-black/[0.02] mb-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Beta: 50% off for early adopters</span>
            </div>
            
            {/* Headline */}
            <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 sm:mb-8 transition-all duration-1000 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="text-gray-900 dark:text-white">We build your website.</span>
              <br />
              <span className="bg-gradient-to-r from-[#A55AAC] via-[#7B6AD8] to-[#4D5DD9] bg-clip-text text-transparent">You update it with AI.</span>
            </h1>
            
            {/* Subheadline */}
            <p className={`text-lg sm:text-xl lg:text-2xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Tell us about your business. We build a professional website. Then use our AI editor to make changes whenever you want.
            </p>
            
            {/* CTA */}
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="h-14 px-8 rounded-2xl bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] hover:opacity-90 text-white text-lg font-medium shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-[1.02]">
                  Book Free Discovery Call
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </a>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">€99.50</span>
                <span>setup</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="font-semibold text-gray-900 dark:text-white">€9.50</span>
                <span>/month</span>
              </div>
            </div>
          </div>

          {/* Editor Preview */}
          <div className={`relative max-w-5xl mx-auto transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            {/* Glow effect behind editor */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#A55AAC]/20 via-[#7B6AD8]/20 to-[#4D5DD9]/20 rounded-[2rem] blur-2xl opacity-60" />
            
            <div className="relative rounded-2xl sm:rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#111114] shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden">
              {/* Editor Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gray-50/80 dark:bg-white/[0.02] border-b border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex gap-1.5 sm:gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#28CA42]" />
                  </div>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs text-gray-500">yourbusiness.com</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Live</span>
                </div>
              </div>
              
              {/* Editor Content */}
              <div className="grid lg:grid-cols-2 min-h-[350px] sm:min-h-[400px] lg:min-h-[450px]">
                {/* Chat Panel */}
                <div className="p-4 sm:p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-black/[0.04] dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.01]">
                  <div className="flex flex-col h-full">
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 sm:mb-6">Chat with your website</div>
                    
                    <div className="flex-1 space-y-4">
                      {/* User message */}
                      <div className="flex justify-end">
                        <div className="max-w-[85%] sm:max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-md bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] text-white text-sm shadow-lg shadow-purple-500/10">
                          {chatExamples[activeChat].user}
                        </div>
                      </div>
                      
                      {/* AI response */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                        </div>
                        <div className="flex-1 px-4 py-3 rounded-2xl rounded-tl-md bg-white dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-sm text-gray-700 dark:text-gray-300 shadow-sm">
                          {chatExamples[activeChat].ai}
                        </div>
                      </div>
                    </div>

                    {/* Input */}
                    <div className="mt-6 flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] shadow-sm">
                      <input 
                        type="text" 
                        placeholder="Tell me what to change..." 
                        className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400 px-2"
                        readOnly
                      />
                      <Button size="sm" className="h-9 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md">
                        Send
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Preview Panel */}
                <div className="p-4 sm:p-6 lg:p-8 bg-white dark:bg-[#0D0D0F]">
                  <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 sm:mb-6">Live Preview</div>
                  <div className="rounded-xl sm:rounded-2xl border border-black/[0.04] dark:border-white/[0.04] bg-gray-50/80 dark:bg-white/[0.02] p-4 sm:p-6 overflow-hidden">
                    {/* Mini website preview */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9]" />
                        <div className="h-2.5 w-16 sm:w-24 bg-gray-200 dark:bg-white/10 rounded-full" />
                      </div>
                      <div className="hidden sm:flex gap-3">
                        <div className="h-2 w-10 bg-gray-200 dark:bg-white/10 rounded-full" />
                        <div className="h-2 w-10 bg-gray-200 dark:bg-white/10 rounded-full" />
                        <div className="h-2 w-10 bg-gray-200 dark:bg-white/10 rounded-full" />
                      </div>
                    </div>
                    <div className="h-20 sm:h-28 rounded-xl bg-gradient-to-br from-[#A55AAC]/10 to-[#4D5DD9]/10 dark:from-[#A55AAC]/20 dark:to-[#4D5DD9]/20 flex items-center justify-center mb-4 sm:mb-6">
                      <div className="text-center px-4">
                        <div className="h-3 sm:h-4 w-24 sm:w-40 bg-gray-300 dark:bg-white/20 rounded-full mx-auto mb-2" />
                        <div className="h-2 w-32 sm:w-56 bg-gray-200 dark:bg-white/10 rounded-full mx-auto" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="h-12 sm:h-16 rounded-lg bg-white dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]" />
                      <div className="h-12 sm:h-16 rounded-lg bg-white dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]" />
                      <div className="h-12 sm:h-16 rounded-lg bg-white dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Changes apply instantly
                  </div>
                </div>
              </div>
            </div>

            {/* Prompt suggestions */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <span className="text-sm text-gray-400">Try:</span>
              {['Add a contact form', 'Change the colors', 'Add a new page', 'Update the footer'].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setActiveChat(i % chatExamples.length)}
                  className="px-3 py-1.5 rounded-full bg-white dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06] text-sm text-gray-600 dark:text-gray-400 transition-all hover:scale-105"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 sm:py-28 lg:py-32 bg-gray-50/80 dark:bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
              Here is exactly what you get
            </h2>
            <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              No vague promises. No hidden fees. The complete package.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {/* Setup */}
            <div className="group relative">
              <div className="absolute -inset-px bg-gradient-to-br from-[#A55AAC]/30 to-[#4D5DD9]/30 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111114] border border-black/[0.04] dark:border-white/[0.04] shadow-xl shadow-black/[0.02] h-full">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Setup</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">One-time fee</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">€99.50</div>
                    <div className="text-sm text-gray-400 line-through">€199</div>
                  </div>
                </div>
                <ul className="space-y-3 sm:space-y-4">
                  {[
                    '30-minute video call',
                    'Custom website design and build',
                    'Domain configuration',
                    '2 professional email addresses',
                    'Fast global hosting',
                    'Live in 3-5 business days',
                  ].map((item, i) => (
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

            {/* Monthly */}
            <div className="group relative">
              <div className="absolute -inset-px bg-gradient-to-br from-[#A55AAC]/30 to-[#4D5DD9]/30 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111114] border border-black/[0.04] dark:border-white/[0.04] shadow-xl shadow-black/[0.02] h-full">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Monthly</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">First month free</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">€9.50<span className="text-base sm:text-lg font-normal text-gray-400">/mo</span></div>
                    <div className="text-sm text-gray-400 line-through">€19/mo</div>
                  </div>
                </div>
                <ul className="space-y-3 sm:space-y-4">
                  {[
                    'Website hosting (fast and secure)',
                    'SSL certificate included',
                    'Your 2 email addresses',
                    'AI Editor to update your site',
                    '1GB storage for files',
                    'Cancel anytime',
                  ].map((item, i) => (
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

          {/* Beta banner */}
          <div className="max-w-4xl mx-auto mt-8 sm:mt-12">
            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-[#A55AAC]/10 to-[#4D5DD9]/10 border border-[#A55AAC]/20 dark:border-[#A55AAC]/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Beta pricing ends soon</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Lock in 50% off before public launch</div>
                </div>
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl shadow-lg">
                    Book Your Call
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Editor Examples */}
      <section className="py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
              Just tell the AI what you want
            </h2>
            <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              No coding. No design skills. Type and watch it happen.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {[
              { title: 'Change content', examples: ['Update the homepage text', 'Add a new team member', 'Change my phone number'] },
              { title: 'Add features', examples: ['Add a contact form', 'Create a pricing table', 'Add an FAQ section'] },
              { title: 'Adjust design', examples: ['Make the header sticky', 'Change the button colors', 'Use a different font'] },
            ].map((category, i) => (
              <div key={i} className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">{category.title}</h3>
                <ul className="space-y-3">
                  {category.examples.map((example, j) => (
                    <li key={j} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <span className="text-[#7B6AD8] font-medium">"</span>
                      {example}
                      <span className="text-[#7B6AD8] font-medium">"</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 lg:py-32 bg-gray-50/80 dark:bg-white/[0.01]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 sm:mb-12 text-center">Common questions</h2>
          <div className="space-y-4 sm:space-y-6">
            {[
              { q: 'What happens on the discovery call?', a: 'We talk about your business, what you do, who your customers are, and what you want your website to accomplish. Takes about 30 minutes.' },
              { q: 'How long until my site is ready?', a: '3 to 5 business days after the call. We send you a preview link to review before going live.' },
              { q: 'What if I want changes after you build it?', a: 'That is what the AI Editor is for. Just tell it what you want changed. It handles text, images, layout, colors, new pages, forms, everything.' },
              { q: 'Can I cancel the monthly subscription?', a: 'Yes, anytime. No contracts, no penalties. Your site stays live until the end of your billing period.' },
              { q: 'What happens after the beta?', a: 'Prices go to €199 setup and €19/month. If you sign up during beta, you keep the beta price forever.' },
            ].map((item, i) => (
              <div key={i} className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.q}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-4 sm:mb-6">
            Ready to get started?
          </h2>
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 mb-8 sm:mb-10 max-w-lg mx-auto">
            Book a free 30-minute call. If it is not a fit, no hard feelings.
          </p>
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="h-14 px-10 rounded-2xl bg-gradient-to-r from-[#A55AAC] to-[#4D5DD9] hover:opacity-90 text-white text-lg font-medium shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-[1.02]">
              Book Free Discovery Call
            </Button>
          </a>
          <p className="mt-6 text-sm text-gray-400">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-black/[0.04] dark:border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#A55AAC] to-[#4D5DD9] flex items-center justify-center">
                <span className="text-white font-bold text-xs">F</span>
              </div>
              <span className="text-sm text-gray-500">© 2026 Flowstarter</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="mailto:hello@flowstarter.app" className="hover:text-gray-900 dark:hover:text-white transition-colors">hello@flowstarter.app</a>
              <Link href="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">Client Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
