// build_artifacts.jsx — the artifact tiles + live mini-preview for the build hero.

// small mini-preview of the generated homepage (assembles as 'site' unlocks)
function MiniSite({ unlocked }) {
  const b = GEN_BRAND, c = GEN_COPY;
  const has = (k) => unlocked[k];
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--canvas-line)',
      background: has('site') ? b.palette[3] : 'var(--canvas-card)', transition: 'background .5s' }}>
      {/* nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 11px', borderBottom: `1px solid ${has('site') ? 'rgba(0,0,0,.08)' : 'var(--canvas-line)'}` }}>
        <span className="serif" style={{ fontSize: 14, color: has('brand') ? b.palette[2] : 'var(--canvas-ink-2)',
          fontWeight: 600, transition: 'color .5s' }}>{has('brand') ? b.name : '···'}</span>
        {has('booking') ? (
          <span style={{ fontSize: 8, fontWeight: 700, padding: '3px 7px', borderRadius: 99, background: b.palette[0], color: '#fff' }}>Book a class</span>
        ) : (
          <span className="shimmer" style={{ width: 44, height: 12, borderRadius: 99, display: 'block' }} />
        )}
      </div>
      {/* hero */}
      <div style={{ padding: '16px 13px 18px' }}>
        {has('copy') ? (
          <>
            <div className="serif fade-in" style={{ fontSize: 16, lineHeight: 1.2, color: b.palette[2], marginBottom: 6 }}>{c.hero}</div>
            <div className="fade-in" style={{ fontSize: 9.5, lineHeight: 1.45, color: b.palette[2], opacity: .7 }}>{c.sub}</div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="shimmer" style={{ height: 14, width: '85%', borderRadius: 5, display: 'block' }} />
            <span className="shimmer" style={{ height: 8, width: '100%', borderRadius: 5, display: 'block' }} />
            <span className="shimmer" style={{ height: 8, width: '70%', borderRadius: 5, display: 'block' }} />
          </div>
        )}
        {/* palette swatches */}
        {has('brand') && (
          <div className="fade-in" style={{ display: 'flex', gap: 4, marginTop: 12 }}>
            {b.palette.map((p, i) => <span key={i} style={{ width: 16, height: 16, borderRadius: 5, background: p, border: '1px solid rgba(0,0,0,.1)' }} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function ArtifactsPanel({ unlocked }) {
  const items = [
    { k: 'brand', agent: AGENTS.brand, label: 'Brand identity', val: () => GEN_BRAND.name },
    { k: 'positioning', agent: AGENTS.research, label: 'Positioning', val: () => '“A Saturday, not a course.”' },
    { k: 'copy', agent: AGENTS.copy, label: 'Homepage copy', val: () => 'Hero + 3 sections' },
    { k: 'booking', agent: AGENTS.dev, label: 'Booking flow', val: () => 'Live drop-in slots' },
  ];
  return (
    <div className="scroll" style={{ borderLeft: '1px solid var(--canvas-line)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="eyebrow" style={{ color: 'var(--canvas-ink-2)' }}>Live preview</div>
      <MiniSite unlocked={unlocked} />
      <div className="eyebrow" style={{ color: 'var(--canvas-ink-2)', marginTop: 4 }}>Artifacts</div>
      {items.map(it => {
        const on = unlocked[it.k];
        return (
          <div key={it.k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 12,
            background: on ? 'var(--canvas-card)' : 'transparent', border: `1px solid ${on ? it.agent.color : 'var(--canvas-line)'}`,
            opacity: on ? 1 : .55, transition: 'all .4s var(--ease)',
            animation: on ? 'popIn .4s var(--ease) both' : 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'grid', placeItems: 'center',
              background: `color-mix(in srgb, ${it.agent.color} 18%, transparent)`, color: it.agent.color }}>
              {on ? <Icons.check size={16} stroke={2.6} /> : (ROLE_ICON[it.agent.id]?.({ size: 15 }))}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--canvas-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</div>
              <div style={{ fontSize: 11, color: 'var(--canvas-ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {on ? it.val() : 'Pending…'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
window.ArtifactsPanel = ArtifactsPanel;
