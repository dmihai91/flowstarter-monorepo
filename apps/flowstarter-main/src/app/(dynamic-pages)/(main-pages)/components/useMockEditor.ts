'use client';

import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { EXTERNAL_URLS } from '@/lib/constants';

declare global {
  interface Window {
    __demoInterval?: ReturnType<typeof setInterval>;
  }
}

/**
 * Hook for the landing page mock editor demo.
 * Manages mock site state, AI response simulation, typing animation.
 */
export function useMockEditor() {
  const { t: _t } = useI18n();
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<
    { role: 'user' | 'ai'; text: string }[]
  >([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTypewriting, setIsTypewriting] = useState(false);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock site state for live preview
  const [mockSite, setMockSite] = useState({
    hasContactForm: false,
    hasTestimonials: false,
    hasPricingSection: false,
    primaryColor: 'violet',
    hasAboutPage: false,
    headerStyle: 'default',
    hasFAQ: false,
    hasNewsletter: false,
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
    faq: {
      text: "FAQ section added — I've covered the 5 most common questions.",
      action: () => setMockSite((s) => ({ ...s, hasFAQ: true })),
    },
    question: {
      text: "FAQ section added — I've covered the 5 most common questions.",
      action: () => setMockSite((s) => ({ ...s, hasFAQ: true })),
    },
    newsletter: {
      text: 'Newsletter signup added. New subscribers go straight to your list.',
      action: () => setMockSite((s) => ({ ...s, hasNewsletter: true })),
    },
    email: {
      text: 'Newsletter signup added. New subscribers go straight to your list.',
      action: () => setMockSite((s) => ({ ...s, hasNewsletter: true })),
    },
    headline: {
      text: 'Headline rewritten. Sounds more confident and client-focused now.',
      action: () => setMockSite((s) => ({ ...s })),
    },
    copy: {
      text: 'Copy updated across the page. Fresh, professional, on-brand.',
      action: () => setMockSite((s) => ({ ...s })),
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

  const typewrite = (text: string, onDone: () => void) => {
    setTypingText('');
    setIsTypewriting(true);
    let i = 0;
    if (typewriterRef.current)
      clearTimeout(
        typewriterRef.current as unknown as ReturnType<typeof setTimeout>
      );

    const typeNextChar = () => {
      i++;
      setTypingText(text.slice(0, i));
      if (i >= text.length) {
        typewriterRef.current = null;
        setIsTypewriting(false);
        onDone();
        return;
      }
      const char = text[i - 1];
      // Natural variance: pause longer after punctuation, random jitter otherwise
      const isPunct = ['.', ',', '!', '?', ':'].includes(char);
      const delay = isPunct
        ? 180 + Math.random() * 120
        : 35 + Math.random() * 45;
      typewriterRef.current = setTimeout(
        typeNextChar,
        delay
      ) as unknown as ReturnType<typeof setInterval>;
    };

    typewriterRef.current = setTimeout(
      typeNextChar,
      40
    ) as unknown as ReturnType<typeof setInterval>;
  };

  const handleSend = (directMessage?: string) => {
    const message = directMessage || inputValue.trim();
    if (!message || isTyping) return;
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
        const msg1 =
          "Great idea! Let's discuss this on a discovery call. Redirecting you to book...";
        typewrite(msg1, () => {
          setMessages((prev) => [...prev, { role: 'ai', text: msg1 }]);
          setTypingText('');
        });
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
      const aiText = response.text;
      typewrite(aiText, () => {
        setMessages((prev) => [...prev, { role: 'ai', text: aiText }]);
        setTypingText('');
        if (response.action) {
          setTimeout(() => response.action!(), 200);
        }
      });
    }, 800 + Math.random() * 400);
  };

  const initialSiteState = {
    hasContactForm: false,
    hasTestimonials: false,
    hasPricingSection: false,
    primaryColor: 'violet',
    hasAboutPage: false,
    headerStyle: 'default',
    hasFAQ: false,
    hasNewsletter: false,
  };

  // Auto-cycle demo prompts — accumulates then resets and loops
  const demoSequence = [
    {
      prompt: 'Add a testimonials section',
      response: 'Done! Added testimonials with star ratings.',
      siteState: { ...initialSiteState, hasTestimonials: true },
    },
    {
      prompt: 'Add pricing tables',
      response: 'Pricing section added with 2 plans.',
      siteState: {
        ...initialSiteState,
        hasTestimonials: true,
        hasPricingSection: true,
      },
    },
    {
      prompt: 'Change the color scheme to green',
      response: 'Updated. Primary color changed across the site.',
      siteState: {
        ...initialSiteState,
        hasTestimonials: true,
        hasPricingSection: true,
        primaryColor: 'emerald',
      },
    },
    {
      prompt: 'Add a contact form',
      response: 'Done. Contact form added below hero.',
      siteState: {
        ...initialSiteState,
        hasTestimonials: true,
        hasPricingSection: true,
        primaryColor: 'emerald',
        hasContactForm: true,
      },
    },
    {
      prompt: 'Add an FAQ section',
      response: "FAQ section added — I've covered the 5 most common questions.",
      siteState: {
        ...initialSiteState,
        hasTestimonials: true,
        hasPricingSection: true,
        primaryColor: 'emerald',
        hasContactForm: true,
        hasFAQ: true,
      },
    },
    {
      prompt: 'Add a newsletter signup',
      response:
        'Newsletter signup added. New subscribers go straight to your list.',
      siteState: {
        ...initialSiteState,
        hasTestimonials: true,
        hasPricingSection: true,
        primaryColor: 'emerald',
        hasContactForm: true,
        hasFAQ: true,
        hasNewsletter: true,
      },
    },
    {
      prompt: 'Add an about page',
      response: 'About page created and linked in the nav.',
      siteState: {
        ...initialSiteState,
        hasTestimonials: true,
        hasPricingSection: true,
        primaryColor: 'emerald',
        hasContactForm: true,
        hasFAQ: true,
        hasNewsletter: true,
        hasAboutPage: true,
      },
    },
  ];

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-cycle through demos when user hasn't interacted
  useEffect(() => {
    let currentIndex = 0; // Start at 0, first advance goes to 1

    function advanceDemo() {
      currentIndex = (currentIndex + 1) % demoSequence.length;
      const demo = demoSequence[currentIndex];

      // When looping back to start, reset everything cleanly
      if (currentIndex === 0) {
        setMessages([
          { role: 'user', text: demo.prompt },
          { role: 'ai', text: demo.response },
        ]);
        setMockSite(demo.siteState as typeof initialSiteState);
        return;
      }

      // Add new message to history (accumulate)
      setMessages((prev) => [...prev, { role: 'user', text: demo.prompt }]);
      setIsTyping(true);

      // AI response after typing delay
      setTimeout(() => {
        setIsTyping(false);
        const demoText = demo.response;
        typewrite(demoText, () => {
          setMessages((prev) => [...prev, { role: 'ai', text: demoText }]);
          setTypingText('');
        });
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
      window.__demoInterval = intervalId;
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
      if (window.__demoInterval) {
        clearInterval(window.__demoInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Only auto-scroll after user has interacted (not on initial load)
    // Use block: 'nearest' to prevent page scroll, only scroll within container
    if (messagesEndRef.current) {
      const parent = messagesEndRef.current.parentElement;
      if (parent) parent.scrollTop = parent.scrollHeight;
    }
  }, [messages]);

  // Scroll animation observer

  return {
    isLoaded,
    inputValue,
    setInputValue,
    messages,
    isTyping,
    typingText,
    isTypewriting,
    mockSite,
    messagesEndRef,
    handleSend,
  };
}
