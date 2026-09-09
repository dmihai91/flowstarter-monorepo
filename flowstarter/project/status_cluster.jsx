// status_cluster.jsx — AI credits + live agent activity, for headers.

// small click-outside popover wrapper
function Popover({ open, onClose, children, align = 'right', width = 300 }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [open]);
  if (!open) return null;
  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 10px)', [align]: 0, width, zIndex: 80,
      borderRadius: 18, padding: 16, animation: 'popIn .22s var(--ease-out) both',
      background: 'var(--card)', border: '1px solid var(--line)',
      boxShadow: 'var(--shadow-lg)',
    }}>
      {children}
    </div>
  );
}

// ---- Live agent activity ----
function AgentActivity({ light = false }) {
  const [open, setOpen] = React.useState(false);
  const active = LIVE_ACTIVITY;
  const ink = light ? 'var(--canvas-ink)' : 'var(--ink)';
  const ink2 = light ? 'var(--canvas-ink-2)' : 'var(--ink-3)';
  const line = light ? 'var(--canvas-line)' : 'var(--line)';
  const surface = light ? 'var(--canvas-card)' : 'var(--card)';
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9,
        background: open ? 'var(--accent-soft)' : (light ? 'transparent' : 'var(--paper-2)'),
        border: `1px solid ${open ? 'color-mix(in srgb,var(--accent) 40%,transparent)' : line}`,
        borderRadius: 999, padding: '6px 12px 6px 8px', transition: 'all .2s var(--ease)',
      }}>
        <div style={{ display: 'flex' }}>
          {active.map((a, i) => (
            <div key={i} style={{ marginLeft: i ? -9 : 0, borderRadius: '50%',
              border: `2px solid ${surface}`, position: 'relative' }}>
              <AgentAvatar agent={AGENTS[a.agent]} size={22} ring={false} />
            </div>
          ))}
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: ink }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--pos)', animation: 'pulse 1.4s infinite' }} />
          {active.length} working
        </span>
      </button>

      <Popover open={open} onClose={() => setOpen(false)} width={320}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span className="serif" style={{ fontSize: 19, color: 'var(--ink)' }}>Agents at work</span>
          <span style={{ fontSize: 12, color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--pos)', animation: 'pulse 1.4s infinite' }} /> Live
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {active.map((a, i) => {
            const agent = AGENTS[a.agent];
            return (
              <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <AgentAvatar agent={agent} size={32} active />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{agent.name}</span>
                    <span className="mono" style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: agent.color }}>{agent.role}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4, marginTop: 1 }}>{a.task}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
                      <div style={{ width: `${a.pct}%`, height: '100%', background: agent.color, borderRadius: 99, transition: 'width .4s' }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{a.project}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Popover>
    </div>
  );
}

// ---- AI credits meter ----
function CreditsMeter({ light = false }) {
  const [open, setOpen] = React.useState(false);
  const c = CREDITS;
  const pct = Math.round((c.available / c.total) * 100);
  const ink = light ? 'var(--canvas-ink)' : 'var(--ink)';
  const line = light ? 'var(--canvas-line)' : 'var(--line)';
  const low = pct < 20;
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9,
        background: open ? 'var(--accent-soft)' : (light ? 'transparent' : 'var(--paper-2)'),
        border: `1px solid ${open ? 'color-mix(in srgb,var(--accent) 40%,transparent)' : line}`,
        borderRadius: 999, padding: '7px 13px', transition: 'all .2s var(--ease)',
      }}>
        <Icons.wand size={15} stroke={2} style={{ color: low ? 'var(--warn)' : 'var(--accent)' }} />
        <span style={{ fontSize: 13.5, fontWeight: 700, color: ink, fontVariantNumeric: 'tabular-nums' }}>
          {c.available.toLocaleString()}
        </span>
        <span style={{ width: 42, height: 5, borderRadius: 99, background: line, overflow: 'hidden' }}>
          <span style={{ display: 'block', width: `${pct}%`, height: '100%', borderRadius: 99,
            background: low ? 'var(--warn)' : 'var(--accent)' }} />
        </span>
      </button>

      <Popover open={open} onClose={() => setOpen(false)} width={290}>
        <div className="eyebrow" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icons.wand size={12} /> AI credits
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 4 }}>
          <span className="serif" style={{ fontSize: 38, lineHeight: 1, color: 'var(--ink)' }}>{c.available.toLocaleString()}</span>
          <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>/ {c.total.toLocaleString()} left</span>
        </div>
        <div style={{ height: 7, borderRadius: 99, background: 'var(--line)', overflow: 'hidden', margin: '10px 0 8px' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: 'var(--accent)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>
          <span>{c.plan}</span><span>{c.renews}</span>
        </div>

        <div className="eyebrow" style={{ marginBottom: 9 }}>Recent spend</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 16 }}>
          {RECENT_SPEND.map((s, i) => {
            const agent = AGENTS[s.agent];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: agent.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12.5, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>−{s.amt}</span>
              </div>
            );
          })}
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}>
          <Icons.spark size={15} /> Get more credits
        </button>
      </Popover>
    </div>
  );
}

// the cluster placed in headers
function StatusCluster({ light = false, showActivity = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {showActivity && <AgentActivity light={light} />}
      <CreditsMeter light={light} />
    </div>
  );
}

Object.assign(window, { Popover, AgentActivity, CreditsMeter, StatusCluster });
