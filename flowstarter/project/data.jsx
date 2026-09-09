// data.jsx — Flowstarter mock content driving the end-to-end flow.
// One worked example: a solopreneur's idea → validated → built → launched.

// The agents (the hero cast). Stable roles, distinct colors.
const AGENTS = {
  research: { id: 'research', name: 'Vera',  role: 'Researcher', color: 'var(--role-research)', glyph: 'R',
              blurb: 'Market & demand analysis' },
  brand:    { id: 'brand',    name: 'Iris',  role: 'Brand',      color: 'var(--role-brand)',    glyph: 'B',
              blurb: 'Identity, naming, visual system' },
  copy:     { id: 'copy',     name: 'Quinn', role: 'Copywriter', color: 'var(--role-copy)',     glyph: 'C',
              blurb: 'Voice, messaging, page copy' },
  dev:      { id: 'dev',      name: 'Dash',  role: 'Developer',  color: 'var(--role-dev)',      glyph: 'D',
              blurb: 'Site assembly, booking, deploy' },
};
const AGENT_LIST = [AGENTS.research, AGENTS.brand, AGENTS.copy, AGENTS.dev];

// The two doors on the entry screen.
const DOORS = [
  {
    id: 'idea',
    kicker: 'Door one',
    title: 'I have an idea',
    desc: 'Not sure it’s worth pursuing yet. Flowstarter interviews you, pressure-tests the idea, researches the market — then builds it.',
    steps: ['Validate', 'Build', 'Launch'],
    cta: 'Start with my idea',
  },
  {
    id: 'business',
    kicker: 'Door two',
    title: 'I already have a business',
    desc: 'Skip validation. Point the agents at what you do and they’ll build a strong online presence — site, copy, brand, booking — fast.',
    steps: ['Build', 'Launch'],
    cta: 'Build my presence',
  },
];

// The example idea the user "types in".
const SEED_IDEA = "A weekend pottery studio for total beginners — drop-in classes, no commitment, BYO wine.";

// Advisor interview — chat-style pressure-test. 'a' is the advisor (serif voice).
const INTERVIEW = [
  { who: 'a', text: "Love it. Let's pressure-test this before we build anything. First — who is this really for?",
    chips: ['Stressed professionals 28–45', 'Date-night couples', 'Bored on weekends'] },
  { who: 'a', text: "Good. People aren't short of hobbies — what makes them choose pottery over a hundred other things on a Saturday?",
    chips: ['It’s tactile & screen-free', 'Low pressure, no skill needed', 'Instagrammable'] },
  { who: 'a', text: "Here's the hard one. There are already studios nearby charging $45 a class. Why would someone pick yours?",
    chips: ['Drop-in, zero commitment', 'BYO wine / social vibe', 'Total-beginner focus'] },
  { who: 'a', text: "Last thing. If only one of these were true a year from now, which would make this a success?",
    chips: ['Repeat regulars every week', 'Booked-out weekends', 'A waitlist I can raise prices on'] },
];

// Validation report — the differentiator. Built after the interview.
const VALIDATION = {
  verdict: 'go',          // go | caution | rework
  score: 78,
  headline: 'Worth pursuing — with one sharp edge.',
  summary: "Real, recurring demand in your area and a clear wedge (drop-in + social) that the two incumbents don't own. The risk isn't demand — it's repeat visits. Build for regulars, not one-offs.",
  market: [
    { label: 'Local search demand', value: 'Rising', detail: '“pottery class near me” +34% YoY in your metro', tone: 'pos' },
    { label: 'Direct competitors', value: '2 studios', detail: 'Both class-package model, no drop-in', tone: 'warn' },
    { label: 'Willingness to pay', value: '$40–55', detail: 'Drop-in benchmark from comparable cities', tone: 'pos' },
    { label: 'Repeat-visit risk', value: 'Watch', detail: 'Novelty fades; needs a regulars loop', tone: 'neg' },
  ],
  wedge: "Own the words “drop-in” and “no commitment.” The incumbents sell 6-week packages — you sell a Saturday.",
  risks: [
    'One-time novelty visits won’t pay the lease — design a “regulars” offer early.',
    'Wine + kilns = check your local liquor & insurance rules before launch.',
  ],
  persona: { name: 'Maya, 34', tag: 'Burned-out designer', quote: "I want to make something with my hands that isn’t on a screen — but I’m not signing up for a 6-week course." },
};

