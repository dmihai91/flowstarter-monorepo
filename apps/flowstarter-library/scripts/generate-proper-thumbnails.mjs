import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

// Template designs with full website mockup styling
const templateDesigns = {
  'academic-tutor': {
    primary: '#3b82f6',
    secondary: '#1e40af', 
    accent: '#dbeafe',
    name: 'Dr. Sarah Chen',
    tagline: 'Expert Academic Tutoring',
    headline: 'Unlock Your Academic Potential',
    subheadline: 'Personalized tutoring for SAT prep, calculus, and more',
    cta: 'Book a Session',
    stats: ['500+ Students', '150pt SAT Increase', '98% Pass Rate'],
    navItems: ['About', 'Services', 'Testimonials', 'Contact'],
    style: 'professional'
  },
  'workshop-host': {
    primary: '#8b5cf6',
    secondary: '#6d28d9',
    accent: '#ede9fe',
    name: 'Alex Rivera',
    tagline: 'Transform Through Learning',
    headline: 'Immersive Workshops That Inspire',
    subheadline: 'Leadership, design thinking, and team development',
    cta: 'View Workshops',
    stats: ['200+ Workshops', '10K Participants', '50+ Clients'],
    navItems: ['Programs', 'About', 'Schedule', 'Book'],
    style: 'creative'
  },
  'language-teacher': {
    primary: '#ec4899',
    secondary: '#be185d',
    accent: '#fce7f3',
    name: 'Maria García',
    tagline: 'Fluency Through Conversation',
    headline: 'Speak Confidently in Any Language',
    subheadline: 'Spanish, French, English lessons tailored to you',
    cta: 'Start Learning',
    stats: ['1000+ Students', '5 Languages', '95% Success'],
    navItems: ['Languages', 'Methods', 'Pricing', 'Book'],
    style: 'warm'
  },
  'coding-bootcamp': {
    primary: '#10b981',
    secondary: '#047857',
    accent: '#d1fae5',
    name: 'CodeCraft Academy',
    tagline: 'From Zero to Developer',
    headline: 'Launch Your Tech Career',
    subheadline: 'Intensive 12-week programs with job placement',
    cta: 'Apply Now',
    stats: ['500+ Hired', '92% Placement', '$85K Avg Salary'],
    navItems: ['Programs', 'Outcomes', 'Apply', 'FAQ'],
    style: 'tech'
  },
  'music-teacher': {
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#fef3c7',
    name: 'Jennifer Walsh',
    tagline: 'Music Studio',
    headline: 'Discover the Joy of Music',
    subheadline: 'Piano, guitar, and voice lessons for all ages',
    cta: 'Book Trial Lesson',
    stats: ['300+ Students', '20 Years Exp', '50+ Recitals'],
    navItems: ['Lessons', 'About', 'Recitals', 'Contact'],
    style: 'artistic'
  },
  'edu-course-creator': {
    primary: '#6366f1',
    secondary: '#4338ca',
    accent: '#e0e7ff',
    name: 'LearnHub',
    tagline: 'Education Reimagined',
    headline: 'Create Courses That Transform',
    subheadline: 'Build and sell online courses with ease',
    cta: 'Start Creating',
    stats: ['10K+ Courses', '1M Learners', '95% Satisfaction'],
    navItems: ['Features', 'Pricing', 'Examples', 'Start'],
    style: 'modern'
  },
  'coach-pro': {
    primary: '#14b8a6',
    secondary: '#0d9488',
    accent: '#ccfbf1',
    name: 'James Mitchell',
    tagline: 'Executive Coaching',
    headline: 'Unlock Your Full Potential',
    subheadline: 'Life and business coaching for high achievers',
    cta: 'Book Discovery Call',
    stats: ['500+ Clients', '15 Years', '4.9 Rating'],
    navItems: ['Programs', 'About', 'Results', 'Contact'],
    style: 'executive'
  },
  'fitness-coach': {
    primary: '#ef4444',
    secondary: '#dc2626',
    accent: '#fee2e2',
    name: 'FitLife Pro',
    tagline: 'Transform Your Body',
    headline: 'Get Fit, Stay Strong',
    subheadline: 'Personal training and nutrition coaching',
    cta: 'Start Your Journey',
    stats: ['1000+ Transformed', '12 Week Programs', '100% Results'],
    navItems: ['Programs', 'Trainers', 'Success Stories', 'Join'],
    style: 'energetic'
  },
  'therapist-care': {
    primary: '#22c55e',
    secondary: '#16a34a',
    accent: '#dcfce7',
    name: 'Mindful Therapy',
    tagline: 'Your Mental Wellness',
    headline: 'Find Peace and Clarity',
    subheadline: 'Compassionate therapy in a safe space',
    cta: 'Schedule Session',
    stats: ['Confidential', 'Licensed', 'Online & In-Person'],
    navItems: ['Services', 'About', 'Approach', 'Book'],
    style: 'calming'
  },
  'beauty-stylist': {
    primary: '#f472b6',
    secondary: '#db2777',
    accent: '#fce7f3',
    name: 'Bella Beauty',
    tagline: 'Style & Elegance',
    headline: 'Elevate Your Look',
    subheadline: 'Hair, makeup, and beauty transformations',
    cta: 'Book Appointment',
    stats: ['5000+ Clients', 'Award Winning', '10 Years'],
    navItems: ['Services', 'Gallery', 'Team', 'Book'],
    style: 'glamorous'
  },
  'creative-portfolio': {
    primary: '#fbbf24',
    secondary: '#f59e0b',
    accent: '#fef3c7',
    name: 'Studio Noir',
    tagline: 'Creative Direction',
    headline: 'Bold Ideas, Beautiful Execution',
    subheadline: 'Photography, design, and visual storytelling',
    cta: 'View Work',
    stats: ['100+ Projects', 'Global Clients', 'Award Winner'],
    navItems: ['Work', 'About', 'Services', 'Contact'],
    style: 'bold'
  },
  'wellness-holistic': {
    primary: '#2dd4bf',
    secondary: '#14b8a6',
    accent: '#ccfbf1',
    name: 'Harmony Wellness',
    tagline: 'Holistic Health',
    headline: 'Balance Mind, Body & Spirit',
    subheadline: 'Integrative wellness and natural healing',
    cta: 'Begin Your Journey',
    stats: ['Certified', 'Natural', 'Personalized'],
    navItems: ['Services', 'Philosophy', 'About', 'Book'],
    style: 'serene'
  }
};

