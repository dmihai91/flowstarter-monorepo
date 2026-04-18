import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ROOT = '/Users/darius91/flowstarter-monorepo/apps/flowstarter-library';
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const SHOWCASE_THUMBS_DIR = path.join(ROOT, 'showcase', 'public', 'thumbs');
const MAIN_THUMBS_DIR = '/Users/darius91/flowstarter-monorepo/apps/flowstarter-main/public/thumbs';

const templates = [
  'freelancer-portfolio',
  'consultant-pro',
  'coach-pro',
  'therapist-care',
  'fitness-coach',
  'beauty-stylist',
  'photographer-portfolio',
];

async function generateForTemplate(browser, slug) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    colorScheme: 'light',
    deviceScaleFactor: 1,
  });

  const url = `http://localhost:2000/api/templates/${slug}/live`;
  console.log(`Opening ${url}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  // Disable motion and remove obvious dev-only noise if any
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
      iframe, video { visibility: hidden !important; }
    `,
  });

  await page.waitForTimeout(700);

  const templateDir = path.join(TEMPLATES_DIR, slug);
  fs.mkdirSync(templateDir, { recursive: true });

  const lightPath = path.join(templateDir, 'thumbnail-light.png');
  const darkPath = path.join(templateDir, 'thumbnail-dark.png');
  const defaultPath = path.join(templateDir, 'thumbnail.png');

  // Light/default
  await page.screenshot({
    path: lightPath,
    clip: { x: 0, y: 0, width: 1280, height: 900 },
  });
  fs.copyFileSync(lightPath, defaultPath);

  // Reuse same rendered preview as dark thumbnail too for now
  fs.copyFileSync(lightPath, darkPath);

  // Copy to showcase thumbs
  const showcaseDir = path.join(SHOWCASE_THUMBS_DIR, slug);
  fs.mkdirSync(showcaseDir, { recursive: true });
  for (const filename of ['thumbnail.png', 'thumbnail-light.png', 'thumbnail-dark.png']) {
    fs.copyFileSync(path.join(templateDir, filename), path.join(showcaseDir, filename));
  }

  // Copy flat thumb for landing page only for active beta templates
  const mainThumbPath = path.join(MAIN_THUMBS_DIR, `${slug}.png`);
  fs.mkdirSync(MAIN_THUMBS_DIR, { recursive: true });
  fs.copyFileSync(defaultPath, mainThumbPath);

  await page.close();
  console.log(`✓ Generated thumbnails for ${slug}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const slug of templates) {
      await generateForTemplate(browser, slug);
    }
    console.log('All thumbnails regenerated.');
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
