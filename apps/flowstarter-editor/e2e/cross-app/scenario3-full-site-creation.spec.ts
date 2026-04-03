import { test, expect } from '@playwright/test';
import { BASE, EDITOR, BUSINESS_INFO, CONTACT_INFO, cleanupProject, e2eFetch, testProjectName, skipIfSecretsUnavailable,
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

  return (result.body as { templates?: TemplateFixture[] }).templates![0];
}

async function openReview(page: import('@playwright/test').Page, token: string) {
  await page.goto(`${EDITOR}?handoff=${encodeURIComponent(token)}`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/project\//, { timeout: 30_000 });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await expect(page.locator('body')).toContainText('Review Before Build', { timeout: 20_000 });
      return;
    } catch (error) {
      if (attempt === 1) {
        throw error;
      }

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForURL(/\/project\//, { timeout: 15_000 });
    }
  }
}

test.afterEach(async () => {
  if (createdProjectId) {
    await cleanupProject(createdProjectId);
    createdProjectId = undefined;
  }
});

test.describe('Scenario 3: Review to build', () => {
  skipIfSecretsUnavailable();
  test.setTimeout(300_000);

  test('3.1 review-first flow can start a seeded build and surface completion', async ({ page }) => {
    const template = await loadTemplateFixture();
    let buildRequested = false;

    await page.route('**/api/build', async (route) => {
      buildRequested = true;
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        body: [
          'data: {"type":"progress","message":"Starting generation pipeline..."}\n\n',
          'data: {"type":"progress","message":"Building preview..."}\n\n',
          'data: {"type":"complete","result":{"success":true,"preview":{"url":"https://mock-preview.daytona.app","sandboxId":"sb-e2e"},"files":[{"path":"src/pages/index.astro","content":"<h1>Hello</h1>"}]}}\n\n',
        ].join(''),
      });
    });

    const handoff = await e2eFetch(`${BASE}/api/editor/handoff`, {
      method: 'POST',
      body: {
        projectConfig: {
          name: testProjectName(),
          description: BUSINESS_INFO.description,
          businessInfo: BUSINESS_INFO,
          brandProfile: {
            brandTone: { primary: 'professional', secondary: ['modern'] },
            valueProposition: BUSINESS_INFO.uvp,
            desiredCustomerAction: 'Book an appointment',
            differentiators: ['Pain-free treatment'],
            trustSignals: ['5-star Google reviews'],
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

    const { token, projectId } = handoff.body as { token: string; projectId: string };
    createdProjectId = projectId;

    await openReview(page, token);

    await page.getByRole('button', { name: 'Build Site' }).click();

    await expect.poll(() => buildRequested).toBe(true);
    await expect(page.locator('body')).toContainText('Building your site', { timeout: 15_000 });
    await expect(page.locator('body')).toContainText('Your site is ready', { timeout: 20_000 });
  });
});
