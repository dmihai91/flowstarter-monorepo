'use client';

// Marketing landing — port of the design bundle's landing/index.html +
// landing.js, with v1 content: €50/€149/€39mo pricing, demo-first steps,
// no fabricated testimonials or client claims (samples clearly labeled),
// concierge replaced by the contact email.
import React from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import { Logo, ThemeToggle } from '@/components/ui';
import { Icons } from '@/components/icons';
import { AGENT_LIST } from '@/lib/agents';
import { FunnelOverlay, openFunnel } from '@/components/funnel';
import { useTypewriter, usePrefersReducedMotion } from '@/components/typewriter';

type Pricing = { build: string; final: string; total: string; monthly: string; headline: string };

// cursor spotlight: cards light up under the pointer (Railway-style)
function useSpotlight() {
  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const t = (e.target as HTMLElement | null)?.closest?.(
        '.landing .step-card, .landing .prob-card, .landing .crew-card, .landing .why-item, .landing .price-step, .landing .show-card',
      ) as HTMLElement | null;
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty('--mx', `${e.clientX - r.left}px`);
      t.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    document.addEventListener('mousemove', onMove, { passive: true });
    return () => document.removeEventListener('mousemove', onMove);
  }, []);
}

// scroll-reveal hook (IntersectionObserver, like landing.js)
function useReveal() {
  React.useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll('.landing .reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const ROLE_HEX: Record<string, string> = {
  research: '#3E86E8',
  brand: '#B964E8',
  copy: '#E89B2F',
  dev: '#2FB87A',
};

// hero demo card: looping live build feed
const HERO_FEED = [
  { who: 'Vera', color: '#3E86E8', text: 'Most barbers around you are booking-only. Walk-ins are your edge, I’d lead with that.' },
  { who: 'Iris', color: '#B964E8', text: 'Going navy and cream, old-school barber colors. Trendy fonts would fight the name.' },
  { who: 'Quinn', color: '#E89B2F', text: 'Kept the headline plain: “A proper cut, no appointment needed.”' },
  { who: 'Dash', color: '#2FB87A', text: 'Booking form is in, it sends straight to your phone.' },
  { who: 'Dash', color: '#2FB87A', text: 'Done on my end. Have a look.' },
];

// Hero prompt box — typing here drops the visitor straight into the funnel
// with the crew already drafting their site.
const PROMPT_IDEAS = [
  'My auto repair garage, we fix most cars the same day',
  'Our guesthouse by the Danube, we want direct bookings',
  'I do wedding flowers, wild and seasonal, from my studio',
  'I coach men over 30 who want to get strong again',
  'I bake sourdough and want to sell weekly subscriptions',
];

function HeroPrompt() {
  const [val, setVal] = React.useState('');
  const [hint, setHint] = React.useState(false);
  const typedPlaceholder = useTypewriter(PROMPT_IDEAS, { enabled: val.length === 0 });
  const go = () => {
    if (val.trim().length < 10) {
      setHint(true);
      return;
    }
    openFunnel(val.trim());
  };
  return (
    <div className="hero-prompt">
      <textarea
        suppressHydrationWarning
        value={val}
        onChange={(e) => {
          setVal(e.target.value);
          setHint(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            go();
          }
        }}
        rows={2}
        placeholder={typedPlaceholder || 'Describe your business in one sentence'}
      />
      <div className="hero-prompt-row">
        <span className="mono hero-prompt-hint">{hint ? 'a sentence is plenty, tell us a bit more' : 'free · no account needed'}</span>
        <button className="btn btn-primary" onClick={go}>
          Draft my site free →
        </button>
      </div>
    </div>
  );
}

function HeroDemoCard() {
  const reduced = usePrefersReducedMotion();
  const [line, setLine] = React.useState(0);
  const [chars, setChars] = React.useState(0);

  React.useEffect(() => {
    if (reduced) return;
    let t: ReturnType<typeof setTimeout>;
    if (line >= HERO_FEED.length) {
      t = setTimeout(() => {
        setLine(0);
        setChars(0);
      }, 3200);
    } else if (chars < HERO_FEED[line].text.length) {
      t = setTimeout(() => setChars((c) => c + 1), 18 + Math.random() * 26);
    } else {
      t = setTimeout(() => {
        setLine((l) => l + 1);
        setChars(0);
      }, 760);
    }
    return () => clearTimeout(t);
  }, [line, chars, reduced]);

  const count = reduced ? HERO_FEED.length : Math.min(line + 1, HERO_FEED.length);
  const visible = HERO_FEED.slice(0, count).slice(-4);
  const offset = count - visible.length;
  const progress = reduced
    ? 100
    : Math.min(100, Math.round(((line + (HERO_FEED[line] ? chars / HERO_FEED[line].text.length : 0)) / HERO_FEED.length) * 100));

  return (
    <div className="demo-card">
      <div className="demo-head">
        <span className="demo-pill">BUILDING</span>
        <span className="demo-domain mono">sample · tudor barbershop</span>
      </div>
      <div className="demo-feed">
        {visible.map((l, i) => {
          const absolute = offset + i;
          const isActive = !reduced && absolute === line;
          const text = isActive ? l.text.slice(0, chars) : l.text;
          return (
            <div className="demo-line" key={absolute} style={{ animation: 'none' }}>
              <span className="demo-line-avatar" style={{ color: l.color, background: l.color + '1f', borderColor: l.color + '66' }}>
                {l.who[0]}
              </span>
              <span className="demo-line-body">
                <strong style={{ color: l.color }}>{l.who}</strong> {text}
                {isActive && <span className="tw-caret" aria-hidden />}
              </span>
            </div>
          );
        })}
      </div>
      <div className="demo-foot">
        <div className="demo-avatars">
          {AGENT_LIST.map((a) => (
            <span key={a.id} className="demo-avatar" style={{ color: ROLE_HEX[a.id], borderColor: ROLE_HEX[a.id] + '66' }}>
              {a.name[0]}
            </span>
          ))}
        </div>
        <span className="demo-progress mono">{progress}%</span>
      </div>
    </div>
  );
}


// after-launch editing demo: the owner texts a change, Dash applies it, and
// the mock site preview updates live. Loops; starts when scrolled into view;
// renders the finished state under reduced motion.
const EDIT_STEPS = [
  { ask: 'Add a banner: 10% off feeder rods this week', doneMsg: 'Done, the banner’s up. ✓' },
  { ask: 'We open Saturdays until 14:00 now, update the hours', doneMsg: 'Changed, in the footer too. ✓' },
  { ask: 'Put the landing net at 39 lei', doneMsg: 'Done, 39 lei in the shop and at checkout. ✓' },
];
const DASH = '#2FB87A';

function EditDemo() {
  const reduced = usePrefersReducedMotion();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [started, setStarted] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [phase, setPhase] = React.useState<'typing' | 'working' | 'done'>('typing');
  const [chars, setChars] = React.useState(0);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || reduced) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es[0]?.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  React.useEffect(() => {
    if (!started || reduced) return;
    let t: ReturnType<typeof setTimeout>;
    const msg = EDIT_STEPS[step].ask;
    if (phase === 'typing') {
      if (chars < msg.length) t = setTimeout(() => setChars((c) => c + 1), 16 + Math.random() * 24);
      else t = setTimeout(() => setPhase('working'), 380);
    } else if (phase === 'working') {
      t = setTimeout(() => setPhase('done'), 1150);
    } else {
      const last = step === EDIT_STEPS.length - 1;
      t = setTimeout(() => {
        setStep(last ? 0 : step + 1);
        setPhase('typing');
        setChars(0);
      }, last ? 4600 : 2100);
    }
    return () => clearTimeout(t);
  }, [started, reduced, step, phase, chars]);

  const appliedCount = reduced ? EDIT_STEPS.length : step + (phase === 'done' ? 1 : 0);
  const applied = (i: number) => appliedCount > i;

  const agentLine = (text: string) => (
    <div className="edit-msg-agent">
      <span className="demo-line-avatar" style={{ color: DASH, background: DASH + '1f', borderColor: DASH + '66' }}>D</span>
      <span>
        <strong style={{ color: DASH }}>Dash</strong> {text}
      </span>
    </div>
  );

  return (
    <div className="edit-grid reveal" ref={rootRef}>
      <div className="edit-chat">
        <div className="edit-chat-head mono">YOU → YOUR SITE CREW</div>
        {EDIT_STEPS.map((sStep, i) => {
          if (!reduced && i > step) return null;
          const current = !reduced && i === step;
          if (current && phase === 'typing' && chars === 0) return null;
          const text = current && phase === 'typing' ? sStep.ask.slice(0, chars) : sStep.ask;
          return (
            <React.Fragment key={i}>
              <div className="edit-msg-user">
                {text}
                {current && phase === 'typing' && <span className="tw-caret" aria-hidden />}
              </div>
              {(!current || phase !== 'typing') &&
                agentLine(current && phase === 'working' ? 'On it, give me a second…' : sStep.doneMsg)}
            </React.Fragment>
          );
        })}
      </div>

      <div className="edit-site" aria-hidden>
        <div className="edit-chrome">
          <span className="edit-dot" />
          <span className="edit-dot" />
          <span className="edit-dot" />
          <span className="mono edit-url">sample · danube tackle shop</span>
          <span className="mono edit-live">● live</span>
        </div>
        <div className="edit-page">
          {applied(0) && (
            <div className="edit-banner" key="banner">
              This week: 10% off feeder rods
            </div>
          )}
          <div className="edit-shop-name serif">Danube Tackle</div>
          <div className="edit-shop-sub">Rods, reels and bait, right by the river</div>
          <div className="edit-row">
            <span>Feeder rod 3.6 m</span>
            <b>189 lei</b>
          </div>
          <div className="edit-row">
            <span>Landing net 50 cm</span>
            <b key={applied(2) ? 'p1' : 'p0'} className={applied(2) ? 'edit-flash' : ''}>
              {applied(2) ? '39 lei' : '35 lei'}
            </b>
          </div>
          <div className="edit-row">
            <span>Benzar Mix groundbait</span>
            <b>21 lei</b>
          </div>
          <div className="edit-hours" key={applied(1) ? 'h1' : 'h0'}>
            <span className={applied(1) ? 'edit-flash' : ''}>
              Open Mon to Fri 9:00 to 18:00{applied(1) ? ', Sat to 14:00' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// product tour — pinned on desktop: the section holds the viewport while
// scrolling advances the panels (Railway-style storytelling); auto-advances
// on mobile/reduced-motion.
function ProductTour({ pricing }: { pricing: Pricing }) {
  const [idx, setIdx] = React.useState(0);
  const stageRef = React.useRef<HTMLElement | null>(null);
  const [pinned, setPinned] = React.useState(false);
  const reduced = usePrefersReducedMotion();
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const set = () => setPinned(mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);

  // scroll position → active panel while the stage is pinned
  React.useEffect(() => {
    if (!pinned || reduced) return;
    const onScroll = () => {
      const el = stageRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const passed = Math.min(Math.max(-r.top, 0), total);
      setIdx(Math.min(2, Math.floor((passed / total) * 3)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pinned, reduced]);
  const tour = [
    {
      title: 'A free demo, drafted in seconds',
      sub: 'A real homepage draft, before you pay anything',
      pill: 'DEMO PREVIEW',
      body: (
        <div className="tsite" style={{ flex: 1 }}>
          <div className="tsite-chrome">
            <span className="edit-dot" />
            <span className="edit-dot" />
            <span className="edit-dot" />
            <span className="mono tsite-url">sample · tudor barbershop</span>
          </div>
          <div className="tsite-hero">
            <div className="tsite-nav">
              <b>TUDOR</b>
              <span>Cuts · Prices · Find us</span>
            </div>
            <div className="tsite-h serif">Walk in. Walk out sharp.</div>
            <div className="tsite-sub">A proper cut, no appointment needed. Two chairs, no waiting list.</div>
            <span className="tsite-btn">See prices ↓</span>
          </div>
          <div className="tsite-rows">
            <div className="tsite-row"><span>Cut</span><b>60 lei</b></div>
            <div className="tsite-row"><span>Cut + beard</span><b>85 lei</b></div>
            <div className="tsite-row"><span>Kids under 10</span><b>40 lei</b></div>
          </div>
          <div className="mono tsite-foot">SAMPLE DRAFT · YOURS IS GENERATED FROM YOUR DESCRIPTION</div>
        </div>
      ),
    },
    {
      title: 'Watch the crew build it live',
      sub: 'Four agents in one feed, with you in charge',
      pill: 'LIVE BUILD',
      body: (
        <>
          <div className="mock-card" style={{ flex: 1 }}>
            {[
              { c: '#3E86E8', n: 'Vera', t: 'Checked the area: everyone takes bookings, nobody does walk-ins. That’s the angle.' },
              { c: '#B964E8', n: 'Iris', t: 'Palette’s ready, navy and cream. Like a shop that’s been there twenty years.' },
              { c: '#E89B2F', n: 'Quinn', t: 'Wrote the homepage the way you’d say it out loud, short sentences.' },
              { c: '#2FB87A', n: 'Dash', t: 'Assembled. The booking form works, I tested it twice. ✓' },
            ].map((l) => (
              <div className="mock-feed-line" key={l.n + l.t}>
                <span className="mock-mini-avatar" style={{ color: l.c, background: l.c + '1f', borderColor: l.c + '66' }}>{l.n[0]}</span>
                <span className="mock-text">
                  <strong style={{ color: l.c }}>{l.n}</strong> {l.t}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Deliverables: brand · positioning · copy · site · booking</span>
            <span className="mono" style={{ fontSize: 12.5, color: 'var(--accent)' }}>92%</span>
          </div>
        </>
      ),
    },
    {
      title: 'It stays managed after launch',
      sub: `Hosting, your domain and edits, ${pricing.monthly}/mo`,
      pill: 'AFTER LAUNCH',
      body: (
        <>
          <div className="mock-card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--pos)' }} />
              <span className="mono" style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 600 }}>yourbusiness.com</span>
              <span style={{ fontSize: 11.5, color: 'var(--ink-3)', marginLeft: 'auto' }}>monitored 24/7</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', fontStyle: 'italic' }}>
              “Update opening hours for the holiday weekend” → <strong style={{ color: 'var(--pos)' }}>Done</strong>
            </div>
          </div>
          <div className="mock-card">
            <div className="mono" style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--accent)', marginBottom: 8 }}>INCLUDED MONTHLY</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              Hosting on our servers · your domain · SSL · AI edits in plain language · auto-fixes when something breaks
            </div>
          </div>
        </>
      ),
    },
  ];

  // auto-advance only when not scroll-pinned
  const restart = React.useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setIdx((i) => (i + 1) % 3), 4200);
  }, []);
  React.useEffect(() => {
    if (pinned && !reduced) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    restart();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [restart, pinned, reduced]);

  const jump = (i: number) => {
    if (!pinned || reduced) {
      setIdx(i);
      restart();
      return;
    }
    const el = stageRef.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: el.offsetTop + (total * (i + 0.5)) / 3, behavior: 'smooth' });
  };

  return (
    <section className="pin-section" id="product" ref={stageRef}>
      <div className="pin-sticky">
        <div className="wrap pin-inner">
        <div className="pin-copy">
          <div className="eyebrow">Inside Flowstarter</div>
          <h2>
            Not just a site builder.
            <br />A team you direct.
          </h2>
          <div className="pin-dots">
            {tour.map((t, i) => (
              <button
                key={t.title}
                className={'pin-dot' + (i === idx ? ' on' : '')}
                onClick={() => jump(i)}
              >
                <span className="pin-dot-bar" />
                <span>
                  <span className="pin-dot-title">{t.title}</span>
                  <br />
                  <span className="pin-dot-sub">{t.sub}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="muted pin-hint">{pinned && !reduced ? 'Keep scrolling, the page waits for you ↓' : 'Auto-playing. Tap a step to jump'}</p>
        </div>
        <div className="pin-panels">
          {tour.map((t, i) => (
            <div key={t.title} className={'pin-panel' + (i === idx ? ' on' : '')}>
              <div className="pin-panel-head">
                <span className="pin-panel-pill">{t.pill}</span>
              </div>
              {t.body}
            </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// REAL work — projects shipped on the platform (assets + facts from
// flowstarter-main's proof section) and real agent drafts (screenshots of
// actual generations, captured from the demo engine).
const PROJECTS = [
  {
    title: 'UX Journey',
    kicker: 'A senior UX coaching practice. Copy, calendar and credibility, all on one domain.',
    meta: 'Coaching · Live · 2026',
    img: '/showcase/ux-journey.png',
    href: 'https://ux-journey.com/',
  },
  {
    title: 'Lebădușul',
    kicker: 'A Danube-side tackle shop. Catalog, checkout and logistics copy written for serious anglers.',
    meta: 'Retail · Live · 2026',
    img: '/showcase/lebadusul.png',
    href: 'https://lebadusularticoledepescuit.ro/',
  },
  {
    title: 'Portfolio starter',
    kicker: 'Dorin’s portfolio starter, the design system our demo agent builds on today.',
    meta: 'Portfolio · Template',
    img: '/showcase/dorin-portfolio.png',
    href: null,
  },
];

const DRAFTS = [
  {
    img: '/showcase/draft-cafe.png',
    href: '/showcase/draft-cafe.html',
    name: 'Cluj Board & Brew',
    prompt: 'our board game café in Cluj, 300 games on the shelves and proper coffee',
  },
  {
    img: '/showcase/draft-florist.png',
    href: '/showcase/draft-florist.html',
    name: 'Wild Bloom Vienna',
    prompt: 'I make wedding flowers in Vienna, wild and seasonal, built around what blooms that week',
  },
  {
    img: '/showcase/draft-fitness.png',
    href: '/showcase/draft-fitness.html',
    name: 'Forge Fit Timisoara',
    prompt: 'personal trainer for men over 30, morning sessions in a bright garage gym in Timisoara',
  },
];

const TESTIMONIAL = {
  quote:
    'I needed a website to sell my fishing equipment, selling only offline was becoming a burden. I contacted Darius, and he and his platform deliver exactly what I need. Now I can take orders from anywhere, even when I’m fishing.',
  name: 'Daniel Draga',
  role: 'Owner, Lebădușul',
  href: 'https://lebadusularticoledepescuit.ro/',
};

const TRADES = [
  'Barbershops', 'Bakeries', 'Coaches', 'Pottery studios', 'Florists', 'Photographers',
  'Therapists', 'Yoga studios', 'Dog groomers', 'Consultants', 'Cafés', 'Local services',
];

export function LandingScreen({ pricing, contactEmail, slots }: { pricing: Pricing; contactEmail: string; slots: { left: number; cap: number } }) {
  useReveal();
  useSpotlight();
  const { isSignedIn } = useAuth();

  const faq = [
    {
      q: `What do I actually get for ${pricing.total}?`,
      a: `Brand identity, written copy and a responsive website with contact and booking flows, built by the agents and approved by you. ${pricing.build} starts the build. ${pricing.final} is due on delivery, after you've reviewed the finished site.`,
    },
    {
      q: 'What if I don’t like what the agents build?',
      a: `You see a free agent-built draft before paying anything, with 10 free prompts to steer it. If you don't approve the finished site, you don't pay the ${pricing.final}. You keep a brand kit with the assets and strategy instead. The ${pricing.build} build fee is non-refundable once the crew starts, and you agree to that explicitly at checkout.`,
    },
    {
      q: 'Do I own my website?',
      a: `Yes. Launch with us and it runs on your domain with everything managed, or take the code-only option for the same ${pricing.final} and host it anywhere. No lock-in, no platform cut.`,
    },
    {
      q: 'How long does the build take?',
      a: 'The demo takes seconds; most builds go from payment to review in hours, not weeks. You watch the crew work live, so you’re never left wondering what’s going on.',
    },
    {
      q: `What does the ${pricing.monthly}/mo cover?`,
      a: 'Everything ongoing, in one subscription: hosting on our servers, your domain, SSL, monitoring with automatic fixes, and AI edits. Ask in plain words and the crew ships it. Cancel anytime.',
    },
    {
      q: 'I have a bigger project, like e-commerce or a custom app.',
      a: `That's beyond the self-serve crew for now. Email us at ${contactEmail} and a human will scope it with you.`,
    },
    {
      q: 'I already have a website.',
      a: 'We do relaunches too. Describe your business and mention your current site. The crew keeps what works and rebuilds the rest.',
    },
    {
      q: 'Is my idea kept confidential?',
      a: 'Yes. Your description, drafts and brand work belong to you. We never reuse or share them.',
    },
  ];

  return (
    <div className="landing">
      {/* NAV */}
      <nav className="nav glass-2">
        <div className="wrap nav-inner">
          <a href="#top" className="logo-row" style={{ textDecoration: 'none' }}>
            <Logo size={19} />
          </a>
          <div className="nav-links">
            <a href="#how">How it works</a>
            <a href="#product">Product</a>
            <a href="#examples">Examples</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="nav-cta-row">
            <ThemeToggle />
            {isSignedIn ? <UserButton /> : <a className="nav-login" href="/sign-in">Log in</a>}
            <button className="btn btn-primary nav-cta" onClick={() => openFunnel()}>
              Try it free
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero" id="top">
        <div className="wrap hero-grid">
          <div className="hero-copy reveal">
            <div className="eyebrow">A crew of agents does the building</div>
            <h1>
              Your business,
              <br />
              <span className="grad-text">online this week.</span>
            </h1>
            <p className="hero-sub muted">
              Describe what you do in one sentence. A crew of specialist agents designs your brand,
              writes your copy and ships your site, while you watch.
            </p>
            {/* the funnel entry: prompt box front and center */}
            <HeroPrompt />
            <div style={{ marginTop: 14 }}>
              <a href="#how" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>
                or see how it works ↓
              </a>
            </div>
            <div className="hero-note muted">
              <span className="live-dot" />
              <span>
                Free demo · <strong>{pricing.build}</strong> starts the build · <strong>{pricing.final}</strong> on
                delivery · then <strong>{pricing.monthly}/mo</strong> covers it all
              </span>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <b>Demo first</b>
                <span>Free, before you pay</span>
              </div>
              <div className="hero-stat">
                <b>Built by agents</b>
                <span>Live, in front of you</span>
              </div>
              <div className="hero-stat">
                <b>Yours to edit</b>
                <span>Plain-language changes</span>
              </div>
            </div>
            <div className="hero-capacity">
              {slots.left > 0
                ? `${slots.left} of ${slots.cap} build slots left this month`
                : 'This month’s build slots are full. Drafts stay free, builds reopen next month'}
            </div>
          </div>
          <div className="hero-demo reveal">
            <HeroDemoCard />
          </div>
        </div>
        {/* trades marquee — who this is for, in motion */}
        <div className="trade-marquee" aria-hidden>
          <div className="tm-track">
            {[...TRADES, ...TRADES].map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>
      </header>

      {/* PROBLEM */}
      <section className="section section-alt" id="problem">
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="eyebrow">What you’ve tried so far</div>
            <h2>You know how this usually goes</h2>
          </div>
          <div className="prob-grid">
            {[
              {
                h: 'AI drafts feel generic',
                p: 'One-shot generators spit out a site in seconds, and it reads like everyone else who used the same tool. Nothing in it is specific to your business.',
              },
              {
                h: 'Agencies are heavy and slow',
                p: 'Bigger builds take months and real money. After launch, every small change waits on someone else’s schedule.',
              },
              {
                h: 'You stay dependent',
                p: 'The site lives in a system you didn’t build. Every tweak needs the person who set it up, or a weekend lost to tutorials.',
              },
            ].map((c) => (
              <div className="prob-card reveal" key={c.h}>
                <div className="prob-mark">×</div>
                <h3>{c.h}</h3>
                <p className="muted">{c.p}</p>
              </div>
            ))}
          </div>
          <p className="prob-note reveal">
            Flowstarter is different: you see a <strong>free demo first</strong>, agents build it{' '}
            <strong>in front of you</strong>, and afterwards you change anything <strong>just by asking</strong>.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="eyebrow">How it works</div>
            <h2>Three steps. You approve, they execute.</h2>
          </div>
          <div className="steps-grid">
            <div className="step-card reveal">
              <div className="step-num mono">01</div>
              <div className="step-icon" style={{ color: '#3E86E8' }}>
                <Icons.eye size={22} />
              </div>
              <h3>Demo</h3>
              <p className="muted">
                Describe your business in a sentence and a real agent builds a draft of your site,
                free, before you pay a cent. Shape it with up to 10 prompts.
              </p>
            </div>
            <div className="step-card reveal">
              <div className="step-num mono">02</div>
              <div className="step-icon" style={{ color: '#4D5DD9' }}>
                <Icons.spark size={22} />
              </div>
              <h3>Build</h3>
              <p className="muted">
                {pricing.build} puts four specialist agents to work on your brand, copy and site, live
                in front of you. You stay in charge the whole way.
              </p>
            </div>
            <div className="step-card reveal">
              <div className="step-num mono">03</div>
              <div className="step-icon" style={{ color: '#2FB87A' }}>
                <Icons.rocket size={22} />
              </div>
              <h3>Launch</h3>
              <p className="muted">
                Review the finished site, then {pricing.final} on delivery: go live on your domain with
                hosting and AI edits for {pricing.monthly}/mo, or take the code and host it yourself.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT TOUR */}
      <ProductTour pricing={pricing} />

      {/* CREW */}
      <section className="section" id="crew">
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="eyebrow">Your build team</div>
            <h2>Meet the crew that works for you 24/7</h2>
          </div>
          <div className="crew-grid">
            {AGENT_LIST.map((a, i) => {
              const hex = ROLE_HEX[a.id];
              const RoleIcon = { research: Icons.search, brand: Icons.brush, copy: Icons.pen, dev: Icons.code }[a.id]!;
              return (
                <div className="crew-card reveal" key={a.id} style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="crew-avatar" style={{ color: hex, background: hex + '1f', borderColor: hex + '66' }}>
                    <RoleIcon size={24} stroke={1.9} />
                  </div>
                  <div className="crew-name">{a.name}</div>
                  <div className="crew-role" style={{ color: hex }}>
                    {a.role.toUpperCase()}
                  </div>
                  <p className="muted">{a.blurb}</p>
                </div>
              );
            })}
          </div>
          <p className="crew-note muted reveal">
            …and when your project outgrows the crew,{' '}
            <a href={`mailto:${contactEmail}`} style={{ color: 'var(--accent)', fontWeight: 600 }}>
              email us
            </a>{' '}
            and a human will scope it with you.
          </p>
        </div>
      </section>

      {/* WHY US */}
      <section className="section section-alt" id="why">
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="eyebrow">Why Flowstarter</div>
            <h2>Why people choose this over the rest</h2>
          </div>
          <div className="why-grid">
            {[
              {
                h: 'A demo before any money',
                p: 'Most builders charge first and show later. Here a real agent builds your draft free and takes 10 of your prompts. You decide with the result in front of you.',
              },
              {
                h: 'Built for you, not off a shelf',
                p: 'One design system, shaped around one business: yours. The crew writes in your voice and builds for how your customers actually book.',
              },
              {
                h: 'The editor stays yours',
                p: 'Change wording, photos or sections after launch just by asking in plain words. No software to learn, no freelancer to chase.',
              },
              {
                h: 'Honest pricing, no drip',
                p: `${pricing.total} total plus ${pricing.monthly}/mo if you launch with us, visible before you pay anything, including on this page.`,
              },
            ].map((c) => (
              <div className="why-item reveal" key={c.h}>
                <h3>{c.h}</h3>
                <p className="muted">{c.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REAL WORK — projects from the platform + live agent drafts */}
      <section className="section section-alt" id="examples" style={{ borderTop: 'none' }}>
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="eyebrow">Real work</div>
            <h2>Built on Flowstarter, live today</h2>
          </div>
          <div className="proj-grid">
            {PROJECTS.map((pr, i) => (
              <a
                key={pr.title}
                className="proj-card reveal"
                href={pr.href ?? '#examples'}
                target={pr.href ? '_blank' : undefined}
                rel={pr.href ? 'noreferrer' : undefined}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="proj-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pr.img} alt={pr.title} loading="lazy" />
                </div>
                <div className="proj-body">
                  <div className="proj-title-row">
                    <span className="proj-title">{pr.title}</span>
                    <span className="mono proj-meta">{pr.meta}</span>
                  </div>
                  <p className="muted">{pr.kicker}</p>
                </div>
              </a>
            ))}
          </div>

          {/* agent drafts — generated, not mocked */}
          <div className="drafts-head reveal">
            <div className="eyebrow">From one sentence</div>
            <h3 className="drafts-title">Real drafts our agent generated, in seconds</h3>
          </div>
          <div className="draft-strip">
            {DRAFTS.map((d, i) => (
              <a
                key={d.name}
                className="draft-card reveal"
                href={d.href}
                target="_blank"
                rel="noreferrer"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="proj-thumb proj-thumb--tall">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.img} alt={`${d.name}, agent-generated draft`} loading="lazy" />
                </div>
                <figcaption>
                  <b>{d.name}</b>
                  <span className="mono">“{d.prompt}”</span>
                  <span className="draft-open">open the real draft →</span>
                </figcaption>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL — one real client, in his words */}
      <section className="section" id="testimonial">
        <div className="wrap wrap-narrow">
          <div className="testi-block reveal">
            <div className="eyebrow" style={{ textAlign: 'center' }}>In their words</div>
            <blockquote>“{TESTIMONIAL.quote}”</blockquote>
            <div className="testi-who">
              <span className="testi-avatar" aria-hidden>DD</span>
              <span>
                <b>{TESTIMONIAL.name}</b> · {TESTIMONIAL.role}
              </span>
              <a href={TESTIMONIAL.href} target="_blank" rel="noreferrer">
                visit the site →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* AFTER LAUNCH — edit your live site by talking to the crew */}
      <section className="section section-alt" id="updates">
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="eyebrow">After launch</div>
            <h2>Change anything with a sentence.</h2>
            <p>
              Your site doesn&rsquo;t freeze the day it ships. Tell the crew what changed, the way
              you&rsquo;d text a friend, and it&rsquo;s live in minutes. Hosting and edits are part
              of the monthly plan.
            </p>
          </div>
          <EditDemo />
        </div>
      </section>

      {/* TEAM — the humans behind the agents */}
      <section className="section section-alt" id="team">
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="eyebrow">Who’s behind this</div>
            <h2>Two people and four agents</h2>
          </div>
          <div className="team-row reveal">
            <div className="team-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="team-photo" src="/team/darius.png" alt="Darius Popescu" width={56} height={56} loading="lazy" />
              <div>
                <b>Darius Popescu</b>
                <span className="muted">Founder. Builds the platform, answers the emails, takes the blame.</span>
              </div>
            </div>
            <div className="team-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="team-photo" src="/team/dorin.jpeg" alt="Dorin" width={56} height={56} loading="lazy" />
              <div>
                <b>Dorin</b>
                <span className="muted">Co-founder. His design system is the one our agents build on.</span>
              </div>
            </div>
            <div className="team-card team-card--crew">
              <div style={{ display: 'flex' }}>
                {AGENT_LIST.map((a) => (
                  <span key={a.id} className="team-crew-dot" style={{ color: ROLE_HEX[a.id], background: ROLE_HEX[a.id] + '1f', borderColor: ROLE_HEX[a.id] + '66' }}>
                    {a.name[0]}
                  </span>
                ))}
              </div>
              <div>
                <b>Vera, Iris, Quinn & Dash</b>
                <span className="muted">The agent crew. Research, brand, copy and code, around the clock.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="section" id="who">
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="eyebrow">Who it’s for</div>
            <h2>Built for people who sell their craft</h2>
          </div>
          <div className="who-chips reveal">
            {['Coaches', 'Consultants', 'Therapists', 'Photographers', 'Studios & classes', 'Barbers & salons', 'Bakers & makers', 'Local services', 'Side-hustles becoming real'].map((c) => (
              <span className="who-chip" key={c}>
                {c}
              </span>
            ))}
          </div>
          <p className="who-note muted reveal">
            If you sell your time, your hands or your products, and you’d rather run the business
            than build websites, this is for you.
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing">
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="eyebrow">Pricing</div>
            <h2>Pay when it’s real. Not before.</h2>
          </div>
          <div className="price-flow reveal">
            <div className="price-step">
              <div className="price-amount">
                <span className="grad-text">€0</span>
              </div>
              <div className="price-label">Try it</div>
              <p className="muted">Describe your business and watch the agents draft your brand and homepage. Free, no account needed.</p>
            </div>
            <div className="price-arrow" aria-hidden>
              →
            </div>
            <div className="price-step price-step-hi">
              <div className="price-amount">{pricing.build}</div>
              <div className="price-label">Start the build</div>
              <p className="muted">
                Puts the crew to work on the full site, live in front of you. Non-refundable once
                they start, and you confirm that explicitly.
              </p>
            </div>
            <div className="price-arrow" aria-hidden>
              →
            </div>
            <div className="price-step">
              <div className="price-amount">{pricing.final}</div>
              <div className="price-label">On delivery</div>
              <p className="muted">
                Pay the rest only after you’ve reviewed the finished site. <strong>{pricing.total} total.</strong>
              </p>
            </div>
          </div>
          <div className="price-foot reveal">
            <div className="sub-card">
              <div className="sub-head">
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Then · one subscription covers everything</div>
                  <h3>Care plan · {pricing.monthly}/mo</h3>
                </div>
                <button className="btn btn-primary" onClick={() => openFunnel()}>
                  Start free
                </button>
              </div>
              <div className="sub-grid">
                <div className="sub-item">
                  <span className="sub-icon" style={{ color: '#2FB87A' }}>
                    <Icons.globe size={17} stroke={1.9} />
                  </span>
                  <div>
                    <strong>Hosting & your domain</strong>
                    <p className="muted">On our servers, with SSL and backups. Nothing extra to buy.</p>
                  </div>
                </div>
                <div className="sub-item">
                  <span className="sub-icon" style={{ color: '#4D5DD9' }}>
                    <Icons.spark size={17} stroke={1.9} />
                  </span>
                  <div>
                    <strong>Ongoing AI edits</strong>
                    <p className="muted">Ask in plain words and the crew ships the change.</p>
                  </div>
                </div>
                <div className="sub-item">
                  <span className="sub-icon" style={{ color: '#E89B2F' }}>
                    <Icons.bolt size={17} stroke={1.9} />
                  </span>
                  <div>
                    <strong>Monitoring & auto-fixes</strong>
                    <p className="muted">Uptime watched 24/7; broken things get fixed fast.</p>
                  </div>
                </div>
                <div className="sub-item">
                  <span className="sub-icon" style={{ color: '#B964E8' }}>
                    <Icons.user size={17} stroke={1.9} />
                  </span>
                  <div>
                    <strong>A human when it matters</strong>
                    <p className="muted">When something needs a person, our team steps in.</p>
                  </div>
                </div>
              </div>
              <p className="sub-foot muted">Cancel anytime. Your domain stays yours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-alt" id="faq">
        <div className="wrap wrap-narrow">
          <div className="sec-head reveal">
            <div className="eyebrow">Questions</div>
            <h2>Fair questions, straight answers</h2>
          </div>
          <div className="faq-list reveal">
            {faq.map((f) => (
              <details className="faq-item" key={f.q}>
                <summary>
                  {f.q}
                  <span className="faq-chev" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section" id="cta">
        <div className="wrap">
          <div className="cta-band reveal">
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,.75)' }}>Ready when you are</div>
            <h2>Let’s see what the crew would build for your business.</h2>
            <p>
              Describe it in one sentence. The agents draft your brand and homepage free, before you
              pay a cent.
            </p>
            <button className="btn btn-lg cta-band-btn" onClick={() => openFunnel()}>
              Try it with your business →
            </button>
            <span className="cta-band-note">
              Free demo · {pricing.build} to start · {pricing.final} only on delivery
            </span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="wrap footer-inner">
          <div className="logo-row">
            <Logo size={15} />
          </div>
          <nav className="footer-links">
            <a href="#how">Process</a>
            <a href="#pricing">Pricing</a>
            <a href="/about">About</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/sign-in">Sign in</a>
            <a href={`mailto:${contactEmail}`}>Contact</a>
          </nav>
          <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 14 }} onClick={() => openFunnel()}>
            Try it free
          </button>
        </div>
      </footer>

      <FunnelOverlay pricing={pricing} slots={slots} />
    </div>
  );
}
