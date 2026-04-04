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
    headlinePrefix:
      'Your clients are searching for someone exactly like you.',
    headlineHighlight: 'Make sure they find you.',
    subheadlineBold: '',
    subheadline:
      'One call. We build your professional site in 5–7 days. You manage it with a smart editor. No code, no agency, no waiting.',
    primaryCta: "Let's build it",
    secondaryCta: 'See plans & pricing',
    trustLine:
      'For coaches, consultants, therapists, freelancers, and founders who want to look as good online as they are in real life.',
    guarantee:
      'Only 8 new projects per month — and we take 50% upfront, the rest only when you love it. Book your spot before it fills.',
  },
  process: {
    title: "Three steps. One week. A site you're proud of.",
    steps: [
      {
        number: '01',
        title: 'We talk for 45 minutes',
        description:
          "You book a free discovery call. We ask the right questions about your brand, your clients, and what you want your site to do. You don't need to prepare anything.",
      },
      {
        number: '02',
        title: 'We build it',
        description:
          "Our team picks the right template, writes the structure, and customises everything to your brand. You review one draft. We refine. That's it.",
      },
      {
        number: '03',
        title: 'You go live',
        description:
          "Your site launches. You get access to our smart editor — update anything yourself in seconds, no code, no back-and-forth. You're in control.",
      },
    ],
  },
  problem: {
    title: "Getting online shouldn't cost you months of your life.",
    pains: [
      {
        icon: 'clock',
        title: 'Every hour on your website is an hour not spent on clients.',
        body: 'Design decisions. Copy rewrites. Broken forms. It eats weeks — and your competitors are already showing up in Google.',
      },
      {
        icon: 'wallet',
        title:
          "Agencies charge €3,000–€10,000. DIY tools look easy — until they're not.",
        body: "You hit the first technical wall and you're suddenly watching YouTube tutorials at midnight. Still not live.",
      },
      {
        icon: 'puzzle',
        title: 'Website builders give you a blank canvas. Not a business.',
        body: "Choosing fonts, layouts, and plugins for weeks isn't getting you clients. It's just procrastination with extra steps.",
      },
    ],
    closing:
      'Flowstarter skips all of that. One call, and your site is live within a week.',
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
        body: 'Start with a clear offer structure, sections that make sense, and the essentials already connected.',
      },
      {
        icon: 'layout',
        title: 'Control without complexity',
        subtitle: 'One place to manage',
        body: 'Make updates, adjust content, and keep your site sharp — on your own schedule, no dependencies.',
      },
      {
        icon: 'sparkles',
        title: 'Designed to evolve',
        subtitle: 'Built-in smart editor',
        body: 'Improve copy, sharpen positioning, and keep iterating as your business grows.',
      },
    ],
  },
  included: {
    title: 'Everything live before you touch a thing.',
    cards: [
      {
        icon: 'globe',
        title: 'A live landing page for your offer',
        description:
          'Designed, structured, and ready. Live before you touch anything.',
      },
      {
        icon: 'layers',
        title: 'Your services and pricing laid out clearly',
        description:
          'Your offer structure is set up so visitors understand it and convert.',
      },
      {
        icon: 'calendar',
        title: 'Booking and contact, ready to go',
        description:
          'Clients book calls and reach you directly. No inbox management needed.',
      },
      {
        icon: 'creditCard',
        title: 'Payments and email on higher plans',
        description:
          'Accept payments and grow your list as your business scales to Growth and Pro.',
      },
      {
        icon: 'sparkles',
        title: 'Change anything yourself, no code needed',
        description:
          'Type what you want updated. Our smart editor handles the rest. No code, no waiting.',
      },
      {
        icon: 'layout',
        title: 'One dashboard for everything',
        description:
          'Your site, leads, bookings, and settings. All in one place.',
      },
    ],
  },
  pricing: {
    title: 'Clear pricing. No surprises. Rate locked forever.',
    subtitle:
      'Pay once to launch. €39/month keeps everything running — and that rate is yours for life. Cancel anytime.',
    socialProof:
      'Only 8 spots available per month. We take 50% upfront, the rest only when you love the result.',
    note: 'No tech skills needed. No waiting on anyone. Full control after launch.',
    relaunchNote:
      "Already have a site that isn't working? Ask about Flowstarter Relaunch on your discovery call.",
    plans: [
      {
        name: 'STARTER',
        label: 'Get online fast',
        setupPrice: '€499',
        monthlyPrice: '€39/month — locked in forever',
        features: [
          'Live landing page for your offer',
          'Offer and pricing structure set up',
          'Online booking and contact form',
          'Visitor tracking and analytics',
          'Smart editor: update anything yourself',
          'Your own business dashboard',
        ],
        cta: 'Claim your Starter spot',
        status: 'available',
      },
      {
        name: 'RELAUNCH',
        label: 'Already have a site?',
        setupPrice: '€699–€999',
        monthlyPrice: '€39/month — locked in forever',
        features: [
          'Full audit of your existing site',
          'Content migration from your old site',
          'SEO redirect mapping',
          'Everything in Starter included',
          'Complexity assessed on discovery call',
        ],
        cta: 'Discuss your project',
        ctaVariant: 'outline',
        status: 'available',
      },
      {
        name: 'GROWTH',
        label: 'Turn visitors into paying clients',
        setupPrice: '€999–€1,499',
        monthlyPrice: '€59/month — locked in forever',
        features: [
          'Everything in Starter',
          'Email list setup and newsletters',
          'Online payment setup',
          'Sales page built to convert',
          'Visitor and revenue insights',
          'Built to turn traffic into clients',
        ],
        cta: 'Claim your Growth spot',
        badge: 'Most popular',
        recommended: true,
        status: 'available',
      },
      {
        name: 'PRO',
        label: 'Scale your business',
        setupPrice: '€1,999+',
        monthlyPrice: '€79/month',
        features: [
          'Everything in Growth',
          'Digital and physical product selling',
          'Custom booking and automations',
          'Full multi-page website',
          'Priority support',
        ],
        cta: 'Coming Soon',
        badge: 'Coming Soon',
        status: 'coming-soon',
      },
    ],
    guarantee:
      'We collect 50% upfront to start your project. You only pay the remaining 50% when you love the result. Your €39/month rate is locked in for life — new clients after launch pay more.',
  },
  differentiation: {
    title: 'A completely different kind of website launch.',
    cards: [
      {
        label: 'Website builders',
        description:
          'Give you a blank canvas and a 47-tab tutorial. You do all the work.',
      },
      {
        label: 'Web agencies',
        description:
          '€3,000–€10,000 upfront. Weeks of back-and-forth. Then you still need someone to update it.',
      },
      {
        label: 'Flowstarter',
        description:
          'Done for you in days. Smart editor included. Rate locked forever.',
        bullets: [
          'Live in 5–7 days from one 45-min call',
          'Smart editor: update anything yourself, no code',
          'Booking, contact form, and analytics all connected',
          'One dashboard — your leads, your site, your control',
          '50% upfront. Rest only when you love the result.',
        ],
        highlighted: true,
      },
    ],
  },
  audience: {
    title: 'This is for you if...',
    items: [
      {
        icon: 'clock',
        label: "You've been meaning to fix your website for months",
      },
      {
        icon: 'puzzle',
        label: 'You tried DIY tools and hated every minute of it',
      },
      {
        icon: 'mic',
        label: "Your current site doesn't reflect how good you actually are",
      },
      {
        icon: 'users',
        label: 'You want clients to find you, trust you, and reach out',
      },
      {
        icon: 'rocket',
        label: 'You want it done fast, by someone who gets it',
      },
      {
        icon: 'check',
        label: "You're a coach, consultant, therapist, or solo pro",
      },
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        question: 'What exactly do I get?',
        answer:
          'A done-for-you launch: your landing page, offer structure, booking setup, and analytics — all connected. Plus your own dashboard and smart editor so you can manage everything after launch, no developer needed. Most clients are live within 5–7 days.',
      },
      {
        question: 'How does payment work?',
        answer:
          'We collect 50% upfront (€249.50 for Starter) to start your project. You only pay the remaining 50% when you are happy with the result. Your monthly rate (€39/mo for Starter) is locked in for as long as you stay subscribed — new clients who join after launch will pay a higher rate.',
      },
      {
        question: "Already have a site that isn't working for you?",
        answer:
          "Flowstarter Relaunch is built for that. We audit your existing site, migrate your content into a production-ready template, and hand you back a site with a real structure. Pricing starts at €699 depending on complexity. Book a free discovery call and we'll assess it together.",
      },
      {
        question: 'How long does launch usually take?',
        answer:
          'Most sites go live within 5–7 days of your discovery call. We move fast and keep you in the loop throughout.',
      },
      {
        question: 'Can I update the site myself after launch?',
        answer:
          'Yes. Our smart editor lets you rewrite copy, update images, add sections, or change anything — all by describing what you want in plain language. No code, no waiting on anyone.',
      },
      {
        question: 'Do I need technical skills?',
        answer:
          'None. Flowstarter is built for people who want a serious online presence without learning to code. If you can send a WhatsApp, you can manage your site.',
      },
      {
        question: 'What changes on higher plans?',
        answer:
          'Growth adds online payments, email marketing, and a dedicated sales page to turn visitors into paying clients. Pro expands into a full multi-page website with custom automations and priority support.',
      },
      {
        question: 'Am I locked into a long-term contract?',
        answer:
          'No contracts. The setup is a one-time fee. The monthly plan keeps your site, smart editor, and dashboard running. Cancel anytime — and you keep all your site files no matter what.',
      },
    ],
  },
  testimonials: {
    title: 'What our clients say',
    subtitle:
      '40+ sites launched. Average delivery 6 days. 4.9 / 5 client rating.',
    items: [
      {
        quote:
          'I had been meaning to fix my website for two years. Flowstarter had it live in five days. I already had three new clients reach out through it in the first month.',
        name: 'Sophie M.',
        role: 'Leadership Coach',
        initials: 'SM',
      },
      {
        quote:
          "I was skeptical — I'd tried Squarespace, Wix, hired a freelancer. None of it stuck. This was completely different. One call, one draft, done. My site finally looks like a real business.",
        name: 'James R.',
        role: 'Strategy Consultant',
        initials: 'JR',
      },
      {
        quote:
          "I'm not technical at all. The smart editor means I can update my site myself when I need to. I changed my pricing page last week in about two minutes.",
        name: 'Lena K.',
        role: 'Therapist & Wellbeing Coach',
        initials: 'LK',
      },
    ],
  },
  finalCta: {
    headline: 'Your next client is searching for someone like you right now.',
    body: 'Make sure they find you. One 45-minute call is all it takes. No tech skills, no commitment needed. Only 8 spots per month — and we only ask for 50% until you love the result.',
    cta: 'Book a free discovery call',
  },
};
