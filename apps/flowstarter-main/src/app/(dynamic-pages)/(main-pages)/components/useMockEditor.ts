'use client';

import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { EXTERNAL_URLS } from '@/lib/constants';

declare global {
  interface Window {
    __demoInterval?: ReturnType<typeof setInterval>;
  }
}

export type MockPreviewField =
  | 'headline'
  | 'introduction'
  | 'cta'
  | 'service'
  | 'price';

export type GuidedRewriteTarget = 'headline' | 'introduction' | 'cta';
export type GuidedRewriteDirection =
  | 'warmer'
  | 'shorter'
  | 'more-confident'
  | 'more-direct';
export type GuidedPriceAmount = '24' | '29' | '35';
export type GuidedPriceCadence = 'two-weeks' | 'monthly';
export type GuidedToneTarget = 'headline' | 'introduction' | 'service';
export type GuidedTone = 'warm' | 'calm' | 'playful' | 'expert';
export type GuidedTranslationTarget =
  | 'headline'
  | 'introduction'
  | 'service'
  | 'cta';
export type GuidedTranslationLanguage = 'ro' | 'fr' | 'es';

export interface MockSiteState {
  hasContactForm: boolean;
  hasTestimonials: boolean;
  hasPricingSection: boolean;
  primaryColor: string;
  hasAboutPage: boolean;
  headerStyle: string;
  hasFAQ: boolean;
  hasNewsletter: boolean;
  headline: string;
  introduction: string;
  ctaLabel: string;
  serviceDescription: string;
  subscriptionPrice: string;
  language: 'en' | GuidedTranslationLanguage;
  updatedField: MockPreviewField | null;
  revision: number;
}

type TextEditPatch = Partial<
  Pick<
    MockSiteState,
    | 'headline'
    | 'introduction'
    | 'ctaLabel'
    | 'serviceDescription'
    | 'subscriptionPrice'
    | 'language'
    | 'updatedField'
  >
>;

const INITIAL_MOCK_SITE: MockSiteState = {
  hasContactForm: false,
  hasTestimonials: false,
  hasPricingSection: false,
  primaryColor: 'violet',
  hasAboutPage: false,
  headerStyle: 'default',
  hasFAQ: false,
  hasNewsletter: false,
  headline: 'Coffee that makes mornings feel like home.',
  introduction: 'Small-batch coffee, roasted fresh and delivered to your door.',
  ctaLabel: 'Shop coffee',
  serviceDescription: 'Find the blend that fits your morning.',
  subscriptionPrice: 'From €24 every two weeks',
  language: 'en',
  updatedField: null,
  revision: 0,
};

const DEMO_SEQUENCE: Array<{
  prompt: string;
  response: string;
  previewPatch: Partial<MockSiteState>;
}> = [
  {
    prompt: 'Make this headline feel warmer',
    response:
      'Done. I kept the fresh-roast promise and made the welcome feel warmer.',
    previewPatch: {
      headline: 'Coffee that makes every morning feel like home.',
      updatedField: 'headline',
    },
  },
  {
    prompt: 'Shorten this introduction',
    response:
      'Done. The introduction now leads with freshness and delivery in four words.',
    previewPatch: {
      introduction: 'Fresh-roasted coffee, delivered.',
      updatedField: 'introduction',
    },
  },
  {
    prompt: 'Make this call to action more direct',
    response:
      'Updated. “Find your roast” makes the next step specific and inviting.',
    previewPatch: {
      ctaLabel: 'Find your roast',
      updatedField: 'cta',
    },
  },
  {
    prompt: 'Translate this service description into Romanian',
    response:
      'Translated. The Romanian version keeps the same warm, local voice.',
    previewPatch: {
      serviceDescription: 'Alege cafeaua potrivită pentru dimineața ta.',
      language: 'ro',
      updatedField: 'service',
    },
  },
];

const GUIDED_REWRITES: Record<
  GuidedRewriteTarget,
  Record<
    GuidedRewriteDirection,
    {
      prompt: string;
      response: string;
      previewPatch: Partial<MockSiteState>;
    }
  >
