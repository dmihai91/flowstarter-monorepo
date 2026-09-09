// funnel.jsx — try-it funnel: idea → agent draft → €30 deposit → confirmed.
const { useState, useEffect, useRef } = React;

const FUNNEL_EXAMPLES = [
  'A weekend pottery studio for total beginners',
  'Mobile bike repair that comes to your office',
  'A sourdough subscription for my neighborhood',
];

// what the "agents" draft from the idea (mocked)
function draftFromIdea(idea) {
  const lower = idea.toLowerCase();
  if (lower.includes('pottery')) return { name: 'Mudroom', tag: 'Drop in. Get your hands dirty.', colors: ['#C2683F', '#E8B07A', '#3C3A34', '#F2EBDD'], hero: 'Make something with your hands this Saturday.' };
  if (lower.includes('bike')) return { name: 'Spoke', tag: 'Your bike, fixed where you are.', colors: ['#2F6B4F', '#8FC9A8', '#22271F', '#F0F4EC'], hero: 'A tuned-up bike by the time you finish work.' };
  if (lower.includes('sourdough') || lower.includes('bak')) return { name: 'Crumb & Co.', tag: 'Real bread, every week.', colors: ['#C98A3D', '#E8C495', '#3A3026', '#F6F0E6'], hero: 'Fresh sourdough on your doorstep, every Friday.' };
  return { name: 'Northstar', tag: 'Built around what you do best.', colors: ['#4D5DD9', '#8FA0EC', '#23253A', '#F0F1F8'], hero: 'Your business, online and bookable this week.' };
}

const DRAFT_TASKS = [
  { who: 'Vera',  color: '#3E86E8', text: 'Checking demand signals for this idea…' },
  { who: 'Iris',  color: '#B964E8', text: 'Drafting a name and palette…' },
  { who: 'Quinn', color: '#E89B2F', text: 'Writing a hero line in your voice…' },
];

