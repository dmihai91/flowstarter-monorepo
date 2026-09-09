// screen_mysite.jsx — post-launch management: the recurring product.
const REQ_STATUS = {
  queued:  { label: 'Queued',         color: 'var(--ink-3)' },
  working: { label: 'Agents working', color: 'var(--accent)' },
  review:  { label: 'Needs review',   color: 'var(--warn)' },
  done:    { label: 'Done',           color: 'var(--pos)' },
};

function MySiteScreen({ onBack, onConcierge }) {
  const isMobile = useIsMobile();
  const [requests, setRequests] = React.useState(MYSITE.requests);
  const [val, setVal] = React.useState('');
  const [files, setFiles] = React.useState([]);
  const addFiles = (list) => {
    const picked = Array.from(list || []).slice(0, 6).map(f => ({ name: f.name }));
    if (picked.length) setFiles(fs => [...fs, ...picked].slice(0, 6));
  };
  const extra = requests.filter(r => !MYSITE.requests.find(o => o.id === r.id)).length;
  const editsLeft = MYSITE.edits.total - MYSITE.edits.used - extra;
  const lowEdits = editsLeft <= 3;

  const submit = () => {
    const text = val.trim();
    if ((!text && files.length === 0) || editsLeft <= 0) return;
    const id = 'r' + Date.now();
    const attached = files;
    setRequests(rs => [{ id, text: text || `Use these ${attached.length} file${attached.length > 1 ? 's' : ''}`, status: 'queued', agent: 'dev', when: 'Just now', files: attached }, ...rs]);
    setVal('');
    setFiles([]);
    setTimeout(() => setRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'working' } : r)), 1800);
  };

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
        <div style={{ maxWidth: 880, margin: '0 auto', padding: isMobile ? '22px 16px 48px' : '32px 26px 56px' }}>

          {/* site header */}
          <div className="fade-up glass-3d" style={{ padding: isMobile ? 16 : '20px 24px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <ProjectThumb mini height={64} project={{ hue: '#C2683F', glyph: 'brush', status: 'live', progress: 100 }} style={{ width: 92, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 className="serif" style={{ fontSize: 24, margin: 0, letterSpacing: '-.02em' }}>{GEN_BRAND.name}</h1>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 99,
                  background: 'color-mix(in srgb, var(--pos) 14%, transparent)', color: 'var(--pos)', fontSize: 12, fontWeight: 700 }}>
                  <span className="live-dot" /> Live
                </span>
              </div>
              <span className="mono" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>{MYSITE.domain} ↗</span>
              <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 12, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icons.bolt size={12} /> {MYSITE.uptime}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icons.shield size={12} /> {MYSITE.ssl}</span>
              </div>
            </div>
            <div style={{ minWidth: 168 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)' }}>AI edits</span>
                <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: lowEdits ? 'var(--warn)' : 'var(--ink)' }}>{editsLeft} of {MYSITE.edits.total} left</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
                <div style={{ width: `${(editsLeft / MYSITE.edits.total) * 100}%`, height: '100%', borderRadius: 99,
                  background: lowEdits ? 'var(--warn)' : 'var(--accent)', transition: 'width .4s var(--ease)' }} />
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 5 }}>
                {lowEdits ? <span>Running low — <span style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>upgrade</span></span> : `Resets ${MYSITE.edits.resets}`}
              </div>
            </div>
          </div>

          {/* monthly snapshot — the retention card */}
          <div className="fade-up" style={{ padding: isMobile ? 18 : '22px 26px', marginBottom: 16, borderRadius: 'var(--r-lg)',
            background: 'linear-gradient(140deg, color-mix(in srgb, var(--accent) 12%, var(--card)), var(--card) 65%)',
            border: '1px solid color-mix(in srgb, var(--accent) 25%, var(--line))' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div className="eyebrow" style={{ color: 'var(--accent)' }}>{MYSITE.snapshot.month} snapshot · what you got this month</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 18 }}>
              {[['Visitors', MYSITE.snapshot.visitors], ['Contact requests', MYSITE.snapshot.contacts], ['Bookings', MYSITE.snapshot.bookings]].map(([label, m]) => (
                <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                    <span className="serif" style={{ fontSize: 26, lineHeight: 1 }}>{m.value}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--pos)' }}>{m.delta}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 5 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 10 }}>The agents fixed these automatically:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MYSITE.snapshot.autofixes.map((f, i) => {
                const I = Icons[f.icon] || Icons.check;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: 'grid', placeItems: 'center',
                      background: 'color-mix(in srgb, var(--pos) 14%, transparent)', color: 'var(--pos)' }}><I size={14} /></div>
                    <span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{f.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* request a change — primary action */}
          <div className="fade-up glass-3d" style={{ padding: isMobile ? 18 : '22px 24px', marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Request a change</div>
            <ChatComposer
              value={val} onChange={setVal} onSend={submit}
              placeholder={'Tell the crew what to change — e.g. “Add a photo gallery to the homepage”'}
              sendLabel="Send to crew"
              files={files} onAddFiles={addFiles} onRemoveFile={(i) => setFiles(fs => fs.filter((_, j) => j !== i))}
              hint="Attach a screenshot, logo or doc for the crew to work from" />

            {/* request list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
              {requests.map(r => {
                const st = REQ_STATUS[r.status];
                const agent = AGENTS[r.agent] || AGENTS.dev;
                return (
                  <div key={r.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '13px 15px',
                    background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
                    <AgentAvatar agent={agent} size={32} active={r.status === 'working'} done={r.status === 'done'} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35 }}>{r.text}</div>
                      {r.note && <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3, lineHeight: 1.4 }}>{r.note}</div>}
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4 }}>{agent.name} · {r.when}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: st.color }}>
                        {r.status === 'working' && <span className="dots" style={{ color: st.color }}><span></span><span></span><span></span></span>}
                        {(r.status === 'done') && <Icons.check size={12} stroke={2.6} />}
                        {st.label}
                      </span>
                      {r.status === 'review' && <button className="btn btn-soft" style={{ padding: '5px 11px', fontSize: 12 }}>Review</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* quiet escalation */}
          <div className="fade-up" style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--ink-3)' }}>
            Need bigger changes? <span onClick={onConcierge} style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Book a call with Mara</span>
          </div>

        </div>
      </div>
    </div>
  );
}
window.MySiteScreen = MySiteScreen;