> = {
  headline: {
    warmer: {
      prompt: 'Rewrite the headline · warmer',
      response:
        'Done. The headline feels more welcoming while keeping the coffee promise.',
      previewPatch: {
        headline: 'Coffee that feels like coming home.',
        updatedField: 'headline',
      },
    },
    shorter: {
      prompt: 'Rewrite the headline · shorter',
      response:
        'Done. The headline lands faster without losing the morning benefit.',
      previewPatch: {
        headline: 'Better coffee. Better mornings.',
        updatedField: 'headline',
      },
    },
    'more-confident': {
      prompt: 'Rewrite the headline · more confident',
      response: 'Done. The headline sounds assured without becoming pushy.',
      previewPatch: {
        headline: 'Your best mornings start with better coffee.',
        updatedField: 'headline',
      },
    },
    'more-direct': {
      prompt: 'Rewrite the headline · more direct',
      response:
        'Done. The headline now states the product and delivery promise immediately.',
      previewPatch: {
        headline: 'Fresh-roasted coffee, delivered weekly.',
        updatedField: 'headline',
      },
    },
  },
  introduction: {
    warmer: {
      prompt: 'Rewrite the introduction · warmer',
      response:
        'Done. The introduction feels more personal while keeping the local detail.',
      previewPatch: {
        introduction:
          'Roasted with care in Cluj, then delivered fresh to your door.',
        updatedField: 'introduction',
      },
    },
    shorter: {
      prompt: 'Rewrite the introduction · shorter',
      response:
        'Done. The introduction is now easy to understand in three words.',
      previewPatch: {
        introduction: 'Fresh coffee, delivered.',
        updatedField: 'introduction',
      },
    },
    'more-confident': {
      prompt: 'Rewrite the introduction · more confident',
      response:
        'Done. The introduction leads with quality and keeps the weekly rhythm clear.',
      previewPatch: {
        introduction:
          'Exceptional small-batch coffee, roasted fresh every week.',
        updatedField: 'introduction',
      },
    },
    'more-direct': {
      prompt: 'Rewrite the introduction · more direct',
      response:
        'Done. The introduction now explains the choice and delivery time directly.',
      previewPatch: {
        introduction: 'Choose your roast and get it delivered within 48 hours.',
        updatedField: 'introduction',
      },
    },
  },
  cta: {
    warmer: {
      prompt: 'Rewrite the button · warmer',
      response:
        'Done. The button feels inviting while still asking for a clear action.',
      previewPatch: {
        ctaLabel: 'Choose your favourite',
        updatedField: 'cta',
      },
    },
    shorter: {
      prompt: 'Rewrite the button · shorter',
      response: 'Done. The button is now immediate and easy to scan.',
      previewPatch: {
        ctaLabel: 'Shop now',
        updatedField: 'cta',
      },
    },
    'more-confident': {
      prompt: 'Rewrite the button · more confident',
      response:
        'Done. The button names the commitment clearly and confidently.',
      previewPatch: {
        ctaLabel: 'Start your subscription',
        updatedField: 'cta',
      },
    },
    'more-direct': {
      prompt: 'Rewrite the button · more direct',
      response:
        'Done. “Find your roast” tells visitors exactly what to do next.',
      previewPatch: {
        ctaLabel: 'Find your roast',
        updatedField: 'cta',
      },
    },
  },
};

const GUIDED_TONE_COPY: Record<GuidedToneTarget, Record<GuidedTone, string>> = {
  headline: {
    warm: 'Coffee that makes every morning feel like home.',
    calm: 'A slower morning starts with better coffee.',
    playful: 'Good beans. Great mornings. Zero fuss.',
    expert: 'Specialty coffee, roasted for peak freshness.',
  },
  introduction: {
    warm: 'Fresh-roasted coffee for slower, better mornings.',
    calm: 'Thoughtfully roasted coffee, delivered when you need it.',
    playful: 'Bright beans, fresh roasts, happier mornings.',
    expert: 'Small-batch coffee roasted weekly for clarity and balance.',
  },
  service: {
    warm: "Let's find the blend that feels right for your morning.",
    calm: 'Find a balanced blend for your everyday ritual.',
    playful: 'Meet the coffee your alarm clock wishes it could make.',
    expert: 'Compare roast profile, origin and tasting notes before choosing.',
  },
};

