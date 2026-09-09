// screen_build_parts.jsx — sub-components for the build hero.

// agent row in left column
function AgentRow({ agent, status }) {
  const active = status === 'active', done = status === 'done';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 11px', borderRadius: 14,
      background: active ? `color-mix(in srgb, ${agent.color} 12%, transparent)` : 'transparent',
      border: `1px solid ${active ? `color-mix(in srgb, ${agent.color} 40%, transparent)` : 'transparent'}`,
      transition: 'all .3s var(--ease)' }}>
      <AgentAvatar agent={agent} size={36} active={active} done={done} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <AgentLabel agent={agent} light />
      </div>
      <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.08em', color: agent.color,
        opacity: active ? 1 : done ? .6 : .35 }}>
        {active ? '●' : done ? '✓' : '○'}
      </span>
    </div>
  );
}

// one feed line
function FeedLine({ line }) {
  const agent = AGENTS[line.agent];
  return (
    <div className="fade-up" style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: `color-mix(in srgb, ${agent.color} 16%, transparent)`, color: agent.color,
        display: 'grid', placeItems: 'center', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
        border: `1px solid color-mix(in srgb, ${agent.color} 40%, transparent)` }}>
        {agent.name[0]}
      </div>
      <div style={{ flex: 1, paddingTop: 1 }}>
        <span style={{ fontSize: 14.5, color: 'var(--canvas-ink)', lineHeight: 1.45 }}>
          <span style={{ color: agent.color, fontWeight: 600 }}>{agent.name}</span>
          <span style={{ color: 'var(--canvas-ink-2)' }}> · {agent.role}</span>
        </span>
        <div style={{ fontSize: 14.5, color: 'var(--canvas-ink-2)', lineHeight: 1.45, marginTop: 2 }}>{line.text}</div>
        {line.artifact && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 7, padding: '4px 10px',
            borderRadius: 99, background: 'color-mix(in srgb, var(--pos) 16%, transparent)', color: 'var(--pos)',
            fontSize: 12, fontWeight: 600 }}>
            <Icons.check size={12} stroke={2.6} /> Artifact ready
          </div>
        )}
        {line.concierge && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 7, padding: '4px 10px',
            borderRadius: 99, background: 'color-mix(in srgb, var(--accent) 20%, transparent)', color: 'var(--accent-2)',
            fontSize: 12, fontWeight: 600 }}>
            <Icons.user size={12} stroke={2.2} /> Book a call with our team
          </div>
        )}
      </div>
    </div>
  );
}

// artifact card (right column)
const ARTIFACT_META = {
  brand:       { label: 'Brand identity',  icon: Icons.brush, agent: 'brand' },
  positioning: { label: 'Positioning',     icon: Icons.search, agent: 'research' },
  copy:        { label: 'Homepage copy',   icon: Icons.pen, agent: 'copy' },
  site:        { label: 'Website',         icon: Icons.globe, agent: 'dev' },
  booking:     { label: 'Booking flow',    icon: Icons.cal, agent: 'dev' },
};
function ArtifactCard({ plan, unlocked, onClick }) {
  const meta = ARTIFACT_META[plan.artifact];
  const agent = AGENTS[meta.agent];
  const I = meta.icon;
  return (
    <button onClick={onClick} disabled={!unlocked} style={{
      font: 'inherit', textAlign: 'left', width: '100%', cursor: unlocked ? 'pointer' : 'default',
      background: 'var(--canvas-card)', border: `1px solid ${unlocked ? `color-mix(in srgb, ${agent.color} 45%, transparent)` : 'var(--canvas-line)'}`,
      borderRadius: 14, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 11,
      opacity: unlocked ? 1 : .5, transition: 'all .4s var(--ease)',
      transform: unlocked ? 'none' : 'scale(.98)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'grid', placeItems: 'center',
        background: unlocked ? `color-mix(in srgb, ${agent.color} 18%, transparent)` : 'transparent',
        color: unlocked ? agent.color : 'var(--canvas-ink-2)',
        border: unlocked ? 'none' : '1px dashed var(--canvas-line)' }}>
        {unlocked ? <I size={17} /> : <span className="mono" style={{ fontSize: 14 }}>·</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--canvas-ink)' }}>{meta.label}</div>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '.06em', color: unlocked ? agent.color : 'var(--canvas-ink-2)', textTransform: 'uppercase' }}>
          {unlocked ? 'View →' : 'Pending'}
        </div>
      </div>
    </button>
  );
}

