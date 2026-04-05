'use client';

import { useState, useEffect, useRef } from 'react';

const GENERIC_EXAMPLES = [
  'Boutique dental clinic for busy professionals. Polished website with online booking, implants and whitening focus, strong lead capture.',
  'Local yoga studio — in-person and online classes. Warm, calming vibe. Simple booking system and newsletter signup.',
  'Freelance graphic designer looking to showcase portfolio and attract branding clients. Minimal, modern aesthetic.',
  'Life coach helping burned-out professionals find clarity and purpose. Warm, empowering tone. Discovery call booking and lead capture.',
  'Personal fitness coach targeting women 30–45. Sells 1-on-1 coaching and online programs. Bold, motivational energy.',
  'Law firm specialising in corporate contracts. Professional, trustworthy tone. Contact form and service descriptions.',
  'Handmade ceramics store. Product showcase, Instagram feed integration, and Stripe checkout.',
];

const INDUSTRY_EXAMPLES: Record<string, string[]> = {
  'Coffee & Food': [
    'Artisan coffee roastery in the city centre. Showcase beans, brew methods, and a café experience. Online shop for bags and subscriptions.',
    'Farm-to-table bistro focusing on seasonal Romanian ingredients. Warm, rustic feel. Online reservations and weekly menu updates.',
    'Vegan meal-prep service delivering weekly boxes. Clean, fresh aesthetic. Subscription sign-up and dietary preference selection.',
  ],
  'Beauty & Wellness': [
    'Luxury nail salon specialising in nail art and gel extensions. Instagram gallery, online booking, and a loyalty program sign-up.',
    'Holistic wellness spa offering massages and facials. Serene, spa-like design. Book appointments and gift voucher purchase.',
    'Mobile hair stylist for weddings and events. Portfolio of bridal looks, packages page, and consultation booking form.',
  ],
  'Health & Medical': [
    'Private GP clinic offering same-day appointments. Clean, clinical design. Online booking, service list, and patient portal link.',
    'Integrative health clinic combining nutrition, physiotherapy, and acupuncture. Warm and trustworthy. Book a free discovery call.',
    'Dermatology clinic focusing on acne and anti-aging treatments. Before/after gallery, treatment explainers, and appointment request.',
  ],
  'Fitness & Sports': [
    'Personal fitness coach targeting women 30–45. Sells 1-on-1 coaching and online programs. Bold, motivational energy.',
    'CrossFit gym with strong community culture. Class schedule, membership tiers, coach bios, and a free trial class sign-up.',
    'Online running coach preparing athletes for half and full marathons. Training plans, testimonials, and coaching inquiry form.',
  ],
  'Legal & Consulting': [
    'Boutique law firm specialising in employment law. Professional, approachable tone. Service pages, team bios, and free consultation form.',
    'Independent business consultant helping SMEs improve operations. Credibility-focused design. Case studies, services, and contact.',
    'IP and trademark attorney serving tech startups. Clean, modern. Service explainers, FAQ, and a direct consultation booking flow.',
  ],
  'Real Estate': [
    'Independent real estate agent specialising in luxury apartments in Bucharest. Property listings, virtual tours, and seller inquiry form.',
    'Property management company handling residential rentals. Listing portal, tenant portal link, and owner inquiry form.',
    'Real estate investment consultant helping expats buy property in Romania. Trust-building content, process explainer, and discovery call booking.',
  ],
  'Education & Training': [
    'Online language school teaching business English to Romanian professionals. Course catalogue, sample lessons, and enrolment form.',
    'Private maths tutor for high school students preparing for the Bac exam. Packages, parent testimonials, and booking form.',
    'Leadership development trainer running corporate workshops. Speaker bio, workshop topics, and corporate inquiry form.',
  ],
  'Photography & Creative': [
    'Wedding photographer with a fine-art documentary style. Full-screen portfolio, package pricing, and inquiry form for 2025–2026 dates.',
    'Commercial product photographer for e-commerce brands. Portfolio by category, day-rate pricing, and quote request form.',
    'Videographer producing brand films and social content. Showreel, client logos, services breakdown, and project inquiry.',
  ],
  'Retail & E-commerce': [
    'Handmade jewellery brand selling sterling silver pieces. Product catalogue, story page, Instagram feed, and Stripe checkout.',
    'Sustainable kids clothing brand. Product shop, size guide, ethical sourcing story, and newsletter sign-up.',
    'Specialty tea importer selling direct-to-consumer. Shop by region, brewing guides blog, subscription option, and gift sets.',
  ],
  'Technology & SaaS': [
    'B2B SaaS tool for freelance accountants. Clean, conversion-focused landing page. Feature highlights, pricing tiers, and free trial CTA.',
    'No-code automation consultancy helping SMEs save time. Case studies, service packages, and a free workflow audit sign-up.',
    'Cybersecurity consultancy for mid-market companies. Trust signals, service breakdown, team credentials, and contact form.',
  ],
  'Travel & Hospitality': [
    'Boutique guesthouse in the Transylvanian countryside. Atmospheric photography, room descriptions, local experiences, and direct booking.',
    'Private tour guide specialising in off-the-beaten-path Romania. Tour packages, testimonials, custom tour inquiry, and day availability.',
    'Corporate travel management agency. Service overview, client logos, cost-saving stats, and RFP / quote request form.',
  ],
  'Construction & Trades': [
    'Interior renovation contractor in Cluj. Before/after project gallery, services list, transparent quote request, and trust badges.',
    'Electrical installation company serving residential and commercial clients. Services, certifications, free estimate form, and emergency contact.',
    'Landscape design studio creating private gardens and terraces. Portfolio, design process explainer, and consultation booking.',
  ],
  'Finance & Accounting': [
    'Chartered accountant serving freelancers and small businesses. Services, pricing, client onboarding info, and contact form.',
    'Fee-only financial planner helping young professionals build wealth. Transparent pricing, planning process, and discovery call booking.',
    'Payroll outsourcing firm for companies with 10–100 employees. Service scope, compliance credentials, and proposal request.',
  ],
  'Non-profit & Community': [
    'Animal rescue NGO in Bucharest. Adoption listings, volunteer sign-up, donation button, and monthly newsletter.',
    'Community learning centre providing free digital skills training for adults. Programme overview, volunteer opportunities, and donor portal.',
    'Mental health awareness foundation. Resource library, event calendar, donation flow, and corporate partnership inquiry.',
  ],
  Other: [
    "Describe your client's business, target audience, main offer, and the tone you're going for. The more detail you give, the better the AI brief.",
  ],
};

