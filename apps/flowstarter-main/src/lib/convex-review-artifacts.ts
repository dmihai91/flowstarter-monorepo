import 'server-only';

function convexSiteUrl(): string {
  return (
    process.env.CONVEX_SITE_URL ||
    (process.env.NEXT_PUBLIC_CONVEX_URL || '').replace(
      '.convex.cloud',
      '.convex.site'
    )
  );
}

function handoffSecret(): string {
  return (
    process.env.HANDOFF_SECRET ||
    process.env.NEXT_PUBLIC_HANDOFF_SECRET ||
    'dev-secret'
  );
}

export interface ReviewArtifactPayload {
  generated_code?: string | null;
  preview_html?: string | null;
  generated_files?: Array<{ path: string; content: string }> | null;
  quality_metrics?: unknown;
}

export interface MergedReviewArtifactFields {
  generated_code: string | null;
  preview_html: string | null;
  generated_files: Array<{ path: string; content: string }> | null;
  quality_metrics: unknown;
  /** ISO string when Convex stored a completion timestamp */
  generation_completed_at: string | null;
}

function hasArtifactPayload(payload: ReviewArtifactPayload): boolean {
  return Boolean(
    (payload.generated_code && payload.generated_code.length > 0) ||
      (payload.preview_html && payload.preview_html.length > 0) ||
      (payload.generated_files && payload.generated_files.length > 0) ||
      payload.quality_metrics !== undefined
  );
}

/**
 * Persist large review/generation blobs in Convex (keyed by Supabase project UUID).
 * No-op when nothing to store or when Convex URL / secret is missing.
 */
export async function upsertReviewArtifacts(
  supabaseProjectId: string,
  payload: ReviewArtifactPayload,
  generationCompletedAtIso?: string | null
): Promise<void> {
  if (!hasArtifactPayload(payload) && !generationCompletedAtIso) return;

  const base = convexSiteUrl();
  if (!base) {
    console.warn(
      '[reviewArtifacts] CONVEX_SITE_URL / NEXT_PUBLIC_CONVEX_URL not set — skipping upsert'
    );
    return;
  }

  const generationCompletedAt = generationCompletedAtIso
    ? Date.parse(generationCompletedAtIso)
    : undefined;

  const res = await fetch(`${base}/reviewArtifacts/upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-handoff-secret': handoffSecret(),
    },
    body: JSON.stringify({
      supabaseProjectId,
      generatedCode: payload.generated_code ?? undefined,
      previewHtml: payload.preview_html ?? undefined,
      generatedFiles: payload.generated_files ?? undefined,
      qualityMetrics: payload.quality_metrics,
      generationCompletedAt: Number.isFinite(generationCompletedAt)
        ? generationCompletedAt
        : undefined,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `[reviewArtifacts] upsert failed (${res.status}): ${text.slice(0, 200)}`
    );
  }
}

const EMPTY: MergedReviewArtifactFields = {
  generated_code: null,
  preview_html: null,
  generated_files: null,
  quality_metrics: null,
  generation_completed_at: null,
};

export async function fetchReviewArtifacts(
  supabaseProjectId: string
): Promise<MergedReviewArtifactFields> {
  const base = convexSiteUrl();
  if (!base) return EMPTY;

  const url = new URL(`${base}/reviewArtifacts`);
  url.searchParams.set('supabaseProjectId', supabaseProjectId);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'x-handoff-secret': handoffSecret() },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.warn('[reviewArtifacts] fetch failed', res.status);
    return EMPTY;
  }

  const json = (await res.json()) as {
    artifact: {
      generated_code: string | null;
      preview_html: string | null;
      generated_files: Array<{ path: string; content: string }> | null;
      quality_metrics: unknown;
      generation_completed_at: number | null;
    } | null;
  };

  const a = json.artifact;
  if (!a) return EMPTY;

  return {
    generated_code: a.generated_code,
    preview_html: a.preview_html,
    generated_files: a.generated_files,
    quality_metrics: a.quality_metrics,
    generation_completed_at:
      typeof a.generation_completed_at === 'number' &&
      Number.isFinite(a.generation_completed_at)
        ? new Date(a.generation_completed_at).toISOString()
        : null,
  };
}
