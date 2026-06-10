// screen_launch.jsx — review the built site, then go live.
function LaunchScreen({ onRestart, theme, onConcierge, booked = null }) {
  const dark = theme === 'midnight';
  const [live, setLive] = React.useState(false);
  const [device, setDevice] = React.useState('desktop');
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar stage="launch" right={
        <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} onClick={onRestart}>Start over</button>
      } />
      <div className="scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '30px 26px 50px' }}>

          {/* header row */}
          <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 22 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Ready to launch</div>
              <h1 className="serif" style={{ fontSize: 36, margin: 0, letterSpacing: '-.02em', lineHeight: 1.05 }}>
                Meet <span className="grad-text">{GEN_BRAND.name}</span>.
              </h1>
              <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: '8px 0 0', maxWidth: 460, lineHeight: 1.5 }}>
                Your site, brand, copy and booking — built by the agents, assembled for your approval.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 4, background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 99, padding: 4 }}>
                {['desktop', 'mobile'].map(d => (
                  <button key={d} onClick={() => setDevice(d)} style={{ font: 'inherit', cursor: 'pointer', border: 'none',
                    borderRadius: 99, padding: '7px 14px', fontSize: 13, fontWeight: 600,
                    background: device === d ? 'var(--card)' : 'transparent', color: device === d ? 'var(--ink)' : 'var(--ink-3)',
                    boxShadow: device === d ? 'var(--shadow)' : 'none' }}>{d === 'desktop' ? 'Desktop' : 'Mobile'}</button>
                ))}
              </div>
              {!live
                ? <button className="btn btn-grad" onClick={() => setLive(true)}><Icons.rocket size={17} /> Publish live</button>
                : <span className="btn btn-soft" style={{ cursor: 'default' }}><Icons.check size={16} stroke={2.4} /> Live</span>}
            </div>
          </div>

          {/* concierge — book a call with our team to take the build further */}
          <button onClick={onConcierge} className="fade-up glass" style={{ width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer',
            borderRadius: 'var(--r-lg)', padding: '15px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <ConciergeAvatar size={42} online={!booked} />
            <div style={{ flex: 1 }}>
              {booked ? (
                <React.Fragment>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)' }}>Your build call is booked</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 1 }}>{CONCIERGE.name.split(' ')[0]} from our team will help you take it further</div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)' }}>Want our team to take it further?</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 1 }}>Book a free 30-min call with {CONCIERGE.name.split(' ')[0]} to plan your build</div>
                </React.Fragment>
              )}
            </div>
            <span className="btn btn-soft" style={{ padding: '8px 14px', fontSize: 13, pointerEvents: 'none' }}>{booked ? 'View booking' : 'Book a call'} <Icons.arrow size={14} /></span>
          </button>

          {/* live banner */}
          {live && (
            <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 18px',
              background: 'color-mix(in srgb, var(--pos) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--pos) 35%, transparent)',
              borderRadius: 'var(--r-md)', color: 'var(--pos)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--pos)', animation: 'pulse 1.4s infinite' }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>You're live at</span>
              <span className="mono" style={{ fontSize: 13.5, color: 'var(--accent)', fontWeight: 600 }}>mudroom.studio</span>
            </div>
          )}

          {/* browser frame with the built site */}
          <div className="fade-up" style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)',
            overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#E0655A', '#E8B14C', '#5FB97A'].map(c => <span key={c} style={{ width: 11, height: 11, borderRadius: 99, background: c }} />)}
              </div>
              <div className="mono" style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--ink-3)' }}>
                {live ? '🔒 mudroom.studio' : 'preview · mudroom.studio'}
              </div>
            </div>
            <div style={{ display: 'grid', placeItems: 'center', padding: device === 'mobile' ? '24px' : 0, background: device === 'mobile' ? 'var(--paper)' : 'transparent' }}>
              <div style={{ width: device === 'mobile' ? 390 : '100%', maxWidth: '100%' }}>
                <SitePreview dark={dark} />
              </div>
            </div>
          </div>

          {/* whats next */}
          <div className="fade-up" style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
            {[
              { icon: Icons.globe, t: 'Custom domain', d: 'Connect your own in a click' },
              { icon: Icons.chart, t: 'Track visitors', d: 'See bookings & traffic' },
              { icon: Icons.spark, t: 'Keep iterating', d: 'Ask the agents for changes anytime' },
            ].map((c, i) => {
              const I = c.icon;
              return (
                <div key={i} className="glass" style={{ borderRadius: 'var(--r-md)', padding: '16px 18px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', marginBottom: 10 }}>
                    <I size={17} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{c.t}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.4 }}>{c.d}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// the generated site, rendered in Mudroom's own brand. Follows app theme for light/dark.
function SitePreview({ dark = false }) {
  const [c1, c2] = GEN_BRAND.palette;
  // Mudroom's own light vs dark surface — brand accents (c1/c2) stay constant
  const paper = dark ? '#1A1510' : '#F2EBDD';
  const surface = dark ? '#241C15' : '#F2EBDD';
  const ink = dark ? '#F3ECDF' : '#3C3A34';
  const line = dark ? '#3A2E22' : c2;
  const muted = dark ? 'rgba(243,236,223,.62)' : 'rgba(60,58,52,.7)';
  return (
    <div style={{ fontFamily: 'var(--sans)', background: paper, color: ink, transition: 'background .4s, color .4s' }}>
      {/* nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 26px' }}>
        <span className="serif" style={{ fontSize: 22, color: ink }}>{GEN_BRAND.name}</span>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 13, color: ink }}>
          <span>Classes</span><span>About</span>
          <span style={{ background: c1, color: '#fff', padding: '8px 16px', borderRadius: 99, fontWeight: 600 }}>Book a Saturday</span>
        </div>
      </div>
      {/* hero */}
      <div style={{ padding: '40px 26px 46px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, alignItems: 'center' }}>
        <div>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: dark ? c2 : c1, marginBottom: 14 }}>
            {GEN_BRAND.tagline}
          </div>
          <h2 className="serif" style={{ fontSize: 38, lineHeight: 1.2, margin: '0 0 16px', color: ink, letterSpacing: '-.02em' }}>{GEN_COPY.hero}</h2>
          <p style={{ fontSize: 15, color: muted, lineHeight: 1.55, margin: '0 0 22px' }}>{GEN_COPY.sub}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ background: c1, color: '#fff', padding: '12px 22px', borderRadius: 99, fontWeight: 600, fontSize: 14 }}>Book a drop-in · $48</span>
            <span style={{ border: `1.5px solid ${ink}`, color: ink, padding: '12px 22px', borderRadius: 99, fontWeight: 600, fontSize: 14 }}>See class times</span>
          </div>
        </div>
        <div style={{ aspectRatio: '4/5', borderRadius: 18, background: `linear-gradient(150deg, ${c2}, ${c1})`,
          display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', opacity: .9 }}>
            <Icons.brush size={64} stroke={1.4} />
          </div>
          <span style={{ position: 'absolute', bottom: 14, left: 14, background: paper, color: ink, padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
            Hands in clay, no experience
          </span>
        </div>
      </div>
      {/* 3 sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, padding: '0 26px 40px' }}>
        {GEN_COPY.sections.map((s, i) => (
          <div key={i} style={{ background: surface, border: `1px solid ${line}`, borderRadius: 14, padding: '18px 18px' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: c1, color: '#fff', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
              {[<Icons.spark size={16} key="a"/>, <Icons.cal size={16} key="b"/>, <Icons.user size={16} key="c"/>][i]}
            </div>
            <div className="serif" style={{ fontSize: 19, color: ink, marginBottom: 6 }}>{s.h}</div>
            <div style={{ fontSize: 13, color: muted, lineHeight: 1.5 }}>{s.p}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
window.LaunchScreen = LaunchScreen;
