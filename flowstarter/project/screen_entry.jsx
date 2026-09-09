// screen_entry.jsx — the two-door entry.
function EntryScreen({ onPick, onHome }) {
  const [hover, setHover] = React.useState(null);
  const isMobile = useIsMobile();
  return (
    <div className="scroll" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* slim top brand */}
      <div style={{ padding: isMobile ? '16px 18px' : '22px 30px', display: 'flex',
        justifyContent: isMobile ? 'center' : 'space-between', alignItems: 'center' }}>
        <button onClick={onHome} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>
          <Logo size={22} />
        </button>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: 'var(--mono)',
            fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
            <Icons.flow size={14} /> Validate · Build · Launch
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: isMobile ? '10px 18px 40px' : '10px 30px 50px' }}>
        <div style={{ width: 'min(1040px, 100%)' }}>
          {/* headline */}
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 44 }}>
            <div className="eyebrow" style={{ marginBottom: 18, lineHeight: 1.7 }}>
              {isMobile ? 'Agents do the building' : 'From idea to online — agents do the building'}
            </div>
            <h1 className="serif" style={{ fontSize: 'clamp(40px, 6vw, 68px)', lineHeight: 1.02, margin: 0,
              letterSpacing: '-.02em' }}>
              You advise.<br/>
              The agents <span className="grad-text">build it.</span>
            </h1>
            <p style={{ fontSize: isMobile ? 16 : 18, color: 'var(--ink-2)', maxWidth: 540, margin: '22px auto 0', lineHeight: 1.5, textWrap: 'pretty' }}>
              Tell Flowstarter what you would like to build. A team of smart specialists
              will work for you 24/7 to make your dream come true.
            </p>
          </div>

          {/* two doors */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
            {DOORS.map((door, i) => {
              const isHover = hover === door.id;
              return (
                <button key={door.id} onClick={() => onPick(door.id)}
                  onMouseEnter={() => setHover(door.id)} onMouseLeave={() => setHover(null)}
                  className="fade-up glass"
                  style={{
                    textAlign: 'left', cursor: 'pointer', font: 'inherit',
                    border: `1.5px solid ${isHover ? 'var(--accent)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--r-xl)', padding: '30px 30px 26px',
                    boxShadow: isHover ? 'var(--shadow-lg)' : 'var(--shadow)',
                    transform: isHover ? 'translateY(-4px)' : 'none',
                    transition: 'all .3s var(--ease)', animationDelay: `${.1 + i * .08}s`,
                    display: 'flex', flexDirection: 'column', minHeight: 280, position: 'relative', overflow: 'hidden',
                  }}>
                  {/* door number watermark */}
                  <div className="serif" style={{ position: 'absolute', top: -18, right: 8, fontSize: 150,
                    lineHeight: 1, color: 'var(--line-2)', userSelect: 'none' }}>
                    {i + 1}
                  </div>
                  <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 14 }}>{door.kicker}</div>
                  <h2 className="serif" style={{ fontSize: 32, margin: '0 0 12px', letterSpacing: '-.02em', color: 'var(--ink)' }}>{door.title}</h2>
                  <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.5, margin: 0, maxWidth: 320, flex: 1 }}>
                    {door.desc}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 22 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {door.steps.map((s, j) => (
                        <React.Fragment key={s}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.06em',
                            color: 'var(--ink-3)' }}>{s}</span>
                          {j < door.steps.length - 1 && <span style={{ color: 'var(--ink-3)', opacity: .5 }}>→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="btn btn-grad" style={{ padding: '12px 18px', fontSize: 14,
                      width: '100%', justifyContent: 'center',
                      transform: isHover ? 'translateY(-1px)' : 'none' }}>
                      {door.cta} <Icons.arrow size={16} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* agent cast strip */}
          <div className="fade-up" style={{ marginTop: 36, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 22, flexWrap: 'wrap', animationDelay: '.3s' }}>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Your build team:</span>
            {AGENT_LIST.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <AgentAvatar agent={a} size={30} ring={false} />
                <AgentLabel agent={a} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
window.EntryScreen = EntryScreen;
