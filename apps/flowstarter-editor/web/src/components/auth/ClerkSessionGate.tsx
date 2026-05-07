/**
 * Wraps the editor app, ensuring a Clerk-authenticated identity exists
 * before children render.
 *
 * Lifecycle:
 *   1. Mount → fetch `/api/clerk/me`.
 *   2. `authenticated` → set tier context and render children.
 *   3. `unauthenticated` → hard-redirect to the configured Clerk sign-in
 *      page (typically `flowstarter.dev/login?redirect_url=...`).
 *   4. `config-error` (server missing CLERK_SECRET_KEY) → render an
 *      explanatory placeholder so a developer can see what's wrong rather
 *      than getting stuck on a spinner.
 *   5. `error` → render a retry surface.
 *
 * The wiring into `__root.tsx` happens in the next slice (Clerk → auto-pair
 * replacement of T3's manual pairing flow). Until then this component is
 * importable but unused; it lets us land + test the data path.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

import { fetchClerkSession, redirectToLogin, type ClerkSessionResolution } from "../../lib/clerkSession";
import { TierProvider } from "../../hooks/useTier";

export interface ClerkSessionGateProps {
  readonly children: ReactNode;
  /**
   * Override for tests / Storybook. When provided, the gate skips the
   * network call and treats this resolution as the result.
   */
  readonly resolutionOverride?: ClerkSessionResolution;
}

type GateState =
  | { readonly kind: "loading" }
  | { readonly kind: "resolved"; readonly resolution: ClerkSessionResolution };

export function ClerkSessionGate({
  children,
  resolutionOverride,
}: ClerkSessionGateProps) {
  const [state, setState] = useState<GateState>(
    resolutionOverride
      ? { kind: "resolved", resolution: resolutionOverride }
      : { kind: "loading" },
  );
  const startedRef = useRef(false);

  useEffect(() => {
    if (resolutionOverride !== undefined) return;
    if (startedRef.current) return;
    startedRef.current = true;

    const controller = new AbortController();
    void fetchClerkSession(controller.signal).then((resolution) => {
      setState({ kind: "resolved", resolution });
    });
    return () => controller.abort();
  }, [resolutionOverride]);

  if (state.kind === "loading") {
    return <ClerkLoadingScreen />;
  }

  const { resolution } = state;

  if (resolution.status === "authenticated") {
    return <TierProvider identity={resolution.identity}>{children}</TierProvider>;
  }

  if (resolution.status === "unauthenticated") {
    // Defer the navigation to an effect so React doesn't complain about
    // setting state during render. The screen below is what the user sees
    // for the ~250ms before the redirect kicks in.
    return <ClerkRedirectScreen loginUrl={resolution.loginUrl} reason={resolution.reason} />;
  }

  if (resolution.status === "config-error") {
    return <ClerkConfigErrorScreen reason={resolution.reason} />;
  }

  return <ClerkErrorScreen reason={resolution.reason} />;
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
  readonly loginUrl: string;
  readonly reason: string;
}) {
  useEffect(() => {
    redirectToLogin(loginUrl);
  }, [loginUrl]);
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-[color:var(--fs-ink-dim)]">
      <p className="text-sm">Redirecting to sign in…</p>
      <p className="text-xs text-[color:var(--fs-ink-faint)]">{reason}</p>
      <a
        href={loginUrl}
        className="mt-2 text-xs text-[color:var(--purple)] underline"
      >
        Continue manually
      </a>
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
        restart.
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
