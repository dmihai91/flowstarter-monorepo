/**
 * Wraps the editor app, ensuring the visitor has both a Clerk session AND
 * a T3 session cookie before children render.
 *
 * Lifecycle:
 *   1. Mount → POST `/api/clerk/auto-pair`. The server validates the Clerk
 *      JWT cookie, mints a single-use T3 pairing credential bound to the
 *      Clerk userId, exchanges it for a session, and sets the t3_session
 *      cookie on the response.
 *   2. `paired` → wrap children in <TierProvider> with the resolved
 *      identity. T3's existing bootstrap (HTTP/WS) finds the cookie and
 *      proceeds without showing the manual pairing UI.
 *   3. `unauthenticated` → hard-redirect to flowstarter.dev/login (the
 *      configured Clerk sign-in URL) so the user signs in and comes back.
 *   4. `no-workspace` → render a polite refusal: a Clerk user with no
 *      `workspace_memberships` (and not a team admin) has nothing to edit.
 *   5. `config-error` (server missing CLERK_SECRET_KEY or Supabase env)
 *      → render a developer-facing placeholder.
 *   6. `error` → render a retry surface.
 *
 * In dev, `?clerk-skip=true` short-circuits the gate and lets you fall
 * back to T3's manual pairing flow — useful when working on the editor
 * without a Clerk dev key set up.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  autoPairWithEditor,
  fetchClerkSession,
  redirectToLogin,
  type AutoPairResolution,
  type ClerkSessionResolution,
} from "../../lib/clerkSession";
import { TierProvider } from "../../hooks/useTier";

export interface ClerkSessionGateProps {
  readonly children: ReactNode;
  /**
   * Override for tests / Storybook. When provided, the gate skips the
   * network call and treats this resolution as the result.
   */
  readonly resolutionOverride?: AutoPairResolution;
  /**
   * When true, bypass the Clerk gate entirely and render children. Used
   * by the entry point when `?clerk-skip=true` is on the URL or
   * `VITE_DISABLE_CLERK_GATE=true` is set in dev.
   */
  readonly bypass?: boolean;
}

type GateState =
  | { readonly kind: "loading" }
  | { readonly kind: "resolved"; readonly resolution: AutoPairResolution };

export function ClerkSessionGate({
  children,
  resolutionOverride,
  bypass = false,
}: ClerkSessionGateProps) {
  const [state, setState] = useState<GateState>(
    resolutionOverride
      ? { kind: "resolved", resolution: resolutionOverride }
      : { kind: "loading" },
  );
  const startedRef = useRef(false);

  useEffect(() => {
    if (bypass) return;
    if (resolutionOverride !== undefined) return;
    if (startedRef.current) return;
    startedRef.current = true;

    const controller = new AbortController();
    void runGateBootstrap(controller.signal).then((resolution) => {
      setState({ kind: "resolved", resolution });
    });
    return () => controller.abort();
  }, [resolutionOverride, bypass]);

  if (bypass) {
    return <>{children}</>;
  }

  if (state.kind === "loading") {
    return <ClerkLoadingScreen />;
  }

  const { resolution } = state;

  if (resolution.status === "paired") {
    return <TierProvider identity={resolution.identity}>{children}</TierProvider>;
  }

  if (resolution.status === "unauthenticated") {
    return (
      <ClerkRedirectScreen
        loginUrl={resolution.loginUrl ?? null}
        reason={resolution.reason}
      />
    );
  }

  if (resolution.status === "no-workspace") {
    return <ClerkNoWorkspaceScreen reason={resolution.reason} />;
  }

  if (resolution.status === "config-error") {
    return <ClerkConfigErrorScreen reason={resolution.reason} />;
  }

  return <ClerkErrorScreen reason={resolution.reason} />;
}

/**
 * Compose the gate's bootstrap: do a quick `/api/clerk/me` so we can pull
 * the loginUrl out of an unauthenticated response, then fall through to
 * the auto-pair POST. We do both because `/api/clerk/me` is the only
 * route that returns a precomputed login URL with redirect_url already
 * appended; the auto-pair endpoint just rejects with 401.
 */
async function runGateBootstrap(signal: AbortSignal): Promise<AutoPairResolution> {
  const session = await fetchClerkSession(signal);
  if (session.status === "unauthenticated") {
    return {
      status: "unauthenticated",
      loginUrl: session.loginUrl,
      reason: session.reason,
    };
  }
  if (session.status === "config-error") {
    return { status: "config-error", reason: session.reason };
  }
  if (session.status === "error") {
    return { status: "error", reason: session.reason };
  }

  return autoPairWithEditor(signal);
}

function ClerkLoadingScreen() {
  return (
    <div className="flex h-full w-full items-center justify-center text-[color:var(--fs-ink-faint)]">
      <span className="text-sm">Authenticating…</span>
    </div>
  );
}

function ClerkRedirectScreen({
  loginUrl,
  reason,
}: {
  readonly loginUrl: string | null;
  readonly reason: string;
}) {
  useEffect(() => {
    if (loginUrl) {
      redirectToLogin(loginUrl);
    }
  }, [loginUrl]);
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-[color:var(--fs-ink-dim)]">
      <p className="text-sm">Redirecting to sign in…</p>
      <p className="text-xs text-[color:var(--fs-ink-faint)]">{reason}</p>
      {loginUrl ? (
        <a
          href={loginUrl}
          className="mt-2 text-xs text-[color:var(--purple)] underline"
        >
          Continue manually
        </a>
      ) : null}
    </div>
  );
}

function ClerkNoWorkspaceScreen({ reason }: { readonly reason: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-[color:var(--fs-ink)]">
      <h2 className="text-lg font-semibold">No workspace assigned yet</h2>
      <p className="max-w-md text-sm text-[color:var(--fs-ink-dim)]">{reason}</p>
      <p className="max-w-md text-xs text-[color:var(--fs-ink-faint)]">
        The Flowstarter team will add you to a workspace once your project is
        ready. Reach out if you've been waiting longer than a day.
      </p>
    </div>
  );
}

function ClerkConfigErrorScreen({ reason }: { readonly reason: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-[color:var(--fs-ink)]">
      <h2 className="text-lg font-semibold">Editor configuration error</h2>
      <p className="max-w-md text-sm text-[color:var(--fs-ink-dim)]">{reason}</p>
      <p className="max-w-md text-xs text-[color:var(--fs-ink-faint)]">
        Set <code>CLERK_SECRET_KEY</code>, <code>NEXT_PUBLIC_SUPABASE_URL</code>,
        and <code>SUPABASE_SERVICE_ROLE_KEY</code> on the editor server, then
        restart. To bypass the gate during local dev, append{" "}
        <code>?clerk-skip=true</code> to the URL.
      </p>
    </div>
  );
}

function ClerkErrorScreen({ reason }: { readonly reason: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-[color:var(--fs-ink)]">
      <h2 className="text-lg font-semibold">Could not contact the editor</h2>
      <p className="max-w-md text-sm text-[color:var(--fs-ink-dim)]">{reason}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 rounded-md border border-[color:var(--fs-rule)] px-3 py-1.5 text-xs text-[color:var(--fs-ink-dim)] hover:bg-[color:var(--fs-glass-bg)]"
      >
        Retry
      </button>
    </div>
  );
}
