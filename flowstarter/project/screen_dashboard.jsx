// screen_dashboard.jsx — projects home. Glassy cards, gradient thumbs.
const STATUS_META = {
  live:       { label: 'Live',       color: 'var(--pos)',  dot: true },
  building:   { label: 'Building',   color: 'var(--accent)', dot: true },
  validating: { label: 'Validating', color: 'var(--role-research)', dot: true },
  draft:      { label: 'Draft',      color: 'var(--ink-3)', dot: false },
};

function Dashboard({ projects, onNew, onOpen, onProfile, onOpenAgent, onIntegrations }) {
  const isMobile = useIsMobile();
  const scrollRef = React.useRef(null);
  const projectsRef = React.useRef(null);
  const liveProject = projects.find(p => p.status === 'live');
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('all'); // all | live | building | validating | draft
  const [sort, setSort] = React.useState('recent'); // recent | name | progress
  const SORT_LABEL = { recent: 'Recently updated', name: 'Name', progress: 'Progress' };
  const FILTERS = [['all','All'],['live','Live'],['building','Building'],['validating','Validating'],['draft','Draft']];
  const shown = projects
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => !query.trim() || (p.name + ' ' + p.kind).toLowerCase().includes(query.trim().toLowerCase()))
    .slice()
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'progress') return b.progress - a.progress;
      return 0;
    });
  const scrollToProjects = () => {
    const sc = scrollRef.current, el = projectsRef.current;
    if (sc && el) sc.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' });
  };
  return (
    <div ref={scrollRef} className="scroll" style={{ height: '100%' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '14px 16px' : '22px 34px', position: 'sticky', top: 0, zIndex: 5, gap: 10 }} className="glass-2">
        <Logo size={isMobile ? 20 : 22} />
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
          {!isMobile && <StatusCluster />}
          {!isMobile && <div style={{ width: 1, height: 24, background: 'var(--line)' }} />}
          <button className="btn btn-primary" style={{ padding: isMobile ? '8px 13px' : '9px 16px', fontSize: isMobile ? 13 : 14 }} onClick={onNew}>
            <Icons.spark size={15} /> {isMobile ? 'New' : 'New project'}
          </button>
          <ThemeToggle />
          <ProfileMenu onProfile={onProfile} />
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: isMobile ? '22px 16px 44px' : '34px 34px 56px' }}>
        {/* greeting */}
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Your workspace</div>
          <h1 className="serif" style={{ fontSize: 'clamp(34px,5vw,52px)', margin: 0, lineHeight: 1.05, letterSpacing: '-.02em' }}>
            Good morning, Alex.<br/>
            <span className="grad-text">What are we building today?</span>
          </h1>
        </div>

        {/* stat strip — faithful to Figma: rich metric cards */}
        <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr 1fr', gap: 14, marginBottom: 18 }}>
          <StatCard title="Total Projects" onDetails={scrollToProjects}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
              <span className="serif" style={{ fontSize: 36, lineHeight: 1, color: 'var(--ink)' }}>12</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginBottom: 16 }}>
              <Legend color="var(--role-research)" label="11 completed" />
              <Legend color="var(--ink-3)" label="1 draft" />
              <Legend color="var(--pos)" label="1 live" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: 'var(--ink-2)',
                  background: 'var(--line-2)', borderRadius: 6, padding: '2px 8px', marginBottom: 7 }}>Draft</span>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>Dorin’s UX Portfolio</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>Last edit: 2 hours ago</div>
              </div>
              <ProjectThumb mini height={44} project={{ hue: 'var(--accent)', glyph: 'pen', status: 'draft', progress: 20 }}
                style={{ width: 56, flexShrink: 0 }} />
            </div>
          </StatCard>

          <StatCard title="Website Traffic" onDetails={liveProject ? () => onOpen(liveProject) : undefined}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 22px' }}>
              {[
                { v: '3.2k', l: 'Total Views' },
                { v: '811', l: 'Total Users' },
                { v: '56 sec', l: 'Avg time on page' },
                { v: '93 sec', l: 'Avg. Session' },
              ].map((m, i) => (
                <div key={i} style={{ borderLeft: i % 2 ? '1px solid var(--line)' : 'none', paddingLeft: i % 2 ? 18 : 0,
                  borderTop: i >= 2 ? '1px solid var(--line)' : 'none', paddingTop: i >= 2 ? 14 : 0 }}>
                  <div className="serif" style={{ fontSize: 28, lineHeight: 1, color: 'var(--ink)', marginBottom: 6 }}>{m.v}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500, lineHeight: 1.3 }}>{m.l}</div>
                </div>
              ))}
            </div>
          </StatCard>

          <StatCard title="AI Credits" onDetails={onProfile}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span className="serif" style={{ fontSize: 36, lineHeight: 1, color: 'var(--ink)' }}>{CREDITS.available.toLocaleString()}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>/ {CREDITS.total.toLocaleString()} left</span>
            </div>
            <div style={{ height: 7, borderRadius: 99, background: 'var(--line)', overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ width: `${(CREDITS.available / CREDITS.total) * 100}%`, height: '100%', borderRadius: 99, background: 'var(--accent)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{MYSITE.edits.total - MYSITE.edits.used} of {MYSITE.edits.total} edits left</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2, whiteSpace: 'nowrap' }}>Resets {CREDITS.resets}</div>
              </div>
              <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center',
                background: 'var(--accent-soft)', color: 'var(--accent)' }}><Icons.spark size={17} /></span>
            </div>
          </StatCard>
        </div>

        {/* integrations strip */}
        <button onClick={onIntegrations} className="fade-up glass-3d integ-strip" style={{ width: '100%', font: 'inherit', cursor: 'pointer',
          padding: isMobile ? '14px 16px' : '15px 20px', marginBottom: 30, display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
          <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center',
            background: 'var(--accent-soft)', color: 'var(--accent)' }}><Icons.box size={19} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>Connect your tools</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{INTEGRATIONS.filter(i => i.connected).length} of {INTEGRATIONS.length} connected · Stripe, Analytics, Calendly &amp; more</div>
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', marginRight: 6 }}>
              {INTEGRATIONS.slice(0, 5).map((it, j) => {
                const I = Icons[it.glyph] || Icons.box;
                return (
                  <span key={it.id} style={{ width: 30, height: 30, borderRadius: '50%', marginLeft: j ? -8 : 0, display: 'grid', placeItems: 'center',
                    background: `color-mix(in srgb, ${it.color} 16%, var(--card))`, color: it.color, border: '2px solid var(--card)',
                    opacity: it.connected ? 1 : .45 }}><I size={14} /></span>
                );
              })}
            </div>
          )}
          <Icons.arrow size={17} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
        </button>

        {/* agents at work — live monitoring */}
        <AgentMonitor onOpenAgent={onOpenAgent} />

        {/* projects header: title + create */}
        <div ref={projectsRef} className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
          <div className="eyebrow">Projects <span style={{ color: 'var(--ink-3)', marginLeft: 4 }}>{shown.length}</span></div>
          <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13.5 }} onClick={onNew}>
            <Icons.spark size={15} /> {isMobile ? 'New' : 'Create new'}
          </button>
        </div>

        {/* toolbar: filters (left) + search & sort (right), one aligned 38px row */}
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {/* filter chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map(([key, label]) => {
              const on = filter === key;
              const count = key === 'all' ? projects.length : projects.filter(p => p.status === key).length;
              return (
                <button key={key} onClick={() => setFilter(key)} style={{ font: 'inherit', cursor: 'pointer', height: 38,
                  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
                  padding: '0 14px', borderRadius: 99, transition: 'all .16s var(--ease)',
                  background: on ? 'var(--accent)' : 'var(--card)', color: on ? '#fff' : 'var(--ink-2)',
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}` }}>
                  {label}
                  <span style={{ fontSize: 11.5, fontWeight: 700, opacity: on ? .85 : .5 }}>{count}</span>
                </button>
              );
            })}
          </div>
          {/* search + sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, background: 'var(--card)', border: '1px solid var(--line)',
              borderRadius: 10, padding: '0 11px', minWidth: isMobile ? 0 : 190 }}>
              <Icons.search size={15} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search projects"
                style={{ border: 'none', outline: 'none', background: 'transparent', font: 'inherit', fontSize: 13.5,
                  color: 'var(--ink)', width: isMobile ? 120 : '100%' }} />
              {query && <button onClick={() => setQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer',
                color: 'var(--ink-3)', padding: 0, display: 'grid', placeItems: 'center' }}><Icons.close size={13} /></button>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: '0 6px 0 11px' }}>
              <Icons.chart size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
              <select value={sort} onChange={e => setSort(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', font: 'inherit', fontSize: 13.5, fontWeight: 500,
                  color: 'var(--ink-2)', padding: '0 4px', cursor: 'pointer', height: '100%' }}>
                {Object.entries(SORT_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        {shown.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
            {shown.map((p, i) => <ProjectCard key={p.id} project={p} delay={i*.05} onOpen={() => onOpen(p)} />)}
          </div>
        ) : (
          <div className="fade-up" style={{ textAlign: 'center', padding: '46px 20px', color: 'var(--ink-3)',
            border: '1px dashed var(--line)', borderRadius: 'var(--r-lg)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 4 }}>No projects match</div>
            <div style={{ fontSize: 13.5 }}>Try a different search or filter.</div>
          </div>
        )}
        {/* quiet empty-state row to start a new project */}
        <button onClick={onNew} className="fade-up new-tile" style={{ animationDelay: `${projects.length*.06}s` }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', flexShrink: 0,
            background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <Icons.spark size={18} />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Start something new</span>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>An idea to validate, or a business to put online — the agents take it from there.</span>
          </span>
          <Icons.arrow size={17} style={{ marginLeft: 'auto', color: 'var(--ink-3)', flexShrink: 0 }} />
        </button>
      </div>

      <style>{`
        .new-tile {
          font: inherit; cursor: pointer; width: 100%;
          background: transparent;
          border: 1.5px dashed var(--line); color: var(--ink);
          border-radius: var(--r-lg); padding: 16px 20px; margin-top: 16px;
          display: flex; align-items: center; gap: 14;
          transition: all .2s var(--ease);
        }
        .new-tile:hover { border-color: var(--accent); background: var(--paper-2); }
        .integ-strip { transition: transform .2s var(--ease), box-shadow .2s var(--ease), border-color .2s var(--ease); }
        .integ-strip:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); border-color: color-mix(in srgb, var(--accent) 40%, var(--glass-border)); }
      `}</style>
    </div>
  );
}

