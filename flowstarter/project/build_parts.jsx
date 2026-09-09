// build_parts.jsx — helper pieces for the build (hero) screen.

// Agent row in the left column
function AgentRow({ agent, status }) {
  const labels = { idle: 'Queued', active: 'Working…', done: 'Done' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 11px', borderRadius: 14,
      background: status === 'active' ? 'color-mix(in srgb, ' + agent.color + ' 12%, transparent)' : 'transparent',
      border: '1px solid ' + (status === 'active' ? 'color-mix(in srgb, ' + agent.color + ' 40%, transparent)' : 'transparent'),
      transition: 'all .35s var(--ease)', opacity: status === 'idle' ? .5 : 1 }}>
      <AgentAvatar agent={agent} size={36} active={status === 'active'} done={status === 'done'} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <AgentLabel agent={agent} light />
        <div style={{ fontSize: 11, color: status === 'active' ? agent.color : 'var(--canvas-ink-2)',
          marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
          {status === 'active' && <span className="dots" style={{ color: agent.color }}><span></span><span></span><span></span></span>}
          {labels[status]}
        </div>
      </div>
    </div>
  );
}

// A single streamed feed line
function FeedLine({ line, last }) {
  const a = AGENTS[line.agent];
  return (
    <div className="fade-up" style={{ display: 'flex', gap: 11, padding: '7px 0' }}>
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        <AgentAvatar agent={a} size={26} ring={false} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--canvas-ink)' }}>{a.name}</span>
          <span className="mono" style={{ fontSize: 10, letterSpacing: '.06em', color: a.color }}>{a.role.toUpperCase()}</span>
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--canvas-ink-2)', lineHeight: 1.45, marginTop: 1 }}>
          {line.text}
          {last && <span className="dots" style={{ color: a.color, marginLeft: 6 }}><span></span><span></span><span></span></span>}
        </div>
        {line.artifact && (
          <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px',
            borderRadius: 99, background: 'color-mix(in srgb, ' + a.color + ' 16%, transparent)', color: a.color,
            fontSize: 11, fontWeight: 600 }}>
            <Icons.check size={12} stroke={2.6} /> Artifact ready
          </div>
        )}
      </div>
    </div>
  );
}

