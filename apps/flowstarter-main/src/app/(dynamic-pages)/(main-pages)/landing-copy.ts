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
  status: 'available';
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
  hero: {
    headlinePrefix: 'The clients you want are already searching.',
    headlineHighlight: "Let's aim them your way.",
    subheadlineBold: '',
    subheadline:
      'New build or a tired site that needs rescuing? We get on one call, learn your business, and shape the site around it. After that you run it yourself with the smart conversational editor. No code piling up, no email chains that go nowhere.',
    primaryCta: 'Get my custom plan',
    secondaryCta: 'See plans and pricing',
    trustLine:
      'For coaches, consultants, therapists, freelancers and founders, whether you are launching for the first time or finally fixing the site you have.',
    guarantee:
      'First month is free. If you are not happy within 30 days, we refund half your setup fee and you keep the work.',
  },
  process: {
    title: 'How a project actually goes.',
    steps: [
      {
        number: '01',
        title: 'Custom plan and discovery call',
        description:
          'Answer a few quick questions and you get a plan made for you. Then we talk for 30 minutes about what you do and what you need. If we are not the right fit, we tell you on that call.',
      },
      {
        number: '02',
        title: 'Design and build',
        description:
          'We design and build it using your photos, your words and your style. You see progress on a set schedule, so you are never left wondering what is going on.',
      },
      {
        number: '03',
        title: 'Review and launch',
        description:
          'You tell us what to change, we polish it, then we handle the technical setup, domain, security and email, so it all just works before anyone sees it.',
      },
      {
        number: '04',
        title: 'Maintain and grow',
        description:
          'Between calls you change things yourself, just by asking. When something is bigger than that, we are still here.',
      },
    ],
  },
  problem: {
    title: 'You know how this usually goes.',
    pains: [
      {
        icon: 'puzzle',
        title: 'DIY builders',
        body: 'Quick to stand up, but it stops looking like a serious practice the moment a prospect compares you to a competitor.',
      },
      {
        icon: 'wallet',
        title: 'Traditional agencies',
        body: 'They want €5,000 or more and take months. Then every small change after launch costs you days of waiting on someone else.',
      },
      {
        icon: 'sparkles',
        title: 'AI generators',
        body: 'Drafts in seconds, but the structure is thin. The pages read like everyone else who used the same tool.',
      },
    ],
    closing: 'Flowstarter is the option that is none of those.',
  },
  included: {
    title: 'Set up before you touch a thing.',
    cards: [
      {
        icon: 'globe',
        title: 'A site designed and built for you',
        description:
          'Designed around your offer and live on your domain before you would have finished fighting with DNS on your own.',
      },
      {
        icon: 'calendar',
        title: 'Cal.com booking, already connected',
        description:
          'Clients pick a time without the back-and-forth email. Cal.com is wired to your availability rules from day one.',
      },
      {
        icon: 'briefcase',
        title: 'Newsletter ready to send',
        description:
          'Your list and your first send are ready on launch day. No extra SaaS subscription for you to manage.',
      },
      {
        icon: 'sparkles',
        title: 'Lead capture from the start',
        description:
          'Enquiries land in a structured inbox instead of getting lost in a Slack thread you forgot to check.',
      },
      {
        icon: 'layout',
        title: 'Your editor, part of the subscription',
        description:
          'Change copy or sections whenever you want. Editor access, maintenance and support are all in the subscription. Cancel anytime and the site keeps running on your own infrastructure.',
      },
      {
        icon: 'layers',
        title: 'Domain and professional email',
        description:
          'Domain, SSL and an inbox at your own hostname. The routing is handled before your first visitor shows up.',
      },
    ],
  },
  pricing: {
    title: 'Pricing, no surprises.',
    subtitle:
      'A one-time build, then a monthly plan you pick separately. Both start with a discovery call.',
    socialProof:
      'We only open a handful of new builds each month, so nothing turns into conveyor-belt work.',
    note: 'The monthly plan is independent of the build: Starter €49 (30 AI edit sessions), Pro €99 (60, 2×), Max €249 (120, 4× + code). Stores run on a dedicated €129/mo plan with 90 AI edit sessions plus store editing. Relaunches and one-off custom work are quoted on the call.',
    plans: [
      {
        name: 'STARTER',
        label: 'Get your professional presence online',
        setupPrice: 'One-time build from €799',
        monthlyPrice: '+ monthly plan from €49',
        features: [
          'Custom-built website (5 to 7 pages)',
          'Hosting and domain included',
          'Smart conversational editor, sessions set by your monthly plan',
          'Discovery call and ongoing support',
        ],
        cta: 'Get my custom plan',
        status: 'available',
      },
      {
        name: 'PRO',
        label: 'For service businesses that are growing',
        setupPrice: 'One-time build from €1,199',
        monthlyPrice: '+ monthly plan from €49',
        features: [
          'Everything in Starter',
          'More pages and integrations',
          'Stripe integration for digital products',
          'Pair with the Pro or Max plan for more edit sessions',
          'Priority support',
        ],
        cta: 'Get my custom plan',
        badge: 'Most Popular',
        recommended: true,
        status: 'available',
      },
      {
        name: 'ECOMMERCE',
        label: 'A full storefront, ready to sell',
        setupPrice: 'One-time build from €1,499',
        monthlyPrice: '+ €129 / month store plan',
        features: [
          'Full Shopify-style storefront, built for you',
          'Physical and digital products',
          'Inventory, shipping and tax handled',
          'Order emails and customer notifications',
          'Stripe checkout, end to end',
          'Dedicated Pro+ plan (90 edit sessions/mo) + store editing',
        ],
        cta: 'Get my custom plan',
        status: 'available',
      },
    ],
    guarantee:
      'You pay half the one-time build upfront so we can start; the rest only once you sign off. The monthly plan is separate, starts after your free first month, and covers the smart conversational editor, hosting, domain and support. Change or cancel the plan anytime.',
  },
  differentiation: {
    title: 'Why people pick us.',
    cards: [
      {
        label: 'Built for you, not pulled off a shelf',
        description:
          'No off-the-shelf templates. The layout is built for one business: yours.',
      },
      {
        label: 'The editor stays yours',
        description:
          'Change wording, photos or testimonials just by asking. No software to open, no freelancer to chase.',
      },
      {
        label: 'A few clients at a time, on purpose',
        description:
          'Taking a small number of projects each month keeps the work human. We spend the time listening instead of managing a queue.',
        highlighted: true,
      },
    ],
  },
  audience: {
    title: 'For small businesses across Europe, service or store.',
    items: [
      { icon: 'users', label: 'Coaches' },
      { icon: 'mic', label: 'Consultants' },
      { icon: 'check', label: 'Therapists' },
      { icon: 'sparkles', label: 'Photographers' },
      { icon: 'briefcase', label: 'Independent professionals' },
      { icon: 'store', label: 'Online stores' },
      { icon: 'store', label: 'Makers and retailers' },
      { icon: 'store', label: 'Small product sellers' },
    ],
  },
  proof: {
    libraryUrl: '/library',
    items: [
      {
        slug: 'ux-journey',
        title: 'UX Journey',
        meta: 'Coaching · Live · 2026',
        kicker:
          'A senior UX coaching practice. Copy, calendar and credibility, all on one domain.',
        thumbnail: '/showcase/ux-journey.png',
        thumbnailDark: null,
        placeholder: 'ux-journey.com',
        href: 'https://ux-journey.com/',
        external: true,
        status: 'live' as const,
      },
      {
        slug: 'lebadusul',
        title: 'Lebădușul',
        meta: 'Retail · Live · 2026',
        kicker:
          'A Danube-side tackle shop. Catalog, checkout and logistics copy written for serious anglers.',
        thumbnail: '/showcase/lebadusul.png',
        thumbnailDark: null,
        placeholder: 'lebadusularticoledepescuit.ro',
        href: 'https://lebadusularticoledepescuit.ro/',
        external: true,
        status: 'live' as const,
      },
      {
        slug: 'dorin-portfolio',
        title: 'Portfolio Template',
        meta: 'Portfolio · Starter · Live',
        kicker:
          "Dorin's portfolio starter. Pull it from the library when you need to launch something credible fast.",
        thumbnail: '/showcase/dorin-portfolio.png',
        thumbnailDark: null,
        href: '/library/templates/dorin-portfolio',
        external: false,
        status: 'live' as const,
      },
    ],
  },
  testimonials: {
    title: 'In their words.',
    items: [
      {
        slug: 'lebadusul',
        quote:
          "I sell fishing tackle, not websites. They built me a proper online shop, catalog, checkout and all, and I can change a price or add a product myself without calling anyone. Orders come in while I'm on the water.",
        name: 'Daniel Draga',
        role: 'Owner, Lebădușul',
        href: 'https://lebadusularticoledepescuit.ro/',
      },
      {
        slug: 'ux-journey',
        quote:
          "My old site didn't say what I actually do. Now the copy, the booking calendar and the credibility all sit on one domain, and it looks like the senior practice it is. People book before the first call.",
        name: 'Dorin',
        role: 'UX Journey',
        href: 'https://ux-journey.com/',
      },
    ],
  },
  faq: {
    title: 'Questions we get asked a lot.',
    items: [
      {
        question: 'Why is there a deposit to book the discovery call?',
        answer:
          "It is 10% of your tier's setup fee (around €79 for Starter, €119 for Pro, €149 for Commerce) and it holds your slot. It keeps the calendar honest and means we show up prepared. If you decide not to go ahead after the call, you get it back in full, before any build work starts. If you do go ahead, it counts toward your setup fee, so you are not paying twice.",
      },
      {
        question: 'How long does it take to build my site?',
        answer:
          'We set a realistic timeline together on the discovery call and keep you posted the whole way. We move faster than a traditional agency, but we are not going to rush the parts that matter.',
      },
      {
        question: 'Do I own my website?',
        answer:
          'Completely. It runs on your own domain and you can take the code with you whenever you want. No lock-in, no platform cut.',
      },
      {
        question: 'What if I want to make changes after launch?',
        answer:
          'You describe the change in plain English ("change the hero headline to X", "add a testimonial from Sarah") and the smart conversational editor does it. There is no system to learn.',
      },
      {
        question: "What's included in the monthly fee?",
        answer:
          'Hosting, domain renewal, support and your monthly editor allowance: 50 edits on Starter, 150 on Pro. Most people stay well inside that, and there are add-on packs if you need more.',
      },
      {
        question: 'What if I already have a website?',
        answer:
          'We do relaunches too. We look at what you have, keep the content that is worth keeping, and rebuild the rest properly. Mention your current site on the discovery call and we will quote it.',
      },
      {
        question: 'Can you handle e-commerce or selling courses?',
        answer:
          'Pro includes Stripe for digital products, courses, bookings and memberships. Need a full Shopify-style storefront with inventory, shipping and tax? That is the Ecommerce tier, and it is open now. Tell us what you sell on the call and we will scope it.',
      },
      {
        question: 'Why limit how many clients you take on?',
        answer:
          'Because it is the two of us, Darius and Dorin, with AI doing the heavy lifting and us responsible for the result. A small number of projects a month is the only way each one gets real attention. We would rather do fewer well.',
      },
      {
        question: 'What if I need more AI edits than my plan includes?',
        answer:
          'There are add-on packs: €15 a month for another 25 edits, up to €45 a month for 100 more. We will sort the right setup with you on the call, or later if your needs grow.',
      },
    ],
  },
};
