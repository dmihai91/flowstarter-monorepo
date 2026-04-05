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
    headlinePrefix: 'The right clients are out there looking for you.',
    headlineHighlight: "Let's make sure they find you.",
    subheadlineBold: '',
    subheadline:
      "Starting from scratch or tired of a site that isn't working? One call. Starter sites go live in 5–7 days. You stay in control with a smart editor. No code, no waiting, no back and forth.",
    primaryCta: 'Start getting clients',
    secondaryCta: 'See plans and pricing',
    trustLine:
      "For coaches, consultants, therapists, freelancers and founders — whether you're starting from scratch or ready to relaunch.",
    guarantee:
      'First month free. Not happy in 30 days? We refund 50% of your setup fee. No questions asked.',
  },
  process: {
    title: "Three steps. A site you're proud of.",
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
          "Your site launches. You get access to our smart editor so you can update anything yourself in seconds, no code, no waiting. You're in control.",
      },
    ],
  },
  problem: {
    title:
      "Whether you're starting fresh or starting over — getting it right shouldn't take months.",
    pains: [
      {
        icon: 'globe',
        title:
          'No website yet? Every day you wait is a client that found someone else.',
        body: 'You know you need a proper online presence. But between templates, copy, tech, and design decisions, it never gets done. Flowstarter does it for you.',
      },
      {
        icon: 'puzzle',
        title:
          "Already have a site? If it's not getting you clients, it's not working.",
        body: "A site that looks outdated or doesn't convert is costing you leads every day. A fresh start with the right structure changes that.",
      },
      {
        icon: 'wallet',
        title:
          "Traditional website projects take weeks and cost more than expected. DIY tools look easy, until they're not.",
        body: "You hit the first technical wall and you're suddenly watching YouTube tutorials at midnight. Still not live.",
      },
    ],
    closing:
      "Flowstarter skips all of that. One call, and your site gets built properly — whether it's your first or your best.",
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
        body: 'Make updates, adjust content, and keep your site sharp. On your own schedule, no dependencies.',
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
      {
        icon: 'briefcase',
        title: 'Integrations built in',
        description:
          'Calendly for bookings, Google Analytics for traffic insights, and more — all connected at launch, no setup needed on your end.',
      },
    ],
  },
  pricing: {
    title: 'Clear pricing. No surprises. Rate locked forever.',
    subtitle:
      'Pay once to launch. €39/month keeps everything running, and that rate is yours for life. First month is free. If you are not happy within 30 days, we refund 50% of the setup fee.',
    socialProof:
      'Only 8 spots per month. First month free. 50% setup refund if not happy in the first 30 days.',
    note: 'No tech skills needed. Full control after launch.',
    relaunchNote:
      "Already have a site that isn't working? Ask about Flowstarter Relaunch on your discovery call.",
    plans: [
      {
        name: 'STARTER',
        label: 'Get online fast',
        setupPrice: '€499',
        monthlyPrice: '€39/month, locked in forever',
        features: [
          'Live landing page for your offer',
          'Offer and pricing structure set up',
          'Online booking and contact form',
          'Visitor tracking and analytics',
          'Smart editor: update anything yourself',
          'Your own business dashboard',
          'First month free',
          '50% setup refund if not happy in 30 days',
        ],
        cta: 'Claim your Starter spot',
        status: 'available',
      },
      {
        name: 'RELAUNCH',
        label: 'Your existing site, rebuilt to convert',
        setupPrice: '€699–€999',
        monthlyPrice: '€39/month, locked in forever',
        features: [
          'Full audit of what is costing you leads',
          'Content migration from your existing site',
          'SEO redirect mapping so you keep your rankings',
          'New structure built to convert visitors',
          'Everything in Starter included',
          'First month free',
          '50% setup refund if not happy in 30 days',
        ],
        cta: 'Discuss your relaunch',
        ctaVariant: 'outline',
        status: 'available',
      },
      {
        name: 'GROWTH',
        label: 'Turn visitors into paying clients',
        setupPrice: '€999–€1,499',
        monthlyPrice: '€59/month, locked in forever',
        features: [
          'Everything in Starter',
          'Email list setup and newsletters',
          'Online payment setup',
          'Sales page built to convert',
          'Visitor and revenue insights',
          'First month free',
          '50% setup refund if not happy in 30 days',
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
      'We collect 50% upfront to start. The remaining 50% is due only when you love the result. Your first month is free. If you are not happy within 30 days, we refund 50% of your setup fee. No questions asked.',
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
        label: 'Traditional approach',
        description:
          'Longer timelines, higher budgets, and you still need to go back whenever something needs updating.',
      },
      {
        label: 'Flowstarter',
        description:
          "Done for you in days — whether it's your first site or a full relaunch. Smart editor included. Rate locked forever.",
        bullets: [
          'Starter sites live in 5–7 days from one 45-min call',
          'Smart editor: update anything yourself, no code',
          'Booking, contact form, and analytics all connected',
          'One dashboard for your leads, your site, your control',
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
        icon: 'globe',
        label:
          "You don't have a website yet and want to get online properly from day one",
      },
      {
        icon: 'mic',
        label:
          "You have a site but it's not bringing in clients, and you've tried to fix it",
      },
      {
        icon: 'clock',
        label: 'Your website has been on the to-do list for too long',
      },
      {
        icon: 'users',
        label: 'You want clients to find you, trust you, and reach out',
      },
      {
        icon: 'puzzle',
        label: 'You want a professional result without doing it yourself',
      },
      {
        icon: 'rocket',
        label: 'You want it done fast and done properly',
      },
      {
        icon: 'check',
        label: "You're a coach, consultant, therapist, or solo pro",
      },
      {
        icon: 'calendar',
        label:
          'You want booking, analytics, and email all connected and ready from day one',
      },
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        question: 'What exactly do I get?',
        answer:
          'A done-for-you launch: your landing page, offer structure, booking setup, and analytics, all connected. Plus your own dashboard and smart editor so you can manage everything after launch, no developer needed. Starter clients are typically live within 5 to 7 days.',
      },
      {
        question: 'How does payment work? Is there a guarantee?',
        answer:
          'We collect 50% upfront to start your project. You only pay the remaining 50% when you are happy with the result. Your first month of subscription is free. If you are not satisfied within the first 30 days, we refund 50% of the setup fee. No questions asked. Your monthly rate is also locked in for life. New clients who join later pay more.',
      },
      {
        question:
          'My current site exists but it is not getting me clients. Can you help?',
        answer:
          'Yes, that is exactly what the Relaunch plan is for. We audit what is costing you leads, migrate your content, set up proper SEO redirects so you keep your rankings, and rebuild the structure around converting visitors. Pricing starts at €699 depending on complexity. Book a free discovery call and we will assess it together.',
      },
      {
        question: 'How long does launch usually take?',
        answer:
          'Starter sites typically go live within 5–7 days of your discovery call. Relaunch and Growth projects may take a bit longer depending on scope. We move fast and keep you in the loop throughout.',
      },
      {
        question: 'Can I update the site myself after launch?',
        answer:
          'Yes. Our smart editor lets you rewrite copy, update images, add sections, or change anything, just by describing what you want in plain language. No code, no waiting on anyone.',
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
          'No contracts. The setup is a one-time fee. The monthly plan keeps your site, smart editor, and dashboard running. Cancel anytime and you keep all your site files no matter what.',
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
          'I was skeptical. I had tried Squarespace, Wix, even hired a freelancer. None of it stuck. This was completely different. One call, one draft, done. My site finally looks like a real business.',
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
    body: 'Make sure they find you. One 45-minute call is all it takes. No tech skills, no commitment needed. Only 8 spots per month, and we only ask for 50% until you love the result.',
    cta: 'Book a free discovery call',
  },
};
