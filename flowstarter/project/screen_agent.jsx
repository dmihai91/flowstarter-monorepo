// screen_agent.jsx — dedicated agent view: activity log + prompt the agent.
function AgentScreen({ agentId, onBack }) {
  const isMobile = useIsMobile();
  const agent = AGENTS[agentId] || AGENTS.dev;
  const detail = AGENT_DETAIL[agentId] || AGENT_DETAIL.dev;
  const [activity, setActivity] = React.useState(detail.activity);
  const [val, setVal] = React.useState('');
  const [files, setFiles] = React.useState([]);
  const fileRef = React.useRef(null);
  const feedRef = React.useRef(null);

  const addFiles = (list) => {
    const picked = Array.from(list || []).slice(0, 6).map(f => ({
      name: f.name,
      kind: /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name) ? 'image' : 'file',
    }));
    if (picked.length) setFiles(fs => [...fs, ...picked].slice(0, 6));
  };

  const send = (text) => {
    const msg = (text || val).trim();
    if (!msg && files.length === 0) return;
    setVal('');
    const attached = files;
    setFiles([]);
    const label = msg || (attached.length === 1 ? `Use this: ${attached[0].name}` : `Use these ${attached.length} files`);
    setActivity(a => [{ t: label, when: 'just now', directive: true, files: attached }, ...a]);
    setTimeout(() => {
      const ack = attached.length
        ? `Got ${attached.length} file${attached.length > 1 ? 's' : ''} — ${(msg || 'working them in').charAt(0).toLowerCase() + (msg || 'working them in').slice(1)}`
        : `On it — ${msg.charAt(0).toLowerCase() + msg.slice(1)}`;
      setActivity(a => [{ t: ack, when: 'now', live: true },
        ...a.map(x => x.live ? { ...x, live: false } : x)]);
    }, 1400);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <header className="glass-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '16px 26px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 5, gap: 10 }}>
        <Logo size={20} />
        <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} onClick={onBack}>
          <Icons.arrow size={15} style={{ transform: 'rotate(180deg)' }} /> Dashboard
        </button>
      </header>

      <div className="scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: isMobile ? '22px 16px 44px' : '32px 26px 48px' }}>

          {/* agent hero */}
          <div className="fade-up glass-3d" style={{ padding: isMobile ? 20 : '26px 28px', marginBottom: 16,
            display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <AgentAvatar agent={agent} size={62} active />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 className="serif" style={{ fontSize: 28, margin: 0, letterSpacing: '-.02em' }}>{agent.name}</h1>
                <span className="mono" style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase',
                  color: agent.color, background: `color-mix(in srgb, ${agent.color} 14%, transparent)`,
                  padding: '4px 10px', borderRadius: 99 }}>{agent.role}</span>
              </div>
              <p style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.5, margin: '7px 0 0', maxWidth: 460 }}>{detail.tagline}</p>
            </div>
          </div>

          {/* now working on */}
          <div className="fade-up" style={{ padding: isMobile ? 16 : '18px 22px', marginBottom: 16, borderRadius: 'var(--r-lg)',
            background: `color-mix(in srgb, ${agent.color} 9%, var(--card))`,
            border: `1px solid color-mix(in srgb, ${agent.color} 28%, var(--line))` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span className="dots" style={{ color: agent.color }}><span></span><span></span><span></span></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{detail.now.task}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <Icons.box size={11} /> {detail.now.project}
                  </div>
                </div>
              </div>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: agent.color }}>{detail.now.pct}%</span>
            </div>
          </div>

          {/* prompt the agent */}
          <div className="fade-up glass-3d" style={{ padding: isMobile ? 18 : '22px 24px', marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Ask {agent.name} to do something</div>
            <ChatComposer
              value={val} onChange={setVal} onSend={() => send()}
              placeholder={`e.g. ${detail.prompts[0]}`}
              sendLabel={`Direct ${agent.name}`} accent={agent.color}
              files={files} onAddFiles={addFiles} onRemoveFile={(i) => setFiles(fs => fs.filter((_, j) => j !== i))}
              hint={`Attach a brief, logo, photos or a doc for ${agent.name} to work from`} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {detail.prompts.map(p => (
                <button key={p} onClick={() => send(p)} style={{ font: 'inherit', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  background: 'var(--card)', border: '1.5px dashed var(--line)', color: 'var(--ink-2)', borderRadius: 99, padding: '7px 13px',
                  transition: 'all .16s var(--ease)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = agent.color; e.currentTarget.style.color = agent.color; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-2)'; }}>
                  + {p}
                </button>
              ))}
            </div>
          </div>

          {/* activity log */}
          <div className="fade-up">
            <div className="eyebrow" style={{ marginBottom: 14 }}>Activity</div>
            <div ref={feedRef} style={{ position: 'relative', paddingLeft: 6 }}>
              {activity.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i === activity.length - 1 ? 0 : 18, position: 'relative' }}>
                  {/* timeline rail */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 11, height: 11, borderRadius: 99, marginTop: 4, flexShrink: 0,
                      background: item.live ? agent.color : item.done ? 'var(--pos)' : item.directive ? 'var(--accent)' : 'var(--ink-3)',
                      boxShadow: item.live ? `0 0 0 4px color-mix(in srgb, ${agent.color} 22%, transparent)` : 'none' }} />
                    {i !== activity.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--line)', marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingBottom: 2 }}>
                    <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.4, fontWeight: item.directive ? 600 : 400,
                      fontStyle: item.directive ? 'italic' : 'normal' }}>
                      {item.directive && <span style={{ color: 'var(--accent)', fontStyle: 'normal', fontWeight: 700 }}>You: </span>}
                      {item.t}
                    </div>
                    {item.files && item.files.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {item.files.map((f, k) => (
                          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 8,
                            background: 'var(--paper-2)', border: '1px solid var(--line)', fontSize: 11.5, color: 'var(--ink-2)' }}>
                            <Icons.box size={11} style={{ color: agent.color }} /> {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {item.live && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: agent.color, fontWeight: 600 }}><span className="live-dot" style={{ background: agent.color }} /> live</span>}
                      {item.done && <Icons.check size={12} stroke={2.6} style={{ color: 'var(--pos)' }} />}
                      {item.when}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
window.AgentScreen = AgentScreen;
