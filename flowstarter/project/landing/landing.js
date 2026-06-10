// landing.js — static-page interactions (vanilla; maps to Astro islands later)

// ---- scroll reveal ----
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ---- crew data (mirrors the product's agents) ----
const CREW = [
  { name: 'Vera',  role: 'Researcher', color: '#3E86E8', desc: 'Market & demand analysis. Finds the wedge before anything gets built.',
    icon: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>' },
  { name: 'Iris',  role: 'Brand',      color: '#B964E8', desc: 'Naming, identity, palettes — a visual system that fits your business.',
    icon: '<path d="M9.5 14.5L18 6a2 2 0 0 1 3 3l-8.5 8.5"/><path d="M9.5 14.5c-1.5-.5-3 .5-3.5 2S4 21 4 21s2-1.5 3.5-2 1.5-3 0-4.5z"/>' },
  { name: 'Quinn', role: 'Copywriter', color: '#E89B2F', desc: 'Writes your pages in your voice — words that actually convert.',
    icon: '<path d="M16 4l4 4L8 20l-4 1 1-4z"/>' },
  { name: 'Dash',  role: 'Developer',  color: '#2FB87A', desc: 'Assembles the site, wires booking and forms, ships it live.',
    icon: '<path d="M8 7l-5 5 5 5"/><path d="M16 7l5 5-5 5"/>' },
];

const crewGrid = document.getElementById('crew-grid');
if (crewGrid) {
  CREW.forEach((a, i) => {
    const el = document.createElement('div');
    el.className = 'crew-card reveal';
    el.style.animationDelay = (i * 0.07) + 's';
    el.innerHTML = `
      <div class="crew-avatar" style="color:${a.color}; background:${a.color}1f; border-color:${a.color}66">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${a.icon}</svg>
      </div>
      <div class="crew-name">${a.name}</div>
      <div class="crew-role mono" style="color:${a.color}">${a.role.toUpperCase()}</div>
      <p class="muted">${a.desc}</p>`;
    crewGrid.appendChild(el);
    io.observe(el);
  });
}

// ---- hero demo: looping live build feed ----
const FEED = [
  { who: 'Vera',  color: '#3E86E8', text: 'Demand is rising in your metro — “pottery class near me” +34% YoY.' },
  { who: 'Iris',  color: '#B964E8', text: 'Brand direction locked: warm, earthy, anti-precious.' },
  { who: 'Quinn', color: '#E89B2F', text: 'Hero written: “Make something with your hands this Saturday.”' },
  { who: 'Dash',  color: '#2FB87A', text: 'Homepage assembled. Booking wired with live slots.' },
  { who: 'Dash',  color: '#2FB87A', text: 'Ready for your review. ✓' },
];
const feedEl = document.getElementById('demo-feed');
const progEl = document.getElementById('demo-progress');
const avEl = document.getElementById('demo-avatars');

if (avEl) {
  CREW.forEach(a => {
    const d = document.createElement('span');
    d.className = 'demo-avatar';
    d.style.cssText = `color:${a.color}; background:${a.color}1f; border-color:${a.color}66`;
    d.textContent = a.name[0];
    avEl.appendChild(d);
  });
}

let feedIdx = 0;
function pushFeedLine() {
  if (!feedEl) return;
  if (feedIdx >= FEED.length) {
    setTimeout(() => { feedEl.innerHTML = ''; feedIdx = 0; if (progEl) progEl.textContent = '0%'; pushFeedLine(); }, 3400);
    return;
  }
  const line = FEED[feedIdx];
  const el = document.createElement('div');
  el.className = 'demo-line';
  el.innerHTML = `
    <span class="demo-line-avatar" style="color:${line.color}; background:${line.color}1f; border-color:${line.color}66">${line.who[0]}</span>
    <span class="demo-line-body"><strong style="color:${line.color}">${line.who}</strong> ${line.text}</span>`;
  feedEl.appendChild(el);
  while (feedEl.children.length > 4) feedEl.removeChild(feedEl.firstChild);
  feedIdx++;
  if (progEl) progEl.textContent = Math.round((feedIdx / FEED.length) * 100) + '%';
  setTimeout(pushFeedLine, 1700);
}
setTimeout(pushFeedLine, 900);

// ---- FAQ accordion ----
const FAQ = [
  { q: 'What do I actually get for €150?', a: 'A complete online presence: brand identity, written copy, a responsive website, booking or contact flows, connected domain and hosting — built by the agents, approved by you. €30 reserves the build; €120 is due only when your site is live and you approve it.' },
  { q: 'What if I don’t like what the agents build?', a: 'You direct the crew at every step and can request changes during the build. If you don’t approve the result, you don’t pay the €120 — and the €30 deposit is refundable in the first 14 days.' },
  { q: 'Do I own my website?', a: 'Completely. It runs on your own domain, and you can take everything with you whenever you want — no lock-in, no platform cut.' },
  { q: 'How long does the build take?', a: 'Validation takes minutes; most builds go from deposit to review in days, not months. You watch the crew work live, so you’re never left wondering what’s going on.' },
  { q: 'What does the €39.99/mo cover?', a: 'Everything ongoing, in one subscription: hosting, your domain, SSL, uptime monitoring with automatic fixes, a monthly performance snapshot, ongoing AI usage (10 plain-language edits a month) — plus one or two hands-on interventions from our human team each month when something needs a person.' },
  { q: 'I have a bigger project — e-commerce or a custom app.', a: 'That’s the team track. Book a free 30-minute call with Mara, our build strategist, and we’ll scope it together at a fixed quote, agreed before we start. Team-built projects start at €3,000.' },
  { q: 'What if I need more edits than my plan includes?', a: 'Add-on packs are available, and bigger one-off changes can be quoted individually. Most people stay well inside the 10 monthly edits.' },
  { q: 'I already have a website.', a: 'We do relaunches too. The crew looks at what you have, keeps the content worth keeping, and rebuilds the rest properly — mention your current site when you describe your business.' },
  { q: 'Is my idea kept confidential?', a: 'Yes. Your idea, research and brand work belong to you. We never reuse or share them.' },
];
const faqList = document.getElementById('faq-list');
if (faqList) {
  FAQ.forEach(item => {
    const d = document.createElement('details');
    d.className = 'faq-item';
    d.innerHTML = `<summary>${item.q}<span class="faq-chev" aria-hidden="true">+</span></summary><p class="muted">${item.a}</p>`;
    faqList.appendChild(d);
  });
}

// ---- product tour: three real product moments, auto-advancing ----
const TOUR = [
  {
    title: 'A real verdict on your idea',
    sub: 'Viability score, market signals, risks — before you build',
    pill: 'VALIDATION REPORT',
    body: `
      <div class="mock-row" style="margin-bottom:16px">
        <div class="mock-score"><span>78</span></div>
        <div class="mock-bars">
          <div><div style="font-size:12px;color:var(--ink-3);margin-bottom:4px">Local search demand · <strong style="color:var(--pos)">Rising</strong></div><div class="mock-bar"><i style="width:76%;background:var(--pos)"></i></div></div>
          <div><div style="font-size:12px;color:var(--ink-3);margin-bottom:4px">Willingness to pay · <strong style="color:var(--pos)">€40–55</strong></div><div class="mock-bar"><i style="width:64%;background:var(--pos)"></i></div></div>
          <div><div style="font-size:12px;color:var(--ink-3);margin-bottom:4px">Repeat-visit risk · <strong style="color:#E0922E">Watch</strong></div><div class="mock-bar"><i style="width:38%;background:#E0922E"></i></div></div>
        </div>
      </div>
      <div class="mock-card">
        <div style="font-size:11px;font-family:var(--mono);letter-spacing:.1em;color:var(--accent);margin-bottom:6px">YOUR WEDGE</div>
        <div style="font-family:var(--serif);font-size:16px;line-height:1.35">"Own the words 'drop-in' and 'no commitment.' The incumbents sell 6-week packages — you sell a Saturday."</div>
      </div>`,
  },
  {
    title: 'Watch the crew build it live',
    sub: 'Four agents, one feed — you direct, they execute',
    pill: 'LIVE BUILD',
    body: `
      <div class="mock-card" style="flex:1">
        <div class="mock-feed-line"><span class="mock-mini-avatar" style="color:#3E86E8;background:#3E86E81f;border-color:#3E86E866">V</span><span class="mock-text"><strong style="color:#3E86E8">Vera</strong> Positioning locked: "A Saturday, not a 6-week course."</span></div>
        <div class="mock-feed-line"><span class="mock-mini-avatar" style="color:#B964E8;background:#B964E81f;border-color:#B964E866">I</span><span class="mock-text"><strong style="color:#B964E8">Iris</strong> Brand direction: warm, earthy, anti-precious. Palette ready.</span></div>
        <div class="mock-feed-line"><span class="mock-mini-avatar" style="color:#E89B2F;background:#E89B2F1f;border-color:#E89B2F66">Q</span><span class="mock-text"><strong style="color:#E89B2F">Quinn</strong> Hero + 3 sections written in your voice.</span></div>
        <div class="mock-feed-line"><span class="mock-mini-avatar" style="color:#2FB87A;background:#2FB87A1f;border-color:#2FB87A66">D</span><span class="mock-text"><strong style="color:#2FB87A">Dash</strong> Homepage assembled. Booking wired with live slots. ✓</span></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px">
        <span style="font-size:12.5px;color:var(--ink-3)">Artifacts: brand · copy · site · booking</span>
        <span class="mono" style="font-size:12.5px;color:var(--accent)">92%</span>
      </div>`,
  },
  {
    title: 'It stays managed after launch',
    sub: 'Plain-language edits, monitoring, monthly snapshot',
    pill: 'MY SITE',
    body: `
      <div class="mock-card" style="margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="width:7px;height:7px;border-radius:99px;background:var(--pos)"></span>
          <span class="mono" style="font-size:12.5px;color:var(--accent);font-weight:600">mudroom.studio</span>
          <span style="font-size:11.5px;color:var(--ink-3);margin-left:auto">99.98% uptime</span>
        </div>
        <div style="font-size:13px;color:var(--ink-2);font-style:italic">"Update opening hours for the holiday weekend" → <strong style="color:var(--pos)">Done</strong></div>
      </div>
      <div class="mock-card">
        <div style="font-size:11px;font-family:var(--mono);letter-spacing:.1em;color:var(--accent);margin-bottom:8px">MAY SNAPSHOT</div>
        <div style="display:flex;gap:18px;margin-bottom:8px">
          <span style="font-size:13px"><strong style="font-size:17px">1,204</strong> visitors <strong style="color:var(--pos);font-size:12px">+22%</strong></span>
          <span style="font-size:13px"><strong style="font-size:17px">58</strong> bookings <strong style="color:var(--pos);font-size:12px">+14</strong></span>
        </div>
        <div style="font-size:12.5px;color:var(--ink-3)">Auto-fixed: SSL renewed · broken form repaired · pages 1.8× faster</div>
      </div>`,
  },
];

const pinDots = document.getElementById('pin-dots');
const pinPanels = document.getElementById('pin-panels');
let tourIdx = 0, tourTimer = null;

function setTour(i) {
  tourIdx = i;
  if (!pinDots || !pinPanels) return;
  [...pinDots.children].forEach((d, j) => d.classList.toggle('on', j === i));
  [...pinPanels.children].forEach((p, j) => p.classList.toggle('on', j === i));
}
function startTourTimer() {
  clearInterval(tourTimer);
  tourTimer = setInterval(() => setTour((tourIdx + 1) % TOUR.length), 4200);
}
if (pinDots && pinPanels) {
  TOUR.forEach((t, i) => {
    const dot = document.createElement('button');
    dot.className = 'pin-dot' + (i === 0 ? ' on' : '');
    dot.innerHTML = `<span class="pin-dot-bar"></span><span><span class="pin-dot-title">${t.title}</span><br/><span class="pin-dot-sub">${t.sub}</span></span>`;
    dot.addEventListener('click', () => { setTour(i); startTourTimer(); });
    pinDots.appendChild(dot);

    const panel = document.createElement('div');
    panel.className = 'pin-panel' + (i === 0 ? ' on' : '');
    panel.innerHTML = `<div class="pin-panel-head"><span class="pin-panel-pill">${t.pill}</span></div>${t.body}`;
    pinPanels.appendChild(panel);
  });
  const hint = document.querySelector('.pin-hint');
  if (hint) hint.textContent = 'Auto-playing — click a step to jump';
  startTourTimer();
}

// ---- showcase: businesses built by the crew ----
const SHOWCASE = [
  { name: 'Mudroom', kind: 'Drop-in pottery studio', domain: 'mudroom.studio', days: 4,
    grad: 'linear-gradient(135deg, #E8B07A, #C2683F)' },
  { name: 'Northside Cuts', kind: 'Two-chair barbershop', domain: 'northsidecuts.com', days: 3,
    grad: 'linear-gradient(135deg, #5C6B8A, #2E3A57)' },
  { name: 'Fernwood Bakery', kind: 'Neighborhood sourdough', domain: 'fernwoodbakery.com', days: 5,
    grad: 'linear-gradient(135deg, #E8C495, #C98A3D)' },
  { name: 'Lumen Yoga', kind: 'Sunrise rooftop yoga', domain: 'lumenyoga.co', days: 4,
    grad: 'linear-gradient(135deg, #9AD0C2, #5BA89A)' },
];
const showGrid = document.getElementById('show-grid');
if (showGrid) {
  SHOWCASE.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'show-card reveal';
    el.style.animationDelay = (i * 0.07) + 's';
    el.innerHTML = `
      <div class="show-thumb" style="background:${s.grad}">
        <div class="st-nav"><span class="st-dot"></span><span class="st-links"><span></span><span></span><span></span></span></div>
        <div class="st-hero"><span class="st-h1"></span><span class="st-h2"></span></div>
      </div>
      <div class="show-body">
        <div class="show-name">${s.name}</div>
        <div class="show-kind">${s.kind}</div>
        <div class="show-meta">
          <span class="live-dot"></span>
          <span class="mono" style="color:var(--accent);font-weight:600">${s.domain}</span>
          <span style="margin-left:auto;color:var(--ink-3)">live in ${s.days} days</span>
        </div>
      </div>`;
    showGrid.appendChild(el);
    io.observe(el);
  });
}

