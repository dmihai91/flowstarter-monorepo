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
  { who: 'Vera', color: '#3E86E8', text: 'Positioning locked: “A Saturday, not a 6-week course.”' },
  { who: 'Iris', color: '#B964E8', text: 'Brand direction locked: warm, earthy, anti-precious.' },
  { who: 'Quinn', color: '#E89B2F', text: 'Hero written: “Make something with your hands this Saturday.”' },
  { who: 'Dash', color: '#2FB87A', text: 'Homepage assembled. Contact & booking wired.' },
  { who: 'Dash', color: '#2FB87A', text: 'Ready for your review. ✓' },
];

// Hero prompt box — typing here drops the visitor straight into the funnel
// with the crew already drafting their site.
const PROMPT_IDEAS = [
  'A weekend pottery studio for total beginners — drop-in classes',
  'A two-chair barbershop in Oakland, walk-ins welcome',
  'A florist making wild, seasonal wedding arrangements',
  'A fitness coach helping men over 30 get strong again',
  'A sourdough subscription for my neighborhood',
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
        <span className="mono hero-prompt-hint">{hint ? 'a sentence is plenty — tell us a bit more' : 'free · no account needed'}</span>
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
        <span className="demo-domain mono">sample · mudroom pottery</span>
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
      sub: 'Name, brand direction and hero — before you pay anything',
      pill: 'DEMO PREVIEW',
      body: (
        <div className="mock-card" style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-.02em' }}>Mudroom</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 12 }}>Drop in. Get your hands dirty.</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {['#C2683F', '#E8B07A', '#3C3A34', '#F2EBDD'].map((c) => (
              <span key={c} style={{ width: 30, height: 30, borderRadius: 8, background: c, border: '1px solid var(--line)' }} />
            ))}
          </div>
          <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-2)' }}>“Make something with your hands this Saturday.”</div>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.08em', color: 'var(--ink-3)', marginTop: 12 }}>
            SAMPLE DRAFT · YOURS IS GENERATED FROM YOUR DESCRIPTION
          </div>
        </div>
      ),
    },
    {
      title: 'Watch the crew build it live',
      sub: 'Four agents, one feed — you direct, they execute',
      pill: 'LIVE BUILD',
      body: (
        <>
          <div className="mock-card" style={{ flex: 1 }}>
            {[
              { c: '#3E86E8', n: 'Vera', t: 'Positioning locked: “A Saturday, not a 6-week course.”' },
              { c: '#B964E8', n: 'Iris', t: 'Brand direction: warm, earthy, anti-precious. Palette ready.' },
              { c: '#E89B2F', n: 'Quinn', t: 'Hero + 3 sections written in your voice.' },
              { c: '#2FB87A', n: 'Dash', t: 'Homepage assembled. Contact & booking wired. ✓' },
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
      sub: `Hosting, your domain and plain-language edits — ${pricing.monthly}/mo`,
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
          <p className="muted pin-hint">{pinned && !reduced ? 'Keep scrolling — the page waits for you ↓' : 'Auto-playing — tap a step to jump'}</p>
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
    kicker: 'Dorin’s portfolio starter — the design system our demo agent builds on today.',
    meta: 'Portfolio · Template',
    img: '/showcase/dorin-portfolio.png',
    href: null,
  },
];

const DRAFTS = [
  { img: '/showcase/draft-cafe.png', name: 'Cluj Board & Brew', prompt: 'a cozy board game café in Cluj with 300+ games' },
  { img: '/showcase/draft-florist.png', name: 'Vienna Wildflower Studio', prompt: 'a florist making wild, seasonal wedding arrangements' },
  { img: '/showcase/draft-fitness.png', name: 'FlowFit Coach', prompt: 'a fitness coach helping men under 30 get in shape' },
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
      a: `A complete online presence: brand identity, written copy, a responsive website with contact & booking flows — built by the agents, approved by you. ${pricing.build} starts the build; ${pricing.final} is due on delivery, after you've reviewed the finished site.`,
    },
    {
      q: 'What if I don’t like what the agents build?',
      a: `You see a free agent-built draft before paying anything, with 10 free prompts to steer it. If you don't approve the finished site, you don't pay the ${pricing.final} — you keep a brand kit (assets + strategy) instead. The ${pricing.build} build fee is non-refundable once the crew starts: you agree to that explicitly at checkout.`,
    },
    {
      q: 'Do I own my website?',
      a: `Yes. Launch with us and it runs on your domain with everything managed; or take the code-only option for the same ${pricing.final} and host it anywhere — no lock-in, no platform cut.`,
    },
    {
      q: 'How long does the build take?',
      a: 'The demo takes seconds; most builds go from payment to review in hours, not weeks. You watch the crew work live, so you’re never left wondering what’s going on.',
    },
    {
      q: `What does the ${pricing.monthly}/mo cover?`,
      a: 'Everything ongoing, in one subscription: hosting on our servers, your domain, SSL, monitoring with automatic fixes, and AI edits — ask in plain language, the crew ships it. Cancel anytime.',
    },
    {
      q: 'I have a bigger project — e-commerce or a custom app.',
      a: `That's beyond the self-serve crew for now. Email us at ${contactEmail} and a human will scope it with you.`,
    },
    {
      q: 'I already have a website.',
      a: 'We do relaunches too. Describe your business and mention your current site — the crew keeps what works and rebuilds the rest properly.',
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
                : 'This month’s build slots are full — drafts stay free, builds reopen next month'}
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
                p: 'One-shot generators spit out a site in seconds — and it reads like everyone else who used the same tool. Thin structure, nothing specific to your business.',
              },
              {
                h: 'Agencies are heavy and slow',
                p: 'Bigger builds take months and real money. After launch, every small change waits on someone else’s schedule.',
              },
              {
                h: 'You stay dependent',
                p: 'The site lives in a system you didn’t build. Every tweak needs the person who set it up — or a weekend lost to tutorials.',
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
                Describe your business in a sentence and a real agent builds a draft of your site —
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
                {pricing.build} puts four specialist agents to work: brand, copy, site, booking — live, in
                front of you, every step visible. You direct; they do.
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
                hosting and AI edits for {pricing.monthly}/mo — or take the code and host it yourself.
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
            — a human will scope it with you.
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
                p: 'Most builders charge first and show later. Here a real agent builds your draft free and takes 10 of your prompts — you decide with the result in front of you.',
              },
              {
                h: 'Built for you, not off a shelf',
                p: 'No template. The crew builds around one business — yours: your voice, your customers, your booking flow.',
              },
              {
                h: 'The editor stays yours',
                p: 'Change wording, photos or sections after launch just by asking in plain words. No software to learn, no freelancer to chase.',
              },
              {
                h: 'Honest pricing, no drip',
                p: `${pricing.total} total plus ${pricing.monthly}/mo if you launch with us — visible before you pay anything, including on this page.`,
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
              <figure key={d.name} className="draft-card reveal" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="proj-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.img} alt={`${d.name} — agent-generated draft`} loading="lazy" />
                </div>
                <figcaption>
                  <b>{d.name}</b>
                  <span className="mono">“{d.prompt}”</span>
                </figcaption>
              </figure>
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

      {/* TEAM — the humans behind the agents */}
      <section className="section section-alt" id="team">
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="eyebrow">Who’s behind this</div>
            <h2>A small team, four tireless agents</h2>
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
            If you sell your time, your hands, or your products — and you’d rather run the business than
            build websites — this is for you.
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
                Puts the crew to work on the full site, live in front of you. Non-refundable once they
                start — you confirm that explicitly.
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
                  <h3>Care plan — {pricing.monthly}/mo</h3>
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
                    <p className="muted">On our servers, with SSL and backups — nothing extra to buy.</p>
                  </div>
                </div>
                <div className="sub-item">
                  <span className="sub-icon" style={{ color: '#4D5DD9' }}>
                    <Icons.spark size={17} stroke={1.9} />
                  </span>
                  <div>
                    <strong>Ongoing AI edits</strong>
                    <p className="muted">Ask in plain language — the crew ships the change.</p>
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
              <p className="sub-foot muted">Cancel anytime — your domain stays yours.</p>
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
              Describe it in one sentence. The agents draft your brand and homepage — free, before you
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
            <a href="#faq">FAQ</a>
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
