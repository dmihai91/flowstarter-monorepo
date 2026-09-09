// screen_integrations.jsx — connect external tools.
function IntegrationsScreen({ onBack }) {
  const isMobile = useIsMobile();
  const [items, setItems] = React.useState(INTEGRATIONS);
  const toggle = (id) => setItems(its => its.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
  const connected = items.filter(i => i.connected).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="glass-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '16px 26px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 5, gap: 10 }}>
        <Logo size={20} />
        <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} onClick={onBack}>
          <Icons.arrow size={15} style={{ transform: 'rotate(180deg)' }} /> Dashboard
        </button>
      </header>

      <div className="scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '24px 16px 48px' : '34px 26px 56px' }}>
          <div className="fade-up" style={{ marginBottom: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Integrations</div>
            <h1 className="serif" style={{ fontSize: isMobile ? 28 : 34, margin: '0 0 8px', letterSpacing: '-.02em' }}>Connect your tools</h1>
            <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.5, margin: 0, maxWidth: 520 }}>
              Plug in the services you already use. The agents wire them into your site automatically — no code.
            </p>
            <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600,
              color: 'var(--pos)', background: 'color-mix(in srgb, var(--pos) 12%, transparent)', padding: '6px 13px', borderRadius: 99 }}>
              <Icons.check size={14} stroke={2.4} /> {connected} of {items.length} connected
            </div>
          </div>

          <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
            {items.map(it => {
              const I = Icons[it.glyph] || Icons.box;
              return (
                <div key={it.id} className="glass-3d" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'grid', placeItems: 'center',
                    background: `color-mix(in srgb, ${it.color} 14%, var(--card))`, color: it.color,
                    border: `1px solid color-mix(in srgb, ${it.color} 30%, transparent)` }}>
                    <I size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{it.name}</span>
                      <span className="mono" style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{it.cat}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>{it.detail}</div>
                  </div>
                  <button onClick={() => toggle(it.id)} className={it.connected ? 'btn btn-ghost' : 'btn btn-primary'}
                    style={{ padding: '8px 14px', fontSize: 13, flexShrink: 0 }}>
                    {it.connected ? <React.Fragment><Icons.check size={14} stroke={2.4} /> Connected</React.Fragment> : 'Connect'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="fade-up" style={{ marginTop: 20, textAlign: 'center', fontSize: 13.5, color: 'var(--ink-3)' }}>
            Don’t see your tool? <span style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Request an integration</span>
          </div>
        </div>
      </div>
    </div>
  );
}
window.IntegrationsScreen = IntegrationsScreen;
