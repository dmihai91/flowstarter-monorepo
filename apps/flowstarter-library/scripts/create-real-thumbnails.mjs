import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

// Each template has a COMPLETELY DIFFERENT design layout
const templateHTML = {
  'edu-course-creator': (dark) => `
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Plus Jakarta Sans', sans-serif; width: 1200px; height: 630px; background: ${dark ? '#0c0f1a' : '#fafbff'}; overflow: hidden; }
.nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 48px; }
.logo { font-weight: 700; font-size: 20px; color: ${dark ? '#fff' : '#1a1a2e'}; display: flex; align-items: center; gap: 8px; }
.logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; }
.nav-links { display: flex; gap: 32px; }
.nav-link { font-size: 14px; color: ${dark ? '#94a3b8' : '#64748b'}; text-decoration: none; font-weight: 500; }
.hero { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; padding: 40px 48px; height: calc(100% - 72px); }
.hero-content { display: flex; flex-direction: column; justify-content: center; }
.badge { display: inline-flex; align-items: center; gap: 8px; background: ${dark ? '#1e1b4b' : '#eef2ff'}; color: #6366f1; padding: 8px 16px; border-radius: 50px; font-size: 13px; font-weight: 600; margin-bottom: 24px; width: fit-content; }
h1 { font-size: 52px; font-weight: 800; color: ${dark ? '#f8fafc' : '#0f172a'}; line-height: 1.1; margin-bottom: 20px; }
h1 span { background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.subtitle { font-size: 18px; color: ${dark ? '#94a3b8' : '#64748b'}; line-height: 1.6; margin-bottom: 32px; }
.cta-row { display: flex; gap: 16px; }
.btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 15px; }
.btn-secondary { background: ${dark ? '#1e293b' : '#f1f5f9'}; color: ${dark ? '#f8fafc' : '#334155'}; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 15px; }
.hero-visual { display: flex; align-items: center; justify-content: center; }
.course-cards { display: flex; flex-direction: column; gap: 16px; transform: perspective(1000px) rotateY(-5deg); }
.course-card { background: ${dark ? '#1e293b' : '#fff'}; border-radius: 16px; padding: 20px; display: flex; gap: 16px; box-shadow: 0 4px 24px rgba(0,0,0,${dark ? '0.3' : '0.08'}); border: 1px solid ${dark ? '#334155' : '#e2e8f0'}; width: 400px; }
.card-thumb { width: 80px; height: 60px; border-radius: 8px; background: linear-gradient(135deg, #6366f1, #a855f7); }
.card-content { flex: 1; }
.card-title { font-weight: 600; color: ${dark ? '#f8fafc' : '#0f172a'}; font-size: 14px; margin-bottom: 4px; }
.card-meta { font-size: 12px; color: ${dark ? '#64748b' : '#94a3b8'}; }
.card-progress { height: 4px; background: ${dark ? '#334155' : '#e2e8f0'}; border-radius: 2px; margin-top: 8px; }
.card-progress-bar { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 2px; }
</style>
</head>
<body>
<nav class="nav">
  <div class="logo"><div class="logo-icon"></div>LearnHub</div>
  <div class="nav-links"><a class="nav-link">Courses</a><a class="nav-link">Pricing</a><a class="nav-link">About</a></div>
</nav>
<div class="hero">
  <div class="hero-content">
    <div class="badge">🎓 #1 Online Learning Platform</div>
    <h1>Master New Skills with <span>Expert-Led Courses</span></h1>
    <p class="subtitle">Join 50,000+ students learning design, development, and business from industry professionals.</p>
    <div class="cta-row">
      <div class="btn-primary">Browse Courses</div>
      <div class="btn-secondary">Start Free Trial</div>
    </div>
  </div>
  <div class="hero-visual">
    <div class="course-cards">
      <div class="course-card"><div class="card-thumb"></div><div class="card-content"><div class="card-title">Complete Web Development</div><div class="card-meta">24 lessons • 12 hours</div><div class="card-progress"><div class="card-progress-bar" style="width: 65%"></div></div></div></div>
      <div class="course-card"><div class="card-thumb" style="background: linear-gradient(135deg, #f59e0b, #ef4444);"></div><div class="card-content"><div class="card-title">UI/UX Design Fundamentals</div><div class="card-meta">18 lessons • 8 hours</div><div class="card-progress"><div class="card-progress-bar" style="width: 35%; background: linear-gradient(90deg, #f59e0b, #ef4444);"></div></div></div></div>
      <div class="course-card"><div class="card-thumb" style="background: linear-gradient(135deg, #10b981, #06b6d4);"></div><div class="card-content"><div class="card-title">Digital Marketing Strategy</div><div class="card-meta">32 lessons • 16 hours</div><div class="card-progress"><div class="card-progress-bar" style="width: 80%; background: linear-gradient(90deg, #10b981, #06b6d4);"></div></div></div></div>
    </div>
  </div>
</div>
</body></html>`,

  'academic-tutor': (dark) => `
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', sans-serif; width: 1200px; height: 630px; background: ${dark ? '#0f172a' : '#fff'}; overflow: hidden; }
.nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 48px; border-bottom: 1px solid ${dark ? '#1e293b' : '#f1f5f9'}; }
.logo { font-family: 'DM Serif Display', serif; font-size: 24px; color: ${dark ? '#f8fafc' : '#0f172a'}; }
.nav-links { display: flex; gap: 32px; align-items: center; }
.nav-link { font-size: 14px; color: ${dark ? '#94a3b8' : '#64748b'}; font-weight: 500; }
.btn-nav { background: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; }
.hero { display: flex; padding: 48px; gap: 64px; height: calc(100% - 73px); }
.hero-left { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.trust-badges { display: flex; gap: 24px; margin-bottom: 24px; }
.trust-badge { display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${dark ? '#94a3b8' : '#64748b'}; }
.trust-icon { width: 20px; height: 20px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; }
h1 { font-family: 'DM Serif Display', serif; font-size: 56px; color: ${dark ? '#f8fafc' : '#0f172a'}; line-height: 1.1; margin-bottom: 20px; }
.subtitle { font-size: 18px; color: ${dark ? '#94a3b8' : '#64748b'}; line-height: 1.7; margin-bottom: 32px; }
.cta-row { display: flex; gap: 16px; align-items: center; }
.btn-primary { background: #3b82f6; color: white; padding: 16px 32px; border-radius: 10px; font-weight: 600; }
.btn-link { color: #3b82f6; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.hero-right { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; }
.tutor-card { background: ${dark ? '#1e293b' : '#f8fafc'}; border-radius: 24px; padding: 32px; width: 360px; border: 1px solid ${dark ? '#334155' : '#e2e8f0'}; }
.tutor-header { display: flex; gap: 16px; margin-bottom: 24px; }
.tutor-avatar { width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 700; }
.tutor-info h3 { font-weight: 600; color: ${dark ? '#f8fafc' : '#0f172a'}; font-size: 18px; }
.tutor-info p { color: ${dark ? '#94a3b8' : '#64748b'}; font-size: 14px; }
.tutor-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
.stat { background: ${dark ? '#0f172a' : '#fff'}; padding: 16px; border-radius: 12px; text-align: center; }
.stat-value { font-size: 24px; font-weight: 700; color: ${dark ? '#f8fafc' : '#0f172a'}; }
.stat-label { font-size: 12px; color: ${dark ? '#64748b' : '#94a3b8'}; }
.tutor-subjects { display: flex; flex-wrap: wrap; gap: 8px; }
.subject { background: ${dark ? '#1e40af20' : '#dbeafe'}; color: #3b82f6; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.floating-badge { position: absolute; background: ${dark ? '#1e293b' : '#fff'}; border-radius: 12px; padding: 12px 16px; box-shadow: 0 4px 24px rgba(0,0,0,${dark ? '0.4' : '0.1'}); display: flex; align-items: center; gap: 10px; }
.badge-1 { top: 20px; right: 20px; }
.badge-2 { bottom: 40px; left: 0; }
.badge-icon { width: 36px; height: 36px; background: #10b981; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; }
.badge-text { font-size: 13px; }
.badge-text strong { display: block; color: ${dark ? '#f8fafc' : '#0f172a'}; }
.badge-text span { color: ${dark ? '#94a3b8' : '#64748b'}; font-size: 11px; }
</style>
</head>
<body>
<nav class="nav">
  <div class="logo">Dr. Sarah Chen</div>
  <div class="nav-links"><span class="nav-link">About</span><span class="nav-link">Subjects</span><span class="nav-link">Testimonials</span><div class="btn-nav">Book Session</div></div>
</nav>
<div class="hero">
  <div class="hero-left">
    <div class="trust-badges">
      <div class="trust-badge"><div class="trust-icon">✓</div>Harvard Graduate</div>
      <div class="trust-badge"><div class="trust-icon">★</div>4.9 Rating</div>
    </div>
    <h1>Expert Academic Tutoring</h1>
    <p class="subtitle">Personalized 1-on-1 tutoring for SAT prep, calculus, chemistry, and more. Helping students achieve their academic goals since 2015.</p>
    <div class="cta-row">
      <div class="btn-primary">Book Free Consultation</div>
      <div class="btn-link">View Success Stories →</div>
    </div>
  </div>
  <div class="hero-right">
    <div class="tutor-card">
      <div class="tutor-header">
        <div class="tutor-avatar">SC</div>
        <div class="tutor-info"><h3>Dr. Sarah Chen</h3><p>PhD Mathematics, Harvard</p></div>
      </div>
      <div class="tutor-stats">
        <div class="stat"><div class="stat-value">500+</div><div class="stat-label">Students</div></div>
        <div class="stat"><div class="stat-value">150pt</div><div class="stat-label">Avg SAT Increase</div></div>
      </div>
      <div class="tutor-subjects">
        <span class="subject">SAT Prep</span><span class="subject">Calculus</span><span class="subject">Chemistry</span><span class="subject">Physics</span>
      </div>
    </div>
    <div class="floating-badge badge-1"><div class="badge-icon">✓</div><div class="badge-text"><strong>98% Pass Rate</strong><span>Verified Results</span></div></div>
    <div class="floating-badge badge-2"><div class="badge-icon" style="background:#f59e0b;">★</div><div class="badge-text"><strong>Top Rated</strong><span>500+ 5-star reviews</span></div></div>
  </div>
</div>
</body></html>`,

  'coding-bootcamp': (dark) => `
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Space Grotesk', sans-serif; width: 1200px; height: 630px; background: ${dark ? '#000' : '#f0fdf4'}; overflow: hidden; }
.terminal-dots { position: absolute; top: 16px; left: 16px; display: flex; gap: 6px; }
.dot { width: 12px; height: 12px; border-radius: 50%; }
.nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 48px; }
.logo { font-weight: 700; font-size: 20px; color: ${dark ? '#10b981' : '#065f46'}; font-family: 'JetBrains Mono', monospace; }
.nav-links { display: flex; gap: 32px; }
.nav-link { font-size: 14px; color: ${dark ? '#a7f3d0' : '#064e3b'}; font-weight: 500; opacity: 0.8; }
.hero { display: grid; grid-template-columns: 1fr 1fr; height: calc(100% - 68px); }
.hero-left { padding: 48px; display: flex; flex-direction: column; justify-content: center; background: ${dark ? '#000' : '#f0fdf4'}; }
.badge { display: inline-flex; align-items: center; gap: 8px; background: ${dark ? '#064e3b' : '#d1fae5'}; color: #10b981; padding: 6px 14px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 12px; margin-bottom: 24px; width: fit-content; }
h1 { font-size: 48px; font-weight: 700; color: ${dark ? '#f0fdf4' : '#064e3b'}; line-height: 1.1; margin-bottom: 20px; }
h1 span { color: #10b981; }
.subtitle { font-size: 18px; color: ${dark ? '#a7f3d0' : '#047857'}; line-height: 1.6; margin-bottom: 32px; opacity: 0.9; }
.stats-row { display: flex; gap: 32px; margin-bottom: 32px; }
.stat { display: flex; flex-direction: column; }
.stat-value { font-size: 32px; font-weight: 700; color: #10b981; font-family: 'JetBrains Mono', monospace; }
.stat-label { font-size: 13px; color: ${dark ? '#a7f3d0' : '#065f46'}; opacity: 0.7; }
.cta-row { display: flex; gap: 16px; }
.btn-primary { background: #10b981; color: #000; padding: 16px 32px; border-radius: 8px; font-weight: 600; }
.btn-secondary { border: 2px solid #10b981; color: #10b981; padding: 14px 30px; border-radius: 8px; font-weight: 600; }
.hero-right { background: ${dark ? '#0f172a' : '#064e3b'}; position: relative; overflow: hidden; }
.code-window { position: absolute; top: 40px; left: 40px; right: 40px; bottom: 40px; background: ${dark ? '#000' : '#022c22'}; border-radius: 12px; border: 1px solid ${dark ? '#1e293b' : '#065f46'}; }
.code-header { padding: 12px 16px; border-bottom: 1px solid ${dark ? '#1e293b' : '#065f46'}; display: flex; gap: 8px; }
.code-dot { width: 12px; height: 12px; border-radius: 50%; }
.code-content { padding: 20px; font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.8; }
.code-line { display: flex; gap: 16px; }
.line-num { color: ${dark ? '#475569' : '#a7f3d0'}; opacity: 0.5; width: 24px; }
.keyword { color: #c084fc; }
.string { color: #fbbf24; }
.function { color: #22d3ee; }
.comment { color: #6b7280; font-style: italic; }
.variable { color: #f472b6; }
.normal { color: ${dark ? '#e2e8f0' : '#d1fae5'}; }
</style>
</head>
<body>
<nav class="nav">
  <div class="logo">&lt;CodeCraft/&gt;</div>
  <div class="nav-links"><span class="nav-link">Programs</span><span class="nav-link">Outcomes</span><span class="nav-link">Apply</span></div>
</nav>
<div class="hero">
  <div class="hero-left">
    <div class="badge">// 92% JOB PLACEMENT</div>
    <h1>Launch Your <span>Tech Career</span> in 12 Weeks</h1>
    <p class="subtitle">Intensive, hands-on coding bootcamp with real projects and career support. Go from zero to developer.</p>
    <div class="stats-row">
      <div class="stat"><div class="stat-value">$85K</div><div class="stat-label">Avg Starting Salary</div></div>
      <div class="stat"><div class="stat-value">500+</div><div class="stat-label">Graduates Hired</div></div>
    </div>
    <div class="cta-row">
      <div class="btn-primary">Apply Now →</div>
      <div class="btn-secondary">Download Syllabus</div>
    </div>
  </div>
  <div class="hero-right">
    <div class="code-window">
      <div class="code-header"><div class="code-dot" style="background:#ef4444;"></div><div class="code-dot" style="background:#fbbf24;"></div><div class="code-dot" style="background:#22c55e;"></div></div>
      <div class="code-content">
        <div class="code-line"><span class="line-num">1</span><span class="comment">// Your first app</span></div>
        <div class="code-line"><span class="line-num">2</span><span class="keyword">const</span> <span class="variable">student</span> <span class="normal">= {</span></div>
        <div class="code-line"><span class="line-num">3</span><span class="normal">  name:</span> <span class="string">"You"</span><span class="normal">,</span></div>
        <div class="code-line"><span class="line-num">4</span><span class="normal">  goal:</span> <span class="string">"Full-Stack Dev"</span></div>
        <div class="code-line"><span class="line-num">5</span><span class="normal">};</span></div>
        <div class="code-line"><span class="line-num">6</span></div>
        <div class="code-line"><span class="line-num">7</span><span class="function">launchCareer</span><span class="normal">(student);</span></div>
      </div>
    </div>
  </div>
</div>
</body></html>`,

  'fitness-coach': (dark) => `
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', sans-serif; width: 1200px; height: 630px; background: ${dark ? '#0f0f0f' : '#fff'}; overflow: hidden; }
.nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 48px; position: absolute; top: 0; left: 0; right: 0; z-index: 10; }
.logo { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #fff; letter-spacing: 2px; }
.nav-links { display: flex; gap: 32px; }
.nav-link { font-size: 14px; color: rgba(255,255,255,0.8); font-weight: 500; }
.hero { display: grid; grid-template-columns: 1fr 1fr; height: 100%; }
.hero-left { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 120px 48px 48px; display: flex; flex-direction: column; justify-content: center; }
h1 { font-family: 'Bebas Neue', sans-serif; font-size: 72px; color: #fff; line-height: 0.9; margin-bottom: 24px; letter-spacing: 2px; }
.subtitle { font-size: 18px; color: rgba(255,255,255,0.9); line-height: 1.6; margin-bottom: 40px; }
.cta-row { display: flex; gap: 16px; }
.btn-primary { background: #fff; color: #ef4444; padding: 16px 32px; border-radius: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; }
.btn-secondary { border: 2px solid #fff; color: #fff; padding: 14px 30px; border-radius: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; }
.hero-right { background: ${dark ? '#1a1a1a' : '#f8f8f8'}; position: relative; display: flex; align-items: center; justify-content: center; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; padding: 48px; }
.stat-card { background: ${dark ? '#262626' : '#fff'}; border-radius: 16px; padding: 24px; text-align: center; }
.stat-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #ef4444, #f97316); border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; }
.stat-value { font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: ${dark ? '#fff' : '#0f0f0f'}; }
.stat-label { font-size: 13px; color: ${dark ? '#a3a3a3' : '#737373'}; text-transform: uppercase; letter-spacing: 1px; }
.accent-stripe { position: absolute; top: 0; right: 0; bottom: 0; width: 8px; background: linear-gradient(180deg, #ef4444, #f97316); }
</style>
</head>
<body>
<nav class="nav">
  <div class="logo">FITLIFE PRO</div>
  <div class="nav-links"><span class="nav-link">Programs</span><span class="nav-link">Trainers</span><span class="nav-link">Results</span></div>
</nav>
<div class="hero">
  <div class="hero-left">
    <h1>TRANSFORM<br/>YOUR BODY<br/>YOUR LIFE</h1>
    <p class="subtitle">Personal training and nutrition coaching designed to push your limits and achieve real, lasting results.</p>
    <div class="cta-row">
      <div class="btn-primary">Start Journey</div>
      <div class="btn-secondary">View Programs</div>
    </div>
  </div>
  <div class="hero-right">
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon">🔥</div><div class="stat-value">1000+</div><div class="stat-label">Lives Changed</div></div>
      <div class="stat-card"><div class="stat-icon">💪</div><div class="stat-value">12</div><div class="stat-label">Week Programs</div></div>
      <div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-value">4.9</div><div class="stat-label">Rating</div></div>
      <div class="stat-card"><div class="stat-icon">🏆</div><div class="stat-value">100%</div><div class="stat-label">Guarantee</div></div>
    </div>
    <div class="accent-stripe"></div>
  </div>
</div>
</body></html>`,

  'beauty-stylist': (dark) => `
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Montserrat', sans-serif; width: 1200px; height: 630px; background: ${dark ? '#1a1a1a' : '#fff9f9'}; overflow: hidden; }
.nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 48px; }
.logo { font-family: 'Cormorant Garamond', serif; font-size: 28px; color: ${dark ? '#fce7f3' : '#831843'}; font-weight: 600; }
.nav-links { display: flex; gap: 32px; }
.nav-link { font-size: 12px; color: ${dark ? '#f9a8d4' : '#9d174d'}; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; }
.hero { display: grid; grid-template-columns: 1.2fr 1fr; height: calc(100% - 68px); }
.hero-left { background: ${dark ? '#1a1a1a' : '#fff9f9'}; padding: 32px 48px; display: flex; flex-direction: column; justify-content: center; }
.badge { display: inline-block; background: linear-gradient(135deg, #f472b6, #ec4899); color: white; padding: 8px 20px; border-radius: 50px; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px; }
h1 { font-family: 'Cormorant Garamond', serif; font-size: 64px; color: ${dark ? '#fce7f3' : '#831843'}; line-height: 1.0; margin-bottom: 20px; font-weight: 500; }
.subtitle { font-size: 16px; color: ${dark ? '#f9a8d4' : '#9d174d'}; line-height: 1.8; margin-bottom: 40px; }
.cta-row { display: flex; gap: 16px; }
.btn-primary { background: linear-gradient(135deg, #f472b6, #ec4899); color: white; padding: 16px 40px; border-radius: 50px; font-weight: 600; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; }
.btn-secondary { border: 2px solid ${dark ? '#f472b6' : '#ec4899'}; color: ${dark ? '#f472b6' : '#ec4899'}; padding: 14px 38px; border-radius: 50px; font-weight: 600; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; }
.hero-right { background: ${dark ? '#2d2d2d' : '#fdf2f8'}; position: relative; display: flex; align-items: center; justify-content: center; }
.service-cards { display: flex; flex-direction: column; gap: 16px; }
.service-card { background: ${dark ? '#1a1a1a' : '#fff'}; border-radius: 16px; padding: 20px 24px; display: flex; align-items: center; gap: 16px; width: 320px; border: 1px solid ${dark ? '#404040' : '#fce7f3'}; }
.service-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #f472b6, #ec4899); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; }
.service-info h4 { font-weight: 600; color: ${dark ? '#fce7f3' : '#831843'}; font-size: 15px; margin-bottom: 4px; }
.service-info p { font-size: 12px; color: ${dark ? '#f9a8d4' : '#9d174d'}; }
.decorative-circle { position: absolute; width: 300px; height: 300px; border: 1px solid ${dark ? '#f472b640' : '#f472b640'}; border-radius: 50%; }
.circle-1 { top: -100px; right: -100px; }
.circle-2 { bottom: -50px; left: -50px; width: 200px; height: 200px; }
</style>
</head>
<body>
<nav class="nav">
  <div class="logo">Bella Beauty</div>
  <div class="nav-links"><span class="nav-link">Services</span><span class="nav-link">Gallery</span><span class="nav-link">Book</span></div>
</nav>
<div class="hero">
  <div class="hero-left">
    <div class="badge">Award-Winning Studio</div>
    <h1>Elevate Your<br/>Natural Beauty</h1>
    <p class="subtitle">Experience luxury hair styling, makeup artistry, and beauty treatments in our elegant salon.</p>
    <div class="cta-row">
      <div class="btn-primary">Book Now</div>
      <div class="btn-secondary">View Services</div>
    </div>
  </div>
  <div class="hero-right">
    <div class="decorative-circle circle-1"></div>
    <div class="decorative-circle circle-2"></div>
    <div class="service-cards">
      <div class="service-card"><div class="service-icon">✨</div><div class="service-info"><h4>Hair Styling</h4><p>Cuts, Color & Treatments</p></div></div>
      <div class="service-card"><div class="service-icon">💄</div><div class="service-info"><h4>Makeup Artistry</h4><p>Bridal & Special Events</p></div></div>
      <div class="service-card"><div class="service-icon">💅</div><div class="service-info"><h4>Nail Services</h4><p>Manicures & Pedicures</p></div></div>
    </div>
  </div>
</div>
</body></html>`,
};

