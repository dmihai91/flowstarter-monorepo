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
    intake_payload: {
      projectId: WORKSPACE_ID,
      business: { name: 'Calm Path' },
    },
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
    expect(
      isClaimable(ledgerRow({ status: 'failed', attempt_count: 2 }), 3),
    ).toBe(true);
    expect(
      isClaimable(ledgerRow({ status: 'failed', attempt_count: 3 }), 3),
    ).toBe(false);
  });

  it('ignores an inline-edit job dispatched to the full-site endpoint', () => {
    expect(isClaimable(ledgerRow({ kind: 'INLINE_EDIT' }), 3)).toBe(false);
  });

  it('claims a site rebuild, which rides the same endpoint as a full build', () => {
    expect(isClaimable(ledgerRow({ kind: 'SITE_REBUILD' }), 3)).toBe(true);
    expect(
      isClaimable(ledgerRow({ kind: 'SITE_REBUILD', status: 'running' }), 3),
    ).toBe(false);
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
      {
        path: 'src/content/site.md',
        content: 'Approved preview',
        type: 'file',
      },
    ]);
  });

  it('carries the kind through, so the worker knows which half to run', () => {
    expect(
      buildJobFromRows({
        job: ledgerRow(),
        projectState: ProjectState.DEPOSIT_PAID,
        artifacts: artifacts(),
      }).kind,
    ).toBe('FULL_SITE_BUILD');
  });

  it('builds a rebuild job from a live project, with no deposit gate', () => {
    // The deposit gate belongs to the full build. A client publishing an edit
    // does so months later, from LIVE_SUBSCRIPTION, and mapping the rows must
    // not quietly require the state that build already passed through.
    const job = buildJobFromRows({
      job: ledgerRow({
        kind: 'SITE_REBUILD',
        payload: { trigger: 'client_publish', version: 4 },
      }),
      projectState: ProjectState.LIVE_SUBSCRIPTION,
      artifacts: artifacts({
        preview_manifest: {
          files: [{ path: 'src/content/site.md', content: 'The edit' }],
        },
      }),
    });

    expect(job.kind).toBe('SITE_REBUILD');
    expect(job.projectState).toBe(ProjectState.LIVE_SUBSCRIPTION);
    expect(job.approvedPreviewFiles).toEqual([
      { path: 'src/content/site.md', content: 'The edit', type: 'file' },
    ]);
  });

  it('keeps a real Cal.com link and adds the integration the build needs', () => {
    const job = buildJobFromRows({
      job: ledgerRow(),
      projectState: ProjectState.DEPOSIT_PAID,
      artifacts: artifacts(),
      calComUrl: '  https://cal.com/calm-path/intro  ',
    });

    expect(job.calComUrl).toBe('https://cal.com/calm-path/intro');
    expect(job.requiredIntegrations).toEqual(['cal.com']);
  });

  it('drops a booking link on a host that only looks like Cal.com', () => {
    // The workspace row is client-supplied and its value is written into the
    // built site. A substring or prefix test on "cal.com" would accept every
    // one of these, so the host itself is what gets checked.
    for (const lookalike of [
      'https://cal.com.attacker.example/book',
      'https://notcal.com/book',
      'https://cal.com@attacker.example/book',
      'https://evil.example/cal.com/book',
    ]) {
      const job = buildJobFromRows({
        job: ledgerRow(),
        projectState: ProjectState.DEPOSIT_PAID,
        artifacts: artifacts(),
        calComUrl: lookalike,
      });

      expect(job.calComUrl).toBeUndefined();
      expect(job.requiredIntegrations).toEqual([]);
    }
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
    expect(() => parseApprovedPreviewFiles({ files: [] })).toThrow(
      JobArtifactError,
    );
    expect(() => parseApprovedPreviewFiles(null)).toThrow(JobArtifactError);
  });

  it('refuses a manifest entry without a usable path or content', () => {
    expect(() =>
      parseApprovedPreviewFiles({ files: [{ content: 'x' }] }),
    ).toThrow(JobArtifactError);
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
      parseRequiredIntegrations(
        { requiredIntegrations: ['../etc/passwd'] },
        {},
      ),
    ).toThrow(JobArtifactError);
  });
});
