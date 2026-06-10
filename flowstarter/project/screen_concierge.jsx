// screen_concierge.jsx — connect with the team: book a call to build your project.

// human concierge avatar — warm, distinct from the geometric agent avatars
function ConciergeAvatar({ size = 48, online = true }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(140deg, color-mix(in srgb, var(--accent) 35%, #fff 10%), var(--accent-2))',
        display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700,
        fontSize: size * 0.36, letterSpacing: '.02em', boxShadow: '0 8px 20px -8px var(--accent)' }}>
        {CONCIERGE.initials}
      </div>
      {online && (
        <span style={{ position: 'absolute', right: 1, bottom: 1, width: size * 0.26, height: size * 0.26,
          borderRadius: '50%', background: 'var(--pos)', border: '2.5px solid var(--card)' }} />
      )}
    </div>
  );
}

function ConciergeScreen({ onBack, booked, onBook }) {
  const [picked, setPicked] = React.useState(booked || null);
  const [confirmed, setConfirmed] = React.useState(!!booked);
  const [answers, setAnswers] = React.useState({});
  const first = CONCIERGE.name.split(' ')[0];

  const slot = (picked && CALL_SLOTS.find(s => s.id === picked)) || null;
  const qualified = QUALIFY.every(q => answers[q.id]);
  const chips = QUALIFY.map(q => answers[q.id]).filter(Boolean);

  const confirm = () => {
    if (!picked || !qualified) return;
    setConfirmed(true);
    onBook && onBook(picked);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar stage="build" right={
        <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} onClick={onBack}>
          <Icons.arrow size={15} style={{ transform: 'rotate(180deg)' }} /> Back
        </button>
      } />

      <div className="scroll" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 'min(820px, 100%)', padding: '32px 26px 54px' }}>

          {/* concierge intro */}
          <div className="fade-up glass" style={{ borderRadius: 'var(--r-xl)', padding: '26px 28px', marginBottom: 24,
            display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <ConciergeAvatar size={64} />
            <div style={{ flex: 1, minWidth: 260 }}>
              <div className="eyebrow" style={{ marginBottom: 7 }}>{CONCIERGE.role}</div>
              <h1 className="serif" style={{ fontSize: 30, margin: '0 0 7px', lineHeight: 1.08, letterSpacing: '-.02em' }}>
                Let’s build this together.
              </h1>
              <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.5, margin: 0, maxWidth: 480 }}>{CONCIERGE.blurb}</p>
            </div>
          </div>

          {confirmed && slot ? (
            <BookingConfirmed slot={slot} first={first} chips={chips} onChange={() => setConfirmed(false)} />
          ) : (
            <React.Fragment>
              {/* qualify — 3 quick questions before booking */}
              <div className="fade-up glass" style={{ borderRadius: 'var(--r-lg)', padding: '22px 24px', marginBottom: 14 }}>
                <div className="eyebrow" style={{ marginBottom: 4 }}>A few quick things, so {first} comes prepared</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                  {QUALIFY.map(q => (
                    <div key={q.id}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{q.label}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {q.options.map(opt => {
                          const on = answers[q.id] === opt;
                          return (
                            <button key={opt} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))} className="slot-btn"
                              style={{ padding: '9px 15px', borderColor: on ? 'var(--accent)' : 'var(--line)',
                                background: on ? 'var(--accent-soft)' : 'var(--card)', color: on ? 'var(--accent)' : 'var(--ink)',
                                fontWeight: on ? 700 : 500, fontSize: 13.5 }}>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* what we'll cover */}
              <div className="fade-up" style={{ marginBottom: 14 }}>
                <div className="eyebrow" style={{ marginBottom: 12 }}>What we’ll cover · 30 min, free</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                  {CALL_AGENDA.map((a, i) => {
                    const I = Icons[a.icon] || Icons.spark;
                    return (
                      <div key={i} className="glass" style={{ borderRadius: 'var(--r-md)', padding: '16px 17px' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center',
                          background: 'var(--accent-soft)', color: 'var(--accent)', marginBottom: 11 }}>
                          <I size={17} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4, lineHeight: 1.2 }}>{a.title}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.45 }}>{a.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* pick a time */}
              <div className="fade-up glass" style={{ borderRadius: 'var(--r-lg)', padding: '22px 24px', marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <div className="serif" style={{ fontSize: 21, lineHeight: 1.1 }}>Pick a time with {first}</div>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icons.globe size={13} /> Times in PT
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                  {CALL_SLOTS.map(s => {
                    const on = picked === s.id;
                    return (
                      <button key={s.id} onClick={() => setPicked(s.id)} className="slot-btn"
                        style={{
                          borderColor: on ? 'var(--accent)' : 'var(--line)',
                          background: on ? 'var(--accent-soft)' : 'var(--card)',
                          boxShadow: on ? '0 8px 20px -12px var(--accent)' : 'none',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase',
                            color: on ? 'var(--accent)' : 'var(--ink-3)' }}>{s.day} · {s.date}</span>
                          {s.few && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--role-copy)' }}>1 left</span>}
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 700, marginTop: 5, color: on ? 'var(--accent)' : 'var(--ink)' }}>{s.time}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>{s.note}</div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--ink-2)' }}>
                    <ConciergeAvatar size={28} online={false} />
                    {!qualified ? <span>Answer the 3 questions above to book</span>
                      : slot ? <span>{slot.day} {slot.date} at <strong>{slot.time} {slot.tz}</strong> with {first}</span>
                      : <span>Select a slot to book your call</span>}
                  </div>
                  <button className="btn btn-grad" disabled={!picked || !qualified} onClick={confirm}
                    style={{ opacity: (picked && qualified) ? 1 : .5, cursor: (picked && qualified) ? 'pointer' : 'default' }}>
                    <Icons.cal size={16} /> Book the call
                  </button>
                </div>
              </div>

              {/* prefer async */}
              <div className="fade-up" style={{ marginTop: 16, textAlign: 'center', fontSize: 13.5, color: 'var(--ink-3)' }}>
                Can’t find a time? <span style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Tell us your availability</span> and we’ll come to you.
              </div>
            </React.Fragment>
          )}
        </div>
      </div>

      <style>{`
        .slot-btn {
          font: inherit; text-align: left; cursor: pointer;
          border: 1.5px solid var(--line); border-radius: var(--r-md);
          padding: 13px 15px; transition: all .16s var(--ease);
        }
        .slot-btn:hover { transform: translateY(-2px); border-color: var(--accent); }
      `}</style>
    </div>
  );
}

function BookingConfirmed({ slot, first, chips = [], onChange }) {
  return (
    <div className="fade-up glass" style={{ borderRadius: 'var(--r-xl)', padding: '30px 30px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px', background: 'var(--pos)',
        color: '#fff', display: 'grid', placeItems: 'center' }}>
        <Icons.check size={30} stroke={2.4} />
      </div>
      <h2 className="serif" style={{ fontSize: 28, margin: '0 0 8px', letterSpacing: '-.02em' }}>You’re booked with {first}.</h2>
      <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.5, margin: '0 auto 20px', maxWidth: 420 }}>
        A calendar invite and video link are on the way to your inbox. {first} will have your validated idea and build plan ready.
      </p>
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginBottom: 22 }}>
          {chips.map(c => (
            <span key={c} style={{ padding: '5px 12px', borderRadius: 99, background: 'var(--accent-soft)',
              color: 'var(--accent)', fontSize: 12.5, fontWeight: 600 }}>{c}</span>
          ))}
        </div>
      )}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 22px', borderRadius: 'var(--r-lg)',
        background: 'var(--accent-soft)', marginBottom: 22 }}>
        <div style={{ textAlign: 'center', paddingRight: 14, borderRight: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>{slot.day}</div>
          <div className="serif" style={{ fontSize: 26, color: 'var(--accent)', lineHeight: 1 }}>{slot.date.split(' ')[1]}</div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{slot.time} {slot.tz}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>30-min build call · video</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-soft" onClick={onChange}>Change time</button>
        <button className="btn btn-ghost"><Icons.cal size={15} /> Add to calendar</button>
      </div>
    </div>
  );
}

window.ConciergeScreen = ConciergeScreen;
window.ConciergeAvatar = ConciergeAvatar;
