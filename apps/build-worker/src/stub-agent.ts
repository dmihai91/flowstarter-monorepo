/**
 * The deterministic stand-in for the Pi full-site session.
 *
 * Local mode exists to prove the chain around the model — ledger claim,
 * worktree, integrations, validation, commit, package, deploy, serve — on a
 * machine that may have no provider key and certainly has no budget for a
 * twenty-minute coding session per test run. This writes one build receipt
 * into the site root and reports it as changed, which is the minimum the
 * worker requires to consider the session real.
 *
 * It is reachable only when `FLOWSTARTER_BUILD_MODE=local` AND
 * `FLOWSTARTER_BUILD_STUB_AGENT=true` (see config.ts). Production cannot
 * select it, because a client who paid for a build must never be handed the
 * approved preview back with a receipt stapled to it.
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PiSdkFlowstarterAgents } from '@flowstarter/agentic-codegen';

export const STUB_RECEIPT_PATH = 'flowstarter-build.json';

export function createStubFullSiteAgent(): PiSdkFlowstarterAgents {
  return {
    async buildFullSite(input: {
      workspaceRoot: string;
      projectId: string;
      requiredIntegrations: string[];
    }) {
      const receipt = {
        mode: 'local-stub',
        projectId: input.projectId,
        requiredIntegrations: input.requiredIntegrations,
        note:
          'Built without a model session. The approved preview was materialized, ' +
          'integrations were injected deterministically, and the trusted ' +
          'validation commands ran. Set FLOWSTARTER_BUILD_STUB_AGENT=false and ' +
          'supply PI_API_KEY to run the real full-site agent.',
      };
      await writeFile(
        join(input.workspaceRoot, STUB_RECEIPT_PATH),
        `${JSON.stringify(receipt, null, 2)}\n`,
        'utf8',
      );
      return {
        summary: 'Deterministic local build (no model session)',
        changedPaths: [STUB_RECEIPT_PATH],
      };
    },
  } as unknown as PiSdkFlowstarterAgents;
}