// Build plan — what the agents will produce. Each maps to an agent.
const BUILD_PLAN = [
  { id: 'name',     agent: 'brand',    label: 'Name & identity',        artifact: 'brand' },
  { id: 'research', agent: 'research', label: 'Audience & positioning', artifact: 'positioning' },
  { id: 'voice',    agent: 'copy',     label: 'Voice & homepage copy',  artifact: 'copy' },
  { id: 'site',     agent: 'dev',      label: 'Site assembly',          artifact: 'site' },
  { id: 'booking',  agent: 'dev',      label: 'Drop-in booking',        artifact: 'booking' },
];

// Live build feed — streamed line by line. agent id + message + optional artifact unlock.
const BUILD_FEED = [
  { agent: 'research', text: 'Pulling demand signals for your metro…' },
  { agent: 'brand',    text: 'Exploring names around “drop-in, unfussy, hands-on”…' },
  { agent: 'brand',    text: 'Landed on a direction: warm, earthy, anti-precious.', artifact: 'brand' },
  { agent: 'research', text: 'Positioning locked: “A Saturday, not a 6-week course.”', artifact: 'positioning' },
  { agent: 'copy',     text: 'Drafting a homepage hero that sells the feeling, not the kiln…' },
  { agent: 'copy',     text: 'Hero + 3 sections written in your voice.', artifact: 'copy' },
  { agent: 'dev',      text: 'Assembling pages, wiring nav and mobile layout…' },
  { agent: 'dev',      text: 'Homepage assembled and responsive.', artifact: 'site' },
  { agent: 'dev',      text: 'Connected a drop-in booking flow with live slots.', artifact: 'booking' },
  { agent: 'research', text: 'This is a strong start — but a human on our team can sharpen the plan and timeline with you.', concierge: true },
  { agent: 'dev',      text: 'Everything I can build is wired. Ready for your review.' },
];

// Human concierge — the warm specialist behind the agents.
const CONCIERGE = {
  name: 'Mara Ellis',
  role: 'Build strategist',
  initials: 'ME',
  blurb: 'When you want a person in the loop, I’m it. Book a quick call and we’ll plan your build together — then our team takes it the rest of the way.',
};

// What the call covers — sets expectations before booking.
const CALL_AGENDA = [
  { icon: 'search', title: 'Walk through your idea', desc: 'We go over what the agents found and where you want to take it.' },
  { icon: 'spark',  title: 'Map the build',          desc: 'Brand, site, copy, booking — what to ship first and what can wait.' },
  { icon: 'rocket', title: 'Agree a plan & timeline', desc: 'You leave with a clear scope and a date your presence goes live.' },
];

// Bookable call slots. status: open | few (limited) — picking one books it.
const CALL_SLOTS = [
  { id: 's1', day: 'Tue', date: 'Jun 10', time: '10:00 AM', tz: 'PT', note: '30 min' },
  { id: 's2', day: 'Tue', date: 'Jun 10', time: '2:30 PM',  tz: 'PT', note: '30 min' },
  { id: 's3', day: 'Wed', date: 'Jun 11', time: '9:00 AM',  tz: 'PT', note: '30 min', few: true },
  { id: 's4', day: 'Wed', date: 'Jun 11', time: '4:00 PM',  tz: 'PT', note: '30 min' },
  { id: 's5', day: 'Thu', date: 'Jun 12', time: '11:30 AM', tz: 'PT', note: '30 min' },
  { id: 's6', day: 'Thu', date: 'Jun 12', time: '3:00 PM',  tz: 'PT', note: '30 min', few: true },
];

// The brand the agents "generate" for the example business.
const GEN_BRAND = {
  name: 'Mudroom',
  tagline: 'Drop in. Get your hands dirty.',
  palette: ['#C2683F', '#E8B07A', '#3C3A34', '#F2EBDD'],
  voice: ['Warm', 'Unfussy', 'A little cheeky'],
};

// homepage copy the Copywriter produces.
const GEN_COPY = {
  hero: 'Make something with your hands this Saturday.',
  sub: 'No course. No commitment. Drop into a beginner pottery class, bring a friend (and a bottle), and leave with something you made.',
  sections: [
    { h: 'Zero experience required', p: 'Every class starts from nothing. If you can squish clay, you’re qualified.' },
    { h: 'Pay for one Saturday', p: 'No 6-week packages. Book a single drop-in for $48 and see if it’s your thing.' },
    { h: 'Bring your people', p: 'BYO wine, bring a friend or a date. The kiln does the rest.' },
  ],
};

