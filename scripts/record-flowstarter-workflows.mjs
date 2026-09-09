import { mkdir, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.FLOWSTARTER_RECORDING_URL ?? 'http://127.0.0.1:3000';
const outputDir = resolve(
  process.cwd(),
  'apps/flowstarter-main/public/workflow-clips',
);
const temporaryDir = resolve(process.cwd(), 'artifacts/workflow-recordings');
const selectedScenarios = new Set(
  (process.env.FLOWSTARTER_RECORDING_SCENARIOS ?? '01,02,03,04')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

const demoData = {
  fullName: 'Maya Chen',
  email: 'maya@example.com',
  businessName: 'Northstar Portrait Studio',
  industry: 'Photography',
  description:
    'Relaxed family portraits and founder headshots, with gentle direction and natural light.',
  targetAudience:
    'Families and independent founders who want natural photographs without awkward posing.',
  instagramUrl: 'https://instagram.com/northstarportraits',
  linkedinUrl: 'https://linkedin.com/company/northstar-portraits',
  goal: 'Take bookings or appointments, Show a portfolio of work',
  secondaryGoals: [],
  brandTone: 'Warm, Calm, Editorial',
  pageCount: '5-7',
  timeline: '4-weeks',
  commerceMode: 'few-services',
  catalogSize: 'na',
  customIntegrations:
    'Cal.com booking, Stripe deposits, newsletter signup and a private client gallery.',
  selectedTier: 'pro',
  subscription: '',
  billingCadence: 'monthly',
};

await mkdir(outputDir, { recursive: true });
await rm(temporaryDir, { recursive: true, force: true });
await mkdir(temporaryDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function newRecording(filename, draft) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: temporaryDir,
      size: { width: 1440, height: 900 },
    },
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  });
  await context.addInitScript(() => {
    window.localStorage.setItem(
      'flowstarter_cookie_consent',
      JSON.stringify({
        essential: true,
        analytics: false,
        functional: false,
        timestamp: new Date().toISOString(),
      }),
    );
  });
  if (draft) {
    await context.addInitScript((value) => {
      window.sessionStorage.setItem(
        'fs-discovery-draft-v1',
        JSON.stringify(value),
      );
    }, draft);
  }
  const page = await context.newPage();
  page.on('pageerror', (error) => console.error(`page error: ${error.message}`));
  page.on('requestfailed', (request) => {
    const failure = request.failure();
    if (request.resourceType() === 'script') {
      console.error(`script failed: ${request.url()} (${failure?.errorText ?? 'unknown'})`);
    }
  });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.getByRole('heading', { name: /Your business already has a brand/i }).waitFor();
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await page.waitForTimeout(1_000);
  const essentials = page.getByRole('button', { name: 'Essential only' });
  if (await essentials.isVisible().catch(() => false)) await essentials.click();
  return { context, page, filename };
}

async function saveRecording(recording) {
  const video = recording.page.video();
  await recording.context.close();
  if (!video) throw new Error(`Video capture unavailable for ${recording.filename}`);
  const source = await video.path();
  const destination = resolve(outputDir, recording.filename);
  await rm(destination, { force: true });
  await rename(source, destination);
  console.log(`${recording.filename}: ${destination}`);
}

async function openDiscovery(page) {
  // The SSR shell can show the CTA before its click handler is hydrated.
  // The hero stage only advances once the real client bundle is running.
  await page
    .locator('[data-hero-stage]:not([data-hero-stage="1"])')
    .waitFor({ timeout: 30_000 });
  const essentials = page.getByRole('button', { name: 'Essential only' });
  if (await essentials.isVisible().catch(() => false)) await essentials.click();
  await page.locator('main .ls-cta-hero').first().click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ timeout: 30_000 });
  return dialog;
}

async function clickContinue(dialog) {
  const button = dialog.getByRole('button', { name: 'Continue' });
  await button.waitFor();
  await button.click();
}

