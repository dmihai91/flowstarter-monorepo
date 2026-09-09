// components.jsx — shared UI: logo, icons, agent avatar, progress rail.

// ---- Icons (inline, currentColor) ----
const Icon = ({ d, size = 18, stroke = 1.8, fill = 'none', ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {d}
  </svg>
);
const Icons = {
  arrow:   (p) => <Icon {...p} d={<><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>} />,
  check:   (p) => <Icon {...p} d={<path d="M4 12l5 5L20 6"/>} />,
  spark:   (p) => <Icon {...p} d={<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/>} />,
  search:  (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></>} />,
  pen:     (p) => <Icon {...p} d={<path d="M16 4l4 4L8 20l-4 1 1-4z"/>} />,
  brush:   (p) => <Icon {...p} d={<><path d="M9.5 14.5L18 6a2 2 0 0 1 3 3l-8.5 8.5"/><path d="M9.5 14.5c-1.5-.5-3 .5-3.5 2S4 21 4 21s2-1.5 3.5-2 1.5-3 0-4.5z"/></>} />,
  code:    (p) => <Icon {...p} d={<><path d="M8 7l-5 5 5 5"/><path d="M16 7l5 5-5 5"/></>} />,
  rocket:  (p) => <Icon {...p} d={<><path d="M12 3c3 1 6 4 6 9l-3 3H9l-3-3c0-5 3-8 6-9z"/><circle cx="12" cy="9" r="1.6"/><path d="M9 15l-2 4M15 15l2 4"/></>} />,
  globe:   (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/></>} />,
  bolt:    (p) => <Icon {...p} d={<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>} />,
  pin:     (p) => <Icon {...p} d={<><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></>} />,
  chart:   (p) => <Icon {...p} d={<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>} />,
  cal:     (p) => <Icon {...p} d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>} />,
  user:    (p) => <Icon {...p} d={<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></>} />,
  quote:   (p) => <Icon {...p} d={<path d="M7 7h4v6H5v-3a3 3 0 0 1 2-3zm10 0h4v6h-6v-3a3 3 0 0 1 2-3z"/>} fill="currentColor" stroke="none" />,
  warn:    (p) => <Icon {...p} d={<><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/></>} />,
  star:    (p) => <Icon {...p} d={<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7z"/>} />,
  flow:    (p) => <Icon {...p} d={<path d="M3 16c3 0 3-8 6-8s3 8 6 8 3-8 6-8"/>} />,
  shield:  (p) => <Icon {...p} d={<><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></>} />,
  card:    (p) => <Icon {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></>} />,
  camera:  (p) => <Icon {...p} d={<><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.2"/></>} />,
  chat:    (p) => <Icon {...p} d={<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/>} />,
  phone:   (p) => <Icon {...p} d={<path d="M5 4h3l1.5 5-2 1.5a11 11 0 0 0 5 5l1.5-2 5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>} />,
  moon:    (p) => <Icon {...p} d={<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>} />,
  sun:     (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></>} />,
  auto:    (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"/></>} />,
  grid:    (p) => <Icon {...p} d={<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>} />,
  box:     (p) => <Icon {...p} d={<><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></>} />,
  layout:  (p) => <Icon {...p} d={<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/></>} />,
  puzzle:  (p) => <Icon {...p} d={<path d="M10 4a2 2 0 1 1 4 0v1h3a1 1 0 0 1 1 1v3h1a2 2 0 1 1 0 4h-1v3a1 1 0 0 1-1 1h-3v-1a2 2 0 1 0-4 0v1H6a1 1 0 0 1-1-1v-3H4a2 2 0 1 1 0-4h1V6a1 1 0 0 1 1-1h4z"/>} />,
  book:    (p) => <Icon {...p} d={<><path d="M4 4h11a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/><path d="M17 6h3v14H6"/></>} />,
  plus:    (p) => <Icon {...p} d={<path d="M12 5v14M5 12h14"/>} />,
  image:   (p) => <Icon {...p} d={<><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5-5L5 20"/></>} />,
  file:    (p) => <Icon {...p} d={<><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4"/></>} />,
  arrowUp: (p) => <Icon {...p} d={<path d="M12 19V5M6 11l6-6 6 6"/>} />,
  wand:    (p) => <Icon {...p} d={<><path d="M15 4V2M15 10V8M11 6H9M21 6h-2M18 3l-1.5 1.5M18 9l-1.5-1.5"/><path d="M13 8L4 17l3 3 9-9"/></>} />,
  bot:     (p) => <Icon {...p} d={<><rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 8V4M9 4h6"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/></>} />,
  gear:    (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M19.5 4.5l-2 2M6.5 17.5l-2 2"/></>} />,
  logout:  (p) => <Icon {...p} d={<><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l5-5-5-5M15 12H3"/></>} />,
  bell:    (p) => <Icon {...p} d={<><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/></>} />,
  eye:     (p) => <Icon {...p} d={<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>} />,
  clock:   (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>} />,
  users:   (p) => <Icon {...p} d={<><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5"/><path d="M16 5a3.5 3.5 0 0 1 0 7M22 20c0-3-1.5-4.5-4-5"/></>} />,
  paperclip: (p) => <Icon {...p} d={<path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3 3 0 0 1 4.5 4.5L9 13.5a1.5 1.5 0 0 1-2-2l7-7"/>} />,
  close:   (p) => <Icon {...p} d={<path d="M6 6l12 12M18 6L6 18"/>} />,
  trend:   (p) => <Icon {...p} d={<><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></>} />,
  chevron: (p) => <Icon {...p} d={<path d="M9 6l6 6-6 6"/>} />,
  minus:   (p) => <Icon {...p} d={<path d="M5 12h14"/>} />,
};
const ROLE_ICON = { research: Icons.search, brand: Icons.brush, copy: Icons.pen, dev: Icons.code };

// ---- theme context + light/dark toggle ----
const ThemeCtx = React.createContext({ theme: 'studio', mode: 'auto', setMode: () => {} });

// responsive hook — true under `bp` px (default 760)
function useIsMobile(bp = 760) {
  const [m, setM] = React.useState(() => typeof window !== 'undefined' && window.innerWidth <= bp);
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on); };
  }, [bp]);
  return m;
}
function ThemeToggle({ light = false }) {
  const { mode, setMode } = React.useContext(ThemeCtx);
  // cycle: auto → studio (light) → midnight (dark) → auto
  const order = ['auto', 'studio', 'midnight'];
  const meta = {
    auto:     { icon: Icons.auto, label: 'Auto (system)' },
    studio:   { icon: Icons.sun,  label: 'Light' },
    midnight: { icon: Icons.moon, label: 'Dark' },
  };
  const next = order[(order.indexOf(mode) + 1) % order.length];
  const I = meta[mode].icon;
  return (
    <button onClick={() => setMode(next)}
      title={`Theme: ${meta[mode].label} · tap for ${meta[next].label}`}
      style={{
        width: 38, height: 38, borderRadius: 10, cursor: 'pointer', display: 'grid', placeItems: 'center',
        background: 'transparent',
        border: `1px solid ${light ? 'var(--canvas-line)' : 'var(--line)'}`,
        color: light ? 'var(--canvas-ink-2)' : 'var(--ink-2)',
        transition: 'all .2s var(--ease)',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = light ? 'var(--canvas-ink-2)' : 'var(--ink-2)'; e.currentTarget.style.borderColor = light ? 'var(--canvas-line)' : 'var(--line)'; }}>
      <I size={17} />
    </button>
  );
}

// ---- Logo mark ---- refined tile with a crisp 4-point spark (the "agent" signifier).
function LogoMark({ size = 34, light = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.26, flexShrink: 0, position: 'relative',
      background: 'var(--accent-grad)',
      boxShadow: `0 4px 12px -4px var(--accent), inset 0 1px 0 rgba(255,255,255,.35)`,
      display: 'grid', placeItems: 'center', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(110% 90% at 25% 0%, rgba(255,255,255,.4), transparent 60%)' }} />
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="#fff"
        strokeWidth="2.5" strokeLinecap="round" style={{ position: 'relative' }}>
        {/* F drawn from streamlines — stem + two arms flowing like a current */}
        <path d="M7.5 5.2v14" />
        <path d="M7.5 5.8c3-1.6 5.6.9 8.2.4 1-.2 1.8-.6 2.6-1.2" />
        <path d="M7.5 12.2c2.4-1.3 4.4.7 6.5.3.8-.15 1.5-.5 2.1-1" opacity=".85" />
        {/* fading trail continuing the top stream */}
        <path d="M19.6 8.6c.5-.1.9-.3 1.3-.6" opacity=".45" />
      </svg>
    </div>
  );
}
function Logo({ size = 22, light = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <LogoMark size={size + 8} light={light} />
      <span style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: size,
        letterSpacing: '-.03em', lineHeight: 1, color: light ? 'var(--canvas-ink)' : 'var(--ink)' }}>
        Flowstarter
      </span>
    </div>
  );
}

// ---- Agent avatar ----
function AgentAvatar({ agent, size = 40, active = false, done = false, ring = true }) {
  const RoleIcon = ROLE_ICON[agent.id] || Icons.spark;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {active && ring && (
        <div style={{
          position: 'absolute', inset: -4, borderRadius: '50%',
          border: `2px solid ${agent.color}`, opacity: .5,
          animation: 'breathe 1.8s var(--ease) infinite',
        }} />
      )}
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `color-mix(in srgb, ${agent.color} 16%, transparent)`,
        border: `1.5px solid ${active || done ? agent.color : 'color-mix(in srgb,'+agent.color+' 40%, transparent)'}`,
        color: agent.color, display: 'grid', placeItems: 'center',
        transition: 'all .3s var(--ease)',
      }}>
        {done ? <Icons.check size={size * .5} stroke={2.4} /> : <RoleIcon size={size * .48} stroke={2} />}
      </div>
    </div>
  );
}

// agent name + role line
function AgentLabel({ agent, sub = true, light = false }) {
  return (
    <div style={{ lineHeight: 1.25 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: light ? 'var(--canvas-ink)' : 'var(--ink)' }}>
        {agent.name}
      </div>
      {sub && <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '.08em',
        textTransform: 'uppercase', color: agent.color }}>{agent.role}</div>}
    </div>
  );
}

// ---- Progress rail (Validate → Build → Launch) ----
function ProgressRail({ stage, light = false }) {
  // stage: 'entry' | 'validate' | 'report' | 'build' | 'launch'
  const order = { entry: 0, validate: 1, report: 1, build: 2, launch: 3 };
  const at = order[stage] ?? 0;
  const steps = [
    { id: 1, label: 'Validate', icon: Icons.search },
    { id: 2, label: 'Build', icon: Icons.spark },
    { id: 3, label: 'Launch', icon: Icons.rocket },
  ];
  const ink = light ? 'var(--canvas-ink)' : 'var(--ink)';
  const ink2 = light ? 'var(--canvas-ink-2)' : 'var(--ink-3)';
  const line = light ? 'var(--canvas-line)' : 'var(--line)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {steps.map((s, i) => {
        const state = at > s.id ? 'done' : at === s.id ? 'now' : 'next';
        const S = s.icon;
        return (
          <React.Fragment key={s.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7,
              opacity: state === 'next' ? .5 : 1, transition: 'opacity .4s' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: state === 'done' ? 'var(--accent)' : state === 'now' ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'transparent',
                border: state === 'next' ? `1.5px solid ${line}` : `1.5px solid var(--accent)`,
                color: state === 'done' ? 'var(--accent-ink)' : state === 'now' ? 'var(--accent)' : ink2,
                transition: 'all .4s var(--ease)',
              }}>
                {state === 'done' ? <Icons.check size={13} stroke={2.6} /> : <S size={12} stroke={2.2} />}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600,
                color: state === 'now' ? ink : ink2 }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 22, height: 1.5, borderRadius: 2,
                background: at > s.id ? 'var(--accent)' : line, transition: 'background .4s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ---- top bar shared across product screens ----
function TopBar({ stage, right, light = false }) {
  const isMobile = useIsMobile();
  return (
    <header className={light ? '' : 'glass-2'} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '12px 16px' : '16px 26px', borderBottom: `1px solid ${light ? 'var(--canvas-line)' : 'var(--line)'}`,
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 5, gap: 10,
    }}>
      <div style={{ transform: 'scale(.86)', transformOrigin: 'left center', flexShrink: 0 }}>
        <Logo size={20} />
      </div>
      {!isMobile && <ProgressRail stage={stage} light={light} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 7 : 10, justifyContent: 'flex-end' }}>
        {stage !== 'launch' && !isMobile && <CreditsMeter light={light} />}
        <ThemeToggle light={light} />
        {right}
      </div>
    </header>
  );
}

// ---- ChatComposer: unified chatbox with attach-inside-input (chatbot-style) ----
function ChatComposer({ value, onChange, onSend, placeholder, sendLabel, sendIcon, accent = 'var(--accent)',
  files = [], onAddFiles, onRemoveFile, hint }) {
  const fileRef = React.useRef(null);
  const [focus, setFocus] = React.useState(false);
  const SendIcon = sendIcon || Icons.spark;
  const allowFiles = !!onAddFiles;
  return (
    <div style={{
      background: 'var(--card)',
      border: `1.5px solid ${focus ? accent : 'var(--line)'}`,
      borderRadius: 18, padding: 8, transition: 'border-color .18s var(--ease)',
      boxShadow: focus ? `0 0 0 4px color-mix(in srgb, ${accent} 12%, transparent)` : 'none',
    }}>
      {/* attachment chips */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 4px 8px' }}>
          {files.map((f, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 8px 6px 10px',
              borderRadius: 10, background: 'var(--paper-2)', border: '1px solid var(--line)', fontSize: 12.5, color: 'var(--ink-2)', maxWidth: 220 }}>
              <Icons.box size={13} style={{ color: accent, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              <button onClick={() => onRemoveFile(i)} style={{ font: 'inherit', cursor: 'pointer', border: 'none',
                background: 'transparent', color: 'var(--ink-3)', padding: 0, lineHeight: 1, display: 'grid', placeItems: 'center' }}>
                <Icons.close size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        {allowFiles && (
          <React.Fragment>
            <input ref={fileRef} type="file" multiple style={{ display: 'none' }}
              onChange={e => { onAddFiles(e.target.files); e.target.value = ''; }} />
            <button onClick={() => fileRef.current && fileRef.current.click()} title="Attach files"
              className="composer-attach" style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, cursor: 'pointer',
                display: 'grid', placeItems: 'center', background: 'transparent', border: 'none', color: 'var(--ink-3)',
                transition: 'all .16s var(--ease)' }}
              onMouseEnter={e => { e.currentTarget.style.color = accent; e.currentTarget.style.background = 'var(--paper-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-3)'; e.currentTarget.style.background = 'transparent'; }}>
              <Icons.paperclip size={19} />
            </button>
          </React.Fragment>
        )}
        <textarea value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder={placeholder} rows={1}
          style={{ flex: 1, minWidth: 0, fontFamily: 'var(--sans)', fontSize: 15, lineHeight: 1.45, color: 'var(--ink)',
            background: 'transparent', border: 'none', outline: 'none', resize: 'none', padding: '9px 6px', maxHeight: 140 }} />
        <button className="btn btn-primary" onClick={onSend} style={{ flexShrink: 0, padding: '11px 18px', fontSize: 14 }}>
          <SendIcon size={16} /> {sendLabel}
        </button>
      </div>
      {hint && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 6px 2px', fontSize: 11.5, color: 'var(--ink-3)' }}>
          <Icons.paperclip size={11} /> {hint}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Icons, ROLE_ICON, Logo, LogoMark, AgentAvatar, AgentLabel, ProgressRail, TopBar, ThemeCtx, ThemeToggle, useIsMobile, ChatComposer });