// finished block in feed
function BuildDone({ onLaunch, onConcierge }) {
  return (
    <div className="fade-up" style={{ marginTop: 10, background: 'var(--canvas-card)',
      border: '1px solid color-mix(in srgb, var(--pos) 40%, transparent)', borderRadius: 18, padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--pos)', color: '#fff', display: 'grid', placeItems: 'center' }}>
          <Icons.check size={17} stroke={2.6} />
        </div>
        <span className="serif" style={{ fontSize: 22, color: 'var(--canvas-ink)' }}>Your presence is built.</span>
      </div>
      <p style={{ fontSize: 14.5, color: 'var(--canvas-ink-2)', lineHeight: 1.5, margin: '0 0 18px' }}>
        Brand, copy, a responsive site and a live drop-in booking flow — all assembled and wired. Review it, then take it live.
      </p>
      <button onClick={onConcierge} style={{ width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '13px 15px', borderRadius: 14,
        background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
        border: '1px solid color-mix(in srgb, var(--accent) 38%, transparent)', color: 'var(--canvas-ink)' }}>
        <ConciergeAvatar size={36} online={false} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Want a human to take it further?</div>
          <div style={{ fontSize: 12.5, color: 'var(--canvas-ink-2)' }}>Book a call with {CONCIERGE.name.split(' ')[0]} on our team to plan your build</div>
        </div>
        <Icons.arrow size={16} />
      </button>
      <button className="btn btn-primary" onClick={onLaunch}>Review &amp; launch <Icons.arrow size={16} /></button>
    </div>
  );
}

// artifact preview modal
function ArtifactModal({ artifact, onClose }) {
  return (
    <div onClick={onClose} className="fade-in" style={{ position: 'absolute', inset: 0, zIndex: 50,
      background: 'color-mix(in srgb, var(--canvas-bg) 70%, transparent)', backdropFilter: 'blur(6px)',
      display: 'grid', placeItems: 'center', padding: 30 }}>
      <div onClick={e => e.stopPropagation()} style={{ animation: 'popIn .35s var(--ease-out) both',
        background: 'var(--canvas-card)', border: '1px solid var(--canvas-line)', borderRadius: 20,
        width: 'min(560px, 100%)', maxHeight: '84%', overflow: 'auto', boxShadow: 'var(--shadow-lg)' }} className="scroll">
        <ArtifactBody artifact={artifact} />
      </div>
    </div>
  );
}

function ArtifactBody({ artifact }) {
  const head = (label, agent) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 22px', borderBottom: '1px solid var(--canvas-line)' }}>
      <AgentAvatar agent={AGENTS[agent]} size={32} done />
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--canvas-ink)' }}>{label}</div>
        <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: AGENTS[agent].color }}>
          by {AGENTS[agent].name}
        </div>
      </div>
    </div>
  );
  if (artifact === 'brand') return (
    <div>
      {head('Brand identity', 'brand')}
      <div style={{ padding: 24 }}>
        <div className="serif" style={{ fontSize: 40, color: 'var(--canvas-ink)', marginBottom: 4 }}>{GEN_BRAND.name}</div>
        <div style={{ fontSize: 15, color: 'var(--canvas-ink-2)', marginBottom: 20 }}>{GEN_BRAND.tagline}</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {GEN_BRAND.palette.map(c => (
            <div key={c} style={{ flex: 1 }}>
              <div style={{ height: 56, borderRadius: 10, background: c, border: '1px solid var(--canvas-line)' }} />
              <div className="mono" style={{ fontSize: 10, color: 'var(--canvas-ink-2)', marginTop: 5 }}>{c}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          {GEN_BRAND.voice.map(v => (
            <span key={v} style={{ padding: '5px 12px', borderRadius: 99, background: 'color-mix(in srgb, var(--role-brand) 18%, transparent)',
              color: 'var(--role-brand)', fontSize: 12.5, fontWeight: 600 }}>{v}</span>
          ))}
        </div>
      </div>
    </div>
  );
  if (artifact === 'copy') return (
    <div>
      {head('Homepage copy', 'copy')}
      <div style={{ padding: 24 }}>
        <div className="serif" style={{ fontSize: 30, color: 'var(--canvas-ink)', lineHeight: 1.15, marginBottom: 10 }}>{GEN_COPY.hero}</div>
        <p style={{ fontSize: 15, color: 'var(--canvas-ink-2)', lineHeight: 1.55, marginBottom: 22 }}>{GEN_COPY.sub}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {GEN_COPY.sections.map((s, i) => (
            <div key={i} style={{ borderLeft: '2px solid var(--role-copy)', paddingLeft: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--canvas-ink)', marginBottom: 3 }}>{s.h}</div>
              <div style={{ fontSize: 13.5, color: 'var(--canvas-ink-2)', lineHeight: 1.5 }}>{s.p}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  if (artifact === 'positioning') return (
    <div>
      {head('Positioning', 'research')}
      <div style={{ padding: 24 }}>
        <div className="eyebrow" style={{ color: 'var(--canvas-ink-2)', marginBottom: 8 }}>The one-liner</div>
        <div className="serif" style={{ fontSize: 26, color: 'var(--canvas-ink)', lineHeight: 1.25, marginBottom: 20 }}>“A Saturday, not a 6-week course.”</div>
        <div className="eyebrow" style={{ color: 'var(--canvas-ink-2)', marginBottom: 8 }}>Who it's for</div>
        <p style={{ fontSize: 14.5, color: 'var(--canvas-ink-2)', lineHeight: 1.55, margin: 0 }}>
          {VALIDATION.persona.name} — {VALIDATION.persona.tag.toLowerCase()}s who want something tactile and screen-free, without committing to a course.
        </p>
      </div>
    </div>
  );
  // site / booking → tell them it's in the launch preview
  return (
    <div>
      {head(artifact === 'site' ? 'Website' : 'Booking flow', 'dev')}
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ width: 54, height: 54, borderRadius: 14, margin: '0 auto 14px', background: 'color-mix(in srgb, var(--role-dev) 18%, transparent)',
          color: 'var(--role-dev)', display: 'grid', placeItems: 'center' }}>
          {artifact === 'site' ? <Icons.globe size={26} /> : <Icons.cal size={26} />}
        </div>
        <div className="serif" style={{ fontSize: 22, color: 'var(--canvas-ink)', marginBottom: 6 }}>Assembled &amp; wired</div>
        <p style={{ fontSize: 14, color: 'var(--canvas-ink-2)', lineHeight: 1.5, margin: 0 }}>
          See the full {artifact === 'site' ? 'site' : 'booking flow'} in the launch preview — it’s live and responsive.
        </p>
      </div>
    </div>
  );
}

Object.assign(window, { AgentRow, FeedLine, ArtifactCard, BuildDone, ArtifactModal, ArtifactBody });