function generateHTML(design, isDark = false) {
  const bg = isDark ? '#0f172a' : '#ffffff';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#1e293b' : '#f8fafc';
  const borderColor = isDark ? '#334155' : '#e2e8f0';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      width: 1200px;
      height: 630px;
      background: ${bg};
      overflow: hidden;
    }
    
    /* Navigation */
    .nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 50px;
      border-bottom: 1px solid ${borderColor};
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-icon {
      width: 36px;
      height: 36px;
      background: ${design.primary};
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 18px;
    }
    .logo-text {
      font-weight: 700;
      font-size: 18px;
      color: ${textPrimary};
    }
    .nav-links {
      display: flex;
      gap: 32px;
    }
    .nav-link {
      font-size: 14px;
      color: ${textSecondary};
      text-decoration: none;
      font-weight: 500;
    }
    .nav-cta {
      background: ${design.primary};
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
    }
    
    /* Hero */
    .hero {
      display: flex;
      padding: 40px 50px;
      gap: 50px;
      height: calc(100% - 77px);
    }
    .hero-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: ${design.accent};
      color: ${design.secondary};
      padding: 6px 14px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 20px;
      width: fit-content;
    }
    .badge-dot {
      width: 6px;
      height: 6px;
      background: ${design.primary};
      border-radius: 50%;
    }
    h1 {
      font-size: 48px;
      font-weight: 800;
      color: ${textPrimary};
      line-height: 1.1;
      margin-bottom: 16px;
      letter-spacing: -0.02em;
    }
    .highlight {
      color: ${design.primary};
    }
    .subheadline {
      font-size: 18px;
      color: ${textSecondary};
      line-height: 1.6;
      margin-bottom: 28px;
      max-width: 500px;
    }
    .cta-group {
      display: flex;
      gap: 12px;
      margin-bottom: 36px;
    }
    .cta-primary {
      background: ${design.primary};
      color: white;
      padding: 14px 28px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cta-secondary {
      background: transparent;
      color: ${textPrimary};
      padding: 14px 28px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      border: 2px solid ${borderColor};
    }
    .stats {
      display: flex;
      gap: 32px;
    }
    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: ${textPrimary};
    }
    .stat-label {
      font-size: 13px;
      color: ${textSecondary};
    }
    
    /* Hero Visual */
    .hero-visual {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .visual-card {
      width: 100%;
      max-width: 450px;
      background: linear-gradient(135deg, ${design.primary}15, ${design.secondary}25);
      border-radius: 20px;
      padding: 32px;
      border: 1px solid ${design.primary}30;
      position: relative;
      overflow: hidden;
    }
    .visual-card::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, ${design.primary}10 0%, transparent 70%);
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      position: relative;
    }
    .avatar {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, ${design.primary}, ${design.secondary});
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: 700;
    }
    .card-title {
      font-size: 20px;
      font-weight: 700;
      color: ${textPrimary};
    }
    .card-subtitle {
      font-size: 14px;
      color: ${textSecondary};
    }
    .card-features {
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
    }
    .feature {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: ${cardBg};
      border-radius: 10px;
      border: 1px solid ${borderColor};
    }
    .feature-icon {
      width: 32px;
      height: 32px;
      background: ${design.accent};
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${design.primary};
      font-size: 14px;
    }
    .feature-text {
      font-size: 14px;
      font-weight: 500;
      color: ${textPrimary};
    }
  </style>
