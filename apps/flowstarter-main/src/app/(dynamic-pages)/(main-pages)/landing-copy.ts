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
  hero: {
    headlinePrefix: 'The clients you want are already searching.',
    headlineHighlight: "Let's aim them your way.",
    subheadlineBold: '',
    subheadline:
      'New build or a tired site? One call—we shape the site around your business. You steer it with the smart editor: no code pile-up, no endless email chains.',
    primaryCta: 'Book a free discovery call',
    secondaryCta: 'See plans and pricing',
    trustLine:
      'Coaches, consultants, therapists, freelancers, founders—fresh launch or overdue relaunch.',
    guarantee:
      'First month free. Not happy in 30 days? We refund 50% of your setup fee. No questions asked.',
  },
  process: {
    title: 'From conversation to launch, hand-crafted.',
    steps: [
      {
        number: '01',
        title: 'Discovery call (30 minutes)',
        description:
          'We unpack your offer, positioning, and must-haves. Ask anything—we will tell you plainly if someone else should do the job.',
      },
      {
        number: '02',
        title: 'Design and build',
        description:
          'We design and build with your assets and tone. Drafts arrive on a predictable rhythm—no blackout periods.',
      },
      {
        number: '03',
        title: 'Review and launch',
        description:
          'Polish passes from your feedback, then DNS, SSL, inbox—the boring bits handled before anyone visits.',
      },
      {
        number: '04',
        title: 'Maintain and grow',
        description:
          'Iterate in the editor between calls—we stay reachable for heavier lifts when you hit a ceiling.',
      },
    ],
  },
  problem: {
    title: 'Forget about frustrating choices like these.',
    pains: [
      {
        icon: 'puzzle',
        title: 'DIY builders',
        body: 'Friendly to spin up—hard to make look like a serious practice once someone compares you to competitors.',
      },
      {
        icon: 'wallet',
        title: 'Traditional agencies',
        body: 'They charge €5,000 or more and take months. Every small change after launch costs you days of waiting.',
      },
      {
        icon: 'sparkles',
        title: 'AI generators',
        body: "Fast drafts, shallow structure—thin pages that read like everybody else's MVP.",
      },
    ],
    closing: 'Flowstarter skips that triangle.',
  },
  included: {
    title: 'Everything wired up before you touch a thing.',
    cards: [
      {
        icon: 'globe',
        title: 'A premium site, designed and built for you',
        description:
          'Design and build tailored to your offer—live on your domain before you wrestle DNS alone.',
      },
      {
        icon: 'calendar',
        title: 'Cal.com booking, integrated',
        description:
          'Clients book without the email tennis match—Cal.com already wired to your rules.',
      },
      {
        icon: 'briefcase',
        title: 'Newsletter service ready to send',
        description:
          'List + first send ready on day one—no extra SaaS stack to babysit.',
      },
      {
        icon: 'sparkles',
        title: 'Leads collector wired up from the start',
        description:
          'Inbound hits a structured inbox so opportunities do not dissolve in Slack threads.',
      },
      {
        icon: 'layout',
        title: 'Your editor, included with the subscription',
        description:
          'Revise copy or sections when you need to—editor access, maintenance, and support stay bundled. Cancel anytime; the site keeps running on your infrastructure.',
      },
      {
        icon: 'layers',
        title: 'Domain and professional email',
        description:
          'Domain, SSL, inbox at your hostname—routing handled before visitors arrive.',
      },
    ],
  },
  pricing: {
    title: 'Simple, transparent pricing.',
    subtitle: 'Two ways to work with us. Both start with a discovery call.',
    socialProof:
      'Only a handful of new builds open each month so nothing turns into conveyor-belt shipping.',
    note: 'Need something custom? We also handle site relaunches, e-commerce storefronts, and bespoke projects. Just mention your needs in the discovery call.',
    plans: [
      {
        name: 'STARTER',
        label: 'Launch your professional presence',
        setupPrice: 'Starting from €799',
        monthlyPrice: '+ €49 / month',
        features: [
          'Custom-built website (5 to 7 pages)',
          'Hosting and domain included',
          'smart editor (50 edits per month)',
          'Discovery call and ongoing support',
        ],
        cta: 'Book a free discovery call',
        status: 'available',
      },
      {
        name: 'PRO',
        label: 'For growing premium businesses',
        setupPrice: 'Starting from €1,499',
        monthlyPrice: '+ €99 / month',
        features: [
          'Everything in Starter',
          'Extended pages and integrations',
          'Stripe integration for digital products',
          'smart editor (150 edits per month)',
          'Priority support',
        ],
        cta: 'Book a free discovery call',
        badge: 'Most Popular',
        recommended: true,
        status: 'available',
      },
      {
        name: 'ECOMMERCE',
        label: 'A full storefront, when you are ready to sell',
        setupPrice: 'Coming soon',
        monthlyPrice: '',
        features: [
          'Full Shopify-style storefront, hand-crafted',
          'Physical and digital products',
          'Inventory, shipping, and tax sorted',
          'Order emails and customer notifications',
          'Stripe checkout, end to end',
          'Everything in Pro included',
        ],
        cta: 'Notify me when ready',
        badge: 'Coming Soon',
        status: 'coming-soon',
      },
    ],
    guarantee:
      'We collect 50% upfront to begin the build. The remaining 50% is due only when you sign off on the result. After launch, your monthly subscription covers the smart editor, hosting, domain, and ongoing support.',
  },
  differentiation: {
    title: 'What makes Flowstarter different.',
    cards: [
      {
        label: 'Hand-crafted, not template-spammed',
        description:
          'No marketplace theme swaps—layouts are authored for one business at a time.',
      },
      {
        label: 'smart editor for life',
        description:
          'Describe tweaks in plain English—copy, imagery, testimonials—without opening a codebase or begging a freelancer.',
      },
      {
        label: 'Limited spots, by design',
        description:
          'Small monthly intake keeps every roadmap human-sized—fewer spreadsheets, more listening.',
        highlighted: true,
      },
    ],
  },
  audience: {
    title: 'Built for service professionals who value craft.',
    items: [
      { icon: 'users', label: 'Coaches' },
      { icon: 'mic', label: 'Consultants' },
      { icon: 'check', label: 'Therapists' },
      { icon: 'sparkles', label: 'Photographers' },
      { icon: 'layout', label: 'Creatives' },
      { icon: 'briefcase', label: 'Independent professionals' },
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
          'Senior UX coaching practice—shipping copy, calendar, credibility on the same domain.',
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
          'Danube-side tackle shop—catalog, checkout, and logistics language tuned for serious anglers.',
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
          "Dorin's portfolio starter—grab it from the library when you need a credible launch fast.",
        thumbnail: '/showcase/dorin-portfolio.png',
        thumbnailDark: null,
        href: '/library/templates/dorin-portfolio',
        external: false,
        status: 'live' as const,
      },
    ],
  },
  faq: {
    title: 'Frequently asked questions.',
    items: [
      {
        question: 'How long does it take to build my site?',
        answer:
          'We agree on a realistic timeline together during the discovery call, then keep you in the loop the whole way. We aim to ship faster than traditional agencies, without rushing the craft.',
      },
      {
        question: 'Do I own my website?',
        answer:
          'Yes, completely. Your site is deployed on your own domain, and you can take the code with you anytime. No lock-in, no platform tax.',
      },
      {
        question: 'What if I want to make changes after launch?',
        answer:
          'Use the smart editor. Just describe what you want in plain English (“change the hero headline to X” or “add a testimonial from Sarah”) and the editor handles it. No system to learn.',
      },
      {
        question: "What's included in the monthly fee?",
        answer:
          'Hosting, domain renewal, ongoing support, and your monthly smart editor allowance. 50 edits for Starter, 150 for Pro. Most clients stay well within their plan, and add-on packs are available if you need more.',
      },
      {
        question: 'What if I already have a website?',
        answer:
          "We handle relaunches too. We'll analyze your current site, migrate the content that matters, and rebuild it the right way. Mention your existing site in the discovery call for a custom quote.",
      },
      {
        question: 'Can you handle e-commerce or selling courses?',
        answer:
          "Yes. Pro includes Stripe integration for digital products, courses, bookings, and memberships. Full Shopify-style storefronts are coming soon. Let us know in the discovery call if that's what you need.",
      },
      {
        question: 'Why limit how many clients you take on?',
        answer:
          'Because every site is hand-crafted by us, Darius and Dorin, with AI as our assistant. We take a limited number of new clients each month so every project gets the attention it deserves. We choose craft over volume, every time.',
      },
      {
        question: 'What if I need more AI edits than my plan includes?',
        answer:
          "We offer edit add-on packs starting at €15 a month for an extra 25 edits, up to €45 a month for 100 additional edits. We'll discuss the right setup with you in the discovery call or whenever your needs grow.",
      },
    ],
  },
};
