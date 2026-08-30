/**
 * The seam between the anonymous funnel and an owned project.
 *
 * The discovery wizard generates a real, personalized preview against a
 * throwaway `demoId`: no workspace, no membership, no artifacts. The deposit
 * half of the product expects the opposite — a workspace the caller is a
 * member of, in PREVIEW_READY, with a quote and an artifacts row for the build
 * worker to build from. Nothing converted one into the other, so the two
 * halves could never meet.
 *
 * Claiming is that conversion. It runs once per preview and is safe to retry:
 * `workspaces.claimed_preview_id` carries a partial unique index, so a double
 * submit (or a browser retry after a slow response) converges on the same
 * workspace instead of minting a second one.
 *
 * Two things are deliberately server-owned here and are never read from the
 * request body:
 *   - the preview manifest, brand config and template — captured by the
 *     generation pipeline itself (`rememberClaimablePreview`), because the
 *     browser never sees them and must not be able to dictate what gets built;
 *   - the money. The wizard sends a tier *name*; the euro figure comes from
 *     the same published price table the pricing page quotes.
 */
import type {
  BrandConfig,
  BusinessIntakePayload,
  TemplateScaffoldFile,
  TemplateSelection,
} from '@flowstarter/agentic-codegen';
import { ProjectState } from '@flowstarter/agentic-codegen/src/flowstarter/types';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import {
  TIER_SETUP_FROM,
  type Tier,
} from '@/app/(dynamic-pages)/(main-pages)/components/discovery/discovery.logic';
import type { Json } from '@/lib/database.types';
import { recordIntakeSubmission } from './intake-submission';
import { ensureClientMembership } from './membership';
import { savePreviewArtifacts } from './preview-artifacts';
import { parseQuoteInputToMinor } from './quote';
import type { RoutingResult } from './routing-rules';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = '23505';

// ─── The claimable-preview stash ───────────────────────────────────────────
//
// Process-local and ephemeral, exactly like `lib/discovery/live-jobs.ts`: the
// preview it belongs to is held in the same process for the same session. A
// multi-instance deployment must back both with the same durable store; the
// shape here is written so that swap is mechanical.

/** Everything `savePreviewArtifacts` needs, as the pipeline produced it. */
export interface ClaimablePreview {
  previewId: string;
  intake: BusinessIntakePayload;
  brandConfig: BrandConfig;
  template: TemplateSelection;
  files: readonly TemplateScaffoldFile[];
  /** `daytona://<sandbox>` or `local://<path>` — provenance, not a promise. */
  previewArtifactUrl?: string;
  previewUrl?: string;
  capturedAt: number;
}

/** Manifests are large; keep the newest few and let the rest go. */
const MAX_STASHED_PREVIEWS = 40;
const STASH_TTL_MS = 6 * 60 * 60_000;

const stash = new Map<string, ClaimablePreview>();

/**
 * Called by the preview pipeline the moment a preview is publishable, so a
 * visitor who signs in minutes later claims the site they actually saw rather
 * than a regenerated approximation of it.
 */
export function rememberClaimablePreview(
  preview: Omit<ClaimablePreview, 'capturedAt'>
): void {
  if (!UUID.test(preview.previewId)) return;
  reapStashedPreviews();
  stash.set(preview.previewId, { ...preview, capturedAt: Date.now() });
  while (stash.size > MAX_STASHED_PREVIEWS) {
    const oldest = stash.keys().next();
    if (oldest.done) break;
    stash.delete(oldest.value);
  }
}

export function getClaimablePreview(
  previewId: string
): ClaimablePreview | undefined {
  reapStashedPreviews();
  return stash.get(previewId);
}

/** Test seam: the stash is module state, so suites must be able to reset it. */
export function clearClaimablePreviews(): void {
  stash.clear();
}

function reapStashedPreviews(): void {
  const cutoff = Date.now() - STASH_TTL_MS;
  for (const [id, preview] of Array.from(stash.entries())) {
    if (preview.capturedAt < cutoff) stash.delete(id);
  }
}

// ─── Pricing ───────────────────────────────────────────────────────────────

/**
 * The tier's published setup fee, in minor units.
 *
 * `TIER_SETUP_FROM` is display text ("€1,199"), and `parseQuoteInputToMinor`
 * treats a comma as a decimal separator, so the thousands separator has to go
 * before it is parsed — otherwise €1,199 would be quoted as €1.20.
 */
export function quoteMinorForTier(tier: Tier | '' | undefined): number | null {
  if (!tier || !(tier in TIER_SETUP_FROM)) return null;
  const digits = TIER_SETUP_FROM[tier as Tier].replace(/[^0-9.]/g, '');
  if (!digits) return null;
  try {
    const minor = parseQuoteInputToMinor(digits);
    return minor > 0 ? minor : null;
  } catch {
    return null;
  }
}

