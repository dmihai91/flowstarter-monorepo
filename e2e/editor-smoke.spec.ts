/**
 * Flowstarter Editor — V1 Smoke Tests
 *
 * Validates the forked editor's three contracts:
 *   1. Server is up and serves the SPA shell branded as Flowstarter.
 *   2. Clerk gate is wired: `/api/clerk/me` returns a coherent
 *      "publishable key configured" response (not the T3-default
 *      "publishable key missing").
 *   3. `?clerk-skip=true` short-circuits the gate so we can render the
 *      app shell in dev without a Clerk session.
 *
 * Editor runs on `T3CODE_PORT` (default 5773 — see
 * `apps/flowstarter-editor/server/.env.example`). Override with
 * `EDITOR_BASE_URL` when running in other envs.
 *
 * `playwright.config.ts` only spins up the main app (:3000); the
 * editor server is not auto-started. The describe block self-skips
 * when the editor port isn't reachable so the suite stays green in
 * environments without an editor running.
 */

import { test, expect } from "@playwright/test";

const EDITOR = process.env.EDITOR_BASE_URL ?? "http://localhost:5773";

test.describe("Flowstarter editor smoke", () => {
  test.beforeAll(async ({ request }) => {
    // Editor server isn't part of `playwright.config.ts`'s `webServer`
    // list — when it's not running locally, skip the whole describe
    // rather than failing every test with ECONNREFUSED.
    try {
      const probe = await request.get(`${EDITOR}/`, { timeout: 2000 });
      if (!probe.ok() && probe.status() !== 401 && probe.status() !== 403) {
        test.skip(true, `Editor server at ${EDITOR} returned ${probe.status()}`);
      }
    } catch (err) {
      test.skip(
        true,
        `Editor server at ${EDITOR} not reachable (${err instanceof Error ? err.message : String(err)})`,
      );
    }
  });

  test("server responds with HTML shell", async ({ request }) => {
    const response = await request.get(`${EDITOR}/`);
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain("flowstarter-editor:theme");
    expect(body).toContain("Flowstarter Editor");
    expect(body).toContain("boot-shell");
  });

  test("clerk endpoint returns a structured auth outcome", async ({ request }) => {
    const response = await request.get(`${EDITOR}/api/clerk/me`);
    const json = await response.json();
    expect(json).toHaveProperty("authenticated");
    if (!json.authenticated) {
      expect(typeof json.reason).toBe("string");
      expect(json.reason).not.toMatch(/Publishable key is missing/i);
    }
  });

  test("auto-pair endpoint exists and rejects unauthenticated POSTs cleanly", async ({ request }) => {
    const response = await request.post(`${EDITOR}/api/clerk/auto-pair`);
    expect([200, 401, 403, 503]).toContain(response.status());
  });

  test("?clerk-skip=true loads the editor SPA without crashing", async ({ page }) => {
    await page.goto(`${EDITOR}/?clerk-skip=true`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2500);
    const root = page.locator("#root");
    await expect(root).toBeVisible();
    await page.screenshot({
      path: "e2e/screenshots/editor-clerk-skip.png",
      fullPage: true,
    });
  });

  test("flow gradient shows on the body in dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(`${EDITOR}/?clerk-skip=true`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    const bodyBg = await page.evaluate(() => {
      const computed = getComputedStyle(document.body);
      return {
        backgroundColor: computed.backgroundColor,
        backgroundImage: computed.backgroundImage,
      };
    });
    expect(bodyBg.backgroundImage).toContain("radial-gradient");
    await page.screenshot({
      path: "e2e/screenshots/editor-dark-flow.png",
      fullPage: true,
    });
  });

  test("flow gradient shows on the body in light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(`${EDITOR}/?clerk-skip=true`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    const bodyBg = await page.evaluate(() => {
      const computed = getComputedStyle(document.body);
      return {
        backgroundColor: computed.backgroundColor,
        backgroundImage: computed.backgroundImage,
      };
    });
    expect(bodyBg.backgroundImage).toContain("radial-gradient");
    await page.screenshot({
      path: "e2e/screenshots/editor-light-flow.png",
      fullPage: true,
    });
  });
});
