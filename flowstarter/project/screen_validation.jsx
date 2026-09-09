// screen_validation.jsx — the validation verdict (the differentiator).
function ValidationScreen({ onBuild, onBack }) {
  const v = VALIDATION;
  const [score, setScore] = React.useState(0);
  React.useEffect(() => {
    let n = 0;
    const id = setInterval(() => { n += 2; if (n >= v.score) { n = v.score; clearInterval(id); } setScore(n); }, 18);
    return () => clearInterval(id);
  }, []);
  const verd = {
    go: { label: 'Go', color: 'var(--pos)', icon: Icons.check },
    caution: { label: 'Proceed with care', color: 'var(--warn)', icon: Icons.warn },
    rework: { label: 'Rework', color: 'var(--neg)', icon: Icons.warn },
  }[v.verdict];
  const tone = { pos: 'var(--pos)', warn: 'var(--warn)', neg: 'var(--neg)' };
  const R = 60, C = 2 * Math.PI * R;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar stage="report" right={<span className="eyebrow">Validation</span>} />
      <div className="scroll" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 'min(940px, 100%)', padding: '34px 26px 50px' }}>

          {/* verdict header */}
          <div className="fade-up" style={{ display: 'flex', gap: 30, alignItems: 'center', flexWrap: 'wrap', marginBottom: 30 }}>
            <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
              <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r={R} fill="none" stroke="var(--line)" strokeWidth="10" />
                <circle cx="70" cy="70" r={R} fill="none" stroke={verd.color} strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)}
                  style={{ transition: 'stroke-dashoffset .1s linear' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <div>
                  <div className="serif" style={{ fontSize: 44, lineHeight: 1 }}>{score}</div>
                  <div className="eyebrow" style={{ fontSize: 9.5 }}>Viability</div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 13px', borderRadius: 999,
                background: `color-mix(in srgb, ${verd.color} 14%, transparent)`, color: verd.color, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
                <verd.icon size={15} stroke={2.4} /> {verd.label}
              </div>
              <h1 className="serif" style={{ fontSize: 34, margin: '0 0 10px', lineHeight: 1.1, letterSpacing: '-.02em' }}>{v.headline}</h1>
              <p style={{ fontSize: 16, color: 'var(--ink-2)', lineHeight: 1.55, margin: 0, maxWidth: 560 }}>{v.summary}</p>
            </div>
          </div>

          {/* market signals */}
          <div className="eyebrow fade-up" style={{ marginBottom: 12 }}>What the research found</div>
          <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 26 }}>
            {v.market.map((m, i) => (
              <div key={i} className="glass" style={{ borderRadius: 'var(--r-md)', padding: '15px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500, lineHeight: 1.3 }}>{m.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: tone[m.tone], whiteSpace: 'nowrap', flexShrink: 0 }}>{m.value}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.45 }}>{m.detail}</div>
              </div>
            ))}
          </div>

          {/* wedge + persona */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 26 }}>
            <div className="fade-up" style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--r-lg)', padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -10, bottom: -16, opacity: .16 }}><Icons.bolt size={120} /></div>
              <div className="eyebrow" style={{ color: 'inherit', opacity: .82, marginBottom: 10 }}>Your wedge</div>
              <p className="serif" style={{ fontSize: 23, margin: 0, lineHeight: 1.3, position: 'relative' }}>{v.wedge}</p>
            </div>
            <div className="fade-up glass" style={{ borderRadius: 'var(--r-lg)', padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
                  <Icons.user size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{v.persona.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{v.persona.tag}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>“{v.persona.quote}”</p>
            </div>
          </div>

          {/* risks */}
          <div className="fade-up" style={{ background: 'var(--card)', border: '1px solid var(--line)', borderLeft: '3px solid var(--warn)', borderRadius: 'var(--r-md)', padding: '18px 22px', marginBottom: 32 }}>
            <div className="eyebrow" style={{ color: 'var(--warn)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icons.warn size={13} /> Watch these before you commit
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {v.risks.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--warn)', marginTop: 2 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="fade-up glass" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
            borderRadius: 'var(--r-lg)', padding: '22px 26px' }}>
            <div>
              <div className="serif" style={{ fontSize: 22, lineHeight: 1.2 }}>Validated. Want the agents to build it?</div>
              <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>Brand, copy, site and booking — assembled for your approval.</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={onBack}>Refine the idea</button>
              <button className="btn btn-grad" onClick={onBuild}>Build it for me <Icons.arrow size={16} /></button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
window.ValidationScreen = ValidationScreen;
