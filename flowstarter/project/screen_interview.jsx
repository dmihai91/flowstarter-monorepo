// screen_interview.jsx — advisor pressure-tests the idea, chat-style.
function InterviewScreen({ idea, onComplete }) {
  // turns: array of {who:'a'|'u', text}
  const [turns, setTurns] = React.useState([]);
  const [step, setStep] = React.useState(-1);     // index into INTERVIEW currently asked
  const [typing, setTyping] = React.useState(false);
  const [showChips, setShowChips] = React.useState(false);
  const [custom, setCustom] = React.useState('');
  const [writingOwn, setWritingOwn] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const scrollRef = React.useRef(null);

  const advisor = { name: 'Sol', role: 'Advisor', color: 'var(--accent)' };

  // ask question at index i (with typing delay)
  const ask = React.useCallback((i) => {
    if (i >= INTERVIEW.length) { wrap(); return; }
    setTyping(true); setShowChips(false);
    setTimeout(() => {
      setTyping(false);
      setTurns(t => [...t, { who: 'a', text: INTERVIEW[i].text }]);
      setStep(i);
      setTimeout(() => setShowChips(true), 350);
    }, 950);
  }, []);

  const wrap = () => {
    setTyping(true); setShowChips(false);
    setTimeout(() => {
      setTyping(false);
      setTurns(t => [...t, { who: 'a', text: "That's enough to go on. Give me a moment — I'm researching the market and your competition now." }]);
      setTimeout(() => setAnalyzing(true), 700);
    }, 1000);
  };

  // kick off
  React.useEffect(() => { const id = setTimeout(() => ask(0), 500); return () => clearTimeout(id); }, []);

  // auto-scroll
  React.useEffect(() => {
    const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight + 200;
  }, [turns, typing, showChips, analyzing]);

  const pick = (chip) => {
    setShowChips(false);
    setWritingOwn(false);
    setCustom('');
    setTurns(t => [...t, { who: 'u', text: chip }]);
    setTimeout(() => ask(step + 1), 500);
  };

  const sendCustom = () => {
    const val = custom.trim();
    if (!val) return;
    pick(val);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar stage="validate" right={<span className="eyebrow">Step 1 of 3</span>} />

      <div ref={scrollRef} className="scroll" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 'min(680px, 100%)', padding: '30px 24px 40px' }}>

          {/* idea pinned card */}
          <div className="fade-up" style={{ background: 'var(--card)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-lg)', padding: '18px 20px', boxShadow: 'var(--shadow)', marginBottom: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icons.spark size={13} /> Your idea
            </div>
            <p className="serif" style={{ fontSize: 19, margin: 0, lineHeight: 1.4 }}>“{idea}”</p>
          </div>

          {/* advisor intro */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 22 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent)',
              color: 'var(--accent-ink)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icons.flow size={20} stroke={2.2} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Sol</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '.08em',
                textTransform: 'uppercase', color: 'var(--accent)' }}>Your advisor</div>
            </div>
          </div>

          {/* conversation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {turns.map((t, i) => (
              <Bubble key={i} turn={t} />
            ))}
            {typing && (
              <div className="fade-in" style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ background: 'var(--card)', border: '1px solid var(--line)',
                  borderRadius: '4px 16px 16px 16px', padding: '14px 16px', color: 'var(--accent)' }}>
                  <span className="dots"><span></span><span></span><span></span></span>
                </div>
              </div>
            )}
          </div>

          {/* chips */}
          {showChips && step >= 0 && (
            <div className="fade-up" style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 10 }}>
                Pick what fits, or answer in your own words:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {INTERVIEW[step].chips.map(c => (
                  <button key={c} onClick={() => pick(c)} className="chip-btn">
                    {c}
                  </button>
                ))}
                {!writingOwn && (
                  <button onClick={() => setWritingOwn(true)} className="chip-btn chip-own">
                    <Icons.pen size={14} /> Write my own
                  </button>
                )}
              </div>
              {writingOwn && (
                <div className="fade-up" style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <textarea autoFocus value={custom} onChange={e => setCustom(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCustom(); } }}
                    placeholder="Type your own answer…" rows={1} className="own-input" />
                  <button onClick={sendCustom} disabled={!custom.trim()} className="btn btn-primary"
                    style={{ padding: '11px 16px', fontSize: 14, opacity: custom.trim() ? 1 : .5,
                      cursor: custom.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
                    Send <Icons.arrow size={15} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* analyzing → transition */}
          {analyzing && <AnalyzingPanel onDone={onComplete} />}
        </div>
      </div>

      <style>{`
        .chip-btn {
          font-family: var(--sans); font-size: 14px; font-weight: 500;
          background: var(--card); border: 1.5px solid var(--line); color: var(--ink);
          border-radius: 999px; padding: 10px 16px; cursor: pointer;
          transition: all .18s var(--ease);
        }
        .chip-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); transform: translateY(-1px); }
        .chip-own { display: inline-flex; align-items: center; gap: 6px; border-style: dashed; color: var(--ink-2); }
        .own-input {
          flex: 1; font-family: var(--sans); font-size: 15px; line-height: 1.4;
          color: var(--ink); background: var(--card);
          border: 1.5px solid var(--accent); border-radius: 16px;
          padding: 11px 16px; resize: none; outline: none; min-height: 44px;
        }
        .own-input::placeholder { color: var(--ink-3); }
      `}</style>
    </div>
  );
}

