import { describe, expect, it } from 'vitest';
import { ProjectState } from '@flowstarter/agentic-codegen';
import {
  buildJobFromRows,
  isClaimable,
  JobArtifactError,
  parseApprovedPreviewFiles,
  parseRequiredIntegrations,
  type JobLedgerRow,
} from '../src/job-store';

const WORKSPACE_ID = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';

function ledgerRow(overrides: Partial<JobLedgerRow> = {}): JobLedgerRow {
  return {
    id: '4f9d5bf2-1c4a-4a2f-9d4a-4c0f0a7c2f11',
    workspace_id: WORKSPACE_ID,
    kind: 'FULL_SITE_BUILD',
    status: 'queued',
    attempt_count: 0,
    payload: {},
    ...overrides,
  };
}

function artifacts(overrides: Record<string, unknown> = {}) {
  return {
    intake_payload: { projectId: WORKSPACE_ID, business: { name: 'Calm Path' } },
    brand_config: { schemaVersion: '1.0' },
    preview_manifest: {
      files: [{ path: 'src/content/site.md', content: 'Approved preview' }],
    },
    ...overrides,
  };
}

describe('claim eligibility', () => {
  it('claims a freshly queued full-site build', () => {
    expect(isClaimable(ledgerRow(), 3)).toBe(true);
  });

  it('will not double-start a job another worker is already running', () => {
    expect(isClaimable(ledgerRow({ status: 'running' }), 3)).toBe(false);
  });

  it('will not rebuild a job that already succeeded or was canceled', () => {
    expect(isClaimable(ledgerRow({ status: 'succeeded' }), 3)).toBe(false);
    expect(isClaimable(ledgerRow({ status: 'canceled' }), 3)).toBe(false);
  });

  it('retries a failed job until the attempt budget is spent', () => {
    expect(isClaimable(ledgerRow({ status: 'failed', attempt_count: 2 }), 3)).toBe(
      true,
    );
    expect(isClaimable(ledgerRow({ status: 'failed', attempt_count: 3 }), 3)).toBe(
      false,
    );
  });

  it('ignores an inline-edit job dispatched to the full-site endpoint', () => {
    expect(isClaimable(ledgerRow({ kind: 'INLINE_EDIT' }), 3)).toBe(false);
  });
});

describe('artifact parsing', () => {
  it('maps ledger and artifact rows onto a FullSiteBuildJob', () => {
    const job = buildJobFromRows({
      job: ledgerRow({ payload: { requiredIntegrations: ['cal.com'] } }),
      projectState: ProjectState.DEPOSIT_PAID,
      artifacts: artifacts(),
    });

    expect(job.projectId).toBe(WORKSPACE_ID);
    expect(job.projectState).toBe(ProjectState.DEPOSIT_PAID);
    expect(job.requiredIntegrations).toEqual(['cal.com']);
    expect(job.approvedPreviewFiles).toEqual([
      { path: 'src/content/site.md', content: 'Approved preview', type: 'file' },
    ]);
  });

  it('refuses an intake whose projectId does not match the paid workspace', () => {
    expect(() =>
      buildJobFromRows({
        job: ledgerRow(),
        projectState: ProjectState.DEPOSIT_PAID,
        artifacts: artifacts({
          intake_payload: { projectId: '11111111-1111-4111-8111-111111111111' },
        }),
      }),
    ).toThrow(JobArtifactError);
  });

  it('refuses to build from an empty or missing preview manifest', () => {
    expect(() => parseApprovedPreviewFiles({})).toThrow(JobArtifactError);
    expect(() => parseApprovedPreviewFiles({ files: [] })).toThrow(JobArtifactError);
    expect(() => parseApprovedPreviewFiles(null)).toThrow(JobArtifactError);
  });

  it('refuses a manifest entry without a usable path or content', () => {
    expect(() => parseApprovedPreviewFiles({ files: [{ content: 'x' }] })).toThrow(
      JobArtifactError,
    );
    expect(() =>
      parseApprovedPreviewFiles({ files: [{ path: 'a.md', content: 3 }] }),
    ).toThrow(JobArtifactError);
  });

  it('falls back to the preview manifest when the payload carries no integrations', () => {
    expect(
      parseRequiredIntegrations({}, { requiredIntegrations: ['newsletter'] }),
    ).toEqual(['newsletter']);
    expect(parseRequiredIntegrations({}, {})).toEqual([]);
  });

  it('rejects an integration name that is not a plain slug', () => {
    expect(() =>
      parseRequiredIntegrations({ requiredIntegrations: ['../etc/passwd'] }, {}),
    ).toThrow(JobArtifactError);
  });
});