// generated mini-site thumbnail — abstract preview tinted by project hue
function ProjectThumb({ project, height = 116, mini = false, style }) {
  const hue = project.hue;
  const Glyph = Icons[project.glyph] || Icons.flow;
  const live = project.status === 'live';
  return (
    <div style={{ height, borderRadius: mini ? 9 : 12, overflow: 'hidden', marginBottom: mini ? 0 : 14, position: 'relative',
      background: `linear-gradient(135deg, color-mix(in srgb, ${hue} 90%, #fff), color-mix(in srgb, ${hue} 55%, #000 8%))`,
      border: '1px solid color-mix(in srgb, var(--ink) 8%, transparent)', ...style }}>
      {/* faux site chrome */}
      <div style={{ position: 'absolute', inset: 0, padding: mini ? 7 : 12, display: 'flex', flexDirection: 'column' }}>
        {!mini && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 16, height: 16, borderRadius: 5, background: 'rgba(255,255,255,.92)', display: 'grid', placeItems: 'center', color: hue }}>
              <Glyph size={10} stroke={2.2} />
            </div>
            <div style={{ width: 34, height: 5, borderRadius: 99, background: 'rgba(255,255,255,.75)' }} />
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[1,2,3].map(i => <div key={i} style={{ width: 12, height: 4, borderRadius: 99, background: 'rgba(255,255,255,.5)' }} />)}
          </div>
        </div>
        )}
        {/* hero */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ width: '72%', height: mini ? 5 : 9, borderRadius: 99, background: 'rgba(255,255,255,.95)', marginBottom: mini ? 4 : 6 }} />
          <div style={{ width: '52%', height: mini ? 5 : 9, borderRadius: 99, background: 'rgba(255,255,255,.8)', marginBottom: mini ? 0 : 10 }} />
          {!mini && (
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 46, height: 14, borderRadius: 99, background: '#fff' }} />
            <div style={{ width: 34, height: 14, borderRadius: 99, background: 'rgba(255,255,255,.4)', border: '1px solid rgba(255,255,255,.6)' }} />
          </div>
          )}
        </div>
      </div>
      {/* status flag */}
      {!mini && (
      <div style={{ position: 'absolute', top: 9, right: 9, display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 8px', borderRadius: 99, background: 'rgba(0,0,0,.28)', backdropFilter: 'blur(6px)',
        color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '.02em' }}>
        {live ? <span className="live-dot" style={{ width: 5, height: 5 }} /> : <span style={{ width: 5, height: 5, borderRadius: 99, background: '#fff', opacity: .8 }} />}
        {live ? 'LIVE' : `${project.progress}%`}
      </div>
      )}
    </div>
  );
}