// ---- testimonials ----
const TESTI = [
  { quote: 'I had an idea and a full-time job. Three weeks later I had a validated concept, a brand I love, and paying customers booking Saturdays.', name: 'Maya R.', biz: 'Mudroom — pottery studio', color: '#C2683F' },
  { quote: 'The validation call talked me OUT of my first idea — and into a better one. That honesty is why I trust them with the monthly plan.', name: 'Dre W.', biz: 'Northside Cuts — barbershop', color: '#2E3A57' },
  { quote: 'I asked for "a photo gallery and holiday hours" in plain English. It was live the next morning. I have never touched a line of code.', name: 'Elena F.', biz: 'Fernwood Bakery', color: '#C98A3D' },
];
const testiGrid = document.getElementById('testi-grid');
if (testiGrid) {
  TESTI.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = 'testi-card reveal';
    el.style.animationDelay = (i * 0.07) + 's';
    el.innerHTML = `
      <p class="testi-quote">“${t.quote}”</p>
      <div class="testi-who">
        <span class="testi-avatar" style="background:${t.color}">${t.name[0]}</span>
        <span><span class="testi-name">${t.name}</span><br/><span class="testi-biz">${t.biz}</span></span>
      </div>`;
    testiGrid.appendChild(el);
    io.observe(el);
  });
}

// ---- funnel openers (funnel.jsx listens for this) ----
document.querySelectorAll('[data-funnel]').forEach(btn => {
  btn.addEventListener('click', () => window.dispatchEvent(new CustomEvent('open-funnel')));
});
