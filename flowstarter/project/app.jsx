// app.jsx — flow state machine + idea input + tweaks.

// app.jsx — flow state machine + idea input.

const V0_ACCENT = '#4D5DD9';

// resolve the active theme from a mode ('auto' follows the OS)
function systemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'midnight' : 'studio';
}

// ---- idea input (between entry and interview) ----
function IdeaScreen({ door, onSubmit, onBack }) {
  const [val, setVal] = React.useState('');
  const ref = React.useRef(null);
  React.useEffect(() => { const id = setTimeout(() => ref.current && ref.current.focus(), 300); return () => clearTimeout(id); }, []);
  const isIdea = door === 'idea';
  const placeholder = isIdea ? SEED_IDEA : 'e.g. A two-chair barbershop in Oakland — fades, beard trims, walk-ins welcome.';
  const submit = () => onSubmit(val.trim() || (isIdea ? SEED_IDEA : 'A two-chair barbershop in Oakland — fades, beard trims, walk-ins welcome.'));
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar stage={isIdea ? 'validate' : 'build'} right={
        <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} onClick={onBack}>Back</button>
      } />
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '20px 26px' }}>
        <div className="fade-up" style={{ width: 'min(620px, 100%)' }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>{isIdea ? 'Tell me about your idea' : 'Tell me about your business'}</div>
          <h1 className="serif" style={{ fontSize: 'clamp(30px,4.5vw,44px)', margin: '0 0 10px', lineHeight: 1.08, letterSpacing: '-.02em' }}>
            {isIdea ? 'What are you thinking of building?' : 'What do you do?'}
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', margin: '0 0 24px', lineHeight: 1.5 }}>
            {isIdea
              ? 'One or two sentences is plenty. I’ll ask the sharp questions next.'
              : 'A sentence is enough — the agents will take it from here.'}
          </p>
          <div style={{ background: 'var(--card)', border: '1.5px solid var(--line)', borderRadius: 'var(--r-lg)',
            padding: '6px 6px 6px 6px', boxShadow: 'var(--shadow)' }}>
            <textarea ref={ref} value={val} onChange={e => setVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
              placeholder={placeholder}
              style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', background: 'transparent',
                font: 'inherit', fontSize: 17, lineHeight: 1.5, color: 'var(--ink)', padding: '16px 16px 8px', minHeight: 96 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px 8px' }}>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>⌘↵ to continue</span>
              <button className="btn btn-primary" onClick={submit}>
                {isIdea ? 'Pressure-test it' : 'Start building'} <Icons.arrow size={16} />
              </button>
            </div>
          </div>
          {isIdea && (
            <button onClick={() => setVal(SEED_IDEA)} style={{ marginTop: 14, font: 'inherit', cursor: 'pointer',
              background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 13.5, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icons.spark size={14} /> Try an example
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [stage, setStage] = React.useState('dashboard'); // dashboard|entry|idea|interview|validation|build|concierge|launch
  const [door, setDoor] = React.useState('idea');
  const [idea, setIdea] = React.useState(SEED_IDEA);
  const [booked, setBooked] = React.useState(null);
  const [activeAgent, setActiveAgent] = React.useState('research');

  // theme mode: 'auto' | 'studio' | 'midnight' (persisted)
  const [mode, setMode] = React.useState(() => {
    try { return localStorage.getItem('fs-theme-mode') || 'auto'; } catch (e) { return 'auto'; }
  });
  const [sysTheme, setSysTheme] = React.useState(systemTheme);
  const theme = mode === 'auto' ? sysTheme : mode;

  // follow the OS when in auto mode
  React.useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSysTheme(mq.matches ? 'midnight' : 'studio');
    mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on); };
  }, []);

  const changeMode = (m) => {
    setMode(m);
    try { localStorage.setItem('fs-theme-mode', m); } catch (e) {}
  };

  // apply resolved theme + accent
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const root = document.querySelector('.app-shell');
    if (root) root.style.setProperty('--accent', V0_ACCENT);
  }, [theme]);

  const pickDoor = (d) => { setDoor(d); setStage('idea'); };
  const submitIdea = (text) => { setIdea(text); setStage(door === 'idea' ? 'interview' : 'pricing'); };
  const openProject = (p) => {
    const map = { live: 'mysite', building: 'build', validating: 'validation', draft: 'idea' };
    setStage(map[p.status] || 'mysite');
  };

  const openAgent = (id) => { setActiveAgent(id); setStage('agent'); };

  let screen;
  if (stage === 'dashboard') screen = <Dashboard projects={PROJECTS} onNew={() => setStage('entry')} onOpen={openProject} onProfile={() => setStage('profile')} onOpenAgent={openAgent} onIntegrations={() => setStage('integrations')} />;
  else if (stage === 'agent') screen = <AgentScreen agentId={activeAgent} onBack={() => setStage('dashboard')} />;
  else if (stage === 'integrations') screen = <IntegrationsScreen onBack={() => setStage('dashboard')} />;
  else if (stage === 'profile') screen = <ProfileScreen onBack={() => setStage('dashboard')} />;
  else if (stage === 'entry') screen = <EntryScreen onPick={pickDoor} onHome={() => setStage('dashboard')} />;
  else if (stage === 'idea') screen = <IdeaScreen door={door} onSubmit={submitIdea} onBack={() => setStage('entry')} />;
  else if (stage === 'interview') screen = <InterviewScreen idea={idea} onComplete={() => setStage('validation')} />;
  else if (stage === 'validation') screen = <ValidationScreen onBuild={() => setStage('pricing')} onBack={() => setStage('idea')} />;
  else if (stage === 'pricing') screen = <PricingScreen onPick={(id) => setStage(id === 'build' ? 'build' : 'concierge')} onBack={() => setStage('validation')} />;
  else if (stage === 'build') screen = <BuildScreen onLaunch={() => setStage('launch')} onConcierge={() => setStage('concierge')} />;
  else if (stage === 'concierge') screen = <ConciergeScreen booked={booked} onBook={setBooked} onBack={() => setStage('dashboard')} />;
  else if (stage === 'launch') screen = <LaunchScreen theme={theme} onConcierge={() => setStage('concierge')} booked={booked} onRestart={() => setStage('mysite')} />;
  else if (stage === 'mysite') screen = <MySiteScreen onBack={() => setStage('dashboard')} onConcierge={() => setStage('concierge')} />;

  return (
    <ThemeCtx.Provider value={{ theme, mode, setMode: changeMode }}>
    <div className="app-shell" data-theme={theme}>
      <div className="ambient"><div className="blob3"></div></div>
      <div key={stage} className="fade-in" style={{ height: '100%' }}>{screen}</div>
    </div>
    </ThemeCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
