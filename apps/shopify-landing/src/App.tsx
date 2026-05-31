import { useUsage, isUsageOk, type PlanKey, type GetToken } from "./useUsage";
import { siteConfig } from "./siteConfig";

const TIER_LABEL: Record<PlanKey, string> = {
  starter: "Starter",
  pro: "Pro",
  max: "Max",
  ecommerce: "Ecommerce",
  admin: "Concierge",
};

function utcMonthShort(): string {
  try {
    return new Date().toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  } catch {
    return "this month";
  }
}

/** The session metric — live "used / total" for a signed-in owner, a neutral
 *  dash for anonymous visitors (we never render a fabricated count). */
function EditsValue({ used, total }: { used: number; total: number | null }) {
  if (total == null) {
    return (
      <>
        <span className="accent">{used}</span> used
      </>
    );
  }
  return (
    <>
      <span className="accent">{used}</span> / {total}
    </>
  );
}

export function App({
  getToken,
  authReady,
  signedIn,
}: {
  getToken?: GetToken;
  authReady?: boolean;
  signedIn?: boolean;
} = {}) {
  const s = siteConfig;
  // Wait for Clerk to load before fetching (so the token is available); the
  // no-Clerk build passes nothing and fetches immediately.
  const { data } = useUsage({
    getToken,
    enabled: getToken ? authReady !== false : true,
    signedIn,
  });
  const ok = isUsageOk(data) ? data : null;
  const tierLabel = ok ? (TIER_LABEL[ok.usage.tier] ?? ok.usage.tier) : null;
  const month = utcMonthShort();

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="fmark" aria-hidden="true">{s.brandName.charAt(0)}</span>
          <div className="crumbs">
            <strong>{s.brandName}</strong>
            <span className="sep">/</span>
            <span className="ws">{s.workspaceSlug}</span>
          </div>
        </div>
        <div className="status" title="Your store is live and published">
          <span className="dot" aria-hidden="true" />
          <span>Live</span>
        </div>
      </header>

      <section className="hero" aria-labelledby="workspace-name">
        <div className="hero-copy">
          <div className="kicker"><span className="em">{s.kicker.lead}</span> · {s.kicker.tail}</div>
          <h1 id="workspace-name" className="name">{s.storeName}<span className="dot">.</span></h1>
          <p className="lede">{s.lede}</p>
          <p className="sub">
            {s.sub.before}{" "}
            <a href={s.storeUrl} rel="noopener external">{s.storeHost}</a>.{" "}
            {s.sub.after}
          </p>
          <div className="hero-cta">
            <a className="btn-primary" href="/editor/">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.4 3.6a2.1 2.1 0 0 1 3 3L8 19l-4 1 1-4Z" /><path d="m14.5 6.5 3 3" />
              </svg>
              Edit my site
              <span className="arrow" aria-hidden="true">→</span>
            </a>
            <a className="btn-ghost" href={s.storeUrl} rel="noopener external">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /><path d="M14 4h6v6" /><path d="M20 4 10 14" /></svg>
              Visit my store
            </a>
          </div>
          <div className="badges" aria-label="Workspace facts">
            {s.badges.map((b) => (
              <span key={b.label} className={b.accent ? "badge accent" : "badge"}>{b.label}</span>
            ))}
          </div>
        </div>

        <a className="preview" href={s.storeUrl} rel="noopener external" aria-label="Open your live store in a new tab">
          <div className="chrome">
            <span className="lights" aria-hidden="true"><i /><i /><i /></span>
            <span className="urlbar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              {s.storeHost}
            </span>
            <span className="livetag">Live</span>
          </div>
          <div className="shot">
            <img src={s.storefrontImage} alt={s.storefrontAlt} width="1600" height="1000" loading="eager" decoding="async" />
            <div className="overlay"><span className="cue">Visit my store →</span></div>
          </div>
        </a>
      </section>

      <section className="how" aria-labelledby="how-heading">
        <div className="eyebrow" id="how-heading">How your site works</div>
        <div className="how-grid">
          <div className="step">
            <span className="n">01</span>
            <span className="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg></span>
            <h3>See your live store</h3>
            <p>Your storefront, exactly as customers see it right now.</p>
          </div>
          <div className="step">
            <span className="n">02</span>
            <span className="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg></span>
            <h3>Make changes by chatting</h3>
            <p>Tell your {s.brandName} assistant what to change, in plain language.</p>
          </div>
          <div className="step">
            <span className="n">03</span>
            <span className="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg></span>
            <h3>Publish when you're ready</h3>
            <p>Your changes stay private until you publish. Your live store never changes by surprise.</p>
          </div>
        </div>
      </section>

      <section className="actions" aria-label="More actions">
        <a className="card" href={s.storeUrl} rel="noopener external">
          <span className="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /><path d="M14 4h6v6" /><path d="M20 4 10 14" /></svg></span>
          <div className="body">
            <h3>Visit your store <span className="pill ok">Live</span></h3>
            <p className="desc">The storefront your customers see right now.</p>
          </div>
          <span className="arrow" aria-hidden="true">→</span>
        </a>
        <a className="card" href="/preview">
          <span className="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg></span>
          <div className="body">
            <h3>Preview changes <span className="pill soon">Coming soon</span></h3>
            <p className="desc">See pending changes before they go live.</p>
          </div>
          <span className="arrow" aria-hidden="true">→</span>
        </a>
      </section>

      <section className="metrics" aria-label="At-a-glance">
        <div className="metric">
          <div className="label">Edits · {month}</div>
          <div className="value">
            {ok ? <EditsValue used={ok.usage.used} total={ok.usage.total} /> : "—"}
          </div>
          <div className="sub">{tierLabel ? `${tierLabel} plan · ` : ""}resets monthly</div>
        </div>
        <div className="metric">
          <div className="label">Your plan</div>
          <div className="value">{tierLabel ?? "—"}</div>
          <div className="sub">concierge included</div>
        </div>
        <div className="metric">
          <div className="label">Publishing</div>
          <div className="value">You're in control</div>
          <div className="sub">nothing goes live until you publish</div>
        </div>
      </section>

      <section className="about" aria-labelledby="about-heading">
        <h2 id="about-heading">About your workspace</h2>
        <p>This is your {s.brandName} home for <strong>{s.storeName}</strong> — one place to visit your store, make changes with your assistant, or preview what's coming.</p>
        <p>Nothing you change goes live automatically. Your edits wait until you click <strong>publish</strong> — until then, your store stays exactly as it is.</p>
      </section>

      <footer>
        <div className="stack">
          <span>{s.storeName}</span>
          <span className="sep">·</span>
          <span>powered by {s.brandName}</span>
        </div>
        <div className="stack">
          <a href={s.helpUrl} rel="noopener">Need help?</a>
          <span className="sep">·</span>
          <a href={s.brandUrl} rel="noopener">{s.brandHost}</a>
        </div>
      </footer>
    </div>
  );
}
