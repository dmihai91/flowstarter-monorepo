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
  const [hasInteracted, setHasInteracted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mock site state for live preview
  const [mockSite, setMockSite] = useState({
    hasContactForm: false,
    hasTestimonials: false,
    hasPricingSection: false,
    primaryColor: 'violet',
    hasAboutPage: false,
    headerStyle: 'default',
  });

  const aiResponses: Record<string, { text: string; action?: () => void }> = {
    'contact': { 
      text: "Done. Contact form added below hero.", 
      action: () => setMockSite(s => ({ ...s, hasContactForm: true }))
    },
    'form': { 
      text: "Done. Contact form added below hero.", 
      action: () => setMockSite(s => ({ ...s, hasContactForm: true }))
    },
    'color': { 
      text: "Updated. Primary color changed across the site.", 
      action: () => setMockSite(s => ({ ...s, primaryColor: s.primaryColor === 'violet' ? 'emerald' : 'violet' }))
    },
    'testimonial': { 
      text: "Done! Added testimonials with star ratings.", 
      action: () => setMockSite(s => ({ ...s, hasTestimonials: true }))
    },
    'review': { 
      text: "Done! Added testimonials with star ratings.", 
      action: () => setMockSite(s => ({ ...s, hasTestimonials: true }))
    },
    'pricing': { 
      text: "Pricing section added with 2 plans.", 
      action: () => setMockSite(s => ({ ...s, hasPricingSection: true }))
    },
    'plan': { 
      text: "Pricing section added with 2 plans.", 
      action: () => setMockSite(s => ({ ...s, hasPricingSection: true }))
    },
    'about': { 
      text: "About page created and linked in nav.", 
      action: () => setMockSite(s => ({ ...s, hasAboutPage: true }))
    },
    'page': { 
      text: "New page created and linked in nav.", 
      action: () => setMockSite(s => ({ ...s, hasAboutPage: true }))
    },
    'header': {
      text: "Header updated with new style.",
      action: () => setMockSite(s => ({ ...s, headerStyle: s.headerStyle === 'default' ? 'minimal' : 'default' }))
    },
    'default': { text: "Changes applied. Check the preview!" }
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
    setHasInteracted(true);
    setMessages(prev => [...prev, { role: 'user', text: message }]);
    setInputValue('');
    setIsTyping(true);
    
    const response = getAiResponse(message);
    
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'ai', text: response.text }]);
      // Trigger the site update after AI responds
      if (response.action) {
        setTimeout(() => response.action!(), 200);
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
      { role: 'ai', text: 'Done! Added testimonials with star ratings.' }
    ]);
    // Show testimonials in preview after initial message
    setTimeout(() => setMockSite(s => ({ ...s, hasTestimonials: true })), 500);

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
    // Only auto-scroll after user has interacted (not on initial load)
    if (hasInteracted) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, hasInteracted]);

  const mouseParallax = (factor: number) => ({
    transform: `translate(${(mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * factor}px, ${(mousePos.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * factor}px)`
  });

  const features = [
    { num: '01', title: 'We talk', desc: 'Book a free 30-minute discovery call. We learn about your business, your brand, and what you need. You talk, we listen.' },
    { num: '02', title: 'We build', desc: 'Our AI engine generates your site from premium templates, tailored to your brand. We set up your domain, email, and hosting. You review, we refine.' },
    { num: '03', title: 'You own it', desc: 'Your site goes live. From here, use the AI editor to update content, add pages, and tweak your design — anytime, no code needed.' },
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
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-morph { animation: morph 8s ease-in-out infinite; }
        .animate-shimmer { 
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
        
        /* Flow field animations */
        @keyframes flow-drift-1 {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(15px) translateY(-10px); }
          50% { transform: translateX(5px) translateY(15px); }
          75% { transform: translateX(-10px) translateY(5px); }
        }
        @keyframes flow-drift-2 {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(-12px) translateY(8px); }
          50% { transform: translateX(8px) translateY(-12px); }
          75% { transform: translateX(15px) translateY(10px); }
        }
        @keyframes flow-drift-3 {
          0%, 100% { transform: translateX(0) translateY(0); }
          33% { transform: translateX(10px) translateY(15px); }
          66% { transform: translateX(-15px) translateY(-5px); }
        }
        .flow-line-1 { animation: flow-drift-1 25s ease-in-out infinite; will-change: transform; }
        .flow-line-2 { animation: flow-drift-2 30s ease-in-out infinite; will-change: transform; }
        .flow-line-3 { animation: flow-drift-3 22s ease-in-out infinite; will-change: transform; }
      `}</style>

      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0c] text-gray-900 dark:text-white font-display relative overflow-hidden transition-colors duration-300">
        {/* Flow Field Background - Hero Section */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ height: '100vh' }}>
          <svg 
            className="absolute inset-0 w-full h-full opacity-[0.10] dark:opacity-[0.15]"
            viewBox="0 0 1200 800" 
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <linearGradient id="flowGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <linearGradient id="flowGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            {/* Flow lines group 1 - horizontal drift */}
            <g className="flow-line-1" stroke="url(#flowGradient1)" strokeWidth="1.8">
              <path d="M-100,80 Q200,60 400,100 T800,80 T1300,120" />
              <path d="M-100,140 Q150,160 350,120 T750,160 T1300,140" />
              <path d="M-100,200 Q250,180 450,220 T850,190 T1300,230" />
              <path d="M-100,260 Q180,280 380,240 T780,280 T1300,260" />
              <path d="M-100,320 Q220,300 420,340 T820,310 T1300,350" />
              <path d="M-100,380 Q200,400 400,360 T800,400 T1300,380" />
            </g>
            {/* Flow lines group 2 - diagonal drift */}
            <g className="flow-line-2" stroke="url(#flowGradient2)" strokeWidth="1.4">
              <path d="M-50,440 Q300,420 500,460 T900,430 T1350,470" />
              <path d="M-50,500 Q250,520 450,480 T850,520 T1350,490" />
              <path d="M-50,560 Q350,540 550,580 T950,550 T1350,590" />
              <path d="M-50,620 Q280,640 480,600 T880,640 T1350,620" />
              <path d="M-50,680 Q320,660 520,700 T920,670 T1350,710" />
              <path d="M-50,740 Q280,760 480,720 T880,760 T1350,740" />
            </g>
            {/* Flow lines group 3 - subtle curves */}
            <g className="flow-line-3" stroke="url(#flowGradient1)" strokeWidth="1">
              <path d="M0,50 Q400,30 600,70 T1000,40 T1200,80" />
              <path d="M0,110 Q350,130 550,90 T950,130 T1200,110" />
              <path d="M0,780 Q400,760 600,800 T1000,770 T1200,810" />
            </g>
          </svg>
        </div>

        {/* Header */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'} ${scrolled || mobileMenuOpen ? 'bg-white/95 dark:bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 shadow-sm' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/30 transition-shadow">
                  <span className="text-white font-bold text-base sm:text-lg">F</span>
                </div>
                <span className="text-lg sm:text-xl font-semibold tracking-tight">Flowstarter</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-8">
                <a href="#process" onClick={(e) => { e.preventDefault(); document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">Process</a>
                <a href="#pricing" onClick={(e) => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">Pricing</a>
                <a href="#faq" onClick={(e) => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">FAQ</a>
              </nav>

              <div className="flex items-center gap-2 sm:gap-4">
                <ThemeToggle />
                <Link href="/login" className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors hidden md:block">
                  Sign In
                </Link>
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="hidden sm:block">
                  <Button className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 dark:hover:from-gray-100 dark:hover:via-white dark:hover:to-gray-100 rounded-xl px-6 h-10 text-sm font-semibold shadow-lg hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300">
                    Book a Call
                  </Button>
                </a>
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <svg className="w-5 h-5 text-gray-600 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile menu dropdown */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-64 pb-4' : 'max-h-0'}`}>
              <nav className="flex flex-col gap-1 pt-3 mt-2 border-t border-gray-200/50 dark:border-white/10 bg-white/95 dark:bg-[#0a0a0c]/95 backdrop-blur-xl -mx-4 px-4 sm:-mx-6 sm:px-6">
                <a href="#process" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' }); }} className="px-3 py-2 text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer">Process</a>
                <a href="#pricing" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }} className="px-3 py-2 text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer">Pricing</a>
                <a href="#faq" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }} className="px-3 py-2 text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer">FAQ</a>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">Sign In</Link>
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="mt-2">
                  <Button className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 rounded-xl h-10 text-sm font-semibold shadow-lg transition-all duration-300">
                    Book a Call
                  </Button>
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative pt-20 lg:pt-24 pb-12 lg:pb-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Copy */}
              <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/5 dark:bg-white/5 backdrop-blur-sm border border-gray-900/10 dark:border-white/10 mb-8">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs tracking-wide text-gray-600 dark:text-white/60">Beta — 50% off all pricing</span>
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
                  Digital presence
                  <br />
                  <span className="bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                    done for you
                  </span>
                </h1>
                
                <p className="text-lg lg:text-xl text-gray-500 dark:text-white/50 leading-relaxed max-w-lg mb-3">
                  Your professional website, built by us in 1–2 weeks — then yours to customize forever with AI. No code, no stress.
                </p>
                <p className="text-sm text-gray-400 dark:text-white/30 mb-10">
                  For freelancers, small businesses, and creators.
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
                  <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                    <Button className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 dark:hover:from-gray-100 dark:hover:via-white dark:hover:to-gray-100 rounded-xl px-8 h-14 text-base font-semibold shadow-lg hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 hover:scale-[1.02] group">
                      <span className="absolute inset-0 animate-shimmer" />
                      Book Free Discovery Call
                      <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Button>
                  </a>
                  <div className="flex flex-col">
                    <div className="text-sm text-gray-400 dark:text-white/40">
                      <span className="line-through opacity-60">€199</span>
                      <span className="mx-2 text-gray-700 dark:text-white/80 font-medium">€99.50</span>
                      setup
                      <span className="mx-3 text-gray-300 dark:text-white/20">·</span>
                      <span className="line-through opacity-60">€19</span>
                      <span className="mx-2 text-gray-700 dark:text-white/80 font-medium">€9.50</span>
                      /mo
                    </div>
                    <div className="text-xs text-gray-400 dark:text-white/30 mt-1">
                      Hosting, email, and AI customization included. First month free.
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center lg:justify-start gap-8 sm:gap-16 pt-6 border-t border-gray-200 dark:border-white/10">
                  {[
                    { value: '1-2', label: 'Weeks' },
                    { value: '∞', label: 'AI edits' },
                    { value: '0', label: 'Code' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">{stat.value}</div>
                      <div className="text-[10px] sm:text-xs text-gray-400 dark:text-white/30 uppercase tracking-wider mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Interactive Editor */}
              <div className={`relative transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Glow effect behind editor */}
                <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-cyan-400/20 rounded-3xl blur-2xl animate-pulse-glow" />
                
                {/* Editor window */}
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
                      yoursite.com
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">LIVE</span>
                    </div>
                  </div>

                  {/* Split: Chat + Preview */}
                  <div className="flex flex-col sm:flex-row sm:divide-x divide-gray-200/30 dark:divide-white/5 min-h-[280px] sm:min-h-[320px]">
                    {/* Chat Panel */}
                    <div className="w-full sm:w-1/2 p-3 sm:p-4 flex flex-col border-b sm:border-b-0 border-gray-200/30 dark:border-white/5">
                      <div className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-white/20 font-medium mb-2 sm:mb-3">AI Editor</div>
                      
                      {/* Messages - grows to fill space */}
                      <div className="flex-1 space-y-2.5 sm:space-y-3 overflow-y-auto mb-2 sm:mb-3 pr-1 max-h-[100px] sm:max-h-none">
                      {messages.map((msg, i) => (
                        msg.role === 'user' ? (
                          <div key={i} className="flex justify-end">
                            <div className="max-w-[95%] px-3 py-2 rounded-xl rounded-tr-sm bg-gradient-to-r from-violet-500 to-blue-500 text-white text-[13px] shadow-sm">
                              {msg.text}
                            </div>
                          </div>
                        ) : (
                          <div key={i} className="flex gap-2">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                              </svg>
                            </div>
                            <div className="flex-1 px-3 py-2 rounded-xl rounded-tl-sm bg-white/60 dark:bg-white/[0.05] border border-white/50 dark:border-white/10 text-[13px] text-gray-600 dark:text-white/70">
                              {msg.text}
                            </div>
                          </div>
                        )
                      ))}
                      {isTyping && (
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                          </div>
                          <div className="px-3 py-2 rounded-xl rounded-tl-sm bg-white/60 dark:bg-white/[0.05] border border-white/50 dark:border-white/10">
                            <div className="flex gap-1.5">
                              <span className="w-2 h-2 bg-gray-400 dark:bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-gray-400 dark:bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-gray-400 dark:bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                      </div>

                      {/* Input area - stays at bottom */}
                      <div className="mt-auto">
                        {/* Input */}
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/50 dark:bg-white/[0.03] border border-white/60 dark:border-white/10">
                          <input 
                            type="text" 
                            placeholder="Try: Add form..." 
                            className="flex-1 bg-transparent text-[13px] outline-none px-2 placeholder:text-gray-400 dark:placeholder:text-white/20 text-gray-900 dark:text-white"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                          />
                          <button 
                            onClick={() => handleSend()}
                            disabled={!inputValue.trim() || isTyping}
                            className="w-8 h-8 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 text-white flex items-center justify-center disabled:opacity-30 transition-all hover:shadow-lg"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        {/* Quick prompts */}
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {['Add pricing', 'Contact form', 'Change colors'].map((prompt) => (
                            <button
                              key={prompt}
                              onClick={() => handleSend(prompt)}
                              disabled={isTyping}
                              className="px-3 py-1.5 text-[11px] rounded-full bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-gray-200/50 dark:border-white/10 text-gray-500 dark:text-white/50 transition-all disabled:opacity-50"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Mock Site Preview */}
                    <div className="w-full sm:w-1/2 bg-white dark:bg-[#0f0f12] min-h-[200px] sm:min-h-[260px] overflow-hidden">
                      {/* Realistic site header */}
                      <div className={`flex items-center justify-between px-4 py-2.5 border-b transition-all duration-500 ${mockSite.headerStyle === 'minimal' ? 'bg-transparent border-transparent' : 'bg-gray-50/80 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold text-white transition-colors duration-500 ${mockSite.primaryColor === 'violet' ? 'bg-violet-500' : 'bg-emerald-500'}`}>
                            C
                          </div>
                          <span className="text-xs font-semibold text-gray-800 dark:text-white">CoffeeRoast</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                          <span className="hover:text-gray-900 dark:hover:text-white cursor-default">Home</span>
                          {mockSite.hasAboutPage && (
                            <span className={`font-medium transition-all duration-500 ${mockSite.primaryColor === 'violet' ? 'text-violet-500' : 'text-emerald-500'}`}>About</span>
                          )}
                          <span>Shop</span>
                          <span>Contact</span>
                        </div>
                      </div>

                      {/* Hero section with image placeholder */}
                      <div className="px-4 py-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <div className="h-2.5 w-24 bg-gray-800 dark:bg-white rounded mb-1.5" />
                            <div className={`h-3 w-20 rounded mb-2 transition-colors duration-500 ${mockSite.primaryColor === 'violet' ? 'bg-violet-500' : 'bg-emerald-500'}`} />
                            <div className="h-1.5 w-28 bg-gray-300 dark:bg-gray-600 rounded mb-1" />
                            <div className="h-1.5 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-3" />
                            <div className={`h-5 w-16 rounded-full text-[9px] text-white flex items-center justify-center transition-colors duration-500 ${mockSite.primaryColor === 'violet' ? 'bg-violet-500' : 'bg-emerald-500'}`}>
                              Shop Now
                            </div>
                          </div>
                          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-700 dark:to-amber-900 flex items-center justify-center">
                            <span className="text-2xl">☕</span>
                          </div>
                        </div>
                      </div>

                      {/* Contact form - animated in */}
                      <div className={`overflow-hidden transition-all duration-500 ${mockSite.hasContactForm ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/30">
                          <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">Get in Touch</div>
                          <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                            <div className="h-5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 px-2 flex items-center">
                              <span className="text-[9px] text-gray-400">Name</span>
                            </div>
                            <div className="h-5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 px-2 flex items-center">
                              <span className="text-[9px] text-gray-400">Email</span>
                            </div>
                          </div>
                          <div className="h-7 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 mb-2 px-2 flex items-start pt-1">
                            <span className="text-[9px] text-gray-400">Message...</span>
                          </div>
                          <div className={`h-5 w-14 rounded text-[9px] text-white flex items-center justify-center transition-colors duration-500 ${mockSite.primaryColor === 'violet' ? 'bg-violet-500' : 'bg-emerald-500'}`}>
                            Send
                          </div>
                        </div>
                      </div>

                      {/* Products/Features section */}
                      <div className="px-4 py-3">
                        <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">Our Blends</div>
                        <div className="grid grid-cols-3 gap-2">
                          {['☕', '🫘', '✨'].map((emoji, i) => (
                            <div key={i} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-center">
                              <div className="text-base mb-1">{emoji}</div>
                              <div className="h-1.5 w-10 mx-auto bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                              <div className={`h-1.5 w-6 mx-auto rounded transition-colors duration-500 ${mockSite.primaryColor === 'violet' ? 'bg-violet-400' : 'bg-emerald-400'}`} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Testimonials - animated in */}
                      <div className={`overflow-hidden transition-all duration-500 ${mockSite.hasTestimonials ? 'max-h-28 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-4 py-3">
                          <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">What Customers Say</div>
                          <div className="flex gap-2">
                            {[1, 2].map((i) => (
                              <div key={i} className="flex-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
                                  <div className="h-1.5 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
                                </div>
                                <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded mb-1" />
                                <div className="h-1 w-4/5 bg-gray-100 dark:bg-gray-700 rounded" />
                                <div className="flex gap-0.5 mt-1.5">
                                  {[1,2,3,4,5].map(s => (
                                    <span key={s} className={`text-[8px] ${mockSite.primaryColor === 'violet' ? 'text-violet-400' : 'text-emerald-400'}`}>★</span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Pricing section - animated in */}
                      <div className={`overflow-hidden transition-all duration-500 ${mockSite.hasPricingSection ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/30">
                          <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">Pricing</div>
                          <div className="flex gap-2">
                            <div className="flex-1 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                              <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400">Basic</div>
                              <div className={`text-sm font-bold transition-colors duration-500 ${mockSite.primaryColor === 'violet' ? 'text-violet-600' : 'text-emerald-600'}`}>$9/mo</div>
                              <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded mt-1.5 mb-1" />
                              <div className="h-1 w-3/4 bg-gray-100 dark:bg-gray-700 rounded" />
                            </div>
                            <div className={`flex-1 p-2 rounded-lg border-2 transition-colors duration-500 ${mockSite.primaryColor === 'violet' ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'}`}>
                              <div className="flex items-center gap-1">
                                <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400">Pro</div>
                                <div className={`text-[7px] px-1 py-0.5 rounded-full text-white transition-colors duration-500 ${mockSite.primaryColor === 'violet' ? 'bg-violet-500' : 'bg-emerald-500'}`}>POPULAR</div>
                              </div>
                              <div className={`text-sm font-bold transition-colors duration-500 ${mockSite.primaryColor === 'violet' ? 'text-violet-600' : 'text-emerald-600'}`}>$29/mo</div>
                              <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded mt-1.5 mb-1" />
                              <div className="h-1 w-3/4 bg-gray-100 dark:bg-gray-700 rounded" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="text-[9px] text-gray-400">© 2025 CoffeeRoast</div>
                          <div className="flex gap-2">
                            {['📘', '📷', '✉️'].map((icon, i) => (
                              <span key={i} className="text-xs opacity-50">{icon}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements - hidden on small mobile */}
                <div 
                  className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-xl hidden xs:flex flex-col items-center justify-center animate-float text-white"
                  style={{ animationDelay: '1s' }}
                >
                  <div className="text-base sm:text-lg lg:text-2xl font-bold">Draft</div>
                  <div className="text-[8px] sm:text-[10px] lg:text-xs text-white/70">1-2 weeks</div>
                </div>
                
                <div 
                  className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 lg:-top-6 lg:-left-6 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-lg sm:rounded-xl lg:rounded-2xl bg-white/60 dark:bg-white/[0.08] backdrop-blur-xl border border-white/50 dark:border-white/10 hidden xs:flex items-center justify-center animate-float shadow-xl"
                  style={{ animationDelay: '0s' }}
                >
                  <div className="text-base sm:text-lg lg:text-2xl font-bold bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">98</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="process" className="py-12 lg:py-16 relative overflow-hidden bg-gradient-to-b from-white via-[#F8F9FB] to-[#F1F3F7] dark:from-transparent dark:via-white/[0.01] dark:to-white/[0.02]">
          {/* Flow Field Background - Process Section (different direction) */}
          <div className="absolute inset-0 pointer-events-none">
            <svg 
              className="absolute inset-0 w-full h-full opacity-[0.08] dark:opacity-[0.12]"
              viewBox="0 0 1200 600" 
              preserveAspectRatio="xMidYMid slice"
              fill="none"
            >
              <defs>
                <linearGradient id="flowGradientV1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
                <linearGradient id="flowGradientV2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              {/* Vertical-ish flow lines */}
              <g className="flow-line-2" stroke="url(#flowGradientV1)" strokeWidth="1.5">
                <path d="M100,-50 Q80,150 120,300 T100,500 T140,700" />
                <path d="M250,-50 Q270,100 230,250 T270,450 T230,700" />
                <path d="M400,-50 Q380,180 420,330 T380,530 T420,700" />
                <path d="M550,-50 Q570,120 530,270 T570,470 T530,700" />
                <path d="M700,-50 Q680,160 720,310 T680,510 T720,700" />
                <path d="M850,-50 Q870,140 830,290 T870,490 T830,700" />
                <path d="M1000,-50 Q980,180 1020,330 T980,530 T1020,700" />
                <path d="M1150,-50 Q1170,120 1130,270 T1170,470 T1130,700" />
              </g>
              {/* Cross-flow curves */}
              <g className="flow-line-3" stroke="url(#flowGradientV2)" strokeWidth="1">
                <path d="M-50,150 Q400,130 600,170 T1000,140 T1300,180" />
                <path d="M-50,300 Q350,320 550,280 T950,320 T1300,300" />
                <path d="M-50,450 Q400,430 600,470 T1000,440 T1300,480" />
              </g>
            </svg>
          </div>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="max-w-xl mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-3">
                Three steps to your{' '}
                <span className="bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">new website</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {features.map((feature, i) => (
                <div 
                  key={i}
                  className="group p-7 rounded-2xl bg-white/80 dark:bg-white/[0.02] backdrop-blur-sm border border-gray-200/80 dark:border-white/5 hover:border-violet-500/40 dark:hover:border-violet-500/30 hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="text-5xl font-bold text-violet-500/20 dark:text-white/5 group-hover:text-violet-500/50 dark:group-hover:text-violet-500/30 transition-colors mb-4">
                    {feature.num}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section className="py-10 lg:py-14 bg-white dark:bg-transparent">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                Everything you need.{' '}
                <span className="bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">Nothing you don't.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Setup */}
              <div className="group p-7 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/5 hover:border-violet-500/30 dark:hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300">
                <h3 className="text-xl font-semibold mb-4">Setup <span className="text-sm font-normal text-gray-400 dark:text-white/30">(one-time)</span></h3>
                <ul className="space-y-2.5">
                  {[
                    'Personal discovery call with our team',
                    'AI-generated website from premium templates',
                    'Domain setup and configuration',
                    'Professional email (2 mailboxes)',
                    'Hosting on a global CDN — fast, secure, SSL included',
                    'Your site, live and ready'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-white/50">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Monthly subscription */}
              <div className="group p-7 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/5 hover:border-violet-500/30 dark:hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300">
                <h3 className="text-xl font-semibold mb-4">Monthly subscription</h3>
                <ul className="space-y-2.5">
                  {[
                    'Website hosting (global CDN, automatic SSL)',
                    'Professional email (2 mailboxes)',
                    '1 GB cloud storage for your files and assets',
                    'Unlimited AI-powered edits — content, pages, branding, SEO',
                    'Platform updates and improvements'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-white/50">
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
        </section>

        {/* Social Proof / Trust Section - Placeholder for beta */}
        <section className="py-6 lg:py-8">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center p-8 lg:p-12 rounded-2xl bg-gradient-to-r from-violet-500/5 via-blue-500/5 to-cyan-500/5 border border-violet-500/10 dark:border-violet-500/20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-sm font-medium mb-4">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                Early Access
              </div>
              <p className="text-lg text-gray-600 dark:text-white/60 max-w-xl mx-auto">
                Launching beta — early adopters get <span className="font-semibold text-violet-600 dark:text-violet-400">50% off all pricing</span> until v1.0 launches.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-10 lg:py-14 relative">
          {/* Gradient accent - lavender tint */}
          <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.03] via-violet-500/[0.05] to-violet-500/[0.02] dark:from-violet-500/[0.02] dark:via-violet-500/[0.04] dark:to-transparent pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                Simple pricing.{' '}
                <span className="bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">No surprises.</span>
              </h2>
            </div>

            <div className="max-w-lg mx-auto">
              {/* Starter Plan Card - Premium Treatment */}
              <div className="group p-8 lg:p-10 rounded-2xl bg-gradient-to-br from-white via-white to-violet-50/50 dark:from-[#0f0f12] dark:via-[#0f0f12] dark:to-[#12101a] backdrop-blur-sm border-2 border-violet-500/30 dark:border-violet-500/40 shadow-xl shadow-violet-500/10 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/20">
                {/* Beta badge */}
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 text-xs font-medium bg-violet-500 text-white rounded-full">50% off during beta</span>
                </div>
                
                <h3 className="text-2xl font-bold mb-6">Starter Plan</h3>
                
                {/* Pricing */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-white/10">
                  <div className="mb-2">
                    <span className="text-sm text-gray-400 dark:text-white/40">Setup: </span>
                    <span className="text-gray-300 dark:text-white/20 line-through">€199</span>
                    <span className="text-2xl font-bold ml-2">€99.50</span>
                    <span className="text-sm text-gray-400 dark:text-white/40 ml-1">one-time</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400 dark:text-white/40">Monthly: </span>
                    <span className="text-gray-300 dark:text-white/20 line-through">€19</span>
                    <span className="text-2xl font-bold ml-2">€9.50</span>
                    <span className="text-sm text-gray-400 dark:text-white/40 ml-1">/month</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-white/30 mt-2">Starts after your free first month</p>
                </div>
                
                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {[
                    'Discovery call + done-for-you site build',
                    'Hosting on global CDN',
                    'Professional email (2 mailboxes)',
                    '1 GB cloud storage',
                    'Unlimited AI customization',
                    'First month free'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-white/60">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                
                {/* CTA */}
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 dark:hover:from-gray-100 dark:hover:via-white dark:hover:to-gray-100 rounded-xl h-14 text-base font-semibold shadow-lg hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 hover:scale-[1.02]">
                    Book Free Discovery Call
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                </a>
              </div>
              
              {/* Fine print */}
              <p className="text-center text-sm text-gray-400 dark:text-white/30 mt-6">
                No lock-in. Cancel anytime. Setup fee is non-refundable.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-10 lg:py-14 bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-transparent dark:via-white/[0.01] dark:to-transparent">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-4 lg:sticky lg:top-32">
                  Questions?
                  <br />
                  <span className="bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">Answered.</span>
                </h2>
              </div>
              
              <div className="space-y-2">
                {[
                  { q: 'What happens on the discovery call?', a: 'We spend 30–45 minutes learning about your business, your goals, and your brand. You don\'t need to prepare anything — just show up and tell us about what you do. We handle the rest.' },
                  { q: 'How long until my site is live?', a: 'Most sites go live within 1–2 weeks after the discovery call. We\'ll keep you updated throughout the process.' },
                  { q: 'Can I make changes after the site is built?', a: 'That\'s the whole point. Your subscription includes our AI editor — update text, add pages, change your branding, improve your SEO. All without writing a single line of code.' },
                  { q: 'What if I want to cancel?', a: 'No lock-in. Cancel your subscription anytime. The setup fee is non-refundable since it covers real work (your discovery call and site build), but you keep all your site files.' },
                  { q: 'Do I need any technical skills?', a: 'Zero. We handle the technical setup. The AI editor is built for people who\'ve never touched code.' },
                  { q: 'What happens when the beta ends?', a: 'Pricing moves to the standard rate (€199 setup / €19 per month). You\'ll get 30 days notice before anything changes.' },
                  { q: 'What\'s included in the email?', a: 'Two professional email addresses with your domain (e.g., you@yourbusiness.com).' },
                ].map((faq, i) => (
                  <div 
                    key={i} 
                    className="rounded-2xl bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm border border-gray-200 dark:border-white/5 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="group/faq w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <h3 className="text-base font-semibold pr-4">{faq.q}</h3>
                      <svg 
                        className={`w-5 h-5 text-gray-400 group-hover/faq:text-violet-500 flex-shrink-0 transition-all duration-200 ${openFaq === i ? 'rotate-180 text-violet-500' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-48 pb-5' : 'max-h-0'}`}>
                      <p className="px-6 text-gray-500 dark:text-white/40 leading-relaxed text-sm">{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 lg:py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-violet-500/10 via-violet-500/5 to-transparent pointer-events-none" />
          {/* Flow Field Background - Footer CTA */}
          <div className="absolute inset-0 pointer-events-none">
            <svg 
              className="absolute inset-0 w-full h-full opacity-[0.08] dark:opacity-[0.12]"
              viewBox="0 0 1200 400" 
              preserveAspectRatio="xMidYMid slice"
              fill="none"
            >
              <defs>
                <linearGradient id="flowGradientF" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <g className="flow-line-1" stroke="url(#flowGradientF)" strokeWidth="1.2">
                <path d="M-100,80 Q200,60 400,100 T800,70 T1300,110" />
                <path d="M-100,160 Q250,180 450,140 T850,180 T1300,150" />
                <path d="M-100,240 Q200,220 400,260 T800,230 T1300,270" />
                <path d="M-100,320 Q250,340 450,300 T850,340 T1300,310" />
              </g>
            </svg>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center relative">
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-5">
              Ready to get your
              <br />
              <span className="bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent">business online?</span>
            </h2>
            <p className="text-lg text-gray-500 dark:text-white/40 mb-8 max-w-md mx-auto">
              Book a free discovery call. We'll handle everything from there.
            </p>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              <Button className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 dark:hover:from-gray-100 dark:hover:via-white dark:hover:to-gray-100 rounded-xl px-10 h-14 text-base font-semibold shadow-lg hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 hover:scale-[1.02]">
                Book Free Discovery Call
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
            </a>
            <p className="text-sm text-gray-400 dark:text-white/20 mt-4">€99.50 setup during beta · First month free · No code required</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-gray-200 dark:border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="text-sm text-gray-400 dark:text-white/30">© 2026 Flowstarter</span>
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
