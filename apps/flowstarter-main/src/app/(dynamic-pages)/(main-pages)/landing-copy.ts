/** Centralized landing page copy. Edit here instead of JSX. */

export interface PricingPlan {
  name: string;
  label: string;
  setupPrice: string;
  monthlyPrice: string;
  features: readonly string[];
  cta: string;
  status: 'available' | 'coming-soon';
  badge?: string;
  recommended?: boolean;
}

export interface DifferentiationCard {
  label: string;
  description: string;
  highlighted?: boolean;
}

export const LANDING_COPY = {
  nav: {
    templatesLabel: 'Templates',
  },
  hero: {
    headlinePrefix: 'Launch your online business',
    headlineHighlight: 'without tech skills or expensive agencies',
    subheadline:
      'We build your initial setup for you, then you manage and grow everything from Flowstarter with an AI-powered editor.',
    primaryCta: 'Launch my business',
    secondaryCta: 'See pricing',
    trustLine:
      'Built for creators, freelancers and small businesses who want to get online and monetize faster.',
  },
  process: {
    title: 'A done-for-you launch system with full control after',
    steps: [
      {
        number: '01',
        title: 'We launch the foundation',
        description:
          'We create the initial structure for your business: landing page, offer structure, and key integrations.',
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
      },
      {
        icon: 'wallet',
        title: 'Agencies are expensive and slow',
      },
      {
        icon: 'puzzle',
        title: 'Most website builders still leave you alone with the hard parts',
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
      },
      {
        icon: 'layers',
        title: 'Business structure for your offer or services',
      },
      {
        icon: 'calendar',
        title: 'Booking and lead capture integrations',
      },
      {
        icon: 'creditCard',
        title: 'Payments and email tools on higher tiers',
      },
      {
        icon: 'sparkles',
        title: 'AI-powered editing',
      },
      {
        icon: 'layout',
        title: 'Central dashboard for management',
      },
    ],
  },
  pricing: {
    title: 'Simple, transparent pricing',
    subtitle: 'One setup fee. One monthly subscription. Full control.',
    note:
      'No tech skills needed. No expensive agency contracts. Full control after launch.',
    plans: [
      {
        name: 'STARTER',
        label: 'For getting online fast',
        setupPrice: '499€',
        monthlyPrice: '39€/month',
        features: [
          'Landing page',
          'Business structure',
          'Calendly integration',
          'Basic analytics',
          'AI editor',
          'Dashboard access',
        ],
        cta: 'Launch with Starter',
        status: 'available',
      },
      {
        name: 'GROWTH',
        label: 'For starting to monetize',
        setupPrice: '999€–1499€',
        monthlyPrice: '59€/month',
        features: [
          'Everything in Starter',
          'Mailchimp integration',
          'Stripe setup',
          'Simple funnel structure',
          'Advanced analytics',
          'Conversion-ready setup',
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
          'Advanced flows',
          'Multi-page setup',
          'Priority support',
        ],
        cta: 'Coming Soon',
        badge: 'Coming Soon',
        status: 'coming-soon',
      },
    ],
  },
  differentiation: {
    title: 'Not just a website builder. Not just an agency.',
    cards: [
      {
        label: 'Website builders',
        description: 'Give you tools, but not a real start.',
      },
      {
        label: 'Agencies',
        description: 'Build for you, but leave you dependent.',
      },
      {
        label: 'Flowstarter',
        description:
          'Launches your foundation for you and gives you control to manage and grow it.',
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
          'A done-for-you launch setup with your landing page, offer structure, key integrations, dashboard access, and the AI editor to manage it after launch.',
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
          'No. Flowstarter is built for people who want a serious online presence without learning the technical stack.',
      },
      {
        question: 'What changes on the higher tiers?',
        answer:
          'Growth adds monetization-focused setup like Stripe, Mailchimp, and a simple funnel structure. Pro expands into advanced flows and multi-page setups.',
      },
      {
        question: 'Am I locked into an agency relationship?',
        answer:
          'No. The setup is done for you, but the goal is long-term control on your side rather than ongoing dependency.',
      },
    ],
  },
  finalCta: {
    headline: 'Stop waiting months to get online',
    body:
      'Get your business foundation launched in days, then manage and grow it with Flowstarter.',
    cta: 'Launch my business',
  },
};