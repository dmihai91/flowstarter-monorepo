'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { EXTERNAL_URLS } from '@/lib/constants';

interface MockSite {
  hasContactForm: boolean;
  hasTestimonials: boolean;
  hasPricingSection: boolean;
  primaryColor: string;
  hasAboutPage: boolean;
  headerStyle: string;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

/**
 * Hook for the landing page mock editor demo.
 * Manages mock site state, AI response simulation, typing animation.
 */
export function useMockEditor() {
  const { t } = useI18n();
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<
    { role: 'user' | 'ai'; text: string }[]
  >([]);
  const [isTyping, setIsTyping] = useState(false);
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
  }, []);

  useEffect(() => {
    // Only auto-scroll after user has interacted (not on initial load)
    // Use block: 'nearest' to prevent page scroll, only scroll within container
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  // Scroll animation observer

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



  return {
    isLoaded,
    inputValue, setInputValue,
    messages,
    isTyping,
    mockSite,
    messagesEndRef,
    handleSend,
  };
}
