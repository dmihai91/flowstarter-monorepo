// screen_dashboard_parts.jsx — sidebar, stat cards, AI composer (from the Figma frame, in Flowstarter's brand).

// ---- Left sidebar nav ----
function Sidebar({ active = 'dashboard', onNav, projectCount = 1 }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.grid },
    { id: 'projects', label: `My Projects (${projectCount})`, icon: Icons.box },
    { id: 'templates', label: 'Templates Gallery', icon: Icons.layout },
    { id: 'integrations', label: 'Integrations', icon: Icons.puzzle },
    { id: 'help', label: 'Prompt Help Guide', icon: Icons.book },
  ];
  return (
    <aside style={{ width: 248, flexShrink: 0, padding: '20px 16px', display: 'flex', flexDirection: 'column',
      borderRight: '1px solid var(--line)', gap: 5 }}>
      {items.map(it => {
        const on = active === it.id;
        const I = it.icon;
        return (
          <button key={it.id} onClick={() => onNav && onNav(it.id)} style={{
            font: 'inherit', cursor: 'pointer', textAlign: 'left', width: '100%',
            display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12,
            border: '1px solid transparent',
            background: on ? 'var(--ink)' : 'transparent',
            color: on ? 'var(--paper)' : 'var(--ink-2)',
            fontWeight: on ? 700 : 500, fontSize: 14.5,
            transition: 'all .18s var(--ease)',
          }}
            onMouseEnter={e => { if (!on) { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--accent)'; } }}
            onMouseLeave={e => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-2)'; } }}>
            <I size={19} stroke={on ? 2 : 1.8} /> {it.label}
          </button>
        );
      })}
      <div className="glass" style={{ marginTop: 'auto', borderRadius: 'var(--r-lg)', padding: '16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <Icons.wand size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 700, fontSize: 13.5 }}>Pro · 2 builds left</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.45, marginBottom: 10 }}>
          Unlimited agent builds and strategy calls.
        </div>
        <button className="btn btn-grad" style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: 13 }}>
          Upgrade
        </button>
      </div>
    </aside>
  );
}

// ---- Stat cards (richer: projects breakdown, leads, traffic) ----
function StatCards({ projects }) {
  const live = projects.filter(p => p.status === 'live').length;
  const building = projects.filter(p => p.status !== 'live').length;
  return (
    <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14, marginBottom: 26 }}>
      {/* Total projects */}
      <div className="glass-3d" style={{ padding: '18px 20px' }}>
        <StatHead label="Total projects" />
        <div className="serif" style={{ fontSize: 38, lineHeight: 1, margin: '2px 0 12px' }}>{projects.length}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <Legend color="var(--role-research)" label={`${live} live`} />
          <Legend color="var(--accent)" label={`${building} in progress`} />
          <Legend color="var(--ink-3)" label="1 draft" />
        </div>
      </div>
      {/* Business leads */}
      <div className="glass-3d" style={{ padding: '18px 20px' }}>
        <StatHead label="Business leads" />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '2px 0 2px' }}>
          <span className="serif" style={{ fontSize: 38, lineHeight: 1 }}>7</span>
          <span style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 600 }}>prospects</span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 12 }}>1.3% conversion rate</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <Legend color="var(--role-research)" label="3 showed interest" />
          <Legend color="var(--role-copy)" label="2 to follow up" />
          <Legend color="var(--pos)" label="2 qualified" />
        </div>
      </div>
      {/* Website traffic */}
      <div className="glass-3d" style={{ padding: '18px 20px' }}>
        <StatHead label="Website traffic" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 10px', marginTop: 4 }}>
          <Metric v="3.2k" k="Total views" />
          <Metric v="811" k="Total users" />
          <Metric v="56s" k="Avg. on page" />
          <Metric v="93s" k="Avg. session" />
        </div>
      </div>
    </div>
  );
}
function StatHead({ label }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <span className="eyebrow">{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>
        Details <Icons.arrow size={12} />
      </span>
    </div>
  );
}
function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: 99, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{label}</span>
    </div>
  );
}
function Metric({ v, k }) {
  return (
    <div>
      <div className="serif" style={{ fontSize: 26, lineHeight: 1 }}>{v}</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }}>{k}</div>
    </div>
  );
}

Object.assign(window, { Sidebar, StatCards });

// ---- Agents at work — live monitoring of AI agents across active builds ----
// Live tasks the agents are running right now, mapped to a building/validating project.
const AGENT_MONITOR = [
  { agent: 'research', project: 'Lumen Yoga',     task: 'Scoring demand & competition', pct: 38 },
  { agent: 'copy',     project: 'Northside Cuts',  task: 'Writing homepage & services',  pct: 64 },
  { agent: 'dev',      project: 'Northside Cuts',  task: 'Assembling pages, wiring nav',  pct: 64 },
  { agent: 'brand',    project: 'Tidal Surf Co.',  task: 'Exploring identity directions', pct: 42 },
];

function AgentMonitor({ onOpenAgent }) {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2600);
    return () => clearInterval(id);
  }, []);
  const active = AGENT_MONITOR.length;
  return (
    <div className="fade-up" style={{ marginBottom: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="eyebrow">Agents at work</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 99,
            background: 'color-mix(in srgb, var(--pos) 14%, transparent)', color: 'var(--pos)', fontSize: 12, fontWeight: 700 }}>
            <span className="live-dot" /> {active} live
          </span>
        </div>
        <span style={{ fontSize: 13, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>Across 3 active builds</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {AGENT_MONITOR.map((m, i) => {
          const a = AGENTS[m.agent];
          return (
            <button key={i} onClick={() => onOpenAgent && onOpenAgent(m.agent)} className="glass-3d agent-mon-card"
              style={{ font: 'inherit', textAlign: 'left', cursor: 'pointer', padding: '15px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <AgentAvatar agent={a} size={38} active />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{a.name}</span>
                  <span className="mono" style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: a.color }}>{a.role}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-2)', margin: '3px 0 3px', lineHeight: 1.35, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="agent-task" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.task}</span>
                  <span className="dots" style={{ color: a.color, flexShrink: 0 }}><span></span><span></span><span></span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                    <Icons.box size={11} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.project}</span>
                  </div>
                  <span className="agent-mon-cta mono" style={{ fontSize: 10.5, letterSpacing: '.04em', textTransform: 'uppercase', color: a.color, fontWeight: 600, opacity: 0, transition: 'opacity .2s' }}>View →</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: 'var(--line)', overflow: 'hidden', marginTop: 9 }}>
                  <div style={{ width: `${m.pct}%`, height: '100%', borderRadius: 99, background: a.color, transition: 'width .6s var(--ease)' }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <style>{`
        .agent-mon-card { transition: transform .2s var(--ease), box-shadow .2s var(--ease), border-color .2s var(--ease); }
        .agent-mon-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
        .agent-mon-card:hover .agent-mon-cta { opacity: 1; }
      `}</style>
    </div>
  );
}

window.AgentMonitor = AgentMonitor;
