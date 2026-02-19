import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

// Templates to generate thumbnails for
const templates = [
  'academic-tutor',
  'workshop-host', 
  'language-teacher',
  'coding-bootcamp',
  'music-teacher',
  'edu-course-creator',
  'coach-pro',
  'fitness-coach',
  'therapist-care'
];

// Color schemes for each template (primary color for visual distinction)
const templateColors = {
  'academic-tutor': { primary: '#3b82f6', bg: '#eff6ff' },      // Blue
  'workshop-host': { primary: '#8b5cf6', bg: '#f5f3ff' },       // Purple  
  'language-teacher': { primary: '#ec4899', bg: '#fdf2f8' },    // Pink
  'coding-bootcamp': { primary: '#10b981', bg: '#ecfdf5' },     // Green
  'music-teacher': { primary: '#f59e0b', bg: '#fffbeb' },       // Amber
  'edu-course-creator': { primary: '#6366f1', bg: '#eef2ff' },  // Indigo
  'coach-pro': { primary: '#14b8a6', bg: '#f0fdfa' },           // Teal
  'fitness-coach': { primary: '#ef4444', bg: '#fef2f2' },       // Red
  'therapist-care': { primary: '#22c55e', bg: '#f0fdf4' }       // Green
};

async function generateThumbnail(browser, templateSlug) {
  const templateDir = path.join(TEMPLATES_DIR, templateSlug);
  const configPath = path.join(templateDir, 'config.json');
  const heroPath = path.join(templateDir, 'content', 'hero.md');
  const sitePath = path.join(templateDir, 'content', 'site.md');
  
  // Read template data
  let config = { name: templateSlug };
  let heroData = { headline: 'Welcome', subheadline: 'Professional template' };
  let siteData = { name: templateSlug };
  
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (e) {}
  
  try {
    const heroContent = fs.readFileSync(heroPath, 'utf-8');
    const headlineMatch = heroContent.match(/headline:\s*["']?([^"'\n]+)/);
    const subheadlineMatch = heroContent.match(/subheadline:\s*["']?([^"'\n]+)/);
    if (headlineMatch) heroData.headline = headlineMatch[1].trim();
    if (subheadlineMatch) heroData.subheadline = subheadlineMatch[1].trim().substring(0, 100);
  } catch (e) {}
  
  try {
    const siteContent = fs.readFileSync(sitePath, 'utf-8');
    const nameMatch = siteContent.match(/name:\s*["']?([^"'\n]+)/);
    if (nameMatch) siteData.name = nameMatch[1].trim();
  } catch (e) {}

  const colors = templateColors[templateSlug] || { primary: '#3b82f6', bg: '#f8fafc' };
  
  // Create a simple thumbnail HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      width: 1200px;
      height: 630px;
      background: linear-gradient(135deg, ${colors.bg} 0%, #ffffff 100%);
      display: flex;
      flex-direction: column;
      padding: 60px;
    }
    .badge {
      display: inline-block;
      background: ${colors.primary}15;
      color: ${colors.primary};
      padding: 8px 16px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 56px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.1;
      margin-bottom: 20px;
    }
    .highlight {
      color: ${colors.primary};
    }
    p {
      font-size: 22px;
      color: #475569;
      line-height: 1.5;
      max-width: 700px;
    }
    .preview-box {
      margin-top: auto;
      display: flex;
      gap: 16px;
    }
    .preview-item {
      background: white;
      border-radius: 12px;
      padding: 20px 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    .preview-item .label {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .preview-item .value {
      font-size: 24px;
      font-weight: 600;
      color: ${colors.primary};
    }
    .logo {
      position: absolute;
      bottom: 40px;
      right: 50px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #94a3b8;
      font-size: 16px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="badge">${config.category || 'Template'}</div>
  <h1>${heroData.headline.split(' ').slice(0, 3).join(' ')} <span class="highlight">${heroData.headline.split(' ').slice(3, 6).join(' ')}</span></h1>
  <p>${heroData.subheadline}</p>
  <div class="preview-box">
    <div class="preview-item">
      <div class="label">Category</div>
      <div class="value">${(config.category || 'education').charAt(0).toUpperCase() + (config.category || 'education').slice(1)}</div>
    </div>
    <div class="preview-item">
      <div class="label">Framework</div>
      <div class="value">Astro</div>
    </div>
    <div class="preview-item">
      <div class="label">Features</div>
      <div class="value">${(config.features || []).length}+</div>
    </div>
  </div>
  <div class="logo">
    Flowstarter Library
  </div>
</body>
</html>`;

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(html);
  await page.waitForTimeout(500);
  
  // Save light theme thumbnail
  const lightPath = path.join(templateDir, 'thumbnail-light.png');
  await page.screenshot({ path: lightPath });
  console.log(`✓ Generated ${templateSlug}/thumbnail-light.png`);
  
  // Copy as default thumbnail
  const defaultPath = path.join(templateDir, 'thumbnail.png');
  fs.copyFileSync(lightPath, defaultPath);
  console.log(`✓ Generated ${templateSlug}/thumbnail.png`);
  
  // Dark theme
  await page.evaluate((primaryColor) => {
    document.body.style.background = `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`;
    document.querySelector('h1').style.color = '#f8fafc';
    document.querySelector('p').style.color = '#94a3b8';
    document.querySelectorAll('.preview-item').forEach(el => {
      el.style.background = '#1e293b';
      el.style.borderColor = '#334155';
    });
    document.querySelectorAll('.preview-item .label').forEach(el => {
      el.style.color = '#64748b';
    });
    document.querySelector('.logo').style.color = '#475569';
  }, colors.primary);
  
  const darkPath = path.join(templateDir, 'thumbnail-dark.png');
  await page.screenshot({ path: darkPath });
  console.log(`✓ Generated ${templateSlug}/thumbnail-dark.png`);
  
  await page.close();
}

async function main() {
  console.log('Starting thumbnail generation...\n');
  
  const browser = await chromium.launch();
  
  for (const template of templates) {
    try {
      await generateThumbnail(browser, template);
    } catch (error) {
      console.error(`✗ Failed to generate ${template}:`, error.message);
    }
  }
  
  await browser.close();
  console.log('\nDone!');
}

main();
