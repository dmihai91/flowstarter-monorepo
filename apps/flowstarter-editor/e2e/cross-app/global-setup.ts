/**
 * Global Setup — Minimal.
 *
 * Auth is handled via X-E2E-Secret header in requireAuth() (api-auth.ts).
 * No browser Clerk session needed for API-level tests.
 *
 * For UI tests (1.5+) that open the editor in the browser, the handoff token
 * carries the user identity — TeamAuthGuard bypasses Clerk when ?handoff= present.
 */
import { type FullConfig } from '@playwright/test';
import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../.env') });
config({ path: path.resolve(__dirname, '../../.env.local'), override: true });

export default async function globalSetup(_config: FullConfig) {
  const secret = process.env.E2E_SECRET;
  if (!secret) throw new Error('E2E_SECRET must be set in .env.local');

  // Ensure .auth dir exists (Playwright needs storageState file to exist)
  const authDir = path.resolve(__dirname, '.auth');
  fs.mkdirSync(authDir, { recursive: true });

  const sessionFile = path.join(authDir, 'session.json');
  if (!fs.existsSync(sessionFile)) {
    fs.writeFileSync(sessionFile, JSON.stringify({ cookies: [], origins: [] }));
  }

  console.log('[global-setup] E2E_SECRET present ✅ — using header-based auth bypass');
  console.log('[global-setup] BASE:', process.env.E2E_BASE_URL || 'https://flowstarter.dev');
  console.log('[global-setup] EDITOR:', process.env.E2E_EDITOR_URL || 'https://editor.flowstarter.dev');
}
