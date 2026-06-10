// screen_composer.jsx — the "Tell me what you want to create" AI composer (from the Figma frame).
function PromptComposer({ onSubmit }) {
  const [val, setVal] = React.useState('');
  const [quick, setQuick] = React.useState(true);
  const [collapsed, setCollapsed] = React.useState(false);
  const ref = React.useRef(null);
  const examples = [
    'A landing page for a SaaS product in the IT industry that helps teams collaborate better',
    'A booking site for a weekend pottery studio with drop-in classes',
    'A portfolio for a freelance brand designer taking new clients',
  ];
  const guide = [
    ['Industry', 'what type of business?'],
    ['Product', 'landing page or full site?'],
    ['Audience', 'who is it for?'],
    ['Goals', 'sales, leads, awareness?'],
    ['Style', 'minimal, bold, playful?'],
  ];
  const submit = () => {
    const text = val.trim() || examples[0];
    onSubmit && onSubmit(text, quick);
  };
  return (
    <div className="fade-up glass-3d" style={{ padding: 0, overflow: 'hidden', marginBottom: 30 }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 14, padding: '20px 22px 14px' }}>
        <div style={{ display: 'flex', gap: 13 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'grid', placeItems: 'center',
            background: 'var(--accent-grad)', color: '#fff', boxShadow: '0 8px 18px -8px var(--accent)' }}>
            <Icons.bot size={22} />
          </div>
          <div>
            <h2 className="serif" style={{ fontSize: 23, margin: '2px 0 3px', lineHeight: 1.1, letterSpacing: '-.01em' }}>
              Tell me what you want to create.
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--ink-3)', margin: 0 }}>Describe it in a sentence — the agents handle the rest.</p>
          </div>
        </div>
        <button onClick={() => setCollapsed(c => !c)} aria-label="toggle"
          style={{ background: 'transparent', border: '1px solid var(--line)', borderRadius: 9, width: 30, height: 30,
            cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink-3)', flexShrink: 0 }}>
          {collapsed ? <Icons.plus size={16} /> : <Icons.minus size={16} />}
        </button>
      </div>

      {/* guide chips */}
      {!collapsed && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 22px 16px' }}>
          {guide.map(([k, hint]) => (
            <div key={k} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '6px 12px',
              borderRadius: 99, background: 'var(--paper-2)', border: '1px solid var(--line)' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>{k}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{hint}</span>
            </div>
          ))}
        </div>
      )}

      {/* input area */}
      <div style={{ padding: '0 14px 14px' }}>
        <div style={{ background: 'var(--card)', border: '1.5px solid var(--line)', borderRadius: 'var(--r-md)',
          padding: 6, transition: 'border-color .2s' }}>
          <textarea ref={ref} value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
            placeholder="A landing page for a SaaS product that helps teams collaborate better…"
            style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', background: 'transparent',
              font: 'inherit', fontSize: 15.5, lineHeight: 1.5, color: 'var(--ink)', padding: '12px 12px 4px', minHeight: 58 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* quick-mode toggle */}
              <button onClick={() => setQuick(q => !q)} style={{ font: 'inherit', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 99,
                border: 'none', fontWeight: 600, fontSize: 13, transition: 'all .2s var(--ease)',
                background: quick ? 'var(--ink)' : 'var(--paper-2)', color: quick ? 'var(--paper)' : 'var(--ink-3)' }}>
                <Icons.wand size={14} /> {quick ? 'Quick Mode · AI-powered' : 'Advisor Mode'}
              </button>
              <IconBtn icon={Icons.image} title="Attach image" />
              <IconBtn icon={Icons.file} title="Attach file" />
            </div>
            <button onClick={submit} aria-label="Create" style={{ width: 40, height: 40, borderRadius: '50%',
              border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#fff',
              background: 'var(--accent-grad)', boxShadow: '0 8px 18px -8px var(--accent)', transition: 'transform .18s var(--ease)' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              <Icons.arrowUp size={19} stroke={2.2} />
            </button>
          </div>
        </div>
        {/* mode hint */}
        <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '9px 6px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icons.spark size={12} style={{ color: 'var(--accent)' }} />
          {quick
            ? 'Quick Mode skips validation — agents start building immediately.'
            : 'Advisor Mode pressure-tests and validates your idea before building.'}
        </div>
      </div>
    </div>
  );
}

function IconBtn({ icon, title }) {
  const I = icon;
  return (
    <button title={title} style={{ background: 'transparent', border: 'none', cursor: 'pointer',
      width: 36, height: 36, borderRadius: 9, display: 'grid', placeItems: 'center', color: 'var(--ink-3)',
      transition: 'all .15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--paper-2)'; e.currentTarget.style.color = 'var(--ink)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-3)'; }}>
      <I size={18} />
    </button>
  );
}

window.PromptComposer = PromptComposer;