// Dashboard projects — the user's portfolio of businesses.
// status: live | building | validating | draft
const PROJECTS = [
  { id: 'mudroom', name: 'Mudroom', kind: 'Drop-in pottery studio', status: 'live',
    progress: 100, hue: '#C2683F', glyph: 'brush', domain: 'mudroom.studio',
    metric: '212 visitors this week', sub: '3 drop-ins booked', updated: 'Live · 2d ago',
    agents: ['research','brand','copy','dev'] },
  { id: 'northside', name: 'Northside Cuts', kind: 'Two-chair barbershop', status: 'building',
    progress: 64, hue: '#3E5C8A', glyph: 'code',
    metric: 'Dev assembling pages', sub: 'Booking flow next', updated: 'Building · just now',
    agents: ['copy','dev'] },
  { id: 'lumen', name: 'Lumen Yoga', kind: 'Sunrise rooftop yoga', status: 'validating',
    progress: 38, hue: '#E0846A', glyph: 'search',
    metric: 'Researching demand', sub: 'Viability scoring…', updated: 'Validating · 1h ago',
    agents: ['research'] },
  { id: 'fernwood', name: 'Fernwood Bakery', kind: 'Neighborhood sourdough', status: 'live',
    progress: 100, hue: '#E0922E', glyph: 'star', domain: 'fernwoodbakery.com',
    metric: '418 visitors this week', sub: '12 pre-orders', updated: 'Live · 5d ago',
    agents: ['brand','copy','dev'] },
  { id: 'tidal', name: 'Tidal Surf Co.', kind: 'Surf lessons & rentals', status: 'building',
    progress: 42, hue: '#3E86E8', glyph: 'globe',
    metric: 'Brand & copy in progress', sub: 'Site assembly next', updated: 'Building · 8m ago',
    agents: ['brand','copy'] },
  { id: 'verde', name: 'Verde Plant Studio', kind: 'Rare houseplants', status: 'draft',
    progress: 0, hue: '#2FB87A', glyph: 'brush',
    metric: 'Draft — not started', sub: 'Idea captured', updated: 'Draft · 3d ago',
    agents: [] },
];

// AI credits — what the user has, consumes, and the plan.
const CREDITS = {
  available: 1240,
  total: 2000,
  plan: 'Studio plan',
  renews: 'Resets Jul 1',
};

// What the agents are doing right now, across all projects.
const LIVE_ACTIVITY = [
  { agent: 'dev',      project: 'Northside Cuts', task: 'Assembling pages & mobile layout', pct: 64 },
  { agent: 'copy',     project: 'Northside Cuts', task: 'Polishing homepage copy', pct: 80 },
  { agent: 'research', project: 'Lumen Yoga',     task: 'Scoring demand & competition', pct: 38 },
];

// Recent credit spend, by agent, for the credits popover.
const RECENT_SPEND = [
  { agent: 'dev',      label: 'Site assembly · Northside Cuts', amt: 120 },
  { agent: 'research', label: 'Market research · Lumen Yoga',   amt: 80 },
  { agent: 'brand',    label: 'Identity & naming · Mudroom',    amt: 60 },
  { agent: 'copy',     label: 'Homepage copy · Mudroom',        amt: 45 },
];

// User profile.
const PROFILE = {
  name: 'Alex Rivera',
  handle: '@alexbuilds',
  initials: 'A',
  email: 'alex@riverastudio.co',
  plan: 'Studio plan',
  joined: 'Joined Mar 2026',
  location: 'Lisbon, PT',
  bio: 'Solo founder turning weekend ideas into real businesses — with a little help from the agents.',
  stats: [
    { label: 'Projects', value: '6' },
    { label: 'Launched', value: '2' },
    { label: 'Credits used', value: '760' },
  ],
};

// Website-traffic detail: 14-day series + sources + top pages.
const TRAFFIC = {
  range: 'Last 14 days',
  totals: [
    { label: 'Total views', value: '3,204', delta: '+18%', up: true, icon: 'eye' },
    { label: 'Unique users', value: '811',   delta: '+12%', up: true, icon: 'users' },
    { label: 'Avg. on page', value: '56s',    delta: '+4s',  up: true, icon: 'clock' },
    { label: 'Bounce rate',  value: '38%',    delta: '−5%',  up: true, icon: 'trend' },
  ],
  // daily views for the chart
  series: [120,142,138,165,150,182,205,190,220,242,235,268,255,292],
  sources: [
    { label: 'Direct',        pct: 38, color: 'var(--role-research)' },
    { label: 'Search',        pct: 27, color: 'var(--role-dev)' },
    { label: 'Social',        pct: 21, color: 'var(--role-brand)' },
    { label: 'Referral',      pct: 14, color: 'var(--role-copy)' },
  ],
  pages: [
    { path: '/',              views: 1420, pct: 44 },
    { path: '/book',          views: 862,  pct: 27 },
    { path: '/classes',       views: 548,  pct: 17 },
    { path: '/about',         views: 374,  pct: 12 },
  ],
};

