import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

// Premium, professional template designs
const designs = {
  'edu-course-creator': {
    light: `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Cal+Sans&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;width:1200px;height:630px;background:#fff;overflow:hidden}
.container{height:100%;display:grid;grid-template-rows:auto 1fr}
.nav{display:flex;justify-content:space-between;align-items:center;padding:24px 48px;border-bottom:1px solid #f1f5f9}
.logo{font-size:22px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:10px}
.logo-mark{width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px}
.nav-right{display:flex;align-items:center;gap:32px}
.nav-link{font-size:14px;color:#64748b;font-weight:500}
.nav-cta{background:#6366f1;color:#fff;padding:10px 24px;border-radius:8px;font-weight:600;font-size:14px}
.hero{display:grid;grid-template-columns:1fr 1fr;gap:80px;padding:48px 48px 0;align-items:center}
.hero-content{padding-right:20px}
.eyebrow{display:inline-flex;align-items:center;gap:8px;background:#eef2ff;color:#4f46e5;padding:8px 16px;border-radius:100px;font-size:13px;font-weight:600;margin-bottom:24px}
.eyebrow-dot{width:8px;height:8px;background:#4f46e5;border-radius:50%}
h1{font-size:52px;font-weight:700;color:#0f172a;line-height:1.1;letter-spacing:-0.02em;margin-bottom:20px}
h1 span{background:linear-gradient(135deg,#6366f1,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.subtitle{font-size:18px;color:#475569;line-height:1.7;margin-bottom:32px}
.ctas{display:flex;gap:16px}
.btn-primary{background:#6366f1;color:#fff;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;display:flex;align-items:center;gap:8px}
.btn-ghost{color:#6366f1;padding:14px 28px;font-weight:600;font-size:15px;display:flex;align-items:center;gap:8px}
.metrics{display:flex;gap:40px;margin-top:40px;padding-top:32px;border-top:1px solid #e2e8f0}
.metric-value{font-size:28px;font-weight:700;color:#0f172a}
.metric-label{font-size:13px;color:#64748b;margin-top:4px}
.hero-visual{position:relative}
.dashboard{background:#f8fafc;border-radius:20px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.08)}
.dash-header{background:#fff;padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:12px}
.dash-avatar{width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#a855f7);border-radius:10px}
.dash-user{font-weight:600;color:#0f172a;font-size:14px}
.dash-sub{color:#64748b;font-size:12px}
.dash-body{padding:20px}
.course-list{display:flex;flex-direction:column;gap:12px}
.course-item{background:#fff;border-radius:12px;padding:16px;display:flex;gap:14px;border:1px solid #e2e8f0}
.course-thumb{width:64px;height:48px;border-radius:8px;flex-shrink:0}
.course-info h4{font-weight:600;color:#0f172a;font-size:14px;margin-bottom:4px}
.course-info p{color:#64748b;font-size:12px}
.course-progress{background:#e2e8f0;height:4px;border-radius:2px;margin-top:8px;overflow:hidden}
.course-progress-bar{height:100%;border-radius:2px}
.floating-card{position:absolute;background:#fff;border-radius:12px;padding:16px;box-shadow:0 20px 40px rgba(0,0,0,0.1);border:1px solid #e2e8f0}
.card-1{top:-20px;right:-20px;display:flex;align-items:center;gap:12px}
.card-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}
.card-text{font-size:13px}
.card-text strong{display:block;color:#0f172a;font-weight:600}
.card-text span{color:#64748b}
</style></head><body>
<div class="container">
<nav class="nav">
<div class="logo"><div class="logo-mark"></div>LearnHub</div>
<div class="nav-right"><span class="nav-link">Courses</span><span class="nav-link">Pricing</span><span class="nav-link">About</span><div class="nav-cta">Start Learning</div></div>
</nav>
<div class="hero">
<div class="hero-content">
<div class="eyebrow"><span class="eyebrow-dot"></span>Trusted by 50,000+ learners</div>
<h1>Master New Skills with <span>Expert Courses</span></h1>
<p class="subtitle">Learn design, development, and business from industry experts. Start for free with our most popular courses.</p>
<div class="ctas"><div class="btn-primary">Browse Courses →</div><div class="btn-ghost">View Pricing</div></div>
<div class="metrics"><div><div class="metric-value">250+</div><div class="metric-label">Expert courses</div></div><div><div class="metric-value">50K+</div><div class="metric-label">Active students</div></div><div><div class="metric-value">4.9</div><div class="metric-label">Average rating</div></div></div>
</div>
<div class="hero-visual">
<div class="dashboard">
<div class="dash-header"><div class="dash-avatar"></div><div><div class="dash-user">My Learning</div><div class="dash-sub">3 courses in progress</div></div></div>
<div class="dash-body">
<div class="course-list">
<div class="course-item"><div class="course-thumb" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"></div><div class="course-info"><h4>Complete Web Development</h4><p>24 lessons • 12 hours</p><div class="course-progress"><div class="course-progress-bar" style="width:75%;background:linear-gradient(90deg,#6366f1,#8b5cf6)"></div></div></div></div>
<div class="course-item"><div class="course-thumb" style="background:linear-gradient(135deg,#f59e0b,#ef4444)"></div><div class="course-info"><h4>UI/UX Design Mastery</h4><p>18 lessons • 8 hours</p><div class="course-progress"><div class="course-progress-bar" style="width:40%;background:linear-gradient(90deg,#f59e0b,#ef4444)"></div></div></div></div>
<div class="course-item"><div class="course-thumb" style="background:linear-gradient(135deg,#10b981,#06b6d4)"></div><div class="course-info"><h4>Digital Marketing Pro</h4><p>32 lessons • 16 hours</p><div class="course-progress"><div class="course-progress-bar" style="width:90%;background:linear-gradient(90deg,#10b981,#06b6d4)"></div></div></div></div>
</div></div></div>
<div class="floating-card card-1"><div class="card-icon" style="background:#dcfce7;color:#16a34a">🎉</div><div class="card-text"><strong>Certificate Ready!</strong><span>Complete 1 more lesson</span></div></div>
</div>
</div>
</div>
</body></html>`,
    dark: `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;width:1200px;height:630px;background:#0c0f1a;overflow:hidden}
.container{height:100%;display:grid;grid-template-rows:auto 1fr}
.nav{display:flex;justify-content:space-between;align-items:center;padding:24px 48px;border-bottom:1px solid #1e293b}
.logo{font-size:22px;font-weight:700;color:#f8fafc;display:flex;align-items:center;gap:10px}
.logo-mark{width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px}
.nav-right{display:flex;align-items:center;gap:32px}
.nav-link{font-size:14px;color:#94a3b8;font-weight:500}
.nav-cta{background:#6366f1;color:#fff;padding:10px 24px;border-radius:8px;font-weight:600;font-size:14px}
.hero{display:grid;grid-template-columns:1fr 1fr;gap:80px;padding:48px 48px 0;align-items:center}
.hero-content{padding-right:20px}
.eyebrow{display:inline-flex;align-items:center;gap:8px;background:#1e1b4b;color:#a5b4fc;padding:8px 16px;border-radius:100px;font-size:13px;font-weight:600;margin-bottom:24px}
.eyebrow-dot{width:8px;height:8px;background:#a5b4fc;border-radius:50%}
h1{font-size:52px;font-weight:700;color:#f8fafc;line-height:1.1;letter-spacing:-0.02em;margin-bottom:20px}
h1 span{background:linear-gradient(135deg,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.subtitle{font-size:18px;color:#94a3b8;line-height:1.7;margin-bottom:32px}
.ctas{display:flex;gap:16px}
.btn-primary{background:#6366f1;color:#fff;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px}
.btn-ghost{color:#a5b4fc;padding:14px 28px;font-weight:600;font-size:15px}
.metrics{display:flex;gap:40px;margin-top:40px;padding-top:32px;border-top:1px solid #1e293b}
.metric-value{font-size:28px;font-weight:700;color:#f8fafc}
.metric-label{font-size:13px;color:#64748b;margin-top:4px}
.hero-visual{position:relative}
.dashboard{background:#111827;border-radius:20px;border:1px solid #1e293b;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5)}
.dash-header{background:#0f172a;padding:16px 20px;border-bottom:1px solid #1e293b;display:flex;align-items:center;gap:12px}
.dash-avatar{width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#a855f7);border-radius:10px}
.dash-user{font-weight:600;color:#f8fafc;font-size:14px}
.dash-sub{color:#64748b;font-size:12px}
.dash-body{padding:20px}
.course-list{display:flex;flex-direction:column;gap:12px}
.course-item{background:#0f172a;border-radius:12px;padding:16px;display:flex;gap:14px;border:1px solid #1e293b}
.course-thumb{width:64px;height:48px;border-radius:8px;flex-shrink:0}
.course-info h4{font-weight:600;color:#f8fafc;font-size:14px;margin-bottom:4px}
.course-info p{color:#64748b;font-size:12px}
.course-progress{background:#1e293b;height:4px;border-radius:2px;margin-top:8px;overflow:hidden}
.course-progress-bar{height:100%;border-radius:2px}
.floating-card{position:absolute;background:#1e293b;border-radius:12px;padding:16px;box-shadow:0 20px 40px rgba(0,0,0,0.4);border:1px solid #334155}
.card-1{top:-20px;right:-20px;display:flex;align-items:center;gap:12px}
.card-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}
.card-text{font-size:13px}
.card-text strong{display:block;color:#f8fafc;font-weight:600}
.card-text span{color:#94a3b8}
</style></head><body>
<div class="container">
<nav class="nav">
<div class="logo"><div class="logo-mark"></div>LearnHub</div>
<div class="nav-right"><span class="nav-link">Courses</span><span class="nav-link">Pricing</span><span class="nav-link">About</span><div class="nav-cta">Start Learning</div></div>
</nav>
<div class="hero">
<div class="hero-content">
<div class="eyebrow"><span class="eyebrow-dot"></span>Trusted by 50,000+ learners</div>
<h1>Master New Skills with <span>Expert Courses</span></h1>
<p class="subtitle">Learn design, development, and business from industry experts. Start for free with our most popular courses.</p>
<div class="ctas"><div class="btn-primary">Browse Courses →</div><div class="btn-ghost">View Pricing</div></div>
<div class="metrics"><div><div class="metric-value">250+</div><div class="metric-label">Expert courses</div></div><div><div class="metric-value">50K+</div><div class="metric-label">Active students</div></div><div><div class="metric-value">4.9</div><div class="metric-label">Average rating</div></div></div>
</div>
<div class="hero-visual">
<div class="dashboard">
<div class="dash-header"><div class="dash-avatar"></div><div><div class="dash-user">My Learning</div><div class="dash-sub">3 courses in progress</div></div></div>
<div class="dash-body">
<div class="course-list">
<div class="course-item"><div class="course-thumb" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"></div><div class="course-info"><h4>Complete Web Development</h4><p>24 lessons • 12 hours</p><div class="course-progress"><div class="course-progress-bar" style="width:75%;background:linear-gradient(90deg,#6366f1,#8b5cf6)"></div></div></div></div>
<div class="course-item"><div class="course-thumb" style="background:linear-gradient(135deg,#f59e0b,#ef4444)"></div><div class="course-info"><h4>UI/UX Design Mastery</h4><p>18 lessons • 8 hours</p><div class="course-progress"><div class="course-progress-bar" style="width:40%;background:linear-gradient(90deg,#f59e0b,#ef4444)"></div></div></div></div>
<div class="course-item"><div class="course-thumb" style="background:linear-gradient(135deg,#10b981,#06b6d4)"></div><div class="course-info"><h4>Digital Marketing Pro</h4><p>32 lessons • 16 hours</p><div class="course-progress"><div class="course-progress-bar" style="width:90%;background:linear-gradient(90deg,#10b981,#06b6d4)"></div></div></div></div>
</div></div></div>
<div class="floating-card card-1"><div class="card-icon" style="background:#064e3b;color:#10b981">🎉</div><div class="card-text"><strong>Certificate Ready!</strong><span>Complete 1 more lesson</span></div></div>
</div>
</div>
</div>
</body></html>`
  },

  'coding-bootcamp': {
    light: `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Space Grotesk',sans-serif;width:1200px;height:630px;background:#f0fdf4;overflow:hidden}
.split{display:grid;grid-template-columns:1fr 1fr;height:100%}
.left{padding:48px;display:flex;flex-direction:column;justify-content:center}
.right{background:linear-gradient(160deg,#064e3b 0%,#022c22 100%);position:relative;overflow:hidden}
.nav{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:24px 48px}
.logo{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:#047857;display:flex;align-items:center;gap:8px}
.logo-bracket{color:#10b981}
.nav-links{display:flex;gap:24px}
.nav-link{font-size:14px;color:#047857;font-weight:500}
.badge{display:inline-flex;align-items:center;gap:8px;background:#d1fae5;color:#047857;padding:8px 16px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;margin-bottom:24px;width:fit-content}
h1{font-size:52px;font-weight:700;color:#064e3b;line-height:1.05;margin-bottom:20px}
h1 span{color:#10b981}
.subtitle{font-size:18px;color:#047857;line-height:1.7;margin-bottom:32px;max-width:480px}
.stats{display:flex;gap:32px;margin-bottom:32px}
.stat-value{font-family:'JetBrains Mono',monospace;font-size:32px;font-weight:700;color:#047857}
.stat-label{font-size:13px;color:#6b7280}
.ctas{display:flex;gap:16px}
.btn-primary{background:#10b981;color:#fff;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px}
.btn-outline{border:2px solid #10b981;color:#10b981;padding:12px 26px;border-radius:8px;font-weight:600;font-size:15px}
.code-window{position:absolute;top:80px;left:40px;right:40px;bottom:40px;background:#0f172a;border-radius:12px;box-shadow:0 25px 50px rgba(0,0,0,0.3);overflow:hidden}
.code-header{background:#1e293b;padding:12px 16px;display:flex;align-items:center;gap:8px}
.code-dot{width:12px;height:12px;border-radius:50%}
.code-title{color:#64748b;font-size:12px;margin-left:auto;font-family:'JetBrains Mono',monospace}
.code-body{padding:24px;font-family:'JetBrains Mono',monospace;font-size:14px;line-height:2}
.ln{color:#4b5563;width:32px;display:inline-block}
.kw{color:#c084fc}
.fn{color:#22d3ee}
.str{color:#fbbf24}
.cm{color:#6b7280;font-style:italic}
.vr{color:#f472b6}
.op{color:#94a3b8}
.typing{display:inline-block;width:8px;height:18px;background:#10b981;animation:blink 1s infinite;vertical-align:middle}
@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
.floating-badge{position:absolute;background:#fff;border-radius:10px;padding:12px 16px;box-shadow:0 10px 40px rgba(0,0,0,0.15);display:flex;align-items:center;gap:10px}
.badge-1{bottom:60px;left:20px}
.badge-2{top:60px;right:20px}
.badge-icon{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px}
.badge-text{font-size:12px}
.badge-text strong{display:block;color:#0f172a;font-weight:600}
.badge-text span{color:#6b7280}
</style></head><body>
<nav class="nav"><div class="logo"><span class="logo-bracket">&lt;</span>CodeCraft<span class="logo-bracket">/&gt;</span></div><div class="nav-links"><span class="nav-link">Programs</span><span class="nav-link">Outcomes</span><span class="nav-link">Apply</span></div></nav>
<div class="split">
<div class="left">
<div class="badge">// 92% JOB PLACEMENT RATE</div>
<h1>Launch Your<br/><span>Tech Career</span><br/>in 12 Weeks</h1>
<p class="subtitle">Intensive coding bootcamp with hands-on projects, career coaching, and job placement support.</p>
<div class="stats"><div><div class="stat-value">$85K</div><div class="stat-label">Avg starting salary</div></div><div><div class="stat-value">500+</div><div class="stat-label">Graduates hired</div></div></div>
<div class="ctas"><div class="btn-primary">Apply Now →</div><div class="btn-outline">Download Syllabus</div></div>
</div>
<div class="right">
<div class="code-window">
<div class="code-header"><div class="code-dot" style="background:#ef4444"></div><div class="code-dot" style="background:#fbbf24"></div><div class="code-dot" style="background:#22c55e"></div><span class="code-title">career.js</span></div>
<div class="code-body">
<div><span class="ln">1</span><span class="cm">// Your journey starts here</span></div>
<div><span class="ln">2</span><span class="kw">const</span> <span class="vr">student</span> <span class="op">=</span> <span class="op">{</span></div>
<div><span class="ln">3</span>&nbsp;&nbsp;name<span class="op">:</span> <span class="str">"You"</span><span class="op">,</span></div>
<div><span class="ln">4</span>&nbsp;&nbsp;goal<span class="op">:</span> <span class="str">"Full-Stack Developer"</span><span class="op">,</span></div>
<div><span class="ln">5</span>&nbsp;&nbsp;skills<span class="op">:</span> <span class="op">[]</span></div>
<div><span class="ln">6</span><span class="op">};</span></div>
<div><span class="ln">7</span></div>
<div><span class="ln">8</span><span class="kw">async function</span> <span class="fn">bootcamp</span><span class="op">(</span><span class="vr">s</span><span class="op">) {</span></div>
<div><span class="ln">9</span>&nbsp;&nbsp;<span class="vr">s</span>.skills <span class="op">=</span> <span class="op">[</span><span class="str">"React"</span><span class="op">,</span> <span class="str">"Node"</span><span class="op">];</span></div>
<div><span class="ln">10</span>&nbsp;&nbsp;<span class="kw">return</span> <span class="fn">dreamJob</span><span class="op">(</span><span class="vr">s</span><span class="op">);</span></div>
<div><span class="ln">11</span><span class="op">}</span></div>
<div><span class="ln">12</span></div>
<div><span class="ln">13</span><span class="fn">bootcamp</span><span class="op">(</span><span class="vr">student</span><span class="op">);</span><span class="typing"></span></div>
</div>
</div>
<div class="floating-badge badge-1"><div class="badge-icon" style="background:#dcfce7;color:#16a34a">✓</div><div class="badge-text"><strong>Job Guarantee</strong><span>Or your money back</span></div></div>
<div class="floating-badge badge-2"><div class="badge-icon" style="background:#dbeafe;color:#2563eb">🚀</div><div class="badge-text"><strong>Next Cohort</strong><span>Starts March 1</span></div></div>
</div>
</div>
</body></html>`,
    dark: `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Space Grotesk',sans-serif;width:1200px;height:630px;background:#000;overflow:hidden}
.split{display:grid;grid-template-columns:1fr 1fr;height:100%}
.left{padding:48px;display:flex;flex-direction:column;justify-content:center;background:#000}
.right{background:#0a0a0a;position:relative;overflow:hidden;border-left:1px solid #1e1e1e}
.nav{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:24px 48px}
.logo{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:#10b981;display:flex;align-items:center;gap:8px}
.nav-links{display:flex;gap:24px}
.nav-link{font-size:14px;color:#6b7280;font-weight:500}
.badge{display:inline-flex;align-items:center;gap:8px;background:#064e3b;color:#10b981;padding:8px 16px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;margin-bottom:24px;width:fit-content}
h1{font-size:52px;font-weight:700;color:#f0fdf4;line-height:1.05;margin-bottom:20px}
h1 span{color:#10b981}
.subtitle{font-size:18px;color:#6b7280;line-height:1.7;margin-bottom:32px;max-width:480px}
.stats{display:flex;gap:32px;margin-bottom:32px}
.stat-value{font-family:'JetBrains Mono',monospace;font-size:32px;font-weight:700;color:#10b981}
.stat-label{font-size:13px;color:#4b5563}
.ctas{display:flex;gap:16px}
.btn-primary{background:#10b981;color:#000;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px}
.btn-outline{border:2px solid #10b981;color:#10b981;padding:12px 26px;border-radius:8px;font-weight:600;font-size:15px}
.code-window{position:absolute;top:80px;left:40px;right:40px;bottom:40px;background:#0f0f0f;border-radius:12px;border:1px solid #1e1e1e;overflow:hidden}
.code-header{background:#161616;padding:12px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #1e1e1e}
.code-dot{width:12px;height:12px;border-radius:50%}
.code-title{color:#4b5563;font-size:12px;margin-left:auto;font-family:'JetBrains Mono',monospace}
.code-body{padding:24px;font-family:'JetBrains Mono',monospace;font-size:14px;line-height:2}
.ln{color:#3b3b3b;width:32px;display:inline-block}
.kw{color:#c084fc}
.fn{color:#22d3ee}
.str{color:#fbbf24}
.cm{color:#4b5563;font-style:italic}
.vr{color:#f472b6}
.op{color:#6b7280}
.typing{display:inline-block;width:8px;height:18px;background:#10b981;animation:blink 1s infinite;vertical-align:middle}
@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
.floating-badge{position:absolute;background:#161616;border-radius:10px;padding:12px 16px;box-shadow:0 10px 40px rgba(0,0,0,0.5);display:flex;align-items:center;gap:10px;border:1px solid #262626}
.badge-1{bottom:60px;left:20px}
.badge-2{top:60px;right:20px}
.badge-icon{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px}
.badge-text{font-size:12px}
.badge-text strong{display:block;color:#f0fdf4;font-weight:600}
.badge-text span{color:#6b7280}
</style></head><body>
<nav class="nav"><div class="logo">&lt;CodeCraft/&gt;</div><div class="nav-links"><span class="nav-link">Programs</span><span class="nav-link">Outcomes</span><span class="nav-link">Apply</span></div></nav>
<div class="split">
<div class="left">
<div class="badge">// 92% JOB PLACEMENT RATE</div>
<h1>Launch Your<br/><span>Tech Career</span><br/>in 12 Weeks</h1>
<p class="subtitle">Intensive coding bootcamp with hands-on projects, career coaching, and job placement support.</p>
<div class="stats"><div><div class="stat-value">$85K</div><div class="stat-label">Avg starting salary</div></div><div><div class="stat-value">500+</div><div class="stat-label">Graduates hired</div></div></div>
<div class="ctas"><div class="btn-primary">Apply Now →</div><div class="btn-outline">Download Syllabus</div></div>
</div>
<div class="right">
<div class="code-window">
<div class="code-header"><div class="code-dot" style="background:#ef4444"></div><div class="code-dot" style="background:#fbbf24"></div><div class="code-dot" style="background:#22c55e"></div><span class="code-title">career.js</span></div>
<div class="code-body">
<div><span class="ln">1</span><span class="cm">// Your journey starts here</span></div>
<div><span class="ln">2</span><span class="kw">const</span> <span class="vr">student</span> <span class="op">=</span> <span class="op">{</span></div>
<div><span class="ln">3</span>&nbsp;&nbsp;name<span class="op">:</span> <span class="str">"You"</span><span class="op">,</span></div>
<div><span class="ln">4</span>&nbsp;&nbsp;goal<span class="op">:</span> <span class="str">"Full-Stack Developer"</span><span class="op">,</span></div>
<div><span class="ln">5</span>&nbsp;&nbsp;skills<span class="op">:</span> <span class="op">[]</span></div>
<div><span class="ln">6</span><span class="op">};</span></div>
<div><span class="ln">7</span></div>
<div><span class="ln">8</span><span class="kw">async function</span> <span class="fn">bootcamp</span><span class="op">(</span><span class="vr">s</span><span class="op">) {</span></div>
<div><span class="ln">9</span>&nbsp;&nbsp;<span class="vr">s</span>.skills <span class="op">=</span> <span class="op">[</span><span class="str">"React"</span><span class="op">,</span> <span class="str">"Node"</span><span class="op">];</span></div>
<div><span class="ln">10</span>&nbsp;&nbsp;<span class="kw">return</span> <span class="fn">dreamJob</span><span class="op">(</span><span class="vr">s</span><span class="op">);</span></div>
<div><span class="ln">11</span><span class="op">}</span></div>
<div><span class="ln">12</span></div>
<div><span class="ln">13</span><span class="fn">bootcamp</span><span class="op">(</span><span class="vr">student</span><span class="op">);</span><span class="typing"></span></div>
</div>
</div>
<div class="floating-badge badge-1"><div class="badge-icon" style="background:#064e3b;color:#10b981">✓</div><div class="badge-text"><strong>Job Guarantee</strong><span>Or your money back</span></div></div>
<div class="floating-badge badge-2"><div class="badge-icon" style="background:#1e3a8a;color:#3b82f6">🚀</div><div class="badge-text"><strong>Next Cohort</strong><span>Starts March 1</span></div></div>
</div>
</div>
</body></html>`
  },
};

