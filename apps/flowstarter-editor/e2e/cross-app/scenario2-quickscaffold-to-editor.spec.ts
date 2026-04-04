import { test, expect } from '@playwright/test';
import {
  BASE,
  EDITOR,
  BUSINESS_INFO,
  CONTACT_INFO,
  ENRICHED_DATA,
  QUICKSCAFFOLD_INPUT,
  cleanupProject,
  e2eFetch,
skipIfSecretsUnavailable,
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

  return body.templates![0];
}

async function quickScaffoldHandoff() {
  const template = await loadTemplateFixture();
  const result = await e2eFetch(`${BASE}/api/editor/handoff`, {
    method: 'POST',
    body: {
      projectConfig: {
        name: ENRICHED_DATA.name,
        description: ENRICHED_DATA.description,
        userDescription: QUICKSCAFFOLD_INPUT,
        industry: ENRICHED_DATA.industry,
        businessInfo: {
          ...BUSINESS_INFO,
          description: ENRICHED_DATA.description,
          uvp: ENRICHED_DATA.uvp,
          targetAudience: ENRICHED_DATA.targetAudience,
        },
        brandProfile: {
          brandTone: { primary: 'professional', secondary: ['modern'] },
          valueProposition: ENRICHED_DATA.uvp,
          primaryGoal: 'Book more consultations',
          desiredCustomerAction: 'Book an appointment',
        },
        template: { id: template.slug, name: template.name },
        palette: template.palettes[0],
        font: template.fonts[0],
        contactInfo: CONTACT_INFO,
        siteInfo: { integrations: ['booking'] },
      },
      mode: 'interactive',
    },
  });

  expect(result.status).toBe(200);

  const body = result.body as {
    success: boolean;
    token: string;
    editorUrl: string;
    projectId: string;
  };

  expect(body.success).toBe(true);
  createdProjectId = body.projectId;

  return { ...body, template };
}

test.afterEach(async () => {
  if (createdProjectId) {
    await cleanupProject(createdProjectId);
    createdProjectId = undefined;
  }
});

test.describe('Scenario 2: QuickScaffold to editor review', () => {
  skipIfSecretsUnavailable();
  test.setTimeout(180_000);

  test('2.1 quick scaffold handoff accepts enriched business data and returns editor access', async () => {
    const { token, editorUrl, projectId } = await quickScaffoldHandoff();

    expect(token).toBeTruthy();
    expect(editorUrl).toContain('handoff=');
    expect(projectId).toMatch(/^[0-9a-f-]{36}$/i);
  });

  test('2.2 enriched handoff token preserves business, brand, and template data', async ({ page }) => {
    const { token, template } = await quickScaffoldHandoff();

    const res = await page.request.post(`${EDITOR}/api/handoff/validate`, {
      data: { token },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.status()).toBe(200);

    const validated = (await res.json()) as {
      valid: boolean;
      project?: {
        data?: {
          businessInfo?: { uvp?: string };
          brandProfile?: { brandTone?: { primary?: string } };
          template?: { id?: string };
        };
      };
    };

    expect(validated.valid).toBe(true);
    expect(validated.project?.data?.businessInfo?.uvp).toBe(ENRICHED_DATA.uvp);
    expect(validated.project?.data?.brandProfile?.brandTone?.primary).toBe('professional');
    expect(validated.project?.data?.template?.id).toBe(template.slug);
  });

  test('2.3 quick scaffold handoff opens in review instead of legacy onboarding', async ({ page }) => {
    const { token, template } = await quickScaffoldHandoff();

    await page.goto(`${EDITOR}?handoff=${encodeURIComponent(token)}`);
    await page.waitForURL(/\/project\//, { timeout: 30_000 });

    await expect(page.getByText('Review Before Build')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(template.name)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Build Site' })).toBeVisible();
    await expect(page.getByText(/tell me about your business|choose a template/i)).toHaveCount(0);
  });
});