// Projects-detail breakdown by status.
const PROJECT_STATS = {
  byStatus: [
    { label: 'Live',       key: 'live',       color: 'var(--pos)' },
    { label: 'Building',   key: 'building',   color: 'var(--accent)' },
    { label: 'Validating', key: 'validating', color: 'var(--role-research)' },
    { label: 'Draft',      key: 'draft',      color: 'var(--ink-3)' },
  ],
};

// ---- My Site: post-launch management (the subscription product) ----
const MYSITE = {
  domain: 'mudroom.studio',
  uptime: '99.98% uptime',
  ssl: 'SSL valid',
  edits: { used: 3, total: 10, resets: 'Jul 1' },
  // change requests — status: queued | working | done | review
  requests: [
    { id: 'r1', text: 'Update opening hours for the holiday weekend', status: 'done',
      agent: 'dev', when: 'Yesterday', note: 'Hours updated on the homepage and booking page.' },
    { id: 'r2', text: 'Make the booking button more visible on mobile', status: 'review',
      agent: 'dev', when: '2d ago', note: 'Dash made it sticky on scroll — approve to publish.' },
    { id: 'r3', text: 'Rewrite the About section to mention our new kiln', status: 'working',
      agent: 'copy', when: 'Just now' },
  ],
  snapshot: {
    month: 'May',
    visitors: { value: '1,204', delta: '+22%' },
    contacts: { value: '36', delta: '+9' },
    bookings: { value: '58', delta: '+14' },
    autofixes: [
      { icon: 'shield', text: 'Renewed your SSL certificate before expiry' },
      { icon: 'bolt',   text: 'Fixed a broken contact form field (caught in 4 min)' },
      { icon: 'globe',  text: 'Compressed images — pages load 1.8× faster' },
    ],
  },
};

// ---- Pricing moment (after validation, before build) ----
const PRICING = [
  {
    id: 'build',
    kicker: 'Most popular',
    title: 'Build it now',
    price: '€100',
    priceNote: 'one-time generation',
    sub: '+ €39.99/mo managed',
    desc: 'The agents build and launch your site today. We keep it running — hosting, domain, AI edits, and a human when you need one.',
    points: ['Live this week', '10 AI edits / month', 'Hosting & domain included'],
    cta: 'Start the build',
  },
  {
    id: 'team',
    kicker: 'Hands-on',
    title: 'Build it with our team',
    price: 'from €3,000',
    priceNote: 'scoped per project',
    sub: 'Custom scope & timeline',
    desc: 'For e-commerce, custom apps, or anything beyond a standard site. Plan it on a call with Mara, then our team builds it with you.',
    points: ['Dedicated strategist', 'Custom design & features', 'Migration & integrations'],
    cta: 'Book a call with Mara',
  },
];

// ---- Qualify questions before the concierge call ----
const QUALIFY = [
  { id: 'what', label: 'What are we building?', options: ['New site', 'E-commerce', 'Custom app'] },
  { id: 'budget', label: 'Budget range', options: ['€3–5k', '€5–10k', '€10k+'] },
  { id: 'when', label: 'Timeline', options: ['ASAP', '1–3 months', 'Flexible'] },
];

