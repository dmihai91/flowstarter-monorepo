// screen_pricing.jsx — single pricing moment after validation, before build.
function PricingScreen({ onPick, onBack }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar stage="report" right={
        <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} onClick={onBack}>Back</button>
      } />
      <div className="scroll" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 'min(860px, 100%)', padding: isMobile ? '26px 16px 44px' : '40px 26px 54px' }}>
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: 30 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Validated · ready to build</div>
            <h1 className="serif" style={{ fontSize: isMobile ? 30 : 40, margin: 0, lineHeight: 1.06, letterSpacing: '-.02em' }}>
              How do you want to build it?
            </h1>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {PRICING.map((p, i) => {
              const primary = p.id === 'build';
              return (
                <div key={p.id} className="fade-up glass-3d" style={{ padding: isMobile ? 22 : '28px 26px',
                  display: 'flex', flexDirection: 'column', position: 'relative', animationDelay: `${i * .08}s`,
                  border: primary ? '1.5px solid color-mix(in srgb, var(--accent) 55%, transparent)' : '1px solid var(--line)' }}>
                  <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 99,
                    background: primary ? 'var(--accent)' : 'var(--accent-soft)', color: primary ? '#fff' : 'var(--accent)',
                    fontSize: 11, fontWeight: 700, letterSpacing: '.04em', marginBottom: 16 }}>
                    {p.kicker}
                  </div>
                  <h2 className="serif" style={{ fontSize: 25, margin: '0 0 12px', letterSpacing: '-.02em' }}>{p.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                    <span className="serif" style={{ fontSize: 34, lineHeight: 1 }}>{p.price}</span>
                    <span style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>{p.priceNote}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', marginBottom: 16 }}>{p.sub}</div>
                  <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5, margin: '0 0 18px' }}>{p.desc}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
                    {p.points.map(pt => (
                      <div key={pt} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: 'var(--ink-2)' }}>
                        <Icons.check size={15} stroke={2.4} style={{ color: 'var(--pos)', flexShrink: 0 }} /> {pt}
                      </div>
                    ))}
                  </div>
                  <button className={primary ? 'btn btn-primary' : 'btn btn-ghost'} onClick={() => onPick(p.id)}
                    style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }}>
                    {p.cta} <Icons.arrow size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="fade-up" style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-3)', marginTop: 22 }}>
            Cancel anytime · no lock-in · your domain stays yours
          </div>
        </div>
      </div>
    </div>
  );
}
window.PricingScreen = PricingScreen;