// Generate for remaining templates (simplified for time)
const simpleTemplate = (name, color, colorDark, icon, subtitle, stat1, stat2, isDark) => {
  const bg = isDark ? '#0f172a' : '#fff';
  const text = isDark ? '#f8fafc' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const accent = isDark ? color + '40' : color + '15';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;width:1200px;height:630px;background:${bg};overflow:hidden}.container{height:100%;display:grid;grid-template-rows:auto 1fr}.nav{display:flex;justify-content:space-between;align-items:center;padding:24px 48px;border-bottom:1px solid ${isDark?'#1e293b':'#f1f5f9'}}.logo{font-size:20px;font-weight:700;color:${text};display:flex;align-items:center;gap:10px}.logo-icon{width:32px;height:32px;background:${color};border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px}.hero{display:grid;grid-template-columns:1.1fr 1fr;gap:64px;padding:48px;align-items:center}.eyebrow{display:inline-flex;align-items:center;gap:8px;background:${accent};color:${color};padding:8px 16px;border-radius:100px;font-size:13px;font-weight:600;margin-bottom:24px}h1{font-size:48px;font-weight:800;color:${text};line-height:1.1;margin-bottom:20px}h1 span{color:${color}}.subtitle{font-size:17px;color:${muted};line-height:1.7;margin-bottom:32px}.ctas{display:flex;gap:16px;margin-bottom:40px}.btn{background:${color};color:#fff;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px}.btn-ghost{color:${color};padding:14px 28px;font-weight:600}.metrics{display:flex;gap:40px;padding-top:32px;border-top:1px solid ${isDark?'#1e293b':'#e2e8f0'}}.metric-val{font-size:28px;font-weight:700;color:${text}}.metric-lbl{font-size:13px;color:${muted}}.visual{background:${isDark?'#1e293b':'#f8fafc'};border-radius:20px;height:100%;display:flex;align-items:center;justify-content:center;position:relative;border:1px solid ${isDark?'#334155':'#e2e8f0'}}.card{background:${bg};border-radius:16px;padding:32px;width:85%;box-shadow:0 20px 40px rgba(0,0,0,${isDark?'0.3':'0.08'});border:1px solid ${isDark?'#334155':'#e2e8f0'}}.card-head{display:flex;gap:16px;margin-bottom:20px}.card-avatar{width:56px;height:56px;background:linear-gradient(135deg,${color},${colorDark});border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px}.card-title{font-size:18px;font-weight:700;color:${text}}.card-sub{color:${muted};font-size:14px}.card-features{display:flex;flex-direction:column;gap:12px}.feature{display:flex;align-items:center;gap:12px;padding:12px;background:${isDark?'#0f172a':'#fff'};border-radius:10px;border:1px solid ${isDark?'#334155':'#e2e8f0'}}.feature-icon{width:32px;height:32px;background:${accent};border-radius:8px;display:flex;align-items:center;justify-content:center;color:${color}}.feature-text{font-size:14px;color:${text};font-weight:500}</style></head><body>
<div class="container"><nav class="nav"><div class="logo"><div class="logo-icon">${icon}</div>${name}</div></nav>
<div class="hero"><div><div class="eyebrow">⭐ Trusted by thousands</div><h1>Professional <span>${name}</span> Services</h1><p class="subtitle">${subtitle}</p><div class="ctas"><div class="btn">Get Started →</div><div class="btn-ghost">Learn More</div></div><div class="metrics"><div><div class="metric-val">${stat1}</div><div class="metric-lbl">Happy clients</div></div><div><div class="metric-val">${stat2}</div><div class="metric-lbl">5-star reviews</div></div></div></div>
<div class="visual"><div class="card"><div class="card-head"><div class="card-avatar">${icon}</div><div><div class="card-title">${name}</div><div class="card-sub">Premium Services</div></div></div><div class="card-features"><div class="feature"><div class="feature-icon">✓</div><span class="feature-text">Personalized approach</span></div><div class="feature"><div class="feature-icon">⭐</div><span class="feature-text">Expert guidance</span></div><div class="feature"><div class="feature-icon">🎯</div><span class="feature-text">Results guaranteed</span></div></div></div></div></div></div></body></html>`;
};

const templates = {
  'academic-tutor': { name: 'Dr. Sarah Chen', color: '#3b82f6', colorDark: '#1d4ed8', icon: '📚', subtitle: 'Expert 1-on-1 tutoring for SAT prep, calculus, and academic success. Helping students achieve their goals since 2015.', stat1: '500+', stat2: '4.9' },
  'fitness-coach': { name: 'FitLife Pro', color: '#ef4444', colorDark: '#dc2626', icon: '💪', subtitle: 'Transform your body and mindset with personalized training programs and nutrition coaching.', stat1: '1000+', stat2: '4.9' },
  'beauty-stylist': { name: 'Bella Beauty', color: '#ec4899', colorDark: '#db2777', icon: '✨', subtitle: 'Luxury hair styling, makeup artistry, and beauty treatments in an elegant salon experience.', stat1: '5000+', stat2: '4.8' },
  'coach-pro': { name: 'James Mitchell', color: '#14b8a6', colorDark: '#0d9488', icon: '🎯', subtitle: 'Executive coaching for high achievers. Unlock your potential and transform your career.', stat1: '500+', stat2: '4.9' },
  'language-teacher': { name: 'Maria García', color: '#f59e0b', colorDark: '#d97706', icon: '🌍', subtitle: 'Learn Spanish, French, or English through immersive conversation practice with a native speaker.', stat1: '1000+', stat2: '4.9' },
  'music-teacher': { name: 'Jennifer Walsh', color: '#8b5cf6', colorDark: '#7c3aed', icon: '🎵', subtitle: 'Piano, guitar, and voice lessons for all ages. Discover the joy of making music.', stat1: '300+', stat2: '4.9' },
  'workshop-host': { name: 'Workshop Hub', color: '#6366f1', colorDark: '#4f46e5', icon: '🎤', subtitle: 'Transform teams through immersive workshops on leadership, design thinking, and innovation.', stat1: '200+', stat2: '4.8' },
  'therapist-care': { name: 'Mindful Therapy', color: '#22c55e', colorDark: '#16a34a', icon: '💚', subtitle: 'Compassionate mental health support in a safe, confidential environment. Online & in-person.', stat1: '1000+', stat2: '4.9' },
  'creative-portfolio': { name: 'Studio Noir', color: '#fbbf24', colorDark: '#f59e0b', icon: '🎨', subtitle: 'Bold visual storytelling through photography, design, and creative direction.', stat1: '100+', stat2: '5.0' },
  'wellness-holistic': { name: 'Harmony Wellness', color: '#2dd4bf', colorDark: '#14b8a6', icon: '🧘', subtitle: 'Integrative wellness combining ancient wisdom with modern science for whole-body healing.', stat1: '800+', stat2: '4.9' },
};

for (const [slug, t] of Object.entries(templates)) {
  if (!designs[slug]) {
    designs[slug] = {
      light: simpleTemplate(t.name, t.color, t.colorDark, t.icon, t.subtitle, t.stat1, t.stat2, false),
      dark: simpleTemplate(t.name, t.color, t.colorDark, t.icon, t.subtitle, t.stat1, t.stat2, true)
    };
  }
}

async function main() {
  console.log('Creating premium thumbnails...\n');
  const browser = await chromium.launch();
  const DIST_DIR = path.resolve(__dirname, '../showcase/dist/api/templates');
  
  for (const [slug, design] of Object.entries(designs)) {
    const templateDir = path.join(TEMPLATES_DIR, slug);
    if (!fs.existsSync(templateDir)) continue;
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1200, height: 630 });
    
    // Light
    await page.setContent(design.light);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(templateDir, 'thumbnail-light.png') });
    fs.copyFileSync(path.join(templateDir, 'thumbnail-light.png'), path.join(templateDir, 'thumbnail.png'));
    
    // Also copy to dist for serving
    const distDir = path.join(DIST_DIR, slug);
    if (fs.existsSync(distDir)) {
      fs.copyFileSync(path.join(templateDir, 'thumbnail.png'), path.join(distDir, 'thumbnail'));
    }
    
    // Dark
    await page.setContent(design.dark);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(templateDir, 'thumbnail-dark.png') });
    
    console.log(`✓ ${slug}`);
    await page.close();
  }
  
  await browser.close();
  console.log('\n✅ Premium thumbnails complete!');
}

main();
