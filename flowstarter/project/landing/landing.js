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
  { q: 'What does the €39.99/mo cover?', a: 'Everything ongoing, in one subscription: hosting, your domain, SSL, uptime monitoring with automatic fixes, a monthly performance snapshot, ongoing AI usage (10 plain-language edits a month) — plus one or two hands-on interventions from our human team each month when something needs a person.' },
  { q: 'I have a bigger project — e-commerce or a custom app.', a: 'That’s the team track. Book a free 30-minute call with Mara, our build strategist, and we’ll scope it together. Team-built projects start at €3,000.' },
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

// ---- funnel openers (funnel.jsx listens for this) ----
document.querySelectorAll('[data-funnel]').forEach(btn => {
  btn.addEventListener('click', () => window.dispatchEvent(new CustomEvent('open-funnel')));
});