function ProjectCard({ project, delay, onOpen }) {
  const st = STATUS_META[project.status];
  const Glyph = Icons[project.glyph] || Icons.flow;
  const live = project.status === 'live';
  const hue = project.hue;
  return (
    <button onClick={onOpen} className={`fade-up proj-card glass-3d${live ? ' live-card' : ''}`} style={{ animationDelay: `${delay}s` }}>
      {/* generated thumbnail */}
      <ProjectThumb project={project} />
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 13, alignItems: 'center', minWidth: 0 }}>
          {/* tinted brand glyph tile */}
          <div style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, position: 'relative',
            display: 'grid', placeItems: 'center', color: hue,
            background: `color-mix(in srgb, ${hue} 14%, var(--card))`,
            border: `1px solid color-mix(in srgb, ${hue} 28%, transparent)`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,.4)` }}>
            <Glyph size={22} stroke={1.8} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 18, letterSpacing: '-.02em',
              color: 'var(--ink)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.kind}</div>
          </div>
        </div>
        {/* status chip */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 99,
          background: `color-mix(in srgb, ${st.color} 14%, transparent)`, color: st.color,
          fontSize: 11.5, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>
          {st.dot && (live
            ? <span className="live-dot" />
            : <span style={{ width: 6, height: 6, borderRadius: 99, background: st.color, animation: 'pulse 1.4s infinite' }} />)}
          {st.label}
        </div>
      </div>

      {/* metric / domain */}
      {live ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 0 }}>
          <Icons.globe size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
          <span className="mono" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.domain}</span>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>· {project.metric}</span>
        </div>
      ) : (
        <div style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 500, marginBottom: 12 }}>{project.metric}</div>
      )}

      {/* progress (non-live) */}
      {!live && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>{st.label} progress</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>{project.progress}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
            <div style={{ width: `${project.progress}%`, height: '100%', borderRadius: 99,
              background: `linear-gradient(90deg, color-mix(in srgb, ${hue} 70%, var(--accent)), ${hue})` }} />
          </div>
        </div>
      )}

      {/* footer: agents + meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex' }}>
          {project.agents.map((a, j) => (
            <div key={a} style={{ marginLeft: j ? -7 : 0, borderRadius: '50%', border: '2px solid var(--card)' }}>
              <AgentAvatar agent={AGENTS[a]} size={22} ring={false} />
            </div>
          ))}
        </div>
        <span className="proj-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5,
          color: live ? 'var(--accent)' : 'var(--ink-3)', fontWeight: live ? 700 : 400, transition: 'gap .2s var(--ease)' }}>
          {live ? <React.Fragment>Manage <Icons.arrow size={13} /></React.Fragment> : project.updated}
        </span>
      </div>

      <style>{`
        .proj-card {
          font: inherit; text-align: left; cursor: pointer; padding: 18px;
          position: relative; overflow: hidden;
          transition: transform .2s var(--ease), box-shadow .2s var(--ease), border-color .2s var(--ease);
        }
        .proj-card::after {
          content: ''; position: absolute; left: 0; right: 0; top: 0; height: 3px;
          background: var(--accent); opacity: 0; transition: opacity .2s var(--ease);
        }
        .proj-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg);
          border-color: color-mix(in srgb, var(--accent) 45%, var(--glass-border)); }
        .proj-card:hover::after { opacity: 1; }
        .proj-card:hover .proj-cta { gap: 8px; }
      `}</style>
    </button>
  );
}
// stat card shell — glass, "Details" affordance, matches Figma metric cards
function StatCard({ title, children, onDetails }) {
  return (
    <div className="glass-3d" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 15, color: 'var(--ink-2)', fontWeight: 500 }}>{title}</span>
        {onDetails ? (
          <button onClick={onDetails} className="stat-details" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 600,
            font: 'inherit', cursor: 'pointer', background: 'transparent',
            color: 'var(--ink-2)', border: '1.5px solid var(--line)', borderRadius: 10, padding: '5px 10px',
            transition: 'all .18s var(--ease)' }}>
            Details <Icons.arrow size={13} />
          </button>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 600,
            color: 'var(--ink-3)', border: '1.5px solid var(--line)', borderRadius: 10, padding: '5px 10px' }}>
            Details <Icons.arrow size={13} />
          </span>
        )}
      </div>
      {children}
      <style>{`.stat-details:hover { color: var(--accent); border-color: var(--accent); }`}</style>
    </div>
  );
}

// colored-dot legend row
function Legend({ color, label, big }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: big ? 9 : 8, height: big ? 9 : 8, borderRadius: 99, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: big ? 14 : 13.5, color: 'var(--ink-2)', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
    </span>
  );
}

window.Dashboard = Dashboard;