// ---- Per-agent detail: activity log + what you can ask. Keyed by agent id. ----
const AGENT_DETAIL = {
  research: {
    tagline: 'I find the demand, the rivals, and the wedge before a line gets built.',
    now: { project: 'Lumen Yoga', task: 'Scoring demand & competition', pct: 38 },
    activity: [
      { t: 'Scoring viability for Lumen Yoga', when: 'now', live: true },
      { t: 'Mapped 6 rooftop & studio competitors in the metro', when: '4m ago' },
      { t: 'Pulled search-trend data: “rooftop yoga” +28% YoY', when: '11m ago' },
      { t: 'Delivered positioning for Northside Cuts', when: '2h ago', done: true },
      { t: 'Flagged a saturated market for a prior idea', when: 'Yesterday', done: true },
    ],
    prompts: ['Re-run the competitor scan', 'Check demand in a new city', 'Size the market for me'],
  },
  brand: {
    tagline: 'I shape the name, the identity, and the visual system.',
    now: { project: 'Tidal Surf Co.', task: 'Exploring identity directions', pct: 42 },
    activity: [
      { t: 'Exploring identity directions for Tidal Surf Co.', when: 'now', live: true },
      { t: 'Generated 3 logo routes + a coastal palette', when: '6m ago' },
      { t: 'Locked “warm, earthy, anti-precious” for Mudroom', when: '3h ago', done: true },
      { t: 'Delivered brand identity for Fernwood Bakery', when: 'Yesterday', done: true },
    ],
    prompts: ['Try a bolder color direction', 'Show me another logo route', 'Make it feel more premium'],
  },
  copy: {
    tagline: 'I write in your voice — messaging, pages, the words that convert.',
    now: { project: 'Northside Cuts', task: 'Writing homepage & services', pct: 64 },
    activity: [
      { t: 'Writing homepage & services for Northside Cuts', when: 'now', live: true },
      { t: 'Drafted 3 hero options, A/B ready', when: '8m ago' },
      { t: 'Rewrote the About section for Mudroom', when: '5h ago', done: true },
      { t: 'Delivered homepage copy for Fernwood Bakery', when: 'Yesterday', done: true },
    ],
    prompts: ['Make the hero punchier', 'Write an FAQ section', 'Match a friendlier tone'],
  },
  dev: {
    tagline: 'I assemble the site, wire booking, and ship it live.',
    now: { project: 'Northside Cuts', task: 'Assembling pages, wiring nav', pct: 64 },
    activity: [
      { t: 'Assembling pages & wiring nav for Northside Cuts', when: 'now', live: true },
      { t: 'Made booking sticky on mobile (Mudroom)', when: '12m ago', done: true },
      { t: 'Connected a drop-in booking flow with live slots', when: '4h ago', done: true },
      { t: 'Renewed SSL + fixed a broken form for Mudroom', when: 'Yesterday', done: true },
    ],
    prompts: ['Add a photo gallery', 'Speed up page load', 'Wire up a contact form'],
  },
};

// ---- Integrations: connect external tools ----
const INTEGRATIONS = [
  { id: 'stripe',   name: 'Stripe',           cat: 'Payments',   glyph: 'card',   color: '#635BFF', connected: true,  detail: 'Accept payments & deposits' },
  { id: 'ga',       name: 'Google Analytics', cat: 'Analytics',  glyph: 'chart',  color: '#E8710A', connected: true,  detail: 'Track visitors & conversions' },
  { id: 'calendly', name: 'Calendly',         cat: 'Scheduling', glyph: 'cal',    color: '#006BFF', connected: false, detail: 'Let customers book time' },
  { id: 'mailchimp',name: 'Mailchimp',        cat: 'Email',      glyph: 'bell',   color: '#2BB673', connected: false, detail: 'Collect & email your list' },
  { id: 'instagram',name: 'Instagram',        cat: 'Social',     glyph: 'camera', color: '#E1306C', connected: false, detail: 'Pull your latest posts in' },
  { id: 'gbusiness',name: 'Google Business',  cat: 'Listings',   glyph: 'pin',    color: '#4285F4', connected: true,  detail: 'Sync hours, reviews & maps' },
  { id: 'whatsapp', name: 'WhatsApp',         cat: 'Messaging',  glyph: 'chat',   color: '#25D366', connected: false, detail: 'Chat button on your site' },
  { id: 'quickbooks',name:'QuickBooks',       cat: 'Accounting', glyph: 'box',    color: '#2CA01C', connected: false, detail: 'Sync invoices & income' },
];

Object.assign(window, {
  AGENTS, AGENT_LIST, DOORS, SEED_IDEA, INTERVIEW, VALIDATION,
  BUILD_PLAN, BUILD_FEED, GEN_BRAND, GEN_COPY, PROJECTS,
  CONCIERGE, CALL_AGENDA, CALL_SLOTS, CREDITS, LIVE_ACTIVITY, RECENT_SPEND,
  PROFILE, TRAFFIC, PROJECT_STATS, MYSITE, PRICING, QUALIFY, AGENT_DETAIL, INTEGRATIONS,
});