// Right column: artifacts unlocking
function ArtifactStack({ unlocked }) {
  const items = [
    { key: 'brand',       agent: 'brand',    render: () => <BrandArtifact /> },
    { key: 'positioning', agent: 'research', render: () => <PosArtifact /> },
    { key: 'copy',        agent: 'copy',     render: () => <CopyArtifact /> },
    { key: 'site',        agent: 'dev',      render: () => <SiteArtifact /> },
    { key: 'booking',     agent: 'dev',      render: () => <BookingArtifact /> },
  ];
  return (
    <div className="scroll" style={{ borderLeft: '1px solid var(--canvas-line)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 11 }}>
      <div className="eyebrow" style={{ color: 'var(--canvas-ink-2)', marginBottom: 2 }}>Artifacts</div>
      {items.map(it => {
        const on = unlocked[it.key];
        const a = AGENTS[it.agent];
        return (
          <div key={it.key} style={{ borderRadius: 16, border: '1px solid var(--canvas-line)',
            background: 'var(--canvas-card)', overflow: 'hidden', transition: 'all .4s var(--ease)',
            opacity: on ? 1 : .45 }}>
            {on ? <div className="fade-in">{it.render()}</div> : <ArtifactSkeleton agent={a} />}
          </div>
        );
      })}
    </div>
  );
}

function ArtifactSkeleton({ agent }) {
  return (
    <div style={{ padding: '14px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
        <div style={{ width: 18, height: 18, borderRadius: 5, background: 'color-mix(in srgb,' + agent.color + ' 22%, transparent)' }} />
        <div className="shimmer" style={{ height: 9, width: '50%', borderRadius: 4 }} />
      </div>
      <div className="shimmer" style={{ height: 8, width: '100%', borderRadius: 4, marginBottom: 6 }} />
      <div className="shimmer" style={{ height: 8, width: '78%', borderRadius: 4 }} />
    </div>
  );
}

function ArtHead({ agent, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderBottom: '1px solid var(--canvas-line)' }}>
      <div style={{ width: 7, height: 7, borderRadius: 99, background: agent.color }} />
      <span className="mono" style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--canvas-ink-2)', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

function BrandArtifact() {
  return (
    <div>
      <ArtHead agent={AGENTS.brand} label="Name & identity" />
      <div style={{ padding: '14px 15px' }}>
        <div className="serif" style={{ fontSize: 26, color: 'var(--canvas-ink)', lineHeight: 1 }}>{GEN_BRAND.name}</div>
        <div style={{ fontSize: 12.5, color: 'var(--canvas-ink-2)', marginTop: 4, marginBottom: 12 }}>{GEN_BRAND.tagline}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {GEN_BRAND.palette.map(c => <div key={c} style={{ width: 28, height: 28, borderRadius: 7, background: c, border: '1px solid rgba(255,255,255,.12)' }} />)}
        </div>
      </div>
    </div>
  );
}
function PosArtifact() {
  return (
    <div>
      <ArtHead agent={AGENTS.research} label="Positioning" />
      <div style={{ padding: '14px 15px' }}>
        <p className="serif" style={{ fontSize: 16, color: 'var(--canvas-ink)', margin: 0, lineHeight: 1.35 }}>“A Saturday, not a 6-week course.”</p>
      </div>
    </div>
  );
}
function CopyArtifact() {
  return (
    <div>
      <ArtHead agent={AGENTS.copy} label="Homepage copy" />
      <div style={{ padding: '14px 15px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--canvas-ink)', lineHeight: 1.3, marginBottom: 5 }}>{GEN_COPY.hero}</div>
        <div style={{ fontSize: 12, color: 'var(--canvas-ink-2)', lineHeight: 1.45 }}>{GEN_COPY.sub}</div>
      </div>
    </div>
  );
}
function SiteArtifact() {
  return (
    <div>
      <ArtHead agent={AGENTS.dev} label="Site" />
      <div style={{ padding: 12 }}>
        <div style={{ borderRadius: 9, overflow: 'hidden', border: '1px solid var(--canvas-line)' }}>
          <div style={{ height: 8, background: 'var(--canvas-bg)', display: 'flex', alignItems: 'center', gap: 3, padding: '0 5px' }}>
            <div style={{ width: 4, height: 4, borderRadius: 99, background: '#E8542B' }} />
            <div style={{ width: 4, height: 4, borderRadius: 99, background: '#E8B07A' }} />
          </div>
          <div style={{ background: GEN_BRAND.palette[3], padding: 11 }}>
            <div className="serif" style={{ fontSize: 13, color: GEN_BRAND.palette[2], lineHeight: 1.15 }}>Make something with your hands.</div>
            <div style={{ marginTop: 7, display: 'inline-block', background: GEN_BRAND.palette[0], color: '#fff', fontSize: 8, padding: '4px 8px', borderRadius: 99 }}>Book a Saturday</div>
          </div>
        </div>
      </div>
    </div>
  );
}
function BookingArtifact() {
  return (
    <div>
      <ArtHead agent={AGENTS.dev} label="Booking" />
      <div style={{ padding: '12px 15px', display: 'flex', gap: 6 }}>
        {['SAT', 'SUN'].map(d => (
          <div key={d} style={{ flex: 1, textAlign: 'center', border: '1px solid var(--canvas-line)', borderRadius: 9, padding: '8px 0' }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--canvas-ink-2)' }}>{d}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--canvas-ink)' }}>{d === 'SAT' ? '14' : '15'}</div>
            <div style={{ fontSize: 8, color: 'var(--role-dev)' }}>3 slots</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AgentRow, FeedLine, ArtifactStack });