try {
  // 01 — Real landing page → real intake form → real business/social fields.
  if (selectedScenarios.has('01')) {
    const recording = await newRecording('01-intake.webm');
    const { page } = recording;
    await page.waitForTimeout(900);
    const dialog = await openDiscovery(page);
    await page.waitForTimeout(600);
    await dialog.getByLabel('Your name').pressSequentially(demoData.fullName, { delay: 55 });
    await dialog.getByLabel('Email').pressSequentially(demoData.email, { delay: 45 });
    await dialog.getByLabel('Business name').pressSequentially(demoData.businessName, { delay: 45 });
    await page.waitForTimeout(500);
    await clickContinue(dialog);
    await dialog
      .getByLabel('In one or two sentences')
      .pressSequentially(demoData.description, { delay: 16 });
    await dialog.getByLabel('Industry').selectOption('Photography');
    await dialog.getByLabel('Target audience').fill(demoData.targetAudience);
    await dialog.getByLabel('Instagram profile').fill(demoData.instagramUrl);
    await dialog.getByLabel('LinkedIn profile').fill(demoData.linkedinUrl);
    await page.waitForTimeout(1_400);
    await saveRecording(recording);
  }

  // 02 — Real strategy controls → integrations → server recommendation.
  if (selectedScenarios.has('02')) {
    const recording = await newRecording('02-preview.webm', {
      data: { ...demoData, goal: '', brandTone: '', pageCount: '', timeline: '', commerceMode: '' },
      step: 3,
    });
    const { page } = recording;
    const dialog = await openDiscovery(page);
    await page.waitForTimeout(700);
    for (const name of ['Take bookings or appointments', 'Show a portfolio of work']) {
      await dialog.getByRole('button', { name, exact: true }).click();
      await page.waitForTimeout(320);
    }
    for (const name of ['Warm', 'Calm', 'Editorial']) {
      await dialog
        .locator('button')
        .filter({ hasText: new RegExp(`^${name}$`) })
        .click({ force: true });
      await page.waitForTimeout(260);
    }
    await dialog
      .getByRole('button', { name: '5 – 7 Standard service site', exact: true })
      .click();
    await dialog
      .getByRole('button', { name: 'Within 4 weeks', exact: true })
      .click();
    await page.waitForTimeout(700);
    await clickContinue(dialog);
    await dialog
      .getByRole('button', {
        name: 'A few paid offers Let customers pay for services or single sessions online',
        exact: true,
      })
      .click();
    await dialog
      .getByLabel('Anything custom we should know about?')
      .pressSequentially(demoData.customIntegrations, { delay: 18 });
    await page.waitForTimeout(600);
    await clickContinue(dialog);
    await dialog.getByText('Best fit for you').waitFor();
    await page.waitForTimeout(3_200);
    await saveRecording(recording);
  }

  // 03 — Real care-plan selection → real Pi preview request and progress UI.
  if (selectedScenarios.has('03')) {
    const recording = await newRecording('03-build.webm', {
      data: { ...demoData, subscription: '' },
      step: 6,
    });
    const { page } = recording;
    const dialog = await openDiscovery(page);
    await page.waitForTimeout(800);
    await dialog.locator('button').filter({ hasText: /Pro.*99/s }).click();
    await page.waitForTimeout(900);
    await clickContinue(dialog);
    await dialog.getByText('Building a first draft of your site from your answers…').waitFor();
    await page.waitForTimeout(12_000);
    await saveRecording(recording);
  }

  // 04 — Real interactive editor on the Flowstarter landing page.
  if (selectedScenarios.has('04')) {
    const recording = await newRecording('04-editor.webm');
    const { page } = recording;
    const editor = page.locator('#editor-showcase');
    await editor.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1_500);
    await editor.getByRole('button', { name: 'Price' }).click();
    await editor.getByLabel('Amount').selectOption('35');
    await editor.getByLabel('Billing').selectOption('monthly');
    await editor.getByLabel('Delivery').selectOption('separate');
    await page.waitForTimeout(600);
    await editor.getByRole('button', { name: 'Apply price' }).click();
    await page.waitForTimeout(4_800);
    await editor.getByRole('button', { name: 'Rewrite' }).click();
    await editor.getByLabel('What to rewrite').selectOption('headline');
    await editor.getByLabel('How it should feel').selectOption('warmer');
    await editor.getByRole('button', { name: 'Apply rewrite' }).click();
    await page.waitForTimeout(5_500);
    await saveRecording(recording);
  }
} finally {
  await browser.close();
  await rm(temporaryDir, { recursive: true, force: true });
}
