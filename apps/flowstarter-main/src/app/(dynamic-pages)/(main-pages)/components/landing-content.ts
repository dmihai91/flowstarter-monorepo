/** All landing page copy in one place. Edit here, not in components. */

export const LANDING = {
  nav: {
    links: [
      { label: 'How it works', href: '#solution' },
      { label: 'What\u2019s included', href: '#included' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Who it\u2019s for', href: '#audience' },
    ],
    cta: 'Launch my business',
  },
  hero: {
    headline: 'Launch your online business\u2009—\u2009without tech skills or expensive agencies',
    subheadline: 'We build your initial setup for you, then you manage and grow everything from Flowstarter with an AI-powered editor.',
    primaryCta: 'Launch my business',
    secondaryCta: 'See pricing',
    trustLine: 'Built for creators, freelancers and small businesses who want to get online and monetize faster.',
  },
  problem: {
    title: 'Starting online is harder than it should be',
    pains: [
      { icon: 'clock', title: 'Building takes too long', description: 'Building a website from scratch takes weeks or months of your time — time you should spend on your actual business.' },
      { icon: 'wallet', title: 'Agencies are expensive', description: 'Hiring an agency costs thousands and moves at their pace, not yours. And you\u2019re stuck whenever you need a change.' },
      { icon: 'puzzle', title: 'DIY tools still leave you alone', description: 'Most website builders hand you a blank canvas and say "good luck." The hard parts are still on you.' },
    ],
    closing: 'Flowstarter gives you a real starting point: we set up the foundation, and you stay in control.',
  },
  solution: {
    title: 'A done-for-you launch system with full control after',
    steps: [
      { number: '01', title: 'We launch the foundation', description: 'We create the initial structure for your business: landing page, offer structure, and key integrations.' },
      { number: '02', title: 'You manage everything from one dashboard', description: 'Edit content, update sections, track basics, and customize your site without technical knowledge.' },
      { number: '03', title: 'Grow with AI assistance', description: 'Use the AI editor to refine copy, improve structure, and evolve your online presence over time.' },
    ],
  },
  included: {
    title: 'Everything you need to start strong',
    features: [
      { icon: 'globe', title: 'Landing page ready to launch', description: 'A polished, conversion-ready page built around your offer — not a template you have to figure out.' },
      { icon: 'layers', title: 'Business structure for your offer', description: 'Services, pricing, and calls-to-action organized in a way that makes sense for your business.' },
      { icon: 'calendar', title: 'Booking & lead capture', description: 'Calendly integration and lead forms so you can start getting clients from day one.' },
      { icon: 'creditCard', title: 'Payments & email tools', description: 'Stripe and Mailchimp setup on Growth and Pro tiers so you can sell and nurture from the start.' },
      { icon: 'sparkles', title: 'AI-powered editing', description: 'Refine your copy, restructure sections, and improve your site using natural language — no code needed.' },
      { icon: 'layout', title: 'Central dashboard', description: 'One place to manage your site, track basics, and make updates whenever you want.' },
    ],
  },
  pricing: {
    title: 'Simple pricing. No surprises.',
    note: 'No tech skills needed. No expensive agency contracts. Full control after launch.',
    plans: [
      {
        name: 'Starter',
        price: '499\u20AC',
        monthly: '39\u20AC/mo',
        label: 'For getting online fast',
        features: ['Landing page', 'Business structure', 'Calendly integration', 'Basic analytics', 'AI editor', 'Dashboard access'],
        cta: 'Launch with Starter',
        recommended: false,
      },
      {
        name: 'Growth',
        price: '999\u20AC\u2013\u20091499\u20AC',
        monthly: '59\u20AC/mo',
        label: 'For starting to monetize',
        badge: 'Recommended',
        features: ['Everything in Starter', 'Mailchimp integration', 'Stripe setup', 'Simple funnel structure', 'Advanced analytics', 'Conversion-ready setup'],
        cta: 'Choose Growth',
        recommended: true,
      },
      {
        name: 'Pro',
        price: '1999\u20AC+',
        monthly: '79\u20AC/mo',
        label: 'For scaling a real business',
        features: ['Everything in Growth', 'Digital product selling', 'Physical product selling', 'Advanced flows', 'Multi-page setup', 'Priority support'],
        cta: 'Go Pro',
        recommended: false,
      },
    ],
  },
  differentiation: {
    title: 'Not just a website builder. Not just an agency.',
    cards: [
      { label: 'Website builders', description: 'Give you tools, but not a real start. You\u2019re still on your own figuring out structure, copy, and integrations.' },
      { label: 'Agencies', description: 'Build for you, but leave you dependent. Every small change means another invoice and another wait.' },
      { label: 'Flowstarter', description: 'Launches your foundation for you and gives you full control to manage and grow it — on your terms.', highlighted: true },
    ],
  },
  audience: {
    title: 'Who Flowstarter is for',
    items: [
      { icon: 'briefcase', title: 'Freelancers', description: 'Launch your services online and start getting clients.' },
      { icon: 'mic', title: 'Creators', description: 'Build an audience and monetize your expertise.' },
      { icon: 'users', title: 'Coaches & consultants', description: 'Get a professional presence that books calls and builds trust.' },
      { icon: 'store', title: 'Small businesses', description: 'Get online with a clean, professional launch — fast.' },
      { icon: 'rocket', title: 'Founders', description: 'Validate your idea with a real landing page, not a slide deck.' },
    ],
  },
  finalCta: {
    headline: 'Stop waiting months to get online',
    text: 'Get your business foundation launched in days, then manage and grow it with Flowstarter.',
    cta: 'Launch my business',
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      { q: 'What exactly do I get?', a: 'A done-for-you business foundation: landing page, offer structure, integrations, and access to the AI-powered editor and dashboard to manage everything after launch.' },
      { q: 'How long does it take?', a: 'Most launches are ready within days, not weeks or months. We handle the initial setup so you can focus on your business.' },
      { q: 'Can I edit my site after launch?', a: 'Absolutely. The AI editor lets you update copy, restructure sections, and improve your site using plain language — no coding or design skills needed.' },
      { q: 'Do I need technical skills?', a: 'Not at all. That\u2019s the whole point. We build the foundation, and the AI editor handles the technical parts when you want to make changes.' },
      { q: 'What if I need more features later?', a: 'You can upgrade your plan anytime. Growth adds monetization tools (Stripe, Mailchimp), and Pro adds advanced flows and multi-page setups.' },
      { q: 'Is there a long-term contract?', a: 'No contracts. The setup fee is one-time, and the monthly fee is cancel-anytime. You keep your site either way.' },
    ],
  },
} as const;