// ─── Claiming ──────────────────────────────────────────────────────────────

export class PreviewClaimConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PreviewClaimConflictError';
  }
}

export interface ClaimPreviewInput {
  /** The wizard's demo id — the preview the visitor is looking at. */
  previewId: string;
  clerkUserId: string;
  clientEmail?: string | null;
  clientName?: string | null;
  businessName?: string | null;
  /** Tier the visitor confirmed in the wizard; priced server-side. */
  tier?: Tier | '' | null;
  /** Wizard answers, kept on the claim event for provenance. */
  intakeSummary?: Record<string, unknown>;
  /**
   * The deterministic standard-vs-custom verdict, recomputed by the caller
   * from the answers rather than taken from the browser. `intake_submissions`
   * is NOT NULL on workspace_id, so a claim is the first moment it can be
   * persisted at all.
   */
  routing?: RoutingResult;
}

export interface ClaimPreviewResult {
  workspaceId: string;
  unlockUrl: string;
  /** True when this call found a workspace the same preview already made. */
  alreadyClaimed: boolean;
  /** True once artifacts exist and the workspace is in PREVIEW_READY. */
  previewReady: boolean;
  /** Null when the wizard sent no tier — the deposit will then be refused. */
  quoteMinor: number | null;
  /**
   * Set when membership could not be written. The workspace still exists and
   * is returned; the caller can retry. Never silently swallowed.
   */
  membershipError?: string;
}

export async function claimPreview(
  input: ClaimPreviewInput
): Promise<ClaimPreviewResult> {
  if (!UUID.test(input.previewId)) {
    throw new Error('claimPreview requires a valid preview id');
  }
  if (!input.clerkUserId?.trim()) {
    throw new Error('claimPreview requires a clerkUserId');
  }

  const supabase = createSupabaseServiceRoleClient();

  const existing = await findClaimedWorkspace(input.previewId);
  if (existing) {
    await assertClaimableBy(existing, input.clerkUserId);
    const membershipError = await attachClient(existing, input.clerkUserId);
    return {
      workspaceId: existing,
      unlockUrl: unlockUrlFor(existing),
      alreadyClaimed: true,
      previewReady: await isPreviewReady(existing),
      quoteMinor: quoteMinorForTier(input.tier ?? ''),
      ...(membershipError ? { membershipError } : {}),
    };
  }

  const quoteMinor = quoteMinorForTier(input.tier ?? '');
  const businessName = input.businessName?.trim() || null;
  const name = businessName || `${input.clientName?.trim() || 'New'} project`;

  const insert = await supabase
    .from('workspaces')
    .insert({
      slug: uniqueSlug(name),
      name,
      // The funnel preview is an Astro template; a commerce build is
      // re-platformed by an operator, not guessed at from a wizard answer.
      site_kind: 'astro',
      client_name: input.clientName?.trim() || null,
      client_email: input.clientEmail?.trim() || null,
      client_business_name: businessName,
      claimed_preview_id: input.previewId,
      concierge_stage: 'intake',
      // Artifacts move this to PREVIEW_READY below; a workspace with no
      // preview behind it must not look ready to take a deposit.
      project_state: ProjectState.INTAKE,
      ...(quoteMinor ? { final_value_minor: quoteMinor } : {}),
      ...(input.tier ? { tier_name: input.tier } : {}),
    })
    .select('id')
    .maybeSingle();

  if (insert.error?.code === UNIQUE_VIOLATION) {
    // Two claims raced (double click, or a retry after a slow first call).
    // The loser adopts the winner's workspace rather than creating a second.
    const raced = await findClaimedWorkspace(input.previewId);
    if (!raced) throw insert.error;
    await assertClaimableBy(raced, input.clerkUserId);
    const membershipError = await attachClient(raced, input.clerkUserId);
    return {
      workspaceId: raced,
      unlockUrl: unlockUrlFor(raced),
      alreadyClaimed: true,
      previewReady: await isPreviewReady(raced),
      quoteMinor,
      ...(membershipError ? { membershipError } : {}),
    };
  }
  if (insert.error || !insert.data) {
    throw insert.error ?? new Error('Could not create the claimed workspace');
  }
  const workspaceId = insert.data.id;

  // Artifacts before membership: a workspace nobody can open is recoverable
  // (the same preview id re-claims it); a paid build with nothing to build
  // from is not.
  let previewReady = false;
  const preview = getClaimablePreview(input.previewId);
  if (preview) {
    try {
      const saved = await savePreviewArtifacts({
        workspaceId,
        // The manifest was generated against the demo id. The build worker
        // cross-checks intake.projectId against the workspace and fails the
        // job when they disagree, so it is re-pointed at its new home.
        intake: { ...preview.intake, projectId: workspaceId },
        brandConfig: preview.brandConfig,
        template: preview.template,
        files: preview.files,
        ...(preview.previewArtifactUrl
          ? { previewArtifactUrl: preview.previewArtifactUrl }
          : {}),
        advanceToPreviewReady: true,
      });
      previewReady = saved.advanced;
    } catch (error) {
      // A preview we cannot persist is not a reason to lose the workspace:
      // the client still gets an owned project, and the unlock page correctly
      // refuses to sell a deposit against a build that has no source.
      console.error(
        `[Flowstarter] claim ${input.previewId} created workspace ${workspaceId} ` +
          'but could not persist its preview artifacts: ' +
          (error instanceof Error ? error.message : 'unknown error')
      );
    }
  } else {
    console.warn(
      `[Flowstarter] claim ${input.previewId} has no stashed preview manifest; ` +
        `workspace ${workspaceId} stays in ${ProjectState.INTAKE}`
    );
  }

  const membershipError = await attachClient(workspaceId, input.clerkUserId);

  // The routing verdict is calibration data, not a gate: losing it must not
  // cost the client the project they just claimed.
  if (input.routing) {
    try {
      await recordIntakeSubmission({
        workspaceId,
        payload: input.intakeSummary ?? {},
        routing: input.routing,
      });
    } catch (error) {
      console.error(
        `[Flowstarter] claim ${input.previewId} could not record the intake ` +
          'submission for calibration: ' +
          (error instanceof Error ? error.message : 'unknown error')
      );
    }
  }

  await recordEvent(workspaceId, 'preview_claimed', input.clerkUserId, {
    previewId: input.previewId,
    previewReady,
    quoteMinor,
    tier: input.tier ?? null,
    routingDecision: input.routing?.decision ?? null,
    previewUrl: preview?.previewUrl ?? null,
    templateSlug: preview?.template.slug ?? null,
    fileCount: preview?.files.length ?? 0,
    intake: input.intakeSummary ?? {},
    ...(membershipError ? { membershipError } : {}),
  });

  return {
    workspaceId,
    unlockUrl: unlockUrlFor(workspaceId),
    alreadyClaimed: false,
    previewReady,
    quoteMinor,
    ...(membershipError ? { membershipError } : {}),
  };
}

