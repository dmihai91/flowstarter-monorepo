import { test, expect, type Page } from '@playwright/test';
import {
  BASE,
  EDITOR,
  BUSINESS_INFO,
  CONTACT_INFO,
  cleanupProject,
  e2eFetch,
  getGeneratedFiles,
  getProject,
  seedProjectIntegrations,
  testProjectName,
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

const REAL_GA_ID = 'G-E2EBETA42';
const REAL_CALENDLY_URL = 'https://calendly.com/flowstarter-app/discovery';

let createdProjectId: string | undefined;

async function loadTemplateFixture(): Promise<TemplateFixture> {
  const result = await e2eFetch(`${BASE}/api/local-templates`);
  expect(result.status).toBe(200);

  return (result.body as { templates?: TemplateFixture[] }).templates![0];
}

async function openReview(page: Page, token: string) {
  await page.goto(`${EDITOR}?handoff=${encodeURIComponent(token)}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForURL(/\/project\//, { timeout: 30_000 });
  await expect(page.locator('body')).toContainText('Review Before Build', {
    timeout: 20_000,
  });
}

test.describe('Scenario 4: Real live build with integrations', () => {
  test.skip(process.env.RUN_REAL_BUILD_E2E !== '1', 'Set RUN_REAL_BUILD_E2E=1 to run the live build E2E.');

  test.setTimeout(600_000);

  test.afterEach(async () => {
    if (createdProjectId) {
      await cleanupProject(createdProjectId);
      createdProjectId = undefined;
    }
  });

  test('4.1 creates a real site, persists preview state, and injects integrations', async ({ page }) => {
    const template = await loadTemplateFixture();
    const handoff = await e2eFetch(`${BASE}/api/editor/handoff`, {
      method: 'POST',
      body: {
        projectConfig: {
          name: testProjectName(),
          description: BUSINESS_INFO.description,
          businessInfo: BUSINESS_INFO,
          brandProfile: {
            brandTone: {
              primary: 'professional',
              secondary: ['modern'],
              notes: 'Clear, premium, trustworthy.',
            },
            valueProposition: BUSINESS_INFO.uvp,
            primaryGoal: 'Book more consultations',
            desiredCustomerAction: 'Schedule an appointment',
            differentiators: ['Same-day consults', 'Pain-free treatment'],
            trustSignals: ['5-star Google reviews', 'Premium materials'],
          },
          template: { id: template.slug, name: template.name },
          palette: template.palettes[0],
          font: template.fonts[0],
          contactInfo: CONTACT_INFO,
          siteInfo: { integrations: ['booking', 'analytics'] },
        },
        mode: 'interactive',
      },
    });

    expect(handoff.status).toBe(200);

    const { token, projectId } = handoff.body as {
      token: string;
      projectId: string;
    };
    createdProjectId = projectId;

    await seedProjectIntegrations(projectId, {
      calendlyUrl: REAL_CALENDLY_URL,
      gaPropertyId: REAL_GA_ID,
    });

    await openReview(page, token);

    await expect(page.locator('body')).toContainText('booking');
    await expect(page.locator('body')).toContainText('analytics');

    await page.getByRole('button', { name: 'Build Site' }).click();

    await expect(page.locator('body')).toContainText('Building your site', {
      timeout: 30_000,
    });

    await expect
      .poll(
        async () => {
          const project = await getProject(projectId);
          return {
            previewUrl: typeof project.preview_url === 'string' ? project.preview_url : null,
            sandboxId: typeof project.sandbox_id === 'string' ? project.sandbox_id : null,
          };
        },
        {
          timeout: 420_000,
          intervals: [2_000, 5_000, 10_000],
        },
      )
      .toEqual(
        expect.objectContaining({
          previewUrl: expect.stringMatching(/^https?:\/\//),
          sandboxId: expect.any(String),
        }),
      );

    await expect
      .poll(async () => (await getGeneratedFiles(projectId)).length, {
        timeout: 120_000,
        intervals: [2_000, 5_000],
      })
      .toBeGreaterThan(0);

    const projectWithPreview = await getProject(projectId);
    const generatedFiles = await getGeneratedFiles(projectId);
    const joined = generatedFiles.map((file) => file.content).join('\n');

    expect(joined).toContain(REAL_GA_ID);
    expect(
      joined.includes('calendly-inline-widget') ||
        joined.includes('Calendly.initPopupWidget') ||
        joined.includes(REAL_CALENDLY_URL),
    ).toBe(true);
    expect(joined).toContain('/api/leads/capture');
    expect(joined).toContain(projectId);

    await expect(page.locator('body')).toContainText('Your site is ready', {
      timeout: 120_000,
    });

    expect(projectWithPreview.previewUrl).toBeTruthy();
  });
});
