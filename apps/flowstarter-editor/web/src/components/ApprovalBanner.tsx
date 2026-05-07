/**
 * Top-of-app banner that appears when a client opens the editor in
 * "review" mode (`?mode=review` on the URL). It surfaces the mockup
 * approval action so a non-technical client can sign off without
 * needing to find a button buried in the chat or settings.
 *
 * The admin sends a link like
 *   `https://{slug}.flowstarter.net/editor?mode=review`
 * to the client (V1: copy-paste manually; later: an admin "Send mockup
 * link" action will email this with a one-click magic-link auto-pair).
 *
 * Once approved the banner switches to a confirmation state for the
 * remainder of the session; the next page-load reads the persisted
 * `setup_mockup_approved_at` and skips the banner entirely.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { approveMockup, type ApproveMockupResolution } from "../lib/approveMockup";
import { useTier } from "../hooks/useTier";

type BannerState =
  | { readonly kind: "idle" }
  | { readonly kind: "submitting" }
  | { readonly kind: "approved"; readonly approvedAt: string }
  | { readonly kind: "error"; readonly reason: string };

function useReviewMode(): boolean {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      return mode === "review" || mode === "approve";
    } catch {
      return false;
    }
  }, []);
}

export function ApprovalBanner() {
  const reviewMode = useReviewMode();
  const tier = useTier();
  const [state, setState] = useState<BannerState>({ kind: "idle" });

  // Reset banner state if the user navigates back to the editor without
  // the review query — keeps the surface from sticking around past its
  // useful lifetime in SPA history.
  useEffect(() => {
    if (!reviewMode) setState({ kind: "idle" });
  }, [reviewMode]);

  const handleApprove = useCallback(async () => {
    setState({ kind: "submitting" });
    const result = await approveMockup();
    setState(mapResolution(result));
  }, []);

  if (!reviewMode) return null;
  // Admins shouldn't see the client-facing banner — they have the
  // Concierge tab in the main app for milestone management.
  if (tier.role === "admin") return null;
  if (!tier.currentWorkspace) return null;

  return (
    <div
      className="border-b border-[color:var(--fs-rule)] bg-[color:var(--fs-glass-bg)] px-4 py-3 backdrop-blur-md"
      role="region"
      aria-label="Mockup review"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[color:var(--fs-ink)]">
            {state.kind === "approved"
              ? "Thanks — your approval is recorded."
              : `Review your ${tier.currentWorkspace.name} mockup`}
          </p>
          <p className="text-xs text-[color:var(--fs-ink-dim)]">
            {bodyForState(state)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {state.kind === "approved" ? null : (
            <button
              type="button"
              disabled={state.kind === "submitting"}
              onClick={handleApprove}
              className="rounded-md bg-[color:var(--purple)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {state.kind === "submitting" ? "Approving…" : "Approve mockup"}
            </button>
          )}
          <a
            href="mailto:hello@flowstarter.net?subject=Mockup%20feedback"
            className="rounded-md border border-[color:var(--fs-rule)] px-3 py-1.5 text-xs font-semibold text-[color:var(--fs-ink-dim)] transition hover:bg-[color:var(--fs-glass-edge)]"
          >
            Request changes
          </a>
        </div>
      </div>
      {state.kind === "error" ? (
        <p className="mx-auto mt-2 max-w-5xl text-xs text-red-600 dark:text-red-300">
          {state.reason}
        </p>
      ) : null}
    </div>
  );
}

function mapResolution(result: ApproveMockupResolution): BannerState {
  if (result.status === "ok") {
    return { kind: "approved", approvedAt: result.approvedAt };
  }
  if (result.status === "already-approved") {
    return { kind: "approved", approvedAt: result.approvedAt };
  }
  return { kind: "error", reason: reasonOf(result) };
}

function reasonOf(result: ApproveMockupResolution): string {
  if ("reason" in result) return result.reason;
  return "Could not record approval. Please try again.";
}

function bodyForState(state: BannerState): string {
  switch (state.kind) {
    case "idle":
      return "Browse the site preview, then approve to move forward to launch — or send the team feedback if anything needs to change.";
    case "submitting":
      return "Sending your approval to the team…";
    case "approved":
      return "The team will move to the final invoice + launch step shortly.";
    case "error":
      return "We couldn't record your approval automatically. Please retry, or email us if it keeps failing.";
  }
}
