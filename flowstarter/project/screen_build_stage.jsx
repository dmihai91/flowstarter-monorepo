// screen_build_stage.jsx — the live self-assembling site preview + crew + stepper.

// skeleton shimmer block
function Sk({ w = '100%', h = 12, r = 6, mb = 0, light }) {
  return <div style={{ width: w, height: h, borderRadius: r, marginBottom: mb,
    background: 'var(--canvas-line)', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0,
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.07), transparent)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.6s infinite' }} />
  </div>;
}

// reveal wrapper — fades/slides content in when `on` flips true
function Reveal({ on, children, delay = 0 }) {
  return (
    <div style={{
      opacity: on ? 1 : 0,
      transform: on ? 'none' : 'translateY(10px)',
      transition: `opacity .6s var(--ease-out) ${delay}s, transform .6s var(--ease-out) ${delay}s`,
    }}>{children}</div>
  );
}

// THE STAGE: a browser frame where Mudroom assembles itself
function BuildStage({ unlocked, activeAgent, finished }) {
  const has = (k) => !!unlocked[k];
  const [c1, c2, dink, dpaper] = GEN_BRAND.palette; // #C2683F, #E8B07A, #3C3A34, #F2EBDD
  const ink = '#2E2A24', paper = '#FBF7EF';

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden',
      border: '1px solid var(--canvas-line)', boxShadow: '0 30px 80px -40px rgba(0,0,0,.8)',
      background: paper }}>
      {/* browser chrome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
        background: '#ECE5D8', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#E0655A', '#E8B14C', '#5FB97A'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: 99, background: c }} />)}
        </div>
        <div className="mono" style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#8A8270' }}>
          {has('brand') ? 'mudroom.studio' : 'assembling…'}
        </div>
      </div>

      {/* viewport */}
      <div style={{ padding: '20px 26px 26px', minHeight: 420, position: 'relative' }}>
        {/* scan line while building */}
        {!finished && (
          <div style={{ position: 'absolute', left: 0, right: 0, height: 2, top: 0, zIndex: 4,
            background: `linear-gradient(90deg, transparent, ${c1}, transparent)`,
            animation: 'scan 2.6s var(--ease) infinite', opacity: .8 }} />
        )}

        {/* nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
          {has('brand')
            ? <Reveal on><span className="serif" style={{ fontSize: 22, color: ink, fontWeight: 600 }}>{GEN_BRAND.name}</span></Reveal>
            : <Sk w={104} h={20} r={6} />}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {has('site') ? (
              <Reveal on>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 12.5, color: ink }}>
                  <span>Classes</span><span>About</span>
                  <span style={{ background: has('booking') ? c1 : '#D9CFBD', color: has('booking') ? paper : '#8A8270',
                    padding: '7px 14px', borderRadius: 99, fontWeight: 600, transition: 'all .5s' }}>Book a Saturday</span>
                </div>
              </Reveal>
            ) : <><Sk w={48} h={11} /><Sk w={42} h={11} /><Sk w={96} h={28} r={99} /></>}
          </div>
        </div>

        {/* hero */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 22, alignItems: 'center' }}>
          <div>
            {has('positioning')
              ? <Reveal on><div className="mono" style={{ fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: c1, marginBottom: 12 }}>{GEN_BRAND.tagline}</div></Reveal>
              : <Sk w={150} h={11} mb={14} />}
            {has('copy')
              ? <Reveal on><h2 className="serif" style={{ fontSize: 34, lineHeight: 1.1, margin: '0 0 12px', color: ink, fontWeight: 600 }}>{GEN_COPY.hero}</h2></Reveal>
              : <div style={{ marginBottom: 14 }}><Sk h={26} mb={8} /><Sk w="70%" h={26} /></div>}
            {has('copy')
              ? <Reveal on delay={.1}><p style={{ fontSize: 13.5, color: ink, opacity: .72, lineHeight: 1.55, margin: '0 0 20px' }}>{GEN_COPY.sub}</p></Reveal>
              : <div style={{ marginBottom: 20 }}><Sk h={10} mb={7} /><Sk h={10} mb={7} /><Sk w="80%" h={10} /></div>}
            {has('booking')
              ? <Reveal on><span style={{ display: 'inline-block', background: c1, color: paper, padding: '11px 20px', borderRadius: 99, fontWeight: 600, fontSize: 13.5 }}>Book a drop-in · $48</span></Reveal>
              : <Sk w={170} h={40} r={99} />}
          </div>
          {/* hero image block — paints once brand exists */}
          <div style={{ aspectRatio: '4/5', borderRadius: 16, position: 'relative', overflow: 'hidden',
            background: has('brand') ? `linear-gradient(150deg, ${c2}, ${c1})` : 'var(--canvas-line)',
            transition: 'background .8s var(--ease)', display: 'grid', placeItems: 'center' }}>
            {has('brand')
              ? <Reveal on delay={.15}><div style={{ color: paper, opacity: .9 }}><Icons.brush size={56} stroke={1.3} /></div></Reveal>
              : <div style={{ position: 'absolute', inset: 0 }}><Sk h="100%" r={16} /></div>}
          </div>
        </div>

        {/* sections */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 26 }}>
          {GEN_COPY.sections.map((s, i) => (
            has('site')
              ? <Reveal key={i} on delay={i * .12}>
                  <div style={{ background: paper, border: `1px solid ${c2}`, borderRadius: 12, padding: '14px 15px', height: '100%' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: c1, color: paper, display: 'grid', placeItems: 'center', marginBottom: 9 }}>
                      {[<Icons.spark size={14} key="a"/>, <Icons.cal size={14} key="b"/>, <Icons.user size={14} key="c"/>][i]}
                    </div>
                    <div className="serif" style={{ fontSize: 15, color: ink, marginBottom: 4, fontWeight: 600 }}>{s.h}</div>
                    <div style={{ fontSize: 11.5, color: ink, opacity: .68, lineHeight: 1.45 }}>{s.p}</div>
                  </div>
                </Reveal>
              : <div key={i} style={{ background: '#F3EEE2', border: '1px solid #E6DECC', borderRadius: 12, padding: '14px 15px' }}>
                  <Sk w={26} h={26} r={7} mb={10} /><Sk w="70%" h={12} mb={8} /><Sk h={9} mb={5} /><Sk w="85%" h={9} />
                </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// crew card — agent + their live current action
function CrewCard({ agent, status, action }) {
  const active = status === 'active', done = status === 'done';
  return (
    <div style={{ display: 'flex', gap: 12, padding: '13px 13px', borderRadius: 16,
      background: active ? `color-mix(in srgb, ${agent.color} 13%, var(--canvas-card))` : 'var(--canvas-card)',
      border: `1px solid ${active ? `color-mix(in srgb, ${agent.color} 45%, transparent)` : 'var(--canvas-line)'}`,
      transition: 'all .35s var(--ease)', position: 'relative', overflow: 'hidden' }}>
      {active && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: agent.color }} />}
      <AgentAvatar agent={agent} size={38} active={active} done={done} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--canvas-ink)' }}>{agent.name}</span>
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.07em', textTransform: 'uppercase', color: agent.color }}>{agent.role}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--canvas-ink-2)', lineHeight: 1.4, marginTop: 3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {done && !active ? <span style={{ color: 'var(--pos)' }}>✓ Done</span> : action || agent.blurb}
        </div>
        {active && (
          <div style={{ marginTop: 8, height: 3, borderRadius: 99, background: 'var(--canvas-line)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '40%', borderRadius: 99, background: agent.color,
              animation: 'indet 1.4s var(--ease) infinite' }} />
          </div>
        )}
      </div>
    </div>
  );
}