// Generate remaining templates with similar unique designs
const remaining = ['coach-pro', 'language-teacher', 'music-teacher', 'workshop-host', 'therapist-care', 'creative-portfolio', 'wellness-holistic'];

// Simple fallback for templates not yet custom-designed
function genericTemplate(name, color1, color2, dark) {
  const bg = dark ? '#0f172a' : '#fff';
  const text = dark ? '#f8fafc' : '#0f172a';
  const muted = dark ? '#94a3b8' : '#64748b';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;width:1200px;height:630px;background:${bg};overflow:hidden}
.nav{display:flex;justify-content:space-between;align-items:center;padding:20px 48px}.logo{font-weight:700;font-size:20px;color:${text}}
.hero{display:grid;grid-template-columns:1fr 1fr;gap:48px;padding:48px;height:calc(100%-68px);align-items:center}
h1{font-size:52px;font-weight:800;color:${text};line-height:1.1;margin-bottom:20px}h1 span{color:${color1}}
.sub{font-size:18px;color:${muted};line-height:1.6;margin-bottom:32px}
.btn{background:${color1};color:white;padding:16px 32px;border-radius:12px;font-weight:600;display:inline-block}
.visual{background:linear-gradient(135deg,${color1}20,${color2}30);border-radius:24px;height:100%;display:flex;align-items:center;justify-content:center}
.card{background:${dark?'#1e293b':'#f8fafc'};border-radius:16px;padding:32px;width:80%;box-shadow:0 8px 32px rgba(0,0,0,${dark?0.3:0.08})}
.card-title{font-size:24px;font-weight:700;color:${text};margin-bottom:12px}.card-text{color:${muted};font-size:14px}
</style></head><body>
<nav class="nav"><div class="logo">${name}</div></nav>
<div class="hero"><div><h1>Professional <span>${name}</span> Services</h1><p class="sub">Transform your experience with our expert guidance and personalized approach.</p><div class="btn">Get Started</div></div>
<div class="visual"><div class="card"><div class="card-title">${name}</div><p class="card-text">Exceptional service tailored to your needs.</p></div></div></div>
</body></html>`;
}

templateHTML['coach-pro'] = (dark) => genericTemplate('Coach Pro', '#14b8a6', '#06b6d4', dark);
templateHTML['language-teacher'] = (dark) => genericTemplate('Language Academy', '#ec4899', '#f472b6', dark);
templateHTML['music-teacher'] = (dark) => genericTemplate('Music Studio', '#f59e0b', '#fbbf24', dark);
templateHTML['workshop-host'] = (dark) => genericTemplate('Workshop Hub', '#8b5cf6', '#a855f7', dark);
templateHTML['therapist-care'] = (dark) => genericTemplate('Wellness Therapy', '#22c55e', '#4ade80', dark);
templateHTML['creative-portfolio'] = (dark) => genericTemplate('Creative Studio', '#fbbf24', '#f59e0b', dark);
templateHTML['wellness-holistic'] = (dark) => genericTemplate('Holistic Wellness', '#2dd4bf', '#14b8a6', dark);

async function main() {
  console.log('Creating real website thumbnails...\n');
  const browser = await chromium.launch();
  
  for (const [slug, htmlFn] of Object.entries(templateHTML)) {
    const templateDir = path.join(TEMPLATES_DIR, slug);
    if (!fs.existsSync(templateDir)) {
      console.log(`⚠ Skipping ${slug} - not found`);
      continue;
    }
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1200, height: 630 });
    
    // Light
    await page.setContent(htmlFn(false));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(templateDir, 'thumbnail-light.png') });
    fs.copyFileSync(path.join(templateDir, 'thumbnail-light.png'), path.join(templateDir, 'thumbnail.png'));
    
    // Dark
    await page.setContent(htmlFn(true));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(templateDir, 'thumbnail-dark.png') });
    
    console.log(`✓ ${slug}`);
    await page.close();
  }
  
  await browser.close();
  console.log('\n✅ Done!');
}

main();
