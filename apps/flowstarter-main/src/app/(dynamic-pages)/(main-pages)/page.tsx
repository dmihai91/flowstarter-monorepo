'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { useI18n } from '@/lib/i18n';
import Footer from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { EXTERNAL_URLS } from '@/lib/constants';
import { PillarsSection } from './components/PillarsSection';
import { ProcessSection } from './components/ProcessSection';
import { IncludedSection } from './components/IncludedSection';
import { TrustSection } from './components/TrustSection';
import { ManifestoSection } from './components/ManifestoSection';
import { FAQSection } from './components/FAQSection';
import { FinalCTASection } from './components/FinalCTASection';


export default function LandingPage() {
  const { t } = useI18n();
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<
    { role: 'user' | 'ai'; text: string }[]
  >([]);
  const [isTyping, setIsTyping] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    new Set()
  );
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
    contact: {
      text: 'Done. Contact form added below hero.',
      action: () => setMockSite((s) => ({ ...s, hasContactForm: true })),
    },
    form: {
      text: 'Done. Contact form added below hero.',
      action: () => setMockSite((s) => ({ ...s, hasContactForm: true })),
    },
    color: {
      text: 'Updated. Primary color changed across the site.',
      action: () =>
        setMockSite((s) => ({
          ...s,
          primaryColor: s.primaryColor === 'violet' ? 'emerald' : 'violet',
        })),
    },
    testimonial: {
      text: 'Done! Added testimonials with star ratings.',
      action: () => setMockSite((s) => ({ ...s, hasTestimonials: true })),
    },
    review: {
      text: 'Done! Added testimonials with star ratings.',
      action: () => setMockSite((s) => ({ ...s, hasTestimonials: true })),
    },
    pricing: {
      text: 'Pricing section added with 2 plans.',
      action: () => setMockSite((s) => ({ ...s, hasPricingSection: true })),
    },
    plan: {
      text: 'Pricing section added with 2 plans.',
      action: () => setMockSite((s) => ({ ...s, hasPricingSection: true })),
    },
    about: {
      text: 'About page created and linked in nav.',
      action: () => setMockSite((s) => ({ ...s, hasAboutPage: true })),
    },
    page: {
      text: 'New page created and linked in nav.',
      action: () => setMockSite((s) => ({ ...s, hasAboutPage: true })),
    },
    header: {
      text: 'Header updated with new style.',
      action: () =>
        setMockSite((s) => ({
          ...s,
          headerStyle: s.headerStyle === 'default' ? 'minimal' : 'default',
        })),
    },
    default: { text: 'Changes applied. Check the preview!' },
  };

  const getAiResponse = (
    input: string
  ): { text: string; action?: () => void } => {
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
    setInputValue('');

    // Check if it's a known command
    const response = getAiResponse(message);
    const isKnownCommand = response !== aiResponses.default;

    if (!isKnownCommand) {
      // For custom/unknown prompts, show a message and redirect to booking
      setMessages((prev) => [...prev, { role: 'user', text: message }]);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: "Great idea! Let's discuss this on a discovery call. Redirecting you to book...",
          },
        ]);
        setTimeout(() => {
          window.open(EXTERNAL_URLS.calendly.discovery, '_blank');
        }, 1500);
      }, 800);
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: 'ai', text: response.text }]);
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

  // Auto-cycle demo prompts - each demo replaces the previous one
  const demoSequence = [
    {
      prompt: 'Add a testimonials section',
      response: 'Done! Added testimonials with star ratings.',
      siteState: {
        hasTestimonials: true,
        hasPricingSection: false,
        primaryColor: 'violet',
        hasContactForm: false,
      },
    },
    {
      prompt: 'Add pricing tables',
      response: 'Pricing section added with 2 plans.',
      siteState: {
        hasTestimonials: true,
        hasPricingSection: true,
        primaryColor: 'violet',
        hasContactForm: false,
      },
    },
    {
      prompt: 'Change the color scheme',
      response: 'Updated. Primary color changed across the site.',
      siteState: {
        hasTestimonials: true,
        hasPricingSection: true,
        primaryColor: 'emerald',
        hasContactForm: false,
      },
    },
    {
      prompt: 'Add a contact form',
      response: 'Done. Contact form added below hero.',
      siteState: {
        hasTestimonials: true,
        hasPricingSection: true,
        primaryColor: 'emerald',
        hasContactForm: true,
      },
    },
  ];
  const [demoIndex, setDemoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    // Initial state
    setMessages([
      { role: 'user', text: demoSequence[0].prompt },
      { role: 'ai', text: demoSequence[0].response },
    ]);
    setTimeout(
      () => setMockSite((s) => ({ ...s, ...demoSequence[0].siteState })),
      500
    );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-cycle through demos when user hasn't interacted
  useEffect(() => {
    if (hasInteracted) return; // Stop auto-cycling once user interacts

    let currentIndex = 0; // Start at 0, first advance goes to 1

    function advanceDemo() {
      currentIndex = (currentIndex + 1) % demoSequence.length;
      const demo = demoSequence[currentIndex];

      // If cycling back to start, reset everything
      if (currentIndex === 0) {
        setMessages([]);
        setMockSite({
          hasContactForm: false,
          hasTestimonials: false,
          hasPricingSection: false,
          primaryColor: 'violet',
          hasAboutPage: false,
          headerStyle: 'default',
        });
        // Show first message after brief pause
        setTimeout(() => {
          const firstDemo = demoSequence[0];
          setMessages([{ role: 'user', text: firstDemo.prompt }]);
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            setMessages([
              { role: 'user', text: firstDemo.prompt },
              { role: 'ai', text: firstDemo.response },
            ]);
            setMockSite((s) => ({ ...s, ...firstDemo.siteState }));
          }, 800);
        }, 300);
        return;
      }

      // Add new message to history (accumulate)
      setMessages((prev) => [...prev, { role: 'user', text: demo.prompt }]);
      setIsTyping(true);

      // AI response after typing delay
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, { role: 'ai', text: demo.response }]);
        // Update site state
        setMockSite((s) => ({ ...s, ...demo.siteState }));
      }, 800);
    }

    // First advance after 3 seconds
    const timeoutId = setTimeout(() => {
      advanceDemo();

      // Then continue every 5 seconds
      const intervalId = setInterval(advanceDemo, 5000);

      // Store interval for cleanup
      (window as any).__demoInterval = intervalId;
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
      if ((window as any).__demoInterval) {
        clearInterval((window as any).__demoInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInteracted]);

  useEffect(() => {
    // Only auto-scroll after user has interacted (not on initial load)
    // Use block: 'nearest' to prevent page scroll, only scroll within container
    if (hasInteracted && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, hasInteracted]);

  // Scroll animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section');
            if (sectionId) {
              setVisibleSections((prev) => new Set(prev).add(sectionId));
            }
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px 100px 0px' }
    );

    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => observer.observe(section));

        document.querySelectorAll('[data-section]').forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const mouseParallax = (factor: number) => ({
    transform: `translate(${
      (mousePos.x -
        (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) *
      factor
    }px, ${
      (mousePos.y -
        (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) *
      factor
    }px)`,
  });

  const features = [
    {
      num: t('landing.steps.step1.num'),
      title: t('landing.steps.step1.title'),
      desc: t('landing.steps.step1.desc'),
    },
    {
      num: t('landing.steps.step2.num'),
      title: t('landing.steps.step2.title'),
      desc: t('landing.steps.step2.desc'),
    },
    {
      num: t('landing.steps.step3.num'),
      title: t('landing.steps.step3.title'),
      desc: t('landing.steps.step3.desc'),
    },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

        .font-display {
          font-family: 'Outfit', system-ui, sans-serif;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) rotate(5deg);
          }
        }
        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        @keyframes gradient-shift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(40px) scale(0.92);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .animate-fade-in-up-delay-1 {
          animation-delay: 50ms;
        }
        .animate-fade-in-up-delay-2 {
          animation-delay: 250ms;
        }
        .animate-fade-in-up-delay-3 {
          animation-delay: 450ms;
        }

        @keyframes morph {
          0%,
          100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          50% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-morph {
          animation: morph 8s ease-in-out infinite;
        }
        .animate-shimmer {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-gradient {
          background-size: 300% 300%;
          animation: gradient-flow 6s ease-in-out infinite;
        }
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          25% { background-position: 50% 100%; }
          50% { background-position: 100% 50%; }
          75% { background-position: 50% 0%; }
          100% { background-position: 0% 50%; }
        }
        .text-flow {
          background: linear-gradient(
            90deg,
            #7C3AED 0%,
            #3B82F6 20%,
            #06B6D4 40%,
            #3B82F6 60%,
            #7C3AED 80%,
            #3B82F6 100%
          );
          background-size: 300% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: textFlow 5s linear infinite;
        }
        @keyframes textFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }


        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .hero-fade {
          opacity: 0;
          animation: heroFadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hero-fade-1 { animation-delay: 0.1s; }
        .hero-fade-2 { animation-delay: 0.3s; }
        .hero-fade-3 { animation-delay: 0.5s; }
        .hero-fade-4 { animation-delay: 0.7s; }
        .hero-fade-5 { animation-delay: 0.9s; }

        /* Flow field animations */
        @keyframes flow-drift-1 {
          0%,
          100% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(15px) translateY(-10px);
          }
          50% {
            transform: translateX(5px) translateY(15px);
          }
          75% {
            transform: translateX(-10px) translateY(5px);
          }
        }
        @keyframes flow-drift-2 {
          0%,
          100% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(-12px) translateY(8px);
          }
          50% {
            transform: translateX(8px) translateY(-12px);
          }
          75% {
            transform: translateX(15px) translateY(10px);
          }
        }
        @keyframes flow-drift-3 {
          0%,
          100% {
            transform: translateX(0) translateY(0);
          }
          33% {
            transform: translateX(10px) translateY(15px);
          }
          66% {
            transform: translateX(-15px) translateY(-5px);
          }
        }
        .flow-line-1 {
          animation: flow-drift-1 25s ease-in-out infinite;
          will-change: transform;
        }
        .flow-line-2 {
          animation: flow-drift-2 30s ease-in-out infinite;
          will-change: transform;
        }
        .flow-line-3 {
          animation: flow-drift-3 22s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>

      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0c] text-gray-900 dark:text-white font-display relative overflow-x-hidden transition-colors duration-300">
        {/* Flow Field Background - Hero Section */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ height: '100vh' }}
        >
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.45] dark:opacity-[0.18]"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <linearGradient
                id="flowGradient1"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <linearGradient
                id="flowGradient2"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            {/* Flow lines group 1 - horizontal drift */}
            <g
              className="flow-line-1"
              stroke="url(#flowGradient1)"
              strokeWidth="1.8"
            >
              <path d="M-100,80 Q200,60 400,100 T800,80 T1300,120" />
              <path d="M-100,140 Q150,160 350,120 T750,160 T1300,140" />
              <path d="M-100,200 Q250,180 450,220 T850,190 T1300,230" />
              <path d="M-100,260 Q180,280 380,240 T780,280 T1300,260" />
              <path d="M-100,320 Q220,300 420,340 T820,310 T1300,350" />
              <path d="M-100,380 Q200,400 400,360 T800,400 T1300,380" />
            </g>
            {/* Flow lines group 2 - diagonal drift */}
            <g
              className="flow-line-2"
              stroke="url(#flowGradient2)"
              strokeWidth="1.4"
            >
              <path d="M-50,440 Q300,420 500,460 T900,430 T1350,470" />
              <path d="M-50,500 Q250,520 450,480 T850,520 T1350,490" />
              <path d="M-50,560 Q350,540 550,580 T950,550 T1350,590" />
              <path d="M-50,620 Q280,640 480,600 T880,640 T1350,620" />
              <path d="M-50,680 Q320,660 520,700 T920,670 T1350,710" />
              <path d="M-50,740 Q280,760 480,720 T880,760 T1350,740" />
            </g>
            {/* Flow lines group 3 - subtle curves */}
            <g
              className="flow-line-3"
              stroke="url(#flowGradient1)"
              strokeWidth="1"
            >
              <path d="M0,50 Q400,30 600,70 T1000,40 T1200,80" />
              <path d="M0,110 Q350,130 550,90 T950,130 T1200,110" />
              <path d="M0,780 Q400,760 600,800 T1000,770 T1200,810" />
            </g>
          </svg>
        </div>

        {/* Header */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          } ${
            scrolled || mobileMenuOpen
              ? 'bg-white/80 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-white/50 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.05)]'
              : ''
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
                <Logo size="md" />
              </Link>

              <nav className="hidden md:flex items-center gap-8">
                <a
                  href="#process"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById('process')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Process
                </a>
                <a
                  href="#pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById('pricing')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById('faq')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t('nav.faq')}
                </a>
              </nav>

              <div className="flex items-center gap-2 sm:gap-4">
                <ThemeToggle />
                <Link
                  href="/login"
                  className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors hidden md:block"
                >
                  Sign In
                </Link>
                <a
                  href={EXTERNAL_URLS.calendly.discovery}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:block"
                >
                  <Button className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 hover:from-[#232342] hover:via-[#1e2a4a] hover:to-[#232342] dark:hover:from-gray-100 dark:hover:via-white dark:hover:to-gray-100 rounded-lg px-6 h-10 text-sm font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300">
                    Book Free Call
                  </Button>
                </a>
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <svg
                      className="w-5 h-5 text-gray-600 dark:text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-600 dark:text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile menu dropdown */}
            <div
              className={`md:hidden overflow-hidden transition-all duration-300 ${
                mobileMenuOpen ? 'max-h-64 pb-4' : 'max-h-0'
              }`}
            >
              <nav className="flex flex-col gap-1 pt-3 mt-2 border-t border-gray-200/50 dark:border-white/10 bg-white/95 dark:bg-[#0a0a0c]/95 backdrop-blur-xl -mx-4 px-4 sm:-mx-6 sm:px-6">
                <a
                  href="#process"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    document
                      .getElementById('process')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  Process
                </a>
                <a
                  href="#pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    document
                      .getElementById('pricing')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    document
                      .getElementById('faq')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  {t('nav.faq')}
                </a>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <a
                  href={EXTERNAL_URLS.calendly.discovery}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2"
                >
                  <Button className="w-full bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 hover:from-[#232342] hover:via-[#1e2a4a] hover:to-[#232342] rounded-lg h-10 text-sm font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300">
                    Book Free Call
                  </Button>
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative pt-20 lg:pt-24 pb-12 lg:pb-16 bg-gradient-to-b from-white via-[#F3F0FF] to-white dark:from-[#0a0a0c] dark:via-[#0d0b14] dark:to-[#0a0a0c] overflow-hidden">
          {/* Flow lines INSIDE hero so they appear on top of background */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.10] dark:opacity-[0.06]"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
            >
              <defs>
                <linearGradient
                  id="heroFlowGradient1"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="var(--purple)" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <g stroke="url(#heroFlowGradient1)" strokeWidth="1.5">
                <path d="M-100,80 Q200,60 400,100 T800,80 T1300,120" />
                <path d="M-100,160 Q150,180 350,140 T750,180 T1300,160" />
                <path d="M-100,240 Q250,220 450,260 T850,230 T1300,270" />
                <path d="M-100,320 Q180,340 380,300 T780,340 T1300,320" />
                <path d="M-100,400 Q220,380 420,420 T820,390 T1300,430" />
                <path d="M-100,480 Q200,500 400,460 T800,500 T1300,480" />
                <path d="M-100,560 Q250,540 450,580 T850,550 T1300,590" />
                <path d="M-100,640 Q180,660 380,620 T780,660 T1300,640" />
              </g>
            </svg>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10 overflow-hidden w-full">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-w-0">
              {/* Left: Copy */}
              <div
                className={`transition-all duration-1000 ease-out min-w-0 ${
                  isLoaded
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                }`}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/5 dark:bg-white/5 backdrop-blur-sm border border-gray-900/10 dark:border-white/10 mb-10">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-semibold tracking-wide text-gray-700 dark:text-white/80">
                    {t('landing.hero.badge')}
                  </span>
                </div>

                <h1 className="hero-fade hero-fade-2 text-[2.2rem] sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold leading-[1.15] tracking-tight mb-6 break-words text-center sm:text-left">
                  {t('landing.hero.headline1')}
                  <br />
                  <span className="text-flow">
                    {t('landing.hero.headline2')}
                  </span>
                </h1>

                <p className="hero-fade hero-fade-3 text-base lg:text-xl text-gray-500 dark:text-white/50 leading-relaxed mb-5 text-center sm:text-left">
                  {t('landing.hero.pain')}
                </p>
                <p className="hero-fade hero-fade-4 text-base text-gray-400 dark:text-white/40 leading-relaxed mb-8 text-center sm:text-left">
                  {t('landing.hero.subheadline')}
                </p>

                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-y-6 gap-x-4">
                    {/* Left: button + note stacked tightly */}
                    <div className="flex flex-col items-center sm:items-start gap-1.5 pt-2 sm:pt-0 sm:-mt-3">
                      <a
                        href={EXTERNAL_URLS.calendly.discovery}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="relative bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 hover:from-[#232342] hover:via-[#1e2a4a] hover:to-[#232342] dark:hover:from-gray-100 dark:hover:via-white dark:hover:to-gray-100 rounded-lg px-5 sm:px-6 lg:px-8 h-11 sm:h-12 lg:h-14 text-sm sm:text-sm lg:text-base font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300 hover:scale-[1.02] group">
                          <span className="absolute inset-0 animate-shimmer" />
                          {t('landing.hero.cta')}
                          <svg
                            className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </Button>
                      </a>
                      <span className="text-sm font-medium text-gray-500 dark:text-white/50 text-center sm:text-left mt-2">
                        {t('landing.hero.ctaNote')}
                      </span>
                    </div>
                    {/* Right: pricing card */}
                    <div className="flex flex-col items-center px-6 py-5 rounded-2xl bg-gradient-to-b from-amber-50/80 to-amber-100/40 dark:from-amber-500/[0.08] dark:to-amber-600/[0.03] backdrop-blur-2xl backdrop-saturate-150 border border-amber-300/25 dark:border-amber-500/10 shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_-1px_0_rgba(180,130,0,0.05)_inset,0_8px_28px_rgba(245,158,11,0.08),0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_0_rgba(255,200,50,0.06)_inset,0_-1px_0_rgba(0,0,0,0.15)_inset,0_8px_28px_rgba(245,158,11,0.06),0_2px_8px_rgba(0,0,0,0.12)] w-full sm:w-[280px] lg:w-[230px] sm:ml-auto transition-all duration-300 hover:shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_-1px_0_rgba(180,130,0,0.05)_inset,0_12px_36px_rgba(245,158,11,0.12),0_4px_12px_rgba(0,0,0,0.04)]">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-[0.15em] mb-3 opacity-80">🔥 Launch price</span>
                      <div className="flex flex-col gap-0.5 w-full items-center">
                        <div className="flex items-baseline gap-2 justify-center">
                          <span className="text-xs line-through text-gray-400/70 dark:text-white/25 font-medium">€599</span>
                          <span className="text-xl font-extrabold text-gray-900 dark:text-white">{t('landing.hero.priceBuild')}</span>
                          <span className="text-[10px] text-gray-400 dark:text-white/35 font-medium uppercase tracking-wide">setup</span>
                        </div>
                        <div className="w-3/4 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent my-3" />
                        <div className="flex items-baseline gap-2 justify-center">
                          <span className="text-xs line-through text-gray-400/70 dark:text-white/25 font-medium">€59</span>
                          <span className="text-xl font-extrabold text-gray-900 dark:text-white">{t('landing.hero.priceMonthly')}</span>
                          <span className="text-[10px] text-gray-400 dark:text-white/35 font-medium">/ mo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center lg:justify-start pt-6 border-t border-gray-200 dark:border-white/10">
                  {[
                    { value: t('landing.stats.weeks'), label: t('landing.stats.weeksLabel') },
                    { value: t('landing.stats.calls'), label: t('landing.stats.callsLabel') },
                    { value: t('landing.stats.techSkills'), label: t('landing.stats.techSkillsLabel') },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center">
                      <div className="text-center px-6 sm:px-10 lg:px-12">
                        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                          {stat.value}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-400 dark:text-white/30 uppercase tracking-wider mt-1">
                          {stat.label}
                        </div>
                      </div>
                      {i < 2 && (
                        <div className="w-px h-10 bg-gray-200 dark:bg-white/10" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Interactive Editor */}
              <div
                className={`relative transition-all duration-500 delay-200 mb-6 ${
                  isLoaded
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
              >
                {/* Title above editor */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('landing.editor.title')}
                  </h3>
                  <p className="text-base text-gray-500 dark:text-white/50">
                    {t('landing.editor.subtitle')}
                  </p>
                </div>

                {/* Glow effect behind editor */}


                {/* Editor window */}
                <div className="relative bg-white dark:bg-[#141418] rounded-3xl border border-gray-200/60 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-300 hover:shadow-[0_25px_70px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_25px_70px_rgba(0,0,0,0.5)] hover:scale-[1.01]">
                  {/* Browser chrome */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[#F5F5F7] dark:bg-white/[0.03] border-b border-gray-200/50 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#28ca42]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100/80 dark:bg-white/5 backdrop-blur text-[10px] text-gray-400 dark:text-white/30">
                      <svg
                        className="w-2.5 h-2.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      yoursite.com
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                        LIVE
                      </span>
                    </div>
                  </div>

                  {/* Split: Chat + Preview */}
                  <div className="flex flex-col sm:flex-row sm:divide-x divide-gray-200/30 dark:divide-white/5 min-h-[280px] sm:min-h-[320px]">
                    {/* Chat Panel */}
                    <div className="w-full sm:w-1/2 p-3 sm:p-4 flex flex-col border-b sm:border-b-0 border-gray-200/30 dark:border-white/5">
                      <div className="text-[11px] tracking-[0.12em] uppercase font-bold mb-2 sm:mb-3 bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                        Flowstarter Editor
                      </div>

                      {/* Messages - grows to fill space */}
                      <div className="flex-1 space-y-2.5 sm:space-y-3 overflow-y-auto mb-2 sm:mb-3 pr-1 max-h-[100px] sm:max-h-none">
                        {messages.map((msg, i) =>
                          msg.role === 'user' ? (
                            <div key={i} className="flex justify-end">
                              <div className="max-w-[95%] px-3 py-2 rounded-xl rounded-tr-sm bg-gradient-to-r from-[var(--purple)] to-blue-500 text-white text-[13px] shadow-sm">
                                {msg.text}
                              </div>
                            </div>
                          ) : (
                            <div key={i} className="flex gap-2">
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 border border-[var(--purple)]/20 flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-3 h-3 text-[var(--purple)]"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1 px-3 py-2 rounded-xl rounded-tl-sm bg-white/55 dark:bg-white/[0.05] border border-white/50 dark:border-white/10 text-[13px] text-gray-600 dark:text-white/70">
                                {msg.text}
                              </div>
                            </div>
                          )
                        )}
                        {isTyping && (
                          <div className="flex gap-2">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 border border-[var(--purple)]/20 flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-3 h-3 text-[var(--purple)]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                                />
                              </svg>
                            </div>
                            <div className="px-3 py-2 rounded-xl rounded-tl-sm bg-white/55 dark:bg-white/[0.05] border border-white/50 dark:border-white/10">
                              <div className="flex gap-1.5">
                                <span
                                  className="w-2 h-2 bg-gray-400 dark:bg-white/30 rounded-full animate-bounce"
                                  style={{ animationDelay: '0ms' }}
                                />
                                <span
                                  className="w-2 h-2 bg-gray-400 dark:bg-white/30 rounded-full animate-bounce"
                                  style={{ animationDelay: '150ms' }}
                                />
                                <span
                                  className="w-2 h-2 bg-gray-400 dark:bg-white/30 rounded-full animate-bounce"
                                  style={{ animationDelay: '300ms' }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input area - stays at bottom */}
                      <div className="mt-auto">
                        {/* Input */}
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border-0 shadow-[0_2px_12px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.15),inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-all duration-300">
                          <input
                            type="text"
                            placeholder="Try: Add form..."
                            className="flex-1 bg-transparent text-[13px] outline-none border-none focus:outline-none focus:ring-0 px-2 placeholder:text-gray-400 dark:placeholder:text-white/30 text-gray-900 dark:text-white"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                          />
                          <button
                            onClick={() => handleSend()}
                            disabled={!inputValue.trim() || isTyping}
                            className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--purple)] to-blue-500 text-white flex items-center justify-center disabled:opacity-30 transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 12h14m-7-7l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Quick prompts */}
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {['Add pricing', 'Contact form', 'Change colors'].map(
                            (prompt) => (
                              <button
                                key={prompt}
                                onClick={() => handleSend(prompt)}
                                disabled={isTyping}
                                className="px-3 py-1.5 text-[11px] rounded-full bg-white/55 dark:bg-white/[0.04] backdrop-blur-sm hover:bg-white/70 dark:hover:bg-white/[0.08] border border-white/60 dark:border-white/10 text-gray-600 dark:text-white/50 transition-all disabled:opacity-50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                              >
                                {prompt}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mock Site Preview */}
                    <div className="w-full sm:w-1/2 bg-white dark:bg-[#0f0f12] min-h-[200px] sm:min-h-[260px] overflow-hidden relative">
                      {/* Right edge mask */}
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white dark:from-[#0f0f12] to-transparent pointer-events-none z-10" />
                      {/* Realistic site header */}
                      <div
                        className={`flex items-center justify-between px-4 py-2.5 border-b transition-all duration-500 ${
                          mockSite.headerStyle === 'minimal'
                            ? 'bg-transparent border-transparent'
                            : 'bg-gray-50/80 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold text-white transition-colors duration-500 ${
                              mockSite.primaryColor === 'violet'
                                ? 'bg-[var(--purple)]/50'
                                : 'bg-emerald-500'
                            }`}
                          >
                            C
                          </div>
                          <span className="text-xs font-semibold text-gray-800 dark:text-white">
                            CoffeeRoast
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                          <span className="hover:text-gray-900 dark:hover:text-white cursor-default">
                            Home
                          </span>
                          {mockSite.hasAboutPage && (
                            <span
                              className={`font-medium transition-all duration-500 ${
                                mockSite.primaryColor === 'violet'
                                  ? 'text-[var(--purple)]'
                                  : 'text-emerald-500'
                              }`}
                            >
                              About
                            </span>
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
                            <div
                              className={`h-3 w-20 rounded mb-2 transition-colors duration-500 ${
                                mockSite.primaryColor === 'violet'
                                  ? 'bg-[var(--purple)]/50'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            <div className="h-1.5 w-28 bg-gray-300 dark:bg-gray-600 rounded mb-1" />
                            <div className="h-1.5 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-3" />
                            <div
                              className={`h-5 w-16 rounded-full text-[9px] text-white flex items-center justify-center transition-colors duration-500 ${
                                mockSite.primaryColor === 'violet'
                                  ? 'bg-[var(--purple)]/50'
                                  : 'bg-emerald-500'
                              }`}
                            >
                              Shop Now
                            </div>
                          </div>
                          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-700 dark:to-amber-900 flex items-center justify-center">
                            <span className="text-2xl">☕</span>
                          </div>
                        </div>
                      </div>

                      {/* Contact form - animated in */}
                      <div
                        className={`overflow-hidden transition-all duration-500 ${
                          mockSite.hasContactForm
                            ? 'max-h-32 opacity-100'
                            : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/30">
                          <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Get in Touch
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                            <div className="h-5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 px-2 flex items-center">
                              <span className="text-[9px] text-gray-400">
                                Name
                              </span>
                            </div>
                            <div className="h-5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 px-2 flex items-center">
                              <span className="text-[9px] text-gray-400">
                                Email
                              </span>
                            </div>
                          </div>
                          <div className="h-7 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 mb-2 px-2 flex items-start pt-1">
                            <span className="text-[9px] text-gray-400">
                              Message...
                            </span>
                          </div>
                          <div
                            className={`h-5 w-14 rounded text-[9px] text-white flex items-center justify-center transition-colors duration-500 ${
                              mockSite.primaryColor === 'violet'
                                ? 'bg-[var(--purple)]/50'
                                : 'bg-emerald-500'
                            }`}
                          >
                            Send
                          </div>
                        </div>
                      </div>

                      {/* Products/Features section */}
                      <div className="px-4 py-3">
                        <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Our Blends
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {['☕', '🫘', '✨'].map((emoji, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-center"
                            >
                              <div className="text-base mb-1">{emoji}</div>
                              <div className="h-1.5 w-10 mx-auto bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                              <div
                                className={`h-1.5 w-6 mx-auto rounded transition-colors duration-500 ${
                                  mockSite.primaryColor === 'violet'
                                    ? 'bg-[var(--purple)]/40'
                                    : 'bg-emerald-400'
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Testimonials - animated in */}
                      <div
                        className={`overflow-hidden transition-all duration-500 ${
                          mockSite.hasTestimonials
                            ? 'max-h-28 opacity-100'
                            : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-4 py-3">
                          <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            What Customers Say
                          </div>
                          <div className="flex gap-2">
                            {[1, 2].map((i) => (
                              <div
                                key={i}
                                className="flex-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
                                  <div className="h-1.5 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
                                </div>
                                <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded mb-1" />
                                <div className="h-1 w-4/5 bg-gray-100 dark:bg-gray-700 rounded" />
                                <div className="flex gap-0.5 mt-1.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <span
                                      key={s}
                                      className={`text-[8px] ${
                                        mockSite.primaryColor === 'violet'
                                          ? 'text-[var(--purple)]'
                                          : 'text-emerald-400'
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Pricing section - animated in */}
                      <div
                        className={`overflow-hidden transition-all duration-500 ${
                          mockSite.hasPricingSection
                            ? 'max-h-32 opacity-100'
                            : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/30">
                          <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Pricing
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                              <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                                Basic
                              </div>
                              <div
                                className={`text-sm font-bold transition-colors duration-500 ${
                                  mockSite.primaryColor === 'violet'
                                    ? 'text-[var(--purple)]'
                                    : 'text-emerald-600'
                                }`}
                              >
                                $9/mo
                              </div>
                              <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded mt-1.5 mb-1" />
                              <div className="h-1 w-3/4 bg-gray-100 dark:bg-gray-700 rounded" />
                            </div>
                            <div
                              className={`flex-1 p-2 rounded-lg border-2 transition-colors duration-500 ${
                                mockSite.primaryColor === 'violet'
                                  ? 'bg-[var(--purple)]/5 dark:bg-[var(--purple)]/20 border-[var(--purple)]/30 dark:border-[var(--purple)]'
                                  : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                              }`}
                            >
                              <div className="flex items-center gap-1">
                                <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                                  Pro
                                </div>
                                <div
                                  className={`text-[7px] px-1 py-0.5 rounded-full text-white transition-colors duration-500 ${
                                    mockSite.primaryColor === 'violet'
                                      ? 'bg-[var(--purple)]/50'
                                      : 'bg-emerald-500'
                                  }`}
                                >
                                  POPULAR
                                </div>
                              </div>
                              <div
                                className={`text-sm font-bold transition-colors duration-500 ${
                                  mockSite.primaryColor === 'violet'
                                    ? 'text-[var(--purple)]'
                                    : 'text-emerald-600'
                                }`}
                              >
                                $29/mo
                              </div>
                              <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded mt-1.5 mb-1" />
                              <div className="h-1 w-3/4 bg-gray-100 dark:bg-gray-700 rounded" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="text-[9px] text-gray-400">
                            © {new Date().getFullYear()} CoffeeRoast
                          </div>
                          <div className="flex gap-2">
                            {['📘', '📷', '✉️'].map((icon, i) => (
                              <span key={i} className="text-xs opacity-50">
                                {icon}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements - hidden on small mobile */}
                <div
                  className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--purple)] to-blue-500 shadow-xl hidden xs:flex flex-col items-center justify-center animate-float text-white"
                  style={{ animationDelay: '1s' }}
                >
                  <div className="text-base sm:text-lg lg:text-2xl font-bold">
                    Draft
                  </div>
                  <div className="text-[8px] sm:text-[10px] lg:text-xs text-white/70">
                    1-2 weeks
                  </div>
                </div>

                <div
                  className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 lg:-top-6 lg:-left-6 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-lg sm:rounded-xl lg:rounded-2xl bg-white/55 dark:bg-white/[0.08] backdrop-blur-xl border border-white/50 dark:border-white/10 hidden xs:flex items-center justify-center animate-float shadow-xl"
                  style={{ animationDelay: '0s' }}
                >
                  <div className="text-base sm:text-lg lg:text-2xl font-bold bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                    98
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        <PillarsSection />

        <ProcessSection />

        <IncludedSection />

        <TrustSection />

        {/* How it works */}
        <section className="py-8 lg:py-10">
          <div className="max-w-2xl mx-auto px-6 lg:px-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('landing.howItWorks.title')}
            </h3>
            <p className="text-gray-500 dark:text-white/50 leading-relaxed mb-4">
              {t('landing.howItWorks.text1')}
            </p>
            <p className="text-gray-500 dark:text-white/50 leading-relaxed mb-4">
              {t('landing.howItWorks.text2')}
            </p>
            <p className="text-gray-700 dark:text-white/70 font-medium">
              {t('landing.howItWorks.text3')}
            </p>
          </div>
        </section>

        {/* Pricing Section */}
        <section data-section="pricing" id="pricing" className="py-8 lg:py-10 relative">
          {/* Gradient accent - lavender tint */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--purple)]/[0.03] via-[var(--purple)]/50/[0.05] to-[var(--purple)]/[0.02] dark:from-[var(--purple)]/[0.02] dark:via-[var(--purple)]/50/[0.04] dark:to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                Clear{' '}
                <span className="bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                  pricing
                </span>
              </h2>
            </div>

            <div className="max-w-lg lg:max-w-2xl mx-auto">
              {/* Starter Plan Card - Premium Treatment */}
              <div className="group p-6 sm:p-8 lg:p-10 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-2xl border border-[var(--purple)]/20 dark:border-[var(--purple)]/15 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(0,0,0,0.04)_inset,0_8px_32px_rgba(77,93,217,0.1),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_8px_32px_rgba(77,93,217,0.15),0_2px_8px_rgba(0,0,0,0.15)] relative overflow-hidden transition-all duration-300 hover:border-[var(--purple)]/40 hover:shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(0,0,0,0.04)_inset,0_12px_40px_rgba(77,93,217,0.15),0_4px_12px_rgba(0,0,0,0.06)]">
                {/* Badge - inline on mobile, absolute on desktop */}
                <div className="sm:absolute sm:top-4 sm:right-4 mb-4 sm:mb-0 flex items-center gap-2">
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-[var(--purple)] text-white rounded-full">
                    {t('landing.pricing.badge')}
                  </span>
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-amber-500/90 text-white rounded-full animate-pulse">
                    {t('landing.pricing.limitedBadge')}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold mb-1">{t('landing.pricing.title')}</h3>
                <p className="text-base text-gray-400 dark:text-white/40 mb-6">
                  {t('landing.pricing.subtitle')}
                </p>

                {/* Pricing */}
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-white/10">
                  <div className="mb-2">
                    <span className="text-base text-gray-400 dark:text-white/40">
                      {t('landing.pricing.buildLabel')}{' '}
                    </span>
                    <span className="text-lg line-through text-gray-400 dark:text-white/30 font-medium mr-1">€599</span>
                    <span className="text-3xl font-bold">{t('landing.pricing.buildPrice')}</span>
                    <span className="text-base text-gray-400 dark:text-white/40 ml-1">
                      {t('landing.pricing.buildPeriod')}
                    </span>
                  </div>
                  <div>
                    <span className="text-base text-gray-400 dark:text-white/40">
                      {t('landing.pricing.careLabel')}{' '}
                    </span>
                    <span className="text-lg line-through text-gray-400 dark:text-white/30 font-medium mr-1">€59</span>
                    <span className="text-3xl font-bold">{t('landing.pricing.carePrice')}</span>
                    <span className="text-base text-gray-400 dark:text-white/40 ml-1">
                      {t('landing.pricing.carePeriod')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 dark:text-white/30 mt-2">
                    {t('landing.pricing.note')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 text-sm text-gray-500 dark:text-white/40">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('landing.pricing.refund')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {t('landing.pricing.assets')}
                    </span>
                  </div>
                </div>

                {/* Limited time notice */}
                <div className="mb-6 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 backdrop-blur-sm border border-amber-500/30 shadow-[0_4px_16px_rgba(245,158,11,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_16px_rgba(245,158,11,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium text-center">
                    ⏳ {t('landing.pricing.limitedNote')}
                  </p>
                </div>

                {/* Features - Two Categories */}
                <div className="space-y-5 mb-8">
                  {/* Your Website */}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-white/30 font-medium mb-1">
                      {t('landing.pricing.websiteTitle')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-white/40 mb-3">
                      {t('landing.pricing.websiteDesc')}
                    </p>
                    <ul className="space-y-1.5">
                      {[
                        t('landing.pricing.websiteFeature1'),
                        t('landing.pricing.websiteFeature2'),
                        t('landing.pricing.websiteFeature3'),
                        t('landing.pricing.websiteFeature4'),
                        t('landing.pricing.websiteFeature5'),
                      ].map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-base text-gray-600 dark:text-white/60"
                        >
                          <svg
                            className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Ongoing Care */}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-white/30 font-medium mb-1">
                      {t('landing.pricing.careTitle')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-white/40 mb-3">
                      {t('landing.pricing.careDesc')}
                    </p>
                    <ul className="space-y-1.5">
                      {[
                        t('landing.pricing.careFeature1'),
                        t('landing.pricing.careFeature2'),
                        t('landing.pricing.careFeature3'),
                        t('landing.pricing.careFeature4'),
                      ].map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-base text-gray-600 dark:text-white/60"
                        >
                          <svg
                            className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* CTA */}
                <a
                  href={EXTERNAL_URLS.calendly.discovery}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 hover:from-[#232342] hover:via-[#1e2a4a] hover:to-[#232342] dark:hover:from-gray-100 dark:hover:via-white dark:hover:to-gray-100 rounded-lg h-14 text-base font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300 hover:scale-[1.02]">
                    Claim Your Spot
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Button>
                </a>

                {/* Footer note */}
                <p className="text-xs text-gray-400 dark:text-white/30 text-center mt-4">
                  No lock-in. Cancel anytime. No hidden fees.
                </p>
              </div>

              {/* Coming Soon Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                {/* Growth - Coming Soon */}
                <div className="group p-6 rounded-2xl bg-white/55 dark:bg-white/[0.03] backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.1)] relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--purple)]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-gray-700 dark:text-white/80">
                        {t('landing.tiers.pro.name')}
                      </h4>
                      <span className="px-3 py-1 text-[10px] font-medium bg-[var(--purple)]/10 text-[var(--purple)] dark:bg-[var(--purple)]/20 dark:text-[var(--purple)] rounded-full">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-base font-medium text-gray-600 dark:text-white/60 mb-4">
                      {t('landing.tiers.pro.price')}
                    </p>
                    <ul className="space-y-2.5 text-base text-gray-600 dark:text-white/50">
                      {[t('landing.tiers.pro.f1'), t('landing.tiers.pro.f2'), t('landing.tiers.pro.f3'), t('landing.tiers.pro.f4'), t('landing.tiers.pro.f5')].map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--purple)]/50 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Commerce - Coming Soon */}
                <div className="group p-6 rounded-2xl bg-white/55 dark:bg-white/[0.03] backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.1)] relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-gray-700 dark:text-white/80">
                        {t('landing.tiers.ecom.name')}
                      </h4>
                      <span className="px-3 py-1 text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-base font-medium text-gray-600 dark:text-white/60 mb-4">
                      {t('landing.tiers.ecom.price')}
                    </p>
                    <ul className="space-y-2.5 text-base text-gray-600 dark:text-white/50">
                      {[t('landing.tiers.ecom.f1'), t('landing.tiers.ecom.f2'), t('landing.tiers.ecom.f3'), t('landing.tiers.ecom.f4')].map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Fine print */}
              <p className="text-center text-base text-gray-400 dark:text-white/30 mt-6">
                No contracts. Cancel anytime. First month free.
              </p>

              {/* Perfect for you if */}
              <div className="mt-12 p-6 rounded-2xl bg-[var(--purple)]/10 dark:bg-[var(--purple)]/10 backdrop-blur-xl border border-[var(--purple)]/30 shadow-[0_8px_32px_rgba(124,58,237,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(124,58,237,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                  {t('landing.forYou.title')}
                </h4>
                <ul className="space-y-2 text-base text-gray-600 dark:text-white/60">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--purple)]">→</span>
                    {t('landing.forYou.item1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--purple)]">→</span>
                    {t('landing.forYou.item2')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--purple)]">→</span>
                    {t('landing.forYou.item3')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--purple)]">→</span>
                    {t('landing.forYou.item4')}
                  </li>
                </ul>
              </div>

              {/* Not the right fit */}
              <div className="mt-4 p-6 rounded-2xl bg-white/55 dark:bg-white/[0.03] backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <h4 className="text-base font-semibold text-gray-700 dark:text-white/70 mb-4">
                  {t('landing.notForYou.title')}
                </h4>
                <ul className="space-y-2 text-base text-gray-500 dark:text-white/50">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 dark:text-white/30">→</span>
                    {t('landing.notForYou.item1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 dark:text-white/30">→</span>
                    {t('landing.notForYou.item2')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 dark:text-white/30">→</span>
                    {t('landing.notForYou.item3')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 dark:text-white/30">→</span>
                    {t('landing.notForYou.item4')}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>


        <ManifestoSection />

        <FAQSection />

        <FinalCTASection />

        {/* Footer */}
        <Footer showClientLogin />

        {/* Cookie Consent Banner */}
        <CookieConsent />
      </div>
    </>
  );
}