function Funnel() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);        // 1 idea · 2 draft · 3 deposit · 4 done
  const [idea, setIdea] = useState('');
  const [draft, setDraft] = useState(null);
  const [taskIdx, setTaskIdx] = useState(0);
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvc: '' });
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const on = () => { setOpen(true); };
    window.addEventListener('open-funnel', on);
    return () => window.removeEventListener('open-funnel', on);
  }, []);

  // escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // step 2: stream the draft tasks, then show result
  useEffect(() => {
    if (step !== 2) return;
    setTaskIdx(0);
    setDraft(null);
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i <= DRAFT_TASKS.length) setTaskIdx(i);
      if (i > DRAFT_TASKS.length) { clearInterval(id); setDraft(draftFromIdea(idea)); }
    }, 1100);
    return () => clearInterval(id);
  }, [step]);

  const startDraft = (text) => {
    const v = (text || idea).trim() || FUNNEL_EXAMPLES[0];
    setIdea(v);
    setStep(2);
  };

  const payDeposit = () => {
    if (paying) return;
    setPaying(true);
    setTimeout(() => { setPaying(false); setStep(4); }, 1600);
  };

  const close = () => { setOpen(false); setTimeout(() => { setStep(1); setIdea(''); setDraft(null); }, 300); };

  if (!open) return null;

  return (
    <div className="funnel-overlay" onClick={close}>
      <div className="funnel-card" onClick={e => e.stopPropagation()}>
        <button className="funnel-close" onClick={close} aria-label="Close">✕</button>

        {/* progress dots */}
        <div className="funnel-steps">
          {[1, 2, 3, 4].map(n => <span key={n} className={'funnel-step-dot' + (step >= n ? ' on' : '')}></span>)}
        </div>

        {step === 1 && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Free · no account needed</div>
            <h2 style={{ fontSize: 30, marginBottom: 10 }}>What would you like to build?</h2>
            <p className="muted" style={{ fontSize: 15, marginBottom: 22 }}>
              One sentence is plenty. The crew drafts a name, brand and hero line — free, right now.
            </p>
            <textarea value={idea} onChange={e => setIdea(e.target.value)} autoFocus rows={2}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startDraft(); } }}
              placeholder={'e.g. ' + FUNNEL_EXAMPLES[0]}
              style={{ width: '100%', font: 'inherit', fontSize: 16, lineHeight: 1.5, color: 'var(--ink)',
                background: 'var(--card)', border: '1.5px solid var(--line)', borderRadius: 16, padding: '15px 17px',
                resize: 'none', outline: 'none', marginBottom: 14 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {FUNNEL_EXAMPLES.map(ex => (
                <button key={ex} onClick={() => startDraft(ex)} style={{ font: 'inherit', cursor: 'pointer', fontSize: 13,
                  background: 'var(--card)', border: '1.5px dashed var(--line)', color: 'var(--ink-2)',
                  borderRadius: 99, padding: '7px 14px' }}>
                  {ex}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => startDraft()}>
              Let the crew draft it →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>The crew is drafting</div>
            <h2 style={{ fontSize: 26, marginBottom: 6 }}>“{idea}”</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, margin: '24px 0' }}>
              {DRAFT_TASKS.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, opacity: i < taskIdx + 1 ? 1 : .35,
                  transition: 'opacity .3s' }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
                    fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: 600, color: t.color,
                    background: t.color + '1f', border: `1px solid ${t.color}66` }}>{t.who[0]}</span>
                  <span style={{ fontSize: 14.5, color: 'var(--ink-2)' }}>{t.text}</span>
                  {i < taskIdx ? <span style={{ color: 'var(--pos)', fontWeight: 700 }}>✓</span>
                    : i === taskIdx ? <span className="dots" style={{ color: t.color }}><span></span><span></span><span></span></span> : null}
                </div>
              ))}
            </div>

            {draft && (
              <div style={{ animation: 'fadeUp .5s var(--ease-out) both' }}>
                <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, padding: '22px 24px', marginBottom: 20 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: 34, letterSpacing: '-.02em' }}>{draft.name}</div>
                  <div className="muted" style={{ fontSize: 14.5, marginBottom: 14 }}>{draft.tag}</div>
                  <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
                    {draft.colors.map(c => <span key={c} style={{ width: 34, height: 34, borderRadius: 9, background: c, border: '1px solid var(--line)' }}></span>)}
                  </div>
                  <div style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--ink-2)' }}>“{draft.hero}”</div>
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(3)}>
                  I like it — reserve my build · €30
                </button>
                <p className="muted" style={{ fontSize: 12.5, textAlign: 'center', marginTop: 10 }}>
                  €120 due only when your site is live and you approve it. €30 refundable for 14 days.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Reserve your build</div>
            <h2 style={{ fontSize: 28, marginBottom: 8 }}>€30 today. €120 when it’s live.</h2>
            <p className="muted" style={{ fontSize: 14.5, marginBottom: 22 }}>
              Your deposit puts {draft ? <strong>{draft.name}</strong> : 'your project'} in the build queue.
              It’s credited toward your €150 total — you pay the rest only after you approve the finished site.
            </p>
            <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
              <input placeholder="Name on card" value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} style={inputStyle} />
              <input placeholder="Card number" inputMode="numeric" value={card.number}
                onChange={e => setCard({ ...card, number: e.target.value.replace(/[^\d ]/g, '') })} style={inputStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input placeholder="MM / YY" value={card.expiry} onChange={e => setCard({ ...card, expiry: e.target.value })} style={inputStyle} />
                <input placeholder="CVC" inputMode="numeric" value={card.cvc} onChange={e => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} style={inputStyle} />
              </div>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', opacity: paying ? .7 : 1 }} onClick={payDeposit}>
              {paying ? 'Processing…' : 'Pay €30 deposit'}
            </button>
            <p className="muted" style={{ fontSize: 12.5, textAlign: 'center', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="10" width="16" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg>
              Secure payment · refundable for 14 days · demo, no card is charged
            </p>
          </div>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', margin: '0 auto 18px', background: 'var(--pos)', color: '#fff',
              display: 'grid', placeItems: 'center', fontSize: 26 }}>✓</div>
            <h2 style={{ fontSize: 28, marginBottom: 10 }}>{draft ? draft.name : 'Your project'} is in the queue.</h2>
            <p className="muted" style={{ fontSize: 15, maxWidth: 400, margin: '0 auto 24px' }}>
              The crew starts now. You’ll direct the build, approve the result, and pay the remaining €120 only when your site is live.
            </p>
            <a className="btn btn-primary btn-lg" href="../Flowstarter%20Product%20Flow.html" style={{ justifyContent: 'center' }}>
              Open your workspace →
            </a>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>A receipt for your €30 deposit is on its way to your inbox.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  font: 'inherit', fontSize: 15, color: 'var(--ink)', background: 'var(--card)',
  border: '1.5px solid var(--line)', borderRadius: 12, padding: '13px 15px', outline: 'none', width: '100%',
};

ReactDOM.createRoot(document.getElementById('funnel-root')).render(<Funnel />);