const GUIDED_TRANSLATIONS: Record<
  GuidedTranslationLanguage,
  Record<GuidedTranslationTarget, string>
> = {
  ro: {
    headline: 'Cafea proaspăt prăjită, pentru dimineți mai bune.',
    introduction:
      'Cafea în loturi mici, proaspăt prăjită și livrată la ușa ta.',
    service: 'Alege cafeaua potrivită pentru dimineața ta.',
    cta: 'Alege cafeaua',
  },
  fr: {
    headline: 'Du café fraîchement torréfié pour de meilleurs matins.',
    introduction:
      'Du café en petits lots, fraîchement torréfié et livré chez vous.',
    service: 'Trouvez le mélange qui accompagne votre matinée.',
    cta: 'Choisir mon café',
  },
  es: {
    headline: 'Café recién tostado para mejores mañanas.',
    introduction:
      'Café de lotes pequeños, recién tostado y entregado en tu puerta.',
    service: 'Encuentra la mezcla ideal para tu mañana.',
    cta: 'Elegir mi café',
  },
};

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
  const autoStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const userInteractedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock site state for live preview
  const [mockSite, setMockSite] = useState<MockSiteState>(INITIAL_MOCK_SITE);

  const applyTextEdit = (patch: TextEditPatch) => {
    setMockSite((current) => ({
      ...current,
      ...patch,
      revision: current.revision + 1,
    }));
  };

  const aiResponses: Record<string, { text: string; action?: () => void }> = {
    contact: {
      text: 'I sent this to your Care team so they can place and test the form safely.',
    },
    form: {
      text: 'I sent this to your Care team so they can place and test the form safely.',
    },
    color: {
      text: 'Your Care team will check contrast and consistency before changing site-wide colors.',
    },
    testimonial: {
      text: 'Your Care team will verify the proof and place it where it builds the most trust.',
    },
    review: {
      text: 'Your Care team will verify the proof and place it where it builds the most trust.',
    },
    pricing: {
      text: 'Your Care team will review the full buying journey before changing pricing.',
    },
    plan: {
      text: 'Your Care team will review the full buying journey before changing pricing.',
    },
    price: {
      text: 'Updated. The price now shows the billing rhythm and confirms delivery is included.',
      action: () =>
        applyTextEdit({
          subscriptionPrice: '€24 every 2 weeks · delivery included',
          updatedField: 'price',
        }),
    },
    about: {
      text: 'I sent the new page request to your Care team so it fits the whole customer journey.',
    },
    page: {
      text: 'I sent the new page request to your Care team so it fits the whole customer journey.',
    },
    header: {
      text: 'Your Care team will review that layout change across desktop and mobile.',
    },
    faq: {
      text: 'I sent the new section to your Care team so they can shape and test it properly.',
    },
    question: {
      text: 'I sent the new section to your Care team so they can shape and test it properly.',
    },
    newsletter: {
      text: 'Your Care team will connect and test that service without disrupting the site.',
    },
    email: {
      text: 'Your Care team will connect and test that service without disrupting the site.',
    },
    warmer: {
      text: 'Done. I kept the coffee promise and made the headline feel more welcoming.',
      action: () =>
        applyTextEdit({
          headline: 'Coffee that makes every morning feel like home.',
          updatedField: 'headline',
        }),
    },
    friendlier: {
      text: 'Done. The new headline feels like an invitation, not an advertisement.',
      action: () =>
        applyTextEdit({
          headline: 'Come in. Your new favourite coffee is waiting.',
          updatedField: 'headline',
        }),
    },
    tone: {
      text: 'Updated. The introduction now sounds warm, calm, and unhurried.',
      action: () =>
        applyTextEdit({
          introduction: 'Fresh-roasted coffee for slower, better mornings.',
          updatedField: 'introduction',
        }),
    },
    headline: {
      text: 'Rewritten. It is shorter, more confident, and easier to understand at a glance.',
      action: () =>
        applyTextEdit({
          headline: 'Better coffee starts right here.',
          updatedField: 'headline',
        }),
    },
    shorten: {
      text: 'Done. I removed the extra words and kept the freshness and delivery promise.',
      action: () =>
        applyTextEdit({
          introduction: 'Fresh-roasted coffee, delivered.',
          updatedField: 'introduction',
        }),
    },
    'call to action': {
      text: 'Updated. “Find your roast” names the next step clearly.',
      action: () =>
        applyTextEdit({
          ctaLabel: 'Find your roast',
          updatedField: 'cta',
        }),
    },
    cta: {
      text: 'Updated. “Find your roast” names the next step clearly.',
      action: () =>
        applyTextEdit({
          ctaLabel: 'Find your roast',
          updatedField: 'cta',
        }),
    },
    direct: {
      text: 'Updated. “Find your roast” names the next step clearly.',
      action: () =>
        applyTextEdit({
          ctaLabel: 'Find your roast',
          updatedField: 'cta',
        }),
    },
    translate: {
      text: 'Translated. I kept the warm voice natural in Romanian, not word for word.',
      action: () =>
        applyTextEdit({
          serviceDescription: 'Alege cafeaua potrivită pentru dimineața ta.',
          language: 'ro',
          updatedField: 'service',
        }),
    },
    romanian: {
      text: 'Translated. I kept the warm voice natural in Romanian, not word for word.',
      action: () =>
        applyTextEdit({
          serviceDescription: 'Alege cafeaua potrivită pentru dimineața ta.',
          language: 'ro',
          updatedField: 'service',
        }),
    },
    copy: {
      text: 'Updated. The sentence is clearer and still sounds like CoffeeRoast.',
      action: () =>
        applyTextEdit({
          introduction:
            'Fresh coffee, thoughtfully roasted for better mornings.',
          updatedField: 'introduction',
        }),
    },
    default: {
      text: 'I can refine wording here. Wider design changes go to your Care team.',
    },
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
      const delay = isPunct ? 45 + Math.random() * 25 : 10 + Math.random() * 10;
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

  const stopAutoDemo = () => {
    userInteractedRef.current = true;
    if (autoStartTimeoutRef.current) {
      clearTimeout(autoStartTimeoutRef.current);
      autoStartTimeoutRef.current = null;
    }
    if (window.__demoInterval) {
      clearInterval(window.__demoInterval);
      delete window.__demoInterval;
    }
  };

  const runGuidedEdit = (
    prompt: string,
    response: string,
    previewPatch: TextEditPatch
  ) => {
    if (isTyping) return;

    stopAutoDemo();
    setInputValue('');
    setMessages((previous) => [...previous, { role: 'user', text: prompt }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      applyTextEdit(previewPatch);
      typewrite(response, () => {
        setMessages((previous) => [
          ...previous,
          { role: 'ai', text: response },
        ]);
        setTypingText('');
      });
    }, 800);
  };

  const handleGuidedRewrite = (
    target: GuidedRewriteTarget,
    direction: GuidedRewriteDirection
  ) => {
    const rewrite = GUIDED_REWRITES[target][direction];
    runGuidedEdit(rewrite.prompt, rewrite.response, rewrite.previewPatch);
  };

  const handleGuidedPrice = (
    amount: GuidedPriceAmount,
    cadence: GuidedPriceCadence,
    deliveryIncluded: boolean
  ) => {
    const cadenceCopy = cadence === 'monthly' ? 'per month' : 'every 2 weeks';
    const deliveryCopy = deliveryIncluded
      ? 'delivery included'
      : 'delivery calculated separately';

    runGuidedEdit(
      `Set the subscription to €${amount} ${cadenceCopy} · ${deliveryCopy}`,
      'Updated. The preview now shows the chosen amount, billing rhythm and delivery terms.',
      {
        subscriptionPrice: `€${amount} ${cadenceCopy} · ${deliveryCopy}`,
        updatedField: 'price',
      }
    );
  };

  const handleGuidedTone = (target: GuidedToneTarget, tone: GuidedTone) => {
    const copy = GUIDED_TONE_COPY[target][tone];
    const previewPatch: TextEditPatch =
      target === 'headline'
        ? { headline: copy, updatedField: 'headline' }
        : target === 'introduction'
        ? { introduction: copy, updatedField: 'introduction' }
        : { serviceDescription: copy, updatedField: 'service' };

    runGuidedEdit(
      `Make the ${
        target === 'service' ? 'service description' : target
      } feel ${tone}`,
      `Updated. The ${
        target === 'service' ? 'service description' : target
      } now has a ${tone} voice while keeping the same meaning.`,
      previewPatch
    );
  };

  const handleGuidedTranslation = (
    target: GuidedTranslationTarget,
    language: GuidedTranslationLanguage
  ) => {
    const copy = GUIDED_TRANSLATIONS[language][target];
    const previewPatch: TextEditPatch =
      target === 'headline'
        ? { headline: copy, language, updatedField: 'headline' }
        : target === 'introduction'
        ? { introduction: copy, language, updatedField: 'introduction' }
        : target === 'service'
        ? { serviceDescription: copy, language, updatedField: 'service' }
        : { ctaLabel: copy, language, updatedField: 'cta' };

    runGuidedEdit(
      `Translate the ${
        target === 'service' ? 'service description' : target
      } into ${
        language === 'ro'
          ? 'Romanian'
          : language === 'fr'
          ? 'French'
          : 'Spanish'
      }`,
      'Translated. I adapted the wording so it reads naturally and keeps the same brand voice.',
      previewPatch
    );
  };

  const handleSend = (directMessage?: string) => {
    const message = directMessage || inputValue.trim();
    if (!message || isTyping) return;
    stopAutoDemo();
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
          'That needs a wider design change, so I am opening a short call to shape it properly.';
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
      response.action?.();
      typewrite(aiText, () => {
        setMessages((prev) => [...prev, { role: 'ai', text: aiText }]);
        setTypingText('');
      });
    }, 800 + Math.random() * 400);
  };

  useEffect(() => {
    setIsLoaded(true);
    // Initial state
    setMessages([
      { role: 'user', text: DEMO_SEQUENCE[0].prompt },
      { role: 'ai', text: DEMO_SEQUENCE[0].response },
    ]);
    setTimeout(
      () =>
        setMockSite((current) => ({
          ...current,
          ...DEMO_SEQUENCE[0].previewPatch,
          revision: current.revision + 1,
        })),
      500
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-cycle through demos when user hasn't interacted
  useEffect(() => {
    let currentIndex = 0; // Start at 0, first advance goes to 1

    function advanceDemo() {
      if (userInteractedRef.current) return;

      currentIndex = (currentIndex + 1) % DEMO_SEQUENCE.length;
      const demo = DEMO_SEQUENCE[currentIndex];

      // When looping back to start, reset everything cleanly
      if (currentIndex === 0) {
        setMessages([
          { role: 'user', text: demo.prompt },
          { role: 'ai', text: demo.response },
        ]);
        setMockSite({
          ...INITIAL_MOCK_SITE,
          ...demo.previewPatch,
          revision: 1,
        });
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
        setMockSite((current) => ({
          ...current,
          ...demo.previewPatch,
          revision: current.revision + 1,
        }));
      }, 800);
    }

    // First advance after 3 seconds
    autoStartTimeoutRef.current = setTimeout(() => {
      advanceDemo();

      // Then continue every 5 seconds
      const intervalId = setInterval(advanceDemo, 5000);

      // Store interval for cleanup
      window.__demoInterval = intervalId;
    }, 3000);

    return () => {
      if (autoStartTimeoutRef.current) {
        clearTimeout(autoStartTimeoutRef.current);
        autoStartTimeoutRef.current = null;
      }
      if (window.__demoInterval) {
        clearInterval(window.__demoInterval);
        delete window.__demoInterval;
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
    handleGuidedRewrite,
    handleGuidedPrice,
    handleGuidedTone,
    handleGuidedTranslation,
  };
}