</head>
<body>
  <nav class="nav">
    <div class="logo">
      <div class="logo-icon">${design.name.charAt(0)}</div>
      <span class="logo-text">${design.name}</span>
    </div>
    <div class="nav-links">
      ${design.navItems.map(item => `<a class="nav-link" href="#">${item}</a>`).join('')}
    </div>
    <div class="nav-cta">${design.cta}</div>
  </nav>
  
  <div class="hero">
    <div class="hero-content">
      <div class="badge">
        <span class="badge-dot"></span>
        ${design.tagline}
      </div>
      <h1>${design.headline.split(' ').slice(0, -1).join(' ')} <span class="highlight">${design.headline.split(' ').slice(-1)}</span></h1>
      <p class="subheadline">${design.subheadline}</p>
      <div class="cta-group">
        <div class="cta-primary">${design.cta} →</div>
        <div class="cta-secondary">Learn More</div>
      </div>
      <div class="stats">
        ${design.stats.map((stat, i) => {
          const parts = stat.split(' ');
          const value = parts[0];
          const label = parts.slice(1).join(' ') || stat;
          return `<div class="stat"><span class="stat-value">${value}</span><span class="stat-label">${label || 'Metric'}</span></div>`;
        }).join('')}
      </div>
    </div>
    
    <div class="hero-visual">
      <div class="visual-card">
        <div class="card-header">
          <div class="avatar">${design.name.charAt(0)}</div>
          <div>
            <div class="card-title">${design.name}</div>
            <div class="card-subtitle">${design.tagline}</div>
          </div>
        </div>
        <div class="card-features">
          <div class="feature">
            <div class="feature-icon">✓</div>
            <span class="feature-text">Professional & Personalized</span>
          </div>
          <div class="feature">
            <div class="feature-icon">★</div>
            <span class="feature-text">Highly Rated Service</span>
          </div>
          <div class="feature">
            <div class="feature-icon">◎</div>
            <span class="feature-text">Book Online Instantly</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  console.log('Generating proper website preview thumbnails...\n');
  
  const browser = await chromium.launch();
  
  for (const [slug, design] of Object.entries(templateDesigns)) {
    const templateDir = path.join(TEMPLATES_DIR, slug);
    if (!fs.existsSync(templateDir)) {
      console.log(`⚠ Skipping ${slug} - directory not found`);
      continue;
    }
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1200, height: 630 });
    
    // Light theme
    await page.setContent(generateHTML(design, false));
    await page.waitForTimeout(300);
    const lightPath = path.join(templateDir, 'thumbnail-light.png');
    await page.screenshot({ path: lightPath });
    
    // Also save as default
    fs.copyFileSync(lightPath, path.join(templateDir, 'thumbnail.png'));
    
    // Dark theme
    await page.setContent(generateHTML(design, true));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(templateDir, 'thumbnail-dark.png') });
    
    console.log(`✓ ${slug}`);
    await page.close();
  }
  
  await browser.close();
  console.log('\n✅ All thumbnails generated!');
}

main().catch(console.error);
