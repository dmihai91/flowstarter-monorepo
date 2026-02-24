'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

const CALENDLY_URL = 'https://calendly.com/flowstarter/discovery';

export default function LandingPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mock site state
  const [mockSite, setMockSite] = useState({
    showTestimonials: true,
    showContactForm: false,
    primaryColor: 'orange',
    hasAboutPage: false,
  });

  const aiResponses: Record<string, { text: string; action?: () => void }> = {
    'contact': { 
      text: "Done. Contact form added below the hero section.", 
      action: () => setMockSite(s => ({ ...s, showContactForm: true }))
    },
    'form': { 
      text: "Done. Contact form added below the hero section.", 
      action: () => setMockSite(s => ({ ...s, showContactForm: true }))
    },
    'color': { 
      text: "Updated. Primary color changed to blue across the site.", 
      action: () => setMockSite(s => ({ ...s, primaryColor: s.primaryColor === 'orange' ? 'blue' : 'orange' }))
    },
    'testimonial': { 
      text: "Testimonials section added with 3 review cards.", 
      action: () => setMockSite(s => ({ ...s, showTestimonials: true }))
    },
    'about': { 
      text: "About page created and linked in the navigation.", 
      action: () => setMockSite(s => ({ ...s, hasAboutPage: true }))
    },
    'page': { 
      text: "New page created and linked in the navigation.", 
      action: () => setMockSite(s => ({ ...s, hasAboutPage: true }))
    },
    'default': { text: "Changes applied. Check the preview on the right." }
  };

  const getAiResponse = (input: string): { text: string; action?: () => void } => {
    const lower = input.toLowerCase();
    for (const [key, response] of Object.entries(aiResponses)) {
      if (key !== 'default' && lower.includes(key)) return response;
    }
    return aiResponses.default;
  };

  const handleSend = (directMessage?: string) => {
    const message = directMessage || inputValue.trim();
    if (!message || isTyping) return;
    setMessages(prev => [...prev, { role: 'user', text: message }]);
    setInputValue('');
    setIsTyping(true);
    
    const response = getAiResponse(message);
    
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'ai', text: response.text }]);
      if (response.action) {
        setTimeout(() => response.action!(), 300);
      }
    }, 800 + Math.random() * 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    setIsLoaded(true);
    setMessages([
      { role: 'user', text: 'Add a testimonials section' },
      { role: 'ai', text: 'Testimonials section added with 3 review cards.' }
    ]);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const mouseParallax = (factor: number) => ({
    transform: `translate(${(mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * factor}px, ${(mousePos.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * factor}px)`
  });

  const features = [
    { num: '01', title: 'Discovery Call', desc: 'We learn your business, goals, and vision in a focused 30-minute conversation.' },
    { num: '02', title: 'Custom Design', desc: 'Your site is designed and built from scratch. No templates. No compromises.' },
    { num: '03', title: 'AI Editor Access', desc: 'Update text, images, and layouts anytime by describing what you want.' },
    { num: '04', title: 'Your Draft Ready', desc: 'First draft in 1-2 weeks. Then customize it yourself with the AI editor—unlimited changes.' },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        
        .font-display { font-family: 'Outfit', system-ui, sans-serif; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
      `}</style>

      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0c] text-gray-900 dark:text-white font-display relative overflow-hidden transition-colors duration-300">
        {/* Animated gradient orbs - WARM colors */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 dark:opacity-30 transition-transform duration-[2000ms]"
            style={{ 
              background: 'radial-gradient(circle, rgba(251, 146, 60, 0.5) 0%, transparent 70%)',
              top: '-20%',
              left: '-10%',
              ...mouseParallax(0.02),
            }}
          />
          <div 
            className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-15 dark:opacity-25 transition-transform duration-[2000ms]"
            style={{ 
              background: 'radial-gradient(circle, rgba(244, 63, 94, 0.5) 0%, transparent 70%)',
              top: '30%',
              right: '-5%',
              ...mouseParallax(-0.015),
            }}
          />
          <div 
            className="absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-10 dark:opacity-20"
            style={{ 
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)',
              bottom: '10%',
              left: '20%',
            }}
          />
        </div>

        {/* Grid pattern overlay */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Header */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'} ${scrolled ? 'bg-white/70 dark:bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 shadow-sm' : ''}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/30 transition-shadow">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <span className="text-xl font-semibold tracking-tight">Flowstarter</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-8">
                <a href="#process" className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors">Process</a>
                <a href="#pricing" className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a>
                <a href="#faq" className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors">FAQ</a>
              </nav>

              <div className="flex items-center gap-4">
                <ThemeToggle />
                <Link href="/login" className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors hidden sm:block">
                  Sign In
                </Link>
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl px-6 h-10 text-sm font-semibold shadow-lg transition-all">
                    Book a Call
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Copy */}
              <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/5 dark:bg-white/5 backdrop-blur-sm border border-gray-900/10 dark:border-white/10 mb-8">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs tracking-wide text-gray-600 dark:text-white/60">Beta — 50% off all pricing</span>
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
                  Your website,
                  <br />
                  <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 bg-clip-text text-transparent animate-gradient">
                    finally done right
                  </span>
                </h1>
                
                <p className="text-lg lg:text-xl text-gray-500 dark:text-white/50 leading-relaxed max-w-lg mb-10">
                  One call. Your draft in 1-2 weeks. Then customize it yourself with our AI editor—just describe what you want.
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-12">
                  <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl px-8 h-14 text-base font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:scale-[1.02] group">
                      Book Free Discovery Call
                      <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Button>
                  </a>
                  <div className="text-sm text-gray-400 dark:text-white/40">
                    <span className="line-through opacity-60">€199</span>
                    <span className="mx-2 text-gray-700 dark:text-white/80 font-medium">€99.50</span>
                    setup
                    <span className="mx-3 text-gray-300 dark:text-white/20">·</span>
                    <span className="line-through opacity-60">€19</span>
                    <span className="mx-2 text-gray-700 dark:text-white/80 font-medium">€9.50</span>
                    /mo
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-8 pt-8 border-t border-gray-200 dark:border-white/10">
                  {[
                    { value: '1-2', label: 'Weeks to draft' },
                    { value: '∞', label: 'AI edits' },
                    { value: '0', label: 'Code needed' },
                  ].map((stat, i) => (
                    <div key={i}>
                      <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">{stat.value}</div>
                      <div className="text-xs text-gray-400 dark:text-white/30 uppercase tracking-wider mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Interactive Editor with Mock Site */}
              <div className={`relative transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Glow effect behind editor */}
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 via-rose-500/20 to-amber-500/20 rounded-3xl blur-2xl animate-pulse-glow" />
                
                {/* Editor + Preview Container */}
                <div className="relative bg-white/60 dark:bg-white/[0.05] backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-white/10 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
                  {/* Browser chrome */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white/40 dark:bg-white/[0.03] border-b border-gray-200/50 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#28ca42]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100/80 dark:bg-white/5 backdrop-blur text-[10px] text-gray-400 dark:text-white/30">
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      yourbusiness.com
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">LIVE</span>
                    </div>
                  </div>

                  {/* Split view: Chat + Mock Site */}
                  <div className="flex">
                    {/* Chat Panel */}
                    <div className="w-1/2 p-4 border-r border-gray-200/30 dark:border-white/5">
                      <div className="text-[9px] tracking-[0.15em] uppercase text-gray-400 dark:text-white/20 font-medium mb-3">AI Editor</div>
                      
                      {/* Messages */}
                      <div className="space-y-3 max-h-[140px] overflow-y-auto mb-4 pr-1">
                        {messages.map((msg, i) => (
                          msg.role === 'user' ? (
                            <div key={i} className="flex justify-end">
                              <div className="max-w-[90%] px-3 py-2 rounded-xl rounded-tr-sm bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[11px] shadow-sm">
                                {msg.text}
                              </div>
                            </div>
                          ) : (
                            <div key={i} className="flex gap-2">
                              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                                <svg className="w-2.5 h-2.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                              </div>
                              <div className="flex-1 px-3 py-2 rounded-xl rounded-tl-sm bg-white/60 dark:bg-white/[0.05] backdrop-blur border border-white/50 dark:border-white/10 text-[11px] text-gray-600 dark:text-white/70">
                                {msg.text}
                              </div>
                            </div>
                          )
                        ))}
                        {isTyping && (
                          <div className="flex gap-2">
                            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                              <svg className="w-2.5 h-2.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                              </svg>
                            </div>
                            <div className="px-3 py-2 rounded-xl rounded-tl-sm bg-white/60 dark:bg-white/[0.05] backdrop-blur border border-white/50 dark:border-white/10">
                              <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input */}
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/50 dark:bg-white/[0.03] backdrop-blur border border-white/60 dark:border-white/10">
                        <input 
                          type="text" 
                          placeholder="Type a change..." 
                          className="flex-1 bg-transparent text-[11px] outline-none px-2 placeholder:text-gray-400 dark:placeholder:text-white/20 text-gray-900 dark:text-white"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                        />
                        <button 
                          onClick={() => handleSend()}
                          disabled={!inputValue.trim() || isTyping}
                          className="w-7 h-7 rounded-md bg-gradient-to-r from-orange-500 to-rose-500 text-white flex items-center justify-center disabled:opacity-30 transition-all hover:shadow-lg hover:shadow-orange-500/25"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Quick prompts */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {['Add contact form', 'Change colors', 'About page'].map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => handleSend(prompt)}
                            disabled={isTyping}
                            className="px-2 py-1 text-[9px] rounded-full bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-gray-200/50 dark:border-white/10 text-gray-500 dark:text-white/50 transition-all disabled:opacity-50"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mock Site Preview */}
                    <div className="w-1/2 p-3 bg-white dark:bg-gray-900 min-h-[280px]">
                      {/* Mini site header */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-4 h-4 rounded-md transition-colors duration-500 ${mockSite.primaryColor === 'orange' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                          <span className="text-[9px] font-semibold text-gray-800 dark:text-white">YourBrand</span>
                        </div>
                        <div className="flex gap-2 text-[8px] text-gray-400">
                          <span>Home</span>
                          {mockSite.hasAboutPage && <span className="text-orange-500 font-medium animate-pulse">About</span>}
                          <span>Contact</span>
                        </div>
                      </div>

                      {/* Mini hero */}
                      <div className="mb-3">
                        <div className="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-1.5" />
                        <div className="h-1.5 w-28 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
                        <div className={`h-4 w-14 rounded transition-colors duration-500 ${mockSite.primaryColor === 'orange' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                      </div>

                      {/* Contact form (conditional) */}
                      {mockSite.showContactForm && (
                        <div className="mb-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 animate-pulse">
                          <div className="text-[8px] font-medium text-gray-600 dark:text-gray-300 mb-1.5">Contact Us</div>
                          <div className="space-y-1">
                            <div className="h-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
                            <div className="h-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
                            <div className={`h-3 w-10 rounded transition-colors duration-500 ${mockSite.primaryColor === 'orange' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                          </div>
                        </div>
                      )}

                      {/* Testimonials (conditional) */}
                      {mockSite.showTestimonials && (
                        <div className="mb-2">
                          <div className="text-[8px] font-medium text-gray-600 dark:text-gray-300 mb-1.5">Testimonials</div>
                          <div className="grid grid-cols-3 gap-1">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="p-1.5 rounded bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-600 mb-1" />
                                <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded mb-0.5" />
                                <div className="h-1 w-2/3 bg-gray-100 dark:bg-gray-700 rounded" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="h-1 w-12 bg-gray-100 dark:bg-gray-700 rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <div 
                  className="absolute -bottom-4 -right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 shadow-xl flex flex-col items-center justify-center animate-float text-white"
                  style={{ animationDelay: '1s' }}
                >
                  <div className="text-lg font-bold">Draft</div>
                  <div className="text-[10px] text-white/70">1-2 weeks</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="process" className="py-16 lg:py-24 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-xl mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-3">
                The process is{' '}
                <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">simple</span>
              </h2>
              <p className="text-base text-gray-500 dark:text-white/40">
                No back-and-forth revisions. No waiting weeks. Just results.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <div 
                  key={i}
                  className="group p-8 rounded-2xl bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-lg transition-all duration-300"
                >
                  <div className="text-5xl font-bold text-orange-500/20 dark:text-white/5 group-hover:text-orange-500/40 dark:group-hover:text-orange-500/20 transition-colors mb-4">
                    {feature.num}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 lg:py-24 relative">
          {/* Gradient accent */}
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/5 dark:bg-white/5 backdrop-blur-sm border border-gray-900/10 dark:border-white/10 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs tracking-wide text-gray-600 dark:text-white/50">Beta pricing — Lock it in forever</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                Transparent pricing,
                <br />
                <span className="text-gray-400 dark:text-white/30">exceptional value</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Setup */}
              <div className="p-8 lg:p-10 rounded-2xl bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 hover:shadow-lg transition-all group">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-semibold mb-1">Setup</h3>
                    <p className="text-sm text-gray-400 dark:text-white/30">One-time fee</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-2">
                      <span className="text-gray-300 dark:text-white/20 line-through text-lg">€199</span>
                      <span className="text-4xl font-bold">€99.50</span>
                    </div>
                  </div>
                </div>
                <ul className="space-y-4">
                  {['30-minute discovery call', 'Custom design & development', 'Domain configuration', '2 professional email addresses', 'First draft in 1-2 weeks', 'Then customize with AI editor'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-500 dark:text-white/50">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Monthly */}
              <div className="p-8 lg:p-10 rounded-2xl bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 hover:shadow-lg transition-all group">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-semibold mb-1">Monthly</h3>
                    <p className="text-sm text-gray-400 dark:text-white/30">First month free</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-2">
                      <span className="text-gray-300 dark:text-white/20 line-through text-lg">€19</span>
                      <span className="text-4xl font-bold">€9.50</span>
                      <span className="text-gray-400 dark:text-white/30">/mo</span>
                    </div>
                  </div>
                </div>
                <ul className="space-y-4">
                  {['Fast, secure hosting', 'SSL certificate included', 'Your 2 email addresses', 'AI Editor—unlimited changes', '1GB image storage', 'Cancel anytime'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-500 dark:text-white/50">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl px-10 h-14 text-base font-semibold shadow-lg transition-all hover:scale-[1.02]">
                  Book Your Call
                </Button>
              </a>
              <p className="text-sm text-gray-400 dark:text-white/20 mt-4">No credit card required</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4 lg:sticky lg:top-32">
                  Common
                  <br />
                  <span className="text-gray-400 dark:text-white/30">questions</span>
                </h2>
              </div>
              
              <div className="space-y-6">
                {[
                  { q: 'What happens on the discovery call?', a: 'We talk about your business, your customers, and what you want your website to do. Takes about 30 minutes. Come with ideas—or just questions.' },
                  { q: 'How long until my site is ready?', a: '1-2 weeks for your first draft. We send it for your review, then you can customize it yourself using the AI editor—change text, images, colors, add pages, anything you want.' },
                  { q: 'Can I make changes after you build it?', a: 'Yes—that\'s the whole point. The AI Editor lets you change text, images, colors, add pages, forms, anything. Just describe what you want.' },
                  { q: 'What if I need help?', a: 'Email us. We respond within 24 hours. If something breaks, we fix it. If you\'re stuck, we help.' },
                  { q: 'What happens after the beta?', a: 'Prices go to €199 setup and €19/month. If you sign up during beta, you keep the beta price forever.' },
                ].map((faq, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 hover:shadow-lg transition-all">
                    <h3 className="text-lg font-semibold mb-3">{faq.q}</h3>
                    <p className="text-gray-500 dark:text-white/40 leading-relaxed text-sm">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 lg:py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center relative">
            <h2 className="text-3xl lg:text-5xl font-bold leading-tight mb-6">
              Ready to get
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">started?</span>
            </h2>
            <p className="text-lg text-gray-500 dark:text-white/40 mb-10 max-w-md mx-auto">
              Book a free 30-minute call. No sales pitch. Just a conversation about your website.
            </p>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              <Button className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl px-10 h-14 text-base font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:scale-[1.02]">
                Book Free Discovery Call
              </Button>
            </a>
            <p className="text-sm text-gray-400 dark:text-white/20 mt-4">No credit card required</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-gray-200 dark:border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="text-sm text-gray-400 dark:text-white/30">© 2025 Flowstarter</span>
              </div>
              <div className="flex items-center gap-6">
                <a href="mailto:hello@flowstarter.app" className="text-sm text-gray-400 dark:text-white/30 hover:text-gray-900 dark:hover:text-white transition-colors">
                  hello@flowstarter.app
                </a>
                <Link href="/login" className="text-sm text-gray-400 dark:text-white/30 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Client Login
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
