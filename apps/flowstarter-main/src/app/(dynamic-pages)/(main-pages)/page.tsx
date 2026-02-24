'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

const CALENDLY_URL = 'https://calendly.com/flowstarter/discovery';

export default function LandingPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiResponses: Record<string, string> = {
    'contact': "Done. Contact form added below the hero—name, email, message fields. Submissions route to your inbox.",
    'form': "Done. Contact form added below the hero—name, email, message fields. Submissions route to your inbox.",
    'color': "Updated. New primary color applied across buttons, links, and accents. Consistent throughout.",
    'header': "Header refined. White background with subtle shadow on scroll. Logo repositioned for balance.",
    'footer': "Phone number added to footer. Tap-to-call enabled for mobile visitors.",
    'phone': "Phone number added to footer. Tap-to-call enabled for mobile visitors.",
    'page': "New page created and linked in navigation. Ready for your content.",
    'testimonial': "Testimonials section added. Three cards with placeholder text. Want help writing them?",
    'image': "Image replaced and optimized for web. Loading time reduced by 40%.",
    'font': "Typography updated site-wide. Headlines and body text now use the new typeface.",
    'default': "Changes applied. Preview updated on the right. What else?"
  };

  const getAiResponse = (input: string): string => {
    const lower = input.toLowerCase();
    for (const [key, response] of Object.entries(aiResponses)) {
      if (key !== 'default' && lower.includes(key)) return response;
    }
    return aiResponses.default;
  };

  const handleSend = () => {
    if (!inputValue.trim() || isTyping) return;
    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'ai', text: getAiResponse(userMessage) }]);
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
      { role: 'ai', text: 'Testimonials section added. Three cards with placeholder text. Want help writing them?' }
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const features = [
    { title: 'Discovery Call', desc: 'We learn your business, goals, and vision in a focused 30-minute conversation.' },
    { title: 'Custom Design', desc: 'Your site is designed and built from scratch. No templates. No compromises.' },
    { title: 'AI Editor Access', desc: 'Update text, images, and layouts anytime by describing what you want.' },
    { title: 'Live in Days', desc: 'From call to launch in 3-5 business days. Domain, hosting, email—all configured.' },
  ];

  return (
    <>
      {/* Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        
        .font-display { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-body { font-family: 'DM Sans', system-ui, sans-serif; }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-up { animation: fadeUp 0.8s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.7s ease-out forwards; }
        .animate-slide-in { animation: slideIn 0.5s ease-out forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-600 { animation-delay: 600ms; }
        
        .grain::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
        }
      `}</style>

      <div className="min-h-screen bg-[#FDFBF7] text-[#1a1a1a] font-body relative grain">
        {/* Subtle gradient overlay */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-bl from-[#f5ebe0]/50 to-transparent" />
          <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-gradient-to-tr from-[#e8e4de]/30 to-transparent" />
        </div>

        {/* Header */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex items-center justify-between h-20 border-b border-[#1a1a1a]/5">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center transition-transform group-hover:scale-105">
                  <span className="text-[#FDFBF7] font-display text-lg font-semibold">F</span>
                </div>
                <span className="font-display text-xl font-medium tracking-tight">Flowstarter</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-10">
                <a href="#process" className="text-sm tracking-wide text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors">Process</a>
                <a href="#pricing" className="text-sm tracking-wide text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors">Pricing</a>
                <a href="#faq" className="text-sm tracking-wide text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors">FAQ</a>
              </nav>

              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm tracking-wide text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors hidden sm:block">
                  Sign In
                </Link>
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[#1a1a1a] text-[#FDFBF7] hover:bg-[#333] rounded-full px-6 h-10 text-sm font-medium tracking-wide transition-all hover:shadow-lg">
                    Book a Call
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative pt-32 lg:pt-40 pb-20 lg:pb-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left: Copy */}
              <div className={`${isLoaded ? 'animate-fade-up' : 'opacity-0'}`}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a]/5 mb-8">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs tracking-widest uppercase text-[#1a1a1a]/60">Beta — 50% off all pricing</span>
                </div>
                
                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium leading-[1.05] tracking-tight mb-6">
                  Your website,<br />
                  <span className="italic text-[#1a1a1a]/40">finally</span> done right
                </h1>
                
                <p className="text-lg lg:text-xl text-[#1a1a1a]/60 leading-relaxed max-w-lg mb-10">
                  One call. One week. A beautiful website you can update yourself—just by describing what you want.
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-[#1a1a1a] text-[#FDFBF7] hover:bg-[#333] rounded-full px-8 h-14 text-base font-medium tracking-wide transition-all hover:shadow-xl hover:scale-[1.02] group">
                      Book Free Discovery Call
                      <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Button>
                  </a>
                  <div className="text-sm text-[#1a1a1a]/40">
                    <span className="line-through">€199</span>
                    <span className="mx-2 text-[#1a1a1a]/80 font-medium">€99.50</span>
                    setup
                    <span className="mx-2">·</span>
                    <span className="line-through">€19</span>
                    <span className="mx-2 text-[#1a1a1a]/80 font-medium">€9.50</span>
                    /mo
                  </div>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center gap-8 mt-12 pt-12 border-t border-[#1a1a1a]/5">
                  <div>
                    <div className="font-display text-3xl font-semibold">3-5</div>
                    <div className="text-xs tracking-wide text-[#1a1a1a]/40 uppercase">Days to launch</div>
                  </div>
                  <div className="w-px h-10 bg-[#1a1a1a]/10" />
                  <div>
                    <div className="font-display text-3xl font-semibold">∞</div>
                    <div className="text-xs tracking-wide text-[#1a1a1a]/40 uppercase">AI edits included</div>
                  </div>
                  <div className="w-px h-10 bg-[#1a1a1a]/10" />
                  <div>
                    <div className="font-display text-3xl font-semibold">0</div>
                    <div className="text-xs tracking-wide text-[#1a1a1a]/40 uppercase">Code required</div>
                  </div>
                </div>
              </div>

              {/* Right: Interactive Editor */}
              <div className={`relative ${isLoaded ? 'animate-scale-in delay-200' : 'opacity-0'}`}>
                {/* Editor window */}
                <div className="relative bg-white rounded-2xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-[#1a1a1a]/5 overflow-hidden">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-3 px-5 py-4 bg-[#fafaf8] border-b border-[#1a1a1a]/5">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                      <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                      <div className="w-3 h-3 rounded-full bg-[#28ca42]" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#1a1a1a]/5 text-xs text-[#1a1a1a]/40">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        yoursite.com
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-medium text-emerald-600 tracking-wide">LIVE</span>
                    </div>
                  </div>

                  {/* Chat interface */}
                  <div className="p-6">
                    <div className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]/30 font-medium mb-4">AI Editor</div>
                    
                    {/* Messages */}
                    <div className="space-y-4 max-h-[200px] overflow-y-auto mb-6 pr-2">
                      {messages.map((msg, i) => (
                        msg.role === 'user' ? (
                          <div key={i} className="flex justify-end animate-slide-in" style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm bg-[#1a1a1a] text-white text-sm">
                              {msg.text}
                            </div>
                          </div>
                        ) : (
                          <div key={i} className="flex gap-3 animate-slide-in" style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e8e4de] to-[#d4cfc6] flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-[#1a1a1a]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                              </svg>
                            </div>
                            <div className="flex-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-[#f5f3ef] text-sm text-[#1a1a1a]/80">
                              {msg.text}
                            </div>
                          </div>
                        )
                      ))}
                      {isTyping && (
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e8e4de] to-[#d4cfc6] flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-[#1a1a1a]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                          </div>
                          <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#f5f3ef]">
                            <div className="flex gap-1.5">
                              <span className="w-2 h-2 bg-[#1a1a1a]/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-[#1a1a1a]/20 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-[#1a1a1a]/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-[#fafaf8] border border-[#1a1a1a]/5">
                      <input 
                        type="text" 
                        placeholder="Try: Change the hero background..." 
                        className="flex-1 bg-transparent text-sm outline-none px-3 placeholder:text-[#1a1a1a]/30"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                      <button 
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isTyping}
                        className="w-9 h-9 rounded-lg bg-[#1a1a1a] text-white flex items-center justify-center disabled:opacity-30 transition-all hover:bg-[#333]"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating accent */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-gradient-to-br from-[#f5ebe0] to-[#e8e4de] -z-10" />
                <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full border-2 border-[#1a1a1a]/5 -z-10" />
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="process" className="py-24 lg:py-32 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-xl mb-16">
              <h2 className="font-display text-4xl lg:text-5xl font-medium leading-tight mb-4">
                The process is <span className="italic">simple</span>
              </h2>
              <p className="text-lg text-[#1a1a1a]/50">
                No back-and-forth revisions. No waiting weeks. Just results.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <div 
                  key={i}
                  className="group p-8 rounded-2xl bg-white border border-[#1a1a1a]/5 hover:border-[#1a1a1a]/10 hover:shadow-lg transition-all duration-300"
                >
                  <div className="font-display text-5xl font-light text-[#1a1a1a]/10 mb-4">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="font-display text-xl font-medium mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#1a1a1a]/50 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 lg:py-32 bg-[#1a1a1a] text-[#FDFBF7] relative overflow-hidden">
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
          
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs tracking-widest uppercase text-white/40">Beta pricing — Lock it in forever</span>
              </div>
              <h2 className="font-display text-4xl lg:text-5xl font-medium leading-tight">
                Transparent pricing,<br />
                <span className="text-white/40 italic">exceptional value</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Setup */}
              <div className="p-8 lg:p-10 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h3 className="font-display text-2xl font-medium mb-1">Setup</h3>
                    <p className="text-sm text-white/40">One-time fee</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-2">
                      <span className="text-white/30 line-through text-lg">€199</span>
                      <span className="font-display text-4xl font-semibold">€99.50</span>
                    </div>
                  </div>
                </div>
                <ul className="space-y-4">
                  {['30-minute discovery call', 'Custom design & development', 'Domain configuration', '2 professional email addresses', 'Global hosting setup', 'Live in 3-5 business days'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/60">
                      <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Monthly */}
              <div className="p-8 lg:p-10 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h3 className="font-display text-2xl font-medium mb-1">Monthly</h3>
                    <p className="text-sm text-white/40">First month free</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-2">
                      <span className="text-white/30 line-through text-lg">€19</span>
                      <span className="font-display text-4xl font-semibold">€9.50</span>
                      <span className="text-white/40">/mo</span>
                    </div>
                  </div>
                </div>
                <ul className="space-y-4">
                  {['Fast, secure hosting', 'SSL certificate included', 'Your 2 email addresses', 'AI Editor—unlimited changes', '1GB image storage', 'Cancel anytime'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/60">
                      <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                <Button className="bg-white text-[#1a1a1a] hover:bg-white/90 rounded-full px-10 h-14 text-base font-medium tracking-wide transition-all hover:shadow-xl hover:scale-[1.02]">
                  Book Your Call
                </Button>
              </a>
              <p className="text-sm text-white/30 mt-4">No credit card required. No obligation.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16">
              <div>
                <h2 className="font-display text-4xl lg:text-5xl font-medium leading-tight mb-4 sticky top-32">
                  Questions?<br />
                  <span className="italic text-[#1a1a1a]/40">Answers.</span>
                </h2>
              </div>
              
              <div className="space-y-8">
                {[
                  { q: 'What happens on the discovery call?', a: 'We talk about your business, your customers, and what you want your website to do. Takes about 30 minutes. Come with ideas—or just questions.' },
                  { q: 'How long until my site is ready?', a: '3 to 5 business days after the call. We send you a preview before going live. No surprises.' },
                  { q: 'Can I make changes after you build it?', a: 'Yes—that\'s the whole point. The AI Editor lets you change text, images, colors, add pages, forms, anything. Just describe what you want.' },
                  { q: 'What if I need help?', a: 'Email us. We respond within 24 hours. If something breaks, we fix it. If you\'re stuck, we help.' },
                  { q: 'What happens after the beta?', a: 'Prices go to €199 setup and €19/month. If you sign up during beta, you keep the beta price forever.' },
                ].map((faq, i) => (
                  <div key={i} className="pb-8 border-b border-[#1a1a1a]/5">
                    <h3 className="font-display text-xl font-medium mb-3">{faq.q}</h3>
                    <p className="text-[#1a1a1a]/50 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 lg:py-32 border-t border-[#1a1a1a]/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <h2 className="font-display text-4xl lg:text-6xl font-medium leading-tight mb-6">
              Ready to get<br />
              <span className="italic">started?</span>
            </h2>
            <p className="text-lg text-[#1a1a1a]/50 mb-10 max-w-md mx-auto">
              Book a free 30-minute call. No sales pitch. Just a conversation about your website.
            </p>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              <Button className="bg-[#1a1a1a] text-[#FDFBF7] hover:bg-[#333] rounded-full px-10 h-14 text-base font-medium tracking-wide transition-all hover:shadow-xl hover:scale-[1.02]">
                Book Free Discovery Call
              </Button>
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-[#1a1a1a]/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                  <span className="text-[#FDFBF7] font-display text-sm font-semibold">F</span>
                </div>
                <span className="text-sm text-[#1a1a1a]/40">© 2025 Flowstarter</span>
              </div>
              <div className="flex items-center gap-6">
                <a href="mailto:hello@flowstarter.app" className="text-sm text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors">
                  hello@flowstarter.app
                </a>
                <Link href="/login" className="text-sm text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors">
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
