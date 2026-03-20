/** Centralized landing page copy. Edit here instead of JSX. */

export interface HeroCopy {
  headlinePrefix: string;
  headlineHighlight: string;
  subheadlineBold: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  trustLine: string;
  guarantee: string;
}

export interface PricingSectionCopy {
  title: string;
  subtitle: string;
  socialProof?: string;
  plans: PricingPlan[];
  note: string;
  relaunchNote?: string;
  guarantee: string;
}

export interface PricingPlan {
  name: string;
  label: string;
  setupPrice: string;
  monthlyPrice: string;
  features: readonly string[];
  cta: string;
  ctaVariant?: 'primary' | 'secondary' | 'outline';
  status: 'available' | 'coming-soon';
  badge?: string;
  recommended?: boolean;
}

export interface DifferentiationCard {
  label: string;
  description: string;
  bullets?: string[];
  highlighted?: boolean;
}

export const LANDING_COPY = {
  nav: {
    templatesLabel: 'Templates',
  },
  hero: {
    headlinePrefix: 'Launch your online business',
    headlineHighlight: 'without technical skills or expensive setup',
    subheadlineBold: 'Your website, live in days. Not months.',
    subheadline:
      'We handle the build from scratch. You run it yourself from day one.',
    primaryCta: 'Talk to us. First call is free.',
    secondaryCta: 'See pricing',
    trustLine:
      'Built for creators, freelancers and small businesses who want to get online and monetize faster.',
    guarantee: '50% setup fee refundable within 30 days. Includes a 30-day subscription trial — no risk.',
  },
  process: {
    title: 'We do the hard part. You stay in control permanently.',
    steps: [
      {
        number: '01',
        title: 'We launch the foundation',
        description:
          'We create the initial structure for your business: your website, your offer structure, and your essential tools connected.',
      },
      {
        number: '02',
        title: 'You manage everything from one dashboard',
        description:
          'Edit content, update sections, track basics, and customize your site without technical knowledge.',
      },
      {
        number: '03',
        title: 'Grow with AI assistance',
        description:
          'Use the AI editor to refine copy, improve structure, and evolve your online presence over time.',
      },
    ],
  },
  problem: {
    title: 'Starting online is harder than it should be',
    pains: [
      {
        icon: 'clock',
        title: 'Building a website from scratch takes too much time',
        body: 'Every hour spent on design, copy, and setup is an hour not spent on clients, sales, or the actual work that pays.',
      },
      {
        icon: 'wallet',
        title: 'Getting online takes too long and costs too much',
        body: 'Agencies charge thousands and take months. DIY builders look simple until you hit the first technical wall.',
      },
      {
        icon: 'puzzle',
        title: 'Most website builders still leave you alone with the hard parts',
        body: 'They give you a blank canvas and call it a product. You still have to figure out structure, copy, tools, and how it all fits together.',
      },
    ],
    closing:
      'Flowstarter gives you a real starting point: we set up the foundation, and you stay in control.',
  },
  pillars: {
    title: 'Built to help you launch, manage, and improve',
    subtitle:
      'Flowstarter combines done-for-you setup with the flexibility to keep moving on your own.',
    items: [
      {
        icon: 'layers',
        title: 'Structured from day one',
        subtitle: 'A real business foundation',
        body:
          'Start with a clear offer structure, sections that make sense, and the essentials already connected.',
      },
      {
        icon: 'layout',
        title: 'Control without complexity',
        subtitle: 'One place to manage',
        body:
          'Make updates, adjust content, and keep your site current without waiting on a developer or agency.',
      },
      {
        icon: 'sparkles',
        title: 'Designed to evolve',
        subtitle: 'AI-assisted growth',
        body:
          'Improve copy, sharpen positioning, and keep iterating as your business grows.',
      },
    ],
  },
  included: {
    title: 'Everything you need to start strong',
    cards: [
      {
        icon: 'globe',
        title: 'Landing page ready to launch',
        description: 'A complete, designed page for your offer — built and live before you touch anything.',
      },
      {
        icon: 'layers',
        title: 'Business structure for your offer or services',
        description: 'Your services, pricing, and positioning laid out clearly so visitors understand and convert.',
      },
      {
        icon: 'calendar',
        title: 'Online booking & contact form',
        description: 'Clients can book a call or reach you directly without you managing a single email thread.',
      },
      {
        icon: 'creditCard',
        title: 'Payment & email tools on higher plans',
        description: 'Accept payments and grow an email list as your business scales to Growth and Pro.',
      },
      {
        icon: 'sparkles',
        title: 'Edit anything with AI, no tech skills',
        description: 'Type what you want changed in plain English. The AI handles copy, layout tweaks, and updates.',
      },
      {
        icon: 'layout',
        title: 'One dashboard to manage it all',
        description: 'Your site, bookings, leads, and settings in one place. No juggling tabs or third-party logins.',
      },
    ],
  },
  pricing: {
    title: 'Simple, transparent pricing',
    subtitle: 'One setup fee. One monthly subscription. Full control.',
    socialProof: 'Only 10 founding clients accepted per month. Beta is open now.',
    note:
      'No tech skills needed. No expensive agency contracts. Full control after launch.',
    relaunchNote: 'Already have a site? Ask about Flowstarter Relaunch on your strategy call.',
    plans: [
      {
        name: 'STARTER',
        label: 'For getting online fast',
        setupPrice: '499€',
        monthlyPrice: '39€/month',
        features: [
          'Landing page',
          'Business structure',
          'Online booking setup',
          'Visitor tracking',
          'Edit your site with AI',
          'Your own business dashboard',
        ],
        cta: 'Claim your Starter spot',
        status: 'available',
      },
      {
        name: 'RELAUNCH',
        label: 'For sites that need a fresh start',
        setupPrice: '699€–999€',
        monthlyPrice: '39€/month',
        features: [
          'Full site audit before kickoff',
          'Content migration from your existing site',
          'SEO redirect mapping',
          'Everything in Starter included',
          'Complexity assessed on strategy call',
        ],
        cta: 'Discuss your project',
        ctaVariant: 'outline',
        status: 'available',
      },
      {
        name: 'GROWTH',
        label: 'For starting to monetize',
        setupPrice: '999€–1499€',
        monthlyPrice: '59€/month',
        features: [
          'Everything in Starter',
          'Email list & newsletters',
          'Online payment setup',
          'Sales page to convert visitors',
          'Visitor & revenue insights',
          'Built to turn visitors into clients',
        ],
        cta: 'Choose Growth',
        badge: 'Recommended',
        status: 'available',
      },
      {
        name: 'PRO',
        label: 'For scaling a real business',
        setupPrice: '1999€+',
        monthlyPrice: '79€/month',
        features: [
          'Everything in Growth',
          'Digital product selling',
          'Physical product selling',
          'Custom booking & automations',
          'Full multi-page website',
          'Priority support',
        ],
        cta: 'Coming Soon',
        badge: 'Coming Soon',
        status: 'coming-soon',
      },
    ],
  },
  differentiation: {
    title: 'A new kind of launch service.',
    cards: [
      {
        label: 'Website builders',
        description: 'Give you tools, but not a real start.',
      },
      {
        label: 'DIY tools & freelancers',
        description: 'Require time, technical knowledge, and ongoing coordination.',
      },
      {
        label: 'Flowstarter',
        description:
          'Launches your foundation for you and gives you control to manage and grow it.',
        bullets: [
          'Done-for-you setup, live in days',
          'Your own AI editor, no tech skills needed',
          'Landing page, booking, and structure included',
          'One dashboard to manage everything after launch',
          'Real humans behind it, not just a tool',
        ],
        highlighted: true,
      },
    ],
  },
  audience: {
    title: 'Who Flowstarter is for',
    items: [
      { icon: 'briefcase', label: 'Freelancers launching services' },
      { icon: 'mic', label: 'Creators building an audience and offer' },
      { icon: 'users', label: 'Coaches and consultants' },
      { icon: 'store', label: 'Small businesses needing a clean online launch' },
      { icon: 'rocket', label: 'Founders validating a new idea fast' },
      { icon: 'check', label: 'Non-technical professionals' },
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        question: 'What exactly do I get?',
        answer:
          'A done-for-you launch setup with your landing page, offer structure, essential tools connected, your own dashboard, and AI editing so you can manage it all after launch.',
      },
      {
        question: 'Already have a site that isn\'t working for you?',
        answer:
          'If you have an existing site but it\'s not converting, looks outdated, or no longer reflects your business, Flowstarter Relaunch is built for you. We audit what you have, migrate your content into a production-ready template, and hand you back a site with a real foundation. Pricing starts at €699 depending on the complexity of your current setup. Book a strategy call and we\'ll assess it together.',
      },
      {
        question: 'How long does launch usually take?',
        answer:
          'The goal is to get your foundation online in days, not months. Timing depends on scope, but the setup is intentionally lean and fast.',
      },
      {
        question: 'Can I update the site myself after launch?',
        answer:
          'Yes. You can edit content, update sections, and keep improving the site from Flowstarter without technical knowledge.',
      },
      {
        question: 'Do I need technical skills?',
        answer:
          'No. Flowstarter is built for people who want a serious online presence without learning to code.',
      },
      {
        question: 'What changes on the higher tiers?',
        answer:
          'Growth adds online payments, email marketing, and a sales page to turn visitors into clients. Pro expands into a full multi-page website and custom automations.',
      },
      {
        question: 'Am I locked into a long-term contract?',
        answer:
          'No. The setup is done for you, but the goal is long-term control on your side rather than ongoing dependency.',
      },
    ],
  },
  finalCta: {
    headline: 'Stop waiting months to get online',
    body:
      'Get your business foundation launched in days, then manage and grow it with Flowstarter.',
    cta: 'Talk to us. First call is free.',
  },
};