import { test, expect, type Page } from '@playwright/test';
import {
  BASE,
  EDITOR,
  BUSINESS_INFO,
  CONTACT_INFO,
  e2eFetch,
  cleanupProject,
  testProjectName,
  makeHandoffToken,
} from './helpers';

type TemplateFixture = {
  slug: string;
  name: string;
  palettes: Array<{
    id: string;
    name: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
  }>;
  fonts: Array<{
    id: string;
    name: string;
    heading: { family: string; weight?: number };
    body: { family: string; weight?: number };
  }>;
};

let createdProjectId: string | undefined;

async function loadTemplateFixture(): Promise<TemplateFixture> {
  const result = await e2eFetch(`${BASE}/api/local-templates`);
  expect(result.status).toBe(200);

  const body = result.body as { templates?: TemplateFixture[] };
  const template = body.templates?.[0];
  expect(template).toBeTruthy();
  expect(template?.palettes).toHaveLength(6);
  expect(template?.fonts).toHaveLength(6);

  return template!;
}

async function callHandoff(projectConfig: Record<string, unknown>): Promise<{
  editorUrl: string;
  token: string;
  projectId: string;
}> {
  const result = await e2eFetch(`${BASE}/api/editor/handoff`, {
    method: 'POST',
    body: { projectConfig, mode: 'interactive' },
  });

  expect(result.status, `handoff returned ${result.status}: ${JSON.stringify(result.body)}`).toBe(200);

  const body = result.body as {
    success: boolean;
    editorUrl: string;
    token: string;
    projectId: string;
  };

  expect(body.success).toBe(true);
  createdProjectId = body.projectId;

  return body;
}

function editorHandoffUrl(token: string) {
  return `${EDITOR}?handoff=${encodeURIComponent(token)}`;
}

async function openReview(page: Page, token: string) {
  await page.goto(editorHandoffUrl(token), { waitUntil: 'domcontentloaded' });
  await expect
    .poll(async () => page.url(), {
      timeout: 30_000,
      intervals: [250, 500, 1000],
    })
    .toContain('/project/');

  await expect
    .poll(async () => page.url(), {
      timeout: 10_000,
      intervals: [250, 500],
    })
    .not.toContain('flowstarter.dev/login');

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await expect(page.locator('body')).toContainText('Review Before Build', { timeout: 20_000 });
      return;
    } catch (error) {
      if (attempt === 1) {
        throw error;
      }

      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect
        .poll(async () => page.url(), {
          timeout: 15_000,
          intervals: [250, 500, 1000],
        })
        .toContain('/project/');
    }
  }
}

test.afterEach(async () => {
  if (createdProjectId) {
    await cleanupProject(createdProjectId);
    createdProjectId = undefined;
  }
});

test.describe('Scenario 1: Dashboard handoff to editor', () => {
  test.setTimeout(300_000);

  test('1.1 handoff returns signed token and editor url', async () => {
    const { token, editorUrl, projectId } = await callHandoff({
      name: testProjectName(),
      description: BUSINESS_INFO.description,
    });

    expect(token).toBeTruthy();
    expect(token.split('.').length).toBeGreaterThanOrEqual(2);
    expect(editorUrl).toMatch(/\/project\/|handoff=/);
    expect(projectId).toMatch(/^[0-9a-f-]{36}$/i);
  });

  test('1.2 editor validates token and preserves canonical review data', async ({ page }) => {
    const template = await loadTemplateFixture();
    const palette = template.palettes[0];
    const font = template.fonts[0];
    const projectName = testProjectName();

    const { token } = await callHandoff({
      name: projectName,
      description: BUSINESS_INFO.description,
      businessInfo: BUSINESS_INFO,
      brandProfile: {
        brandTone: {
          primary: 'professional',
          secondary: ['modern'],
          notes: 'Keep the tone calm and credible.',
        },
        valueProposition: BUSINESS_INFO.uvp,
        primaryGoal: 'Book more consultations',
        desiredCustomerAction: 'Schedule an appointment',
        differentiators: ['Same-day consults'],
        trustSignals: ['5-star reviews'],
      },
      template: { id: template.slug, name: template.name },
      palette,
      font,
      contactInfo: CONTACT_INFO,
      siteInfo: { integrations: ['booking', 'analytics'] },
    });

    const res = await page.request.post(`${EDITOR}/api/handoff/validate`, {
      data: { token },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.status()).toBe(200);

    const validated = (await res.json()) as {
      valid: boolean;
      project?: {
        name?: string;
        data?: {
          palette?: { id?: string };
          font?: { id?: string };
          brandProfile?: { brandTone?: { primary?: string } };
          siteInfo?: { integrations?: string[] };
        };
      };
    };

    expect(validated.valid).toBe(true);
    expect(validated.project?.name).toBe(projectName);
    expect(validated.project?.data?.palette?.id).toBe(palette.id);
    expect(validated.project?.data?.font?.id).toBe(font.id);
    expect(validated.project?.data?.brandProfile?.brandTone?.primary).toBe('professional');
    expect(validated.project?.data?.siteInfo?.integrations).toEqual(['booking', 'analytics']);
  });

  test('1.3 expired token is rejected', async ({ page }) => {
    const expired = makeHandoffToken({
      projectId: '00000000-0000-0000-0000-000000000001',
      userId: 'user_test',
      iat: Math.floor(Date.now() / 1000) - 1800,
      exp: Math.floor(Date.now() / 1000) - 900,
      project: { id: '00000000-0000-0000-0000-000000000001', name: 'x', description: '', data: {} },
    });

    const res = await page.request.post(`${EDITOR}/api/handoff/validate`, {
      data: { token: expired },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.status()).toBe(401);
  });

  test('1.4 tampered token is rejected', async ({ page }) => {
    const { token } = await callHandoff({
      name: testProjectName(),
      description: BUSINESS_INFO.description,
    });

    const tampered = token.slice(0, -6) + 'XXXXXX';
    const res = await page.request.post(`${EDITOR}/api/handoff/validate`, {
      data: { token: tampered },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.status()).toBe(401);
  });

  test('1.5 handoff-backed project opens in review with template, palette, font, brand, and integrations', async ({
    page,
  }) => {
    const template = await loadTemplateFixture();
    const palette = template.palettes[0];
    const font = template.fonts[0];

    const { token } = await callHandoff({
      name: testProjectName(),
      description: BUSINESS_INFO.description,
      businessInfo: BUSINESS_INFO,
      brandProfile: {
        brandTone: { primary: 'professional', secondary: ['modern'] },
        valueProposition: BUSINESS_INFO.uvp,
        desiredCustomerAction: 'Book a consultation',
        differentiators: ['Same-day appointments'],
        trustSignals: ['Top-rated local clinic'],
      },
      template: { id: template.slug, name: template.name },
      palette,
      font,
      contactInfo: CONTACT_INFO,
      siteInfo: { integrations: ['booking', 'analytics'] },
    });

    await openReview(page, token);

    await expect(page.getByText(template.name)).toBeVisible();
    await expect(page.getByText(palette.name)).toBeVisible();
    await expect(page.getByText(`Heading: ${font.heading.family}`)).toBeVisible();
    await expect(page.getByText(/Tone:\s*professional/i)).toBeVisible();
    await expect(page.locator('body')).toContainText('Same-day appointments');
    await expect(page.locator('body')).toContainText('Top-rated local clinic');
    await expect(page.locator('body')).toContainText('booking');
    await expect(page.locator('body')).toContainText('analytics');
    await expect(page.getByRole('button', { name: 'Adjust Before Build' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Build Site' })).toBeVisible();
  });

  test('1.6 adjust before build opens personalization', async ({ page }) => {
    const template = await loadTemplateFixture();
    const { token } = await callHandoff({
      name: testProjectName(),
      description: BUSINESS_INFO.description,
      businessInfo: BUSINESS_INFO,
      template: { id: template.slug, name: template.name },
      palette: template.palettes[0],
      font: template.fonts[0],
    });

    await openReview(page, token);
    await page.getByRole('button', { name: 'Adjust Before Build' }).click();
    await expect(page.getByTestId('personalization-panel')).toBeVisible({ timeout: 15_000 });
  });

  test('1.7 build site starts from review with seeded configuration', async ({ page }) => {
    const template = await loadTemplateFixture();
    let buildCalled = false;

    await page.route('**/api/build', async (route) => {
      buildCalled = true;
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        body: [
          'data: {"type":"progress","message":"Starting generation pipeline..."}\n\n',
          'data: {"type":"progress","message":"Building preview..."}\n\n',
          'data: {"type":"complete","result":{"success":true,"preview":{"url":"https://mock-preview.daytona.app","sandboxId":"sb-test"},"files":[]}}\n\n',
        ].join(''),
      });
    });

    const { token } = await callHandoff({
      name: testProjectName(),
      description: BUSINESS_INFO.description,
      businessInfo: BUSINESS_INFO,
      template: { id: template.slug, name: template.name },
      palette: template.palettes[0],
      font: template.fonts[0],
      siteInfo: { integrations: ['booking'] },
    });

    await openReview(page, token);
    await page.getByRole('button', { name: 'Build Site' }).click();

    await expect.poll(() => buildCalled).toBe(true);
    await expect(page.locator('body')).toContainText('Building your site', { timeout: 15_000 });
    await expect(page.locator('body')).toContainText('Your site is ready', { timeout: 20_000 });
  });
});
