// screen_build.jsx — THE HERO. Watch your site assemble itself, live.
function BuildScreen({ onLaunch, onConcierge }) {
  const isMobile = useIsMobile();
  const [feedIdx, setFeedIdx] = React.useState(0);
  const [unlocked, setUnlocked] = React.useState({});
  const [activeAgent, setActiveAgent] = React.useState('research');
  const [progress, setProgress] = React.useState(0);
  const [finished, setFinished] = React.useState(false);
  const [focus, setFocus] = React.useState(null);

  React.useEffect(() => {
    if (feedIdx >= BUILD_FEED.length) {
      const id = setTimeout(() => setFinished(true), 900);
      return () => clearTimeout(id);
    }
    const line = BUILD_FEED[feedIdx];
    const id = setTimeout(() => {
      setActiveAgent(line.agent);
      if (line.artifact) setUnlocked(u => ({ ...u, [line.artifact]: true }));
      setProgress(Math.round(((feedIdx + 1) / BUILD_FEED.length) * 100));
      setFeedIdx(i => i + 1);
    }, feedIdx === 0 ? 800 : 1250);
    return () => clearTimeout(id);
  }, [feedIdx]);

  // latest action text per agent (so far)
  const lastAction = {};
  BUILD_FEED.slice(0, feedIdx).forEach(l => { lastAction[l.agent] = l.text; });
  const currentLine = feedIdx > 0 ? BUILD_FEED[Math.min(feedIdx, BUILD_FEED.length) - 1] : null;

  const agentStatus = (id) => {
    if (finished) return 'done';
    const planDone = BUILD_PLAN.filter(p => p.agent === id).every(p => unlocked[p.artifact]);
    if (activeAgent === id && !planDone) return 'active';
    if (planDone && BUILD_PLAN.some(p => p.agent === id)) return 'done';
    return 'idle';
  };
  const stepState = (p) => unlocked[p.artifact] ? 'done' : 'pending';

  return (
    <div className="build-surface" style={{ height: '100%', display: 'flex', flexDirection: 'column',
      color: 'var(--canvas-ink)' }}>
      {/* header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '15px 26px', borderBottom: '1px solid var(--canvas-line)', flexShrink: 0, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <LogoMark size={isMobile ? 26 : 30} />
          {!isMobile && <span style={{ fontWeight: 700, fontSize: 19, letterSpacing: '-.03em', color: 'var(--canvas-ink)' }}>Flowstarter</span>}
          <span className="mono" style={{ marginLeft: isMobile ? 0 : 6, padding: '4px 10px', borderRadius: 7,
            background: finished ? 'color-mix(in srgb, var(--pos) 22%, transparent)' : 'color-mix(in srgb, var(--accent) 22%, transparent)',
            color: finished ? 'var(--pos)' : 'var(--accent-2)', fontSize: 10.5, letterSpacing: '.08em' }}>
            {finished ? 'READY' : 'BUILDING'}
          </span>
        </div>
        {!isMobile && <ProgressRail stage="build" light />}
        <div style={{ minWidth: isMobile ? 0 : 130, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
          {!isMobile && <CreditsMeter light />}
          <ThemeToggle light />
          <div style={{ width: isMobile ? 44 : 70, height: 4, borderRadius: 99, background: 'var(--canvas-line)', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', borderRadius: 99, background: 'var(--accent)', transition: 'width .6s var(--ease)' }} />
          </div>
          <span className="mono" style={{ fontSize: 13, color: 'var(--canvas-ink-2)' }}>{progress}%</span>
        </div>
      </header>

      {/* body */}
      <div className={isMobile ? 'scroll' : ''} style={{ flex: 1, display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: '278px 1fr 250px', minHeight: 0 }}>
        {/* CREW */}
        {isMobile ? (
          <div style={{ borderBottom: '1px solid var(--canvas-line)', padding: '14px 16px' }}>
            <div className="eyebrow" style={{ color: 'var(--canvas-ink-2)', marginBottom: 10 }}>Your crew</div>
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
              {AGENT_LIST.map(a => {
                const st = agentStatus(a.id);
                return (
                  <div key={a.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, width: 64 }}>
                    <AgentAvatar agent={a} size={40} active={st === 'active'} done={st === 'done'} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--canvas-ink)', whiteSpace: 'nowrap' }}>{a.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
        <div className="scroll" style={{ borderRight: '1px solid var(--canvas-line)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div className="eyebrow" style={{ color: 'var(--canvas-ink-2)', marginBottom: 4, paddingLeft: 4 }}>Your crew</div>
          {AGENT_LIST.map(a => <CrewCard key={a.id} agent={a} status={agentStatus(a.id)} action={lastAction[a.id]} />)}
          <div style={{ marginTop: 'auto', paddingTop: 14, paddingLeft: 4 }}>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--canvas-ink-2)', lineHeight: 1.6 }}>
              You direct. The crew executes — and pauses for your call on anything risky.
            </div>
          </div>
        </div>
        )}

        {/* STAGE */}
        <div className={isMobile ? '' : 'scroll'} style={{ padding: isMobile ? '18px 16px' : '22px 30px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* live caption */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16, minHeight: 30 }}>
            {finished ? (
              <><div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--pos)', color: '#fff', display: 'grid', placeItems: 'center' }}><Icons.check size={15} stroke={2.6} /></div>
                <span style={{ fontSize: 15, color: 'var(--canvas-ink)', fontWeight: 600 }}>Your site is built. Take a look.</span></>
            ) : currentLine ? (
              <><AgentAvatar agent={AGENTS[activeAgent]} size={26} active />
                <span style={{ fontSize: 14.5, color: 'var(--canvas-ink-2)' }}>
                  <span style={{ color: AGENTS[activeAgent].color, fontWeight: 600 }}>{AGENTS[activeAgent].name}</span> {currentLine.text}
                </span></>
            ) : <span style={{ fontSize: 14.5, color: 'var(--canvas-ink-2)' }}>Spinning up the crew…</span>}
          </div>

          <BuildStage unlocked={unlocked} activeAgent={activeAgent} finished={finished} />

          {/* launch CTA */}
          {finished && (
            <React.Fragment>
              <button onClick={onConcierge} className="fade-up" style={{ marginTop: 18, width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 13, padding: '15px 18px', borderRadius: 14,
                background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent) 38%, transparent)', color: 'var(--canvas-ink)' }}>
                <ConciergeAvatar size={40} online={false} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>Want a human to take it the rest of the way?</div>
                  <div style={{ fontSize: 13, color: 'var(--canvas-ink-2)', marginTop: 1 }}>Book a 30-min call with {CONCIERGE.name.split(' ')[0]} on our team to plan your build</div>
                </div>
                <span className="btn btn-soft" style={{ padding: '8px 14px', fontSize: 13, pointerEvents: 'none' }}>Book a call <Icons.arrow size={14} /></span>
              </button>
              <div className="fade-up" style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 16, padding: '16px 20px', borderRadius: 14, background: 'var(--canvas-card)', border: '1px solid var(--canvas-line)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--canvas-ink)' }}>Brand, copy, site &amp; booking — all wired.</div>
                  <div style={{ fontSize: 13, color: 'var(--canvas-ink-2)', marginTop: 2 }}>Review the full experience, then take it live.</div>
                </div>
                <button className="btn btn-grad" onClick={onLaunch}>Review &amp; launch <Icons.arrow size={16} /></button>
              </div>
            </React.Fragment>
          )}
        </div>

        {/* DELIVERABLES STEPPER */}
        <div className={isMobile ? '' : 'scroll'} style={{ borderLeft: isMobile ? 'none' : '1px solid var(--canvas-line)',
          borderTop: isMobile ? '1px solid var(--canvas-line)' : 'none', padding: isMobile ? '18px 16px' : '20px 18px' }}>
          <div className="eyebrow" style={{ color: 'var(--canvas-ink-2)', marginBottom: 16, paddingLeft: 2 }}>Deliverables</div>
          <div>
            {BUILD_PLAN.map((p, i) => (
              <DeliverableStep key={p.id} plan={p} state={stepState(p)} last={i === BUILD_PLAN.length - 1}
                onClick={() => setFocus(p.artifact)} />
            ))}
          </div>
        </div>
      </div>

      {focus && <ArtifactModal artifact={focus} onClose={() => setFocus(null)} />}
    </div>
  );
}
window.BuildScreen = BuildScreen;
