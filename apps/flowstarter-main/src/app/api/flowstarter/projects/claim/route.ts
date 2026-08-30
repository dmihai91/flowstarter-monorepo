/**
 * POST /api/flowstarter/projects/claim
 *
 * Turns the anonymous preview the visitor is looking at into a workspace they
 * own. This is the only route that crosses from the funnel into the concierge
 * product: before it, a preview is a demo id and nothing is persisted; after
 * it, `/unlock/[workspaceId]` and the deposit Checkout have everything they
 * check for — a membership row, PREVIEW_READY, artifacts and a quote.
 *
 * Signed-out callers get 401 rather than an orphan workspace: ownership is the
 * entire point of the conversion, so there is nothing useful to do without an
 * identity to attach.
 *
 * The body carries only what the wizard actually holds — the demo id, the
 * answers the visitor typed, and the tier they confirmed. The preview manifest
 * and the price are resolved server-side; neither is accepted from a browser.
 */
import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type {
  CatalogSize,
  CommerceMode,
  DiscoveryData,
  PageCount,
  TimelineId,
} from '@/app/(dynamic-pages)/(main-pages)/components/discovery/discovery.logic';
import { requireAuth } from '@/lib/api-auth';
import {
  claimPreview,
  PreviewClaimConflictError,
} from '@/lib/flowstarter/claim';
import { classifyRouting } from '@/lib/flowstarter/routing-rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ClaimSchema = z.object({
  /** The wizard's `demoId` — from POST /api/discovery/preview/live. */
  previewId: z.string().uuid(),
  /** Wizard step 5. The euro figure it maps to is server-owned. */
  tier: z.enum(['starter', 'pro', 'commerce', 'custom']).optional(),
  // The step-1/2/3 answers, exactly as the wizard already posts them to the
  // preview endpoint. Optional and bounded: they are provenance and display
  // text, never authorization or price.
  businessName: z.string().max(200).optional().default(''),
  fullName: z.string().max(200).optional().default(''),
  email: z.string().max(320).optional().default(''),
  description: z.string().max(5000).optional().default(''),
  industry: z.string().max(200).optional().default(''),
  targetAudience: z.string().max(500).optional().default(''),
  goal: z.string().max(400).optional().default(''),
  brandTone: z.string().max(400).optional().default(''),
  // Scope answers. These exist here only so the routing classifier can be
  // re-run server-side; the wizard's own verdict is never trusted.
  pageCount: z
    .enum(['lt-5', '5-7', '8-15', '15+', 'unsure'])
    .optional()
    .default('unsure'),
  timeline: z
    .enum(['asap', '4-weeks', '1-3-months', 'flexible'])
    .optional()
    .default('flexible'),
  commerceMode: z
    .enum(['none', 'few-services', 'digital', 'physical', 'mixed'])
    .optional()
    .default('none'),
  catalogSize: z
    .enum(['na', '1-5', '6-25', '26-100', '100+', 'unsure'])
    .optional()
    .default('na'),
  customIntegrations: z.string().max(2000).optional().default(''),
});

/**
 * Rebuilds the wizard's own data shape so `classifyRouting` can be run here,
 * on the server, against the answers rather than against a decision the
 * browser handed us. /api/discovery/recommend returns a routing object the
 * wizard may already hold; it is deliberately ignored.
 */
function discoveryDataFrom(spec: z.infer<typeof ClaimSchema>): DiscoveryData {
  return {
    fullName: spec.fullName,
    email: spec.email,
    businessName: spec.businessName,
    industry: spec.industry,
    description: spec.description,
    targetAudience: spec.targetAudience,
    instagramUrl: '',
    linkedinUrl: '',
    goal: spec.goal,
    secondaryGoals: [],
    brandTone: spec.brandTone,
    pageCount: spec.pageCount as PageCount,
    timeline: spec.timeline as TimelineId,
    commerceMode: spec.commerceMode as CommerceMode,
    catalogSize: spec.catalogSize as CatalogSize,
    customIntegrations: spec.customIntegrations,
    selectedTier: spec.tier ?? '',
    subscription: '',
    billingCadence: 'monthly',
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.authenticated) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid claim request', issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const spec = parsed.data;

  try {
    const result = await claimPreview({
      previewId: spec.previewId,
      clerkUserId: auth.userId,
      clientEmail: await primaryEmail(),
      clientName: spec.fullName,
      businessName: spec.businessName,
      ...(spec.tier ? { tier: spec.tier } : {}),
      intakeSummary: {
        description: spec.description,
        industry: spec.industry,
        targetAudience: spec.targetAudience,
        goal: spec.goal,
        brandTone: spec.brandTone,
        pageCount: spec.pageCount,
        timeline: spec.timeline,
        commerceMode: spec.commerceMode,
        catalogSize: spec.catalogSize,
        customIntegrations: spec.customIntegrations,
      },
      routing: classifyRouting(discoveryDataFrom(spec)),
    });

    return NextResponse.json(
      {
        workspaceId: result.workspaceId,
        unlockUrl: result.unlockUrl,
        alreadyClaimed: result.alreadyClaimed,
        previewReady: result.previewReady,
        quoteMinor: result.quoteMinor,
        // Surfaced, not hidden: the client owns a workspace they cannot open
        // until this is retried, and the UI needs to be able to say so.
        ...(result.membershipError
          ? { membershipError: result.membershipError }
          : {}),
      },
      { status: result.alreadyClaimed ? 200 : 201 }
    );
  } catch (error) {
    if (error instanceof PreviewClaimConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error(
      '[Flowstarter] preview claim failed: ' +
        (error instanceof Error ? error.message : 'unknown error')
    );
    return NextResponse.json(
      { error: 'Could not claim this preview' },
      { status: 500 }
    );
  }
}

/**
 * Clerk owns the verified address; the wizard's typed email is not trusted for
 * billing. A Clerk hiccup must not fail a claim — Stripe Checkout will collect
 * the address itself when the workspace has none.
 */
async function primaryEmail(): Promise<string | null> {
  try {
    const user = await currentUser();
    if (!user) return null;
    const primary = user.emailAddresses?.find(
      (address) => address.id === user.primaryEmailAddressId
    );
    return (
      primary?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? null
    );
  } catch {
    return null;
  }
}