interface Options {
  minSpeed?: number;
  maxSpeed?: number;
  deleteSpeed?: number;
  pauseAfter?: number;
  pauseBefore?: number;
  enabled?: boolean;
  industry?: string;
}

export function useAnimatedPlaceholder(opts: Options = {}): string {
  const {
    minSpeed = 38,
    maxSpeed = 72,
    deleteSpeed = 14,
    pauseAfter = 2800,
    pauseBefore = 500,
    enabled = true,
    industry,
  } = opts;

  const examples =
    industry && INDUSTRY_EXAMPLES[industry]
      ? INDUSTRY_EXAMPLES[industry]
      : GENERIC_EXAMPLES;

  const [text, setText] = useState('');
  const state = useRef<{
    exampleIdx: number;
    charIdx: number;
    phase: 'typing' | 'pause' | 'deleting' | 'pauseBefore';
    cursorVisible: boolean;
  }>({ exampleIdx: 0, charIdx: 0, phase: 'typing', cursorVisible: true });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when industry changes
  const industryRef = useRef(industry);
  useEffect(() => {
    if (industryRef.current !== industry) {
      industryRef.current = industry;
      state.current = {
        exampleIdx: 0,
        charIdx: 0,
        phase: 'typing',
        cursorVisible: true,
      };
      setText('');
    }
  }, [industry]);

  useEffect(() => {
    if (!enabled) {
      setText('');
      return;
    }

    cursorRef.current = setInterval(() => {
      state.current.cursorVisible = !state.current.cursorVisible;
      const example = examples[state.current.exampleIdx];
      const current = example.slice(0, state.current.charIdx);
      setText(current + (state.current.cursorVisible ? '|' : ' '));
    }, 530);

    const rand = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const tick = () => {
      const { exampleIdx, charIdx, phase } = state.current;
      const example = examples[exampleIdx];

      if (phase === 'typing') {
        const next = charIdx + 1;
        state.current.charIdx = next;
        setText(
          example.slice(0, next) + (state.current.cursorVisible ? '|' : ' ')
        );

        if (next >= example.length) {
          state.current.phase = 'pause';
          timerRef.current = setTimeout(tick, pauseAfter);
        } else {
          const ch = example[next - 1];
          const delay =
            ch === '.' || ch === ','
              ? rand(120, 200)
              : rand(minSpeed, maxSpeed);
          timerRef.current = setTimeout(tick, delay);
        }
      } else if (phase === 'pause') {
        state.current.phase = 'deleting';
        timerRef.current = setTimeout(tick, deleteSpeed);
      } else if (phase === 'deleting') {
        const next = charIdx - 1;
        state.current.charIdx = next;
        setText(
          examples[exampleIdx].slice(0, next) +
            (state.current.cursorVisible ? '|' : ' ')
        );

        if (next <= 0) {
          const nextIdx = (exampleIdx + 1) % examples.length;
          state.current = {
            exampleIdx: nextIdx,
            charIdx: 0,
            phase: 'pauseBefore',
            cursorVisible: true,
          };
          timerRef.current = setTimeout(tick, pauseBefore);
        } else {
          timerRef.current = setTimeout(tick, deleteSpeed);
        }
      } else {
        state.current.phase = 'typing';
        timerRef.current = setTimeout(tick, rand(minSpeed, maxSpeed));
      }
    };

    timerRef.current = setTimeout(tick, 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (cursorRef.current) clearInterval(cursorRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, industry]);

  return text;
}