// deliverable step in the right rail stepper
function DeliverableStep({ plan, state, last, onClick }) {
  const meta = ARTIFACT_META[plan.artifact];
  const agent = AGENTS[meta.agent];
  const I = meta.icon;
  const done = state === 'done';
  return (
    <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
      {/* connector */}
      {!last && <div style={{ position: 'absolute', left: 15, top: 30, bottom: -14, width: 2,
        background: done ? agent.color : 'var(--canvas-line)', opacity: done ? .5 : 1 }} />}
      {/* node */}
      <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', zIndex: 1,
        background: done ? agent.color : 'var(--canvas-card)',
        border: `1.5px solid ${done ? agent.color : 'var(--canvas-line)'}`,
        color: done ? '#fff' : 'var(--canvas-ink-2)', transition: 'all .4s var(--ease)' }}>
        {done ? <Icons.check size={15} stroke={2.6} /> : <I size={14} />}
      </div>
      <button onClick={done ? onClick : undefined} style={{ font: 'inherit', textAlign: 'left', background: 'none', border: 'none',
        cursor: done ? 'pointer' : 'default', flex: 1, padding: '4px 0 14px', opacity: done ? 1 : .5 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--canvas-ink)' }}>{meta.label}</div>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase',
          color: done ? agent.color : 'var(--canvas-ink-2)' }}>{done ? 'View →' : 'Pending'}</div>
      </button>
    </div>
  );
}

Object.assign(window, { BuildStage, CrewCard, DeliverableStep, Sk, Reveal });