async function findClaimedWorkspace(
  previewId: string
): Promise<string | undefined> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('workspaces')
    .select('id')
    .eq('claimed_preview_id', previewId)
    .maybeSingle();
  if (error) throw error;
  return data?.id;
}

/**
 * A preview id travels inside the generated site (the unlock link), so it is
 * not a secret. Re-claiming your own preview is idempotent; claiming one that
 * already belongs to somebody else is not allowed to hand over their project.
 */
async function assertClaimableBy(
  workspaceId: string,
  clerkUserId: string
): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('workspace_memberships')
    .select('clerk_user_id')
    .eq('workspace_id', workspaceId);
  if (error) throw error;
  const members = data ?? [];
  if (members.length === 0) return;
  if (members.some((member) => member.clerk_user_id === clerkUserId)) return;
  throw new PreviewClaimConflictError(
    'This preview has already been claimed by another account'
  );
}

/** Returns an error message instead of throwing: see ClaimPreviewResult. */
async function attachClient(
  workspaceId: string,
  clerkUserId: string
): Promise<string | undefined> {
  try {
    await ensureClientMembership({ workspaceId, clerkUserId });
    return undefined;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'unknown membership error';
    console.error(
      `[Flowstarter] workspace ${workspaceId} was claimed but the client could ` +
        `not be given membership and cannot open it: ${message}`
    );
    await recordEvent(
      workspaceId,
      'preview_claim_membership_failed',
      clerkUserId,
      { error: message }
    ).catch(() => {});
    return message;
  }
}

async function isPreviewReady(workspaceId: string): Promise<boolean> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('workspaces')
    .select('project_state')
    .eq('id', workspaceId)
    .maybeSingle();
  if (error) throw error;
  return data?.project_state === ProjectState.PREVIEW_READY;
}

async function recordEvent(
  workspaceId: string,
  kind: string,
  actor: string,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from('project_events').insert({
    workspace_id: workspaceId,
    kind,
    actor,
    payload: payload as Json,
  });
  if (error) {
    console.error(
      `[Flowstarter] could not record ${kind} for workspace ${workspaceId}: ${error.message}`
    );
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function uniqueSlug(base: string): string {
  const root = slugify(base) || 'workspace';
  return `${root}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Absolute when the configured origin is one we would put in front of a
 * client, relative otherwise — a misconfigured NEXT_PUBLIC_SITE_URL must not
 * cost the visitor the workspace they just claimed.
 */
export function unlockUrlFor(workspaceId: string): string {
  const path = `/unlock/${workspaceId}`;
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return path;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return path;
  }
  const loopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) {
    return path;
  }
  return `${url.origin}${path}`;
}
