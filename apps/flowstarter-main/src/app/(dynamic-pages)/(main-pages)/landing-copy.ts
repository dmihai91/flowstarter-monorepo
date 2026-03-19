/** Centralized landing page copy. Edit here instead of JSX. */

export interface HeroCopy {
  headlinePrefix: string;
  headlineHighlight: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  trustLine: string;
  guarantee: string;
}

export interface PricingSectionCopy {
  title: string;
  subtitle: string;
  plans: PricingPlan[];
  note: string;
  guarantee: string;
}

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
    headlineHighlight: 'without technical skills or expensive setup',
    subheadline:
      'We build your initial setup for you, then you manage and grow everything from Flowstarter with our editor.',
    primaryCta: 'Book free strategy call',
    secondaryCta: 'See pricing',
    trustLine:
      'Built for creators, freelancers and small businesses who want to get online and monetize faster.',
    guarantee: '50% setup fee refundable within 30 days. Includes a 30-day subscription trial — no risk.',
  },
  process: {
    title: 'A done-for-you launch system with full control after',
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
      },
      {
        icon: 'wallet',
        title: 'Getting online takes too long and costs too much',
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
        title: 'Online booking & contact form',
      },
      {
        icon: 'creditCard',
        title: 'Payment & email tools on higher plans',
      },
      {
        icon: 'sparkles',
        title: 'Edit anything with AI — no tech skills',
      },
      {
        icon: 'layout',
        title: 'One dashboard to manage it all',
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
          'Online booking setup',
          'Visitor tracking',
          'Edit your site with AI',
          'Your own business dashboard',
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
    cta: 'Book free strategy call',
  },
};