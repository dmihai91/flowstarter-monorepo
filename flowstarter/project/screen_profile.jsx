// screen_profile.jsx — profile dropdown (header) + full profile view.

const USER = {
  name: 'Alex Rivera',
  email: 'alex@rivera.studio',
  initials: 'A',
  since: 'March 2026',
  plan: 'Studio plan',
};

// ---- dropdown menu on the header avatar ----
function ProfileMenu({ onProfile }) {
  const [open, setOpen] = React.useState(false);
  const item = {
    display: 'flex', alignItems: 'center', gap: 11, width: '100%', font: 'inherit',
    fontSize: 14, fontWeight: 500, color: 'var(--ink)', background: 'transparent',
    border: 'none', borderRadius: 10, padding: '9px 10px', cursor: 'pointer', textAlign: 'left',
  };
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} title="Account" style={{
        width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
        background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 14,
        border: open ? '2px solid color-mix(in srgb, var(--accent) 45%, transparent)' : '2px solid transparent',
        cursor: 'pointer', transition: 'border .2s var(--ease)' }}>
        {USER.initials}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} width={264}>
        {/* identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', display: 'grid', placeItems: 'center',
            background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 16 }}>{USER.initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)' }}>{USER.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{USER.email}</div>
          </div>
        </div>
        {/* plan line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 2px' }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600 }}>{USER.plan}</span>
          <span className="mono" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{CREDITS.available.toLocaleString()} credits</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 4, borderTop: '1px solid var(--line)' }}>
          <button style={item} className="pm-item" onClick={() => { setOpen(false); onProfile(); }}>
            <Icons.user size={16} /> View profile
          </button>
          <button style={item} className="pm-item">
            <Icons.gear size={16} /> Settings
          </button>
          <button style={{ ...item, color: 'var(--neg)' }} className="pm-item">
            <Icons.logout size={16} /> Sign out
          </button>
        </div>
        <style>{`.pm-item:hover { background: var(--paper-2); }`}</style>
      </Popover>
    </div>
  );
}

// ---- full profile view ----
function ProfileScreen({ onBack }) {
  const { mode, setMode } = React.useContext(ThemeCtx);
  const isMobile = useIsMobile();
  const pct = Math.round((CREDITS.available / CREDITS.total) * 100);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <header className="glass-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '16px 26px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 5 }}>
        <Logo size={20} />
        <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} onClick={onBack}>
          <Icons.arrow size={15} style={{ transform: 'rotate(180deg)' }} /> Back to dashboard
        </button>
      </header>

      <div className="scroll" style={{ flex: 1 }}>
        <div style={{ maxWidth: 660, margin: '0 auto', padding: isMobile ? '24px 16px 48px' : '36px 26px 56px' }}>

          {/* identity */}
          <div className="fade-up glass-3d" style={{ padding: isMobile ? '22px 20px' : '26px 28px', display: 'flex',
            alignItems: 'center', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center',
              background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 24, flexShrink: 0 }}>{USER.initials}</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 className="serif" style={{ fontSize: 26, margin: '0 0 3px', letterSpacing: '-.02em' }}>{USER.name}</h1>
              <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>{USER.email}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3 }}>Member since {USER.since}</div>
            </div>
            <button className="btn btn-ghost" style={{ padding: '9px 16px', fontSize: 13.5 }}>Edit</button>
          </div>

          {/* plan & credits */}
          <div className="fade-up glass-3d" style={{ padding: isMobile ? '20px' : '24px 28px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Plan &amp; credits</div>
                <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>{USER.plan}</div>
              </div>
              <button className="btn btn-primary" style={{ padding: '10px 18px', fontSize: 13.5 }}>
                <Icons.spark size={15} /> Get more credits
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span className="serif" style={{ fontSize: 30, lineHeight: 1, color: 'var(--ink)' }}>{CREDITS.available.toLocaleString()}</span>
              <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>/ {CREDITS.total.toLocaleString()} credits left</span>
            </div>
            <div style={{ height: 7, borderRadius: 99, background: 'var(--line)', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: 'var(--accent)' }} />
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Resets {CREDITS.resets}</div>
          </div>

          {/* preferences */}
          <div className="fade-up glass-3d" style={{ padding: isMobile ? '20px' : '24px 28px' }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Preferences</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>Appearance</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>Auto follows your device setting</div>
              </div>
              <div style={{ display: 'flex', gap: 4, background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 99, padding: 4 }}>
                {[['auto', 'Auto'], ['studio', 'Light'], ['midnight', 'Dark']].map(([v, l]) => (
                  <button key={v} onClick={() => setMode(v)} style={{ font: 'inherit', cursor: 'pointer', border: 'none',
                    borderRadius: 99, padding: '7px 14px', fontSize: 13, fontWeight: 600,
                    background: mode === v ? 'var(--card)' : 'transparent', color: mode === v ? 'var(--ink)' : 'var(--ink-3)',
                    boxShadow: mode === v ? 'var(--shadow)' : 'none', transition: 'all .2s var(--ease)' }}>{l}</button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProfileMenu, ProfileScreen });