function Bubble({ turn }) {
  const isU = turn.who === 'u';
  return (
    <div className="fade-up" style={{ display: 'flex', justifyContent: isU ? 'flex-end' : 'flex-start' }}>
      <div className={isU ? '' : 'serif'} style={{
        maxWidth: '82%',
        background: isU ? 'var(--accent)' : 'var(--card)',
        color: isU ? 'var(--accent-ink)' : 'var(--ink)',
        border: isU ? 'none' : '1px solid var(--line)',
        borderRadius: isU ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        padding: isU ? '12px 16px' : '14px 18px',
        fontSize: isU ? 15 : 17, lineHeight: 1.45,
        fontWeight: isU ? 500 : 400,
        boxShadow: isU ? '0 6px 16px -8px var(--accent)' : 'var(--shadow)',
      }}>
        {turn.text}
      </div>
    </div>
  );
}

// analyzing panel — research agent runs, then auto-advances
function AnalyzingPanel({ onDone }) {
  const tasks = [
    { t: 'Searching local demand & search trends', icon: Icons.search },
    { t: 'Mapping nearby competitors', icon: Icons.pin },
    { t: 'Benchmarking pricing', icon: Icons.chart },
    { t: 'Scoring viability', icon: Icons.star },
  ];
  const [done, setDone] = React.useState(0);
  React.useEffect(() => {
    if (done < tasks.length) { const id = setTimeout(() => setDone(d => d + 1), 720); return () => clearTimeout(id); }
    const id = setTimeout(onDone, 900); return () => clearTimeout(id);
  }, [done]);
  return (
    <div className="fade-up" style={{ marginTop: 26, background: 'var(--card)', border: '1px solid var(--line)',
      borderRadius: 'var(--r-lg)', padding: '22px 24px', boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
        <AgentAvatar agent={AGENTS.research} size={36} active />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{AGENTS.research.name} is researching…</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '.08em',
            textTransform: 'uppercase', color: 'var(--role-research)' }}>Researcher</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {tasks.map((task, i) => {
          const T = task.icon;
          const state = i < done ? 'done' : i === done ? 'now' : 'next';
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11,
              opacity: state === 'next' ? .4 : 1, transition: 'opacity .3s' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: state === 'done' ? 'var(--pos)' : 'transparent',
                border: state === 'done' ? 'none' : '1.5px solid var(--line)',
                color: state === 'done' ? '#fff' : 'var(--role-research)' }}>
                {state === 'done' ? <Icons.check size={12} stroke={2.6} />
                  : state === 'now' ? <span className="dots" style={{ color: 'var(--role-research)' }}><span></span><span></span><span></span></span>
                  : <T size={12} />}
              </div>
              <span style={{ fontSize: 14, color: state === 'now' ? 'var(--ink)' : 'var(--ink-2)' }}>{task.t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
window.InterviewScreen = InterviewScreen;
