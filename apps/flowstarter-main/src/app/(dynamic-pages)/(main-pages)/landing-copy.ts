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
    title: 'From conversation to launch in two weeks.',
    steps: [
      {
        number: '01',
        title: 'Discovery call (45 minutes)',
        description:
          'We talk about your business, brand, and goals. You ask questions. We tell you honestly if we are the right fit.',
      },
      {
        number: '02',
        title: 'Design and build (7 to 14 days)',
        description:
          'We hand-craft your site using your brand and content. You review progress along the way.',
      },
      {
        number: '03',
        title: 'Review and launch',
        description:
          'Final adjustments based on your feedback. Then we deploy your site on your domain, ready for the world.',
      },
      {
        number: '04',
        title: 'Maintain and grow',
        description:
          'Update anytime with the smart editor. We are here when you need us, for changes, advice, or your next chapter.',
      },
    ],
  },
  problem: {
    title: 'Three frustrating choices for your website.',
    pains: [
      {
        icon: 'puzzle',
        title: 'DIY builders',
        body: 'Easy to start, but they make you look amateur and hurt your credibility.',
      },
      {
        icon: 'wallet',
        title: 'Traditional agencies',
        body: 'They charge €5,000 or more and take months. Every small change after launch costs you days of waiting.',
      },
      {
        icon: 'sparkles',
        title: 'AI generators',
        body: 'Fast and cheap, but they spit out generic, soulless sites that all look the same.',
      },
    ],
    closing: 'There is a fourth way.',
  },
  included: {
    title: 'Everything wired up before you touch a thing.',
    cards: [
      {
        icon: 'globe',
        title: 'A premium site, designed and built for you',
        description:
          'Concierge design and build, tailored to your brand and your service. Live before you touch anything.',
      },
      {
        icon: 'calendar',
        title: 'Cal.com booking, integrated',
        description:
          'Clients self-schedule on your terms. No inbox tag-of-war, no scheduling tools to wire up later.',
      },
      {
        icon: 'briefcase',
        title: 'Newsletter service ready to send',
        description:
          'Capture subscribers and send your first campaign on day one. No separate platform to set up.',
      },
      {
        icon: 'sparkles',
        title: 'Leads collector wired up from the start',
        description:
          'Forms route directly to a structured leads inbox so you never lose a prospect.',
      },
      {
        icon: 'layout',
        title: 'Your editor, included with the subscription',
        description:
          'Edit your site on demand, whenever you want. The subscription bundles your editor, ongoing maintenance, and support. Cancel anytime, your site keeps running.',
      },
      {
        icon: 'layers',
        title: 'Domain and professional email',
        description:
          'Custom domain connected and email at your domain set up before launch. We handle the DNS work.',
      },
    ],
  },
  pricing: {
    title: 'Simple, transparent pricing.',
    subtitle: 'Two ways to work with us. Both start with a discovery call.',
    socialProof:
      'We work with just 8 new clients each month to ensure dedicated craft and quality on every project.',
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
          '7 to 14 day delivery',
        ],
        cta: 'Book Discovery Call',
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
          '10 to 21 day delivery',
        ],
        cta: 'Book Discovery Call',
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
          'Full Shopify-style storefront, hand-built',
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
          'Every site is built for you, not generated from a stock theme. No two Flowstarter sites look the same.',
      },
      {
        label: 'smart editor for life',
        description:
          'Update content with natural language. Change copy, swap photos, add testimonials. All without touching code or paying a developer.',
      },
      {
        label: '8 clients per month',
        description:
          'We work with a limited number of clients each month to ensure dedicated craft on every project. Quality over volume, always.',
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
  faq: {
    title: 'Frequently asked questions.',
    items: [
      {
        question: 'How long does it take to build my site?',
        answer:
          'Most Starter projects are delivered in 7 to 14 days. Pro projects take 10 to 21 days depending on scope. We agree on the timeline together during the discovery call.',
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
        question: 'Why only 8 clients per month?',
        answer:
          'Because every site is hand-crafted by us, Darius and Dorin, with AI as our assistant. We work with a small number of clients monthly to ensure each project gets the attention it deserves. We choose craft over volume, every time.',
      },
      {
        question: 'What if I need more AI edits than my plan includes?',
        answer:
          "We offer edit add-on packs starting at €15 a month for an extra 25 edits, up to €45 a month for 100 additional edits. We'll discuss the right setup with you in the discovery call or whenever your needs grow.",
      },
    ],
  },
};
