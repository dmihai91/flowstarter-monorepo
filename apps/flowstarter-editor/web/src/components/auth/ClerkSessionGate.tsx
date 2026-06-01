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
import { useAuth } from "@clerk/clerk-react";
import { EditorLoginForm } from "./EditorLoginForm";

import {
  autoPairWithEditor,
  fetchClerkSession,
  type AutoPairResolution,
} from "../../lib/clerkSession";
import { TierProvider } from "../../hooks/useTier";

import { EditorBootstrapLoader } from "./EditorBootstrapLoader";
import { FlowstarterFMark } from "./FlowstarterFMark";
import { FlowstarterWordmark } from "../brand/FlowstarterWordmark";

/**
 * When the user lands here after a cross-domain sign-in on the marketing
 * app, the URL carries `?__clerk_ticket=<token>`. The Clerk React SDK
 * (mounted as <ClerkProvider> in main.tsx) consumes the ticket on mount,
 * exchanges it for a session, sets the JWT cookie, and finally strips
 * the param from the URL. All of that is async — `useAuth().isLoaded`
 * flips to `true` only once the exchange is complete.
 *
 * If we hit `/api/clerk/me` before that, the server sees no cookie yet,
 * returns `unauthenticated`, and we redirect back to login → infinite
 * loop. So when a ticket is present we have to wait for `isLoaded`
 * before bootstrapping the gate.
 *
 * We also defer until `isLoaded` for every Clerk-enabled load so the
 * session cookie is visible to `/api/clerk/me` after normal hydration.
 */
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

export function ClerkSessionGate(props: ClerkSessionGateProps) {
  // useAuth() throws outside <ClerkProvider>. The provider is only
  // mounted in main.tsx when VITE_CLERK_PUBLISHABLE_KEY is set, so we
  // mirror that gate here and only call useAuth() in the inner variant.
  const clerkConfigured =
    typeof import.meta.env.VITE_CLERK_PUBLISHABLE_KEY === "string" &&
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.trim().length > 0;

  if (clerkConfigured) {
    return <ClerkSessionGateWithSdk {...props} />;
  }
  return <ClerkSessionGateImpl {...props} waitingForTicketRedemption={false} />;
}

/**
 * Variant used when <ClerkProvider> is present. Subscribes to
 * `useAuth().isLoaded` so we can block the server-side `/api/clerk/me`
 * check until Clerk has consumed any `__clerk_ticket` from the URL and
 * set the session cookie. Without this gate, the bootstrap fires on
 * mount, sees no cookie, and triggers an infinite redirect loop.
 */
function ClerkSessionGateWithSdk(props: ClerkSessionGateProps) {
  const { isLoaded: clerkLoaded } = useAuth();
  /** Wait for Clerk to finish loading so session cookies exist before `/api/clerk/me` (ticket redemption and normal cookie hydration). */
  const waitingForTicketRedemption = !clerkLoaded;
  return (
    <ClerkSessionGateImpl
      {...props}
      waitingForTicketRedemption={waitingForTicketRedemption}
    />
  );
}

interface ClerkSessionGateImplProps extends ClerkSessionGateProps {
  readonly waitingForTicketRedemption: boolean;
}

function ClerkSessionGateImpl({
  children,
  resolutionOverride,
  bypass = false,
  waitingForTicketRedemption,
}: ClerkSessionGateImplProps) {
  const [state, setState] = useState<GateState>(
    resolutionOverride
      ? { kind: "resolved", resolution: resolutionOverride }
      : { kind: "loading" },
  );
  const startedRef = useRef(false);

  useEffect(() => {
    if (bypass) return;
    if (resolutionOverride !== undefined) return;
    if (waitingForTicketRedemption) return;
    if (startedRef.current) return;
    startedRef.current = true;

    const controller = new AbortController();
    void runGateBootstrap(controller.signal).then((resolution) => {
      setState({ kind: "resolved", resolution });
    });
    return () => controller.abort();
  }, [resolutionOverride, bypass, waitingForTicketRedemption]);

  if (bypass) {
    // Dev mode: no Clerk session, but downstream code (PowerUserOnly,
    // UsageChip, etc.) calls useTier() which throws without a provider.
    // Wire a synthetic admin identity so the editor surfaces work.
    const devIdentity = {
      userId: "dev-bypass",
      role: "admin" as const,
      tier: "admin" as const,
      allowedWorkspaceIds: [],
      currentWorkspace: null,
    };
    return <TierProvider identity={devIdentity}>{children}</TierProvider>;
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
      <ClerkRedirectScreen loginUrl={resolution.loginUrl ?? null} reason={resolution.reason} />
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
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const id = window.setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(id);
        resolve();
      },
      { once: true },
    );
  });
}

async function runGateBootstrapAttempt(signal: AbortSignal): Promise<AutoPairResolution> {
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

/**
 * One soft retry on `error` so a transient empty/failed first hop does not
 * flash the full error card before the second attempt succeeds.
 */
async function runGateBootstrap(signal: AbortSignal): Promise<AutoPairResolution> {
  const first = await runGateBootstrapAttempt(signal);
  if (first.status !== "error" || signal.aborted) {
    return first;
  }
  await sleep(420, signal);
  if (signal.aborted) {
    return first;
  }
  return runGateBootstrapAttempt(signal);
}

/* ── Auth screens ─────────────────────────────────────────────────────────
   Loading, ticket wait, and Clerk redirect use <EditorBootstrapLoader> so
   cold load → session check → marketing sign-in hop reads as one shell.
   Terminal outcomes (no workspace, misconfiguration, connection failure,
   missing login URL) still use <EditorAuthShell>: centered glass card,
   brand mark, actions.

   Nothing here imports the marketing app's <FlowBackground/> directly —
   the aura ships with the editor's own CSS (body::before in index.css)
   so even an unauthenticated bootstrap renders against the brand
   gradient without needing a provider tree above this component.
   ─────────────────────────────────────────────────────────────────── */

type AuthAction = {
  readonly label: string;
  readonly onClick?: () => void;
  readonly href?: string;
  readonly tone?: "primary" | "ghost";
};

interface EditorAuthShellProps {
  readonly state?: "loading" | "info" | "error";
  readonly overline: string;
  readonly title: ReactNode;
  readonly body: ReactNode;
  readonly footnote?: ReactNode;
  readonly actions?: ReadonlyArray<AuthAction>;
  /** Slot rendered between body and footnote — used to embed the
      inline Clerk <SignIn/> form so sign-in stays in the editor. */
  readonly children?: ReactNode;
}

function EditorAuthShell({
  state = "loading",
  overline,
  title,
  body,
  footnote,
  actions,
  children,
}: EditorAuthShellProps) {
  return (
    <div
      className="relative flex min-h-screen w-full flex-1 items-center justify-center overflow-hidden px-6 py-10"
      style={{
        fontFamily:
          '"Onest Variable", "Onest", "Plus Jakarta Sans", system-ui, sans-serif',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 0 }}
      >
        {/* A second, foreground aura layer so the auth screen has more
            depth than the editor proper — it's a hero moment. */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "-8%",
            width: "55%",
            height: "75%",
            background:
              "radial-gradient(closest-side, rgba(78,94,218,0.22), transparent 70%)",
            filter: "blur(60px)",
            animation: "fs-aura-breathe 14s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            right: "-6%",
            width: "45%",
            height: "65%",
            background:
              "radial-gradient(closest-side, rgba(180,83,9,0.12), transparent 72%)",
            filter: "blur(70px)",
            animation: "fs-aura-breathe 18s ease-in-out infinite 2s",
          }}
        />
      </div>

      <div
        className="relative flex w-full max-w-[440px] flex-col items-center gap-7 px-10 py-11 text-center"
        style={{
          zIndex: 1,
          background: "var(--fs-bg-elevated)",
          border: "1px solid var(--fs-rule-strong)",
          boxShadow: "var(--fs-glass-shadow)",
          borderRadius: 18,
        }}
      >
        <FlowstarterFMark />

        <div className="flex flex-col items-center gap-2.5">
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--fs-ink-faint)",
            }}
          >
            {overline}
          </span>
          <h1
            style={{
              fontFamily:
                '"Onest Variable", "Onest", "Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: "clamp(1.5rem, 2.6vw, 1.9rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--fs-ink)",
              margin: 0,
              textWrap: "balance",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: "var(--fs-ink-dim)",
              margin: 0,
              maxWidth: 320,
              textWrap: "pretty",
            }}
          >
            {body}
          </p>
        </div>

        {children ? (
          <div className="flex w-full justify-center">{children}</div>
        ) : null}

        {state === "loading" ? (
          <div
            className="relative h-[2px] w-32 overflow-hidden rounded-full"
            style={{ background: "var(--fs-rule)" }}
            aria-hidden
          >
            <div
              className="absolute top-0 h-full w-1/3 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, hsl(233, 65%, 50%), transparent)",
                animation: "fs-pulse-bar 1.4s ease-in-out infinite",
              }}
            />
          </div>
        ) : null}

        {actions && actions.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {actions.map((action, i) => {
              if (action.tone === "ghost") {
                const ghostStyle: React.CSSProperties = {
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 36,
                  padding: "0 16px",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                  borderRadius: 10,
                  background: "transparent",
                  color: "var(--fs-ink-dim)",
                  border: "1px solid var(--fs-rule-strong)",
                  cursor: "pointer",
                  textDecoration: "none",
                };
                if (action.href) {
                  return (
                    <a key={i} href={action.href} style={ghostStyle}>
                      {action.label}
                    </a>
                  );
                }
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={action.onClick}
                    style={ghostStyle}
                  >
                    {action.label}
                  </button>
                );
              }
              // Primary — picks up `.fs-cta` from theme so the auth
              // screen and the chat header's Publish button share the
              // exact same surface treatment (navy/indigo per mode).
              if (action.href) {
                return (
                  <a key={i} href={action.href} className="fs-cta">
                    {action.label}
                  </a>
                );
              }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={action.onClick}
                  className="fs-cta"
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {footnote ? (
          <p
            style={{
              fontSize: 11,
              color: "var(--fs-ink-faint)",
              margin: 0,
              maxWidth: 320,
            }}
          >
            {footnote}
          </p>
        ) : null}
      </div>

      <style>{`
        @keyframes fs-pulse-bar {
          0%   { transform: translateX(-200%); }
          100% { transform: translateX(400%); }
        }
        @keyframes fs-aura-breathe {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.78; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

function ClerkLoadingScreen() {
  return (
    <EditorBootstrapLoader statusLabel="Loading Flowstarter Assistant. Verifying your session before opening the workspace." />
  );
}

/**
 * Inline sign-in. Renders Clerk's <SignIn/> *inside* the editor's
 * auth shell instead of redirecting to flowstarter-main's /login.
 *
 * Why: a hard redirect to localhost:3000/login boots the entire
 * flowstarter-main app, which shows its own NavigationWrapper
 * loading screen — so the user saw two unrelated loaders back to
 * back. Keeping sign-in in the editor (ClerkProvider is mounted in
 * main.tsx) means one surface, one loader, no bounce.
 *
 * On success Clerk sets the session cookie; `fallbackRedirectUrl`
 * reloads the editor at the same URL so ClerkSessionGate re-runs
 * /api/clerk/me and resolves `paired`.
 *
 * Falls back to the old redirect only if the Clerk SDK isn't
 * available (no publishable key — `loginUrl` carries the server's
 * configured URL in that case).
 */
/**
 * Unauthenticated → render the shared <LoginForm/> (via the editor
 * adapter) inside the platform's AuthFormCard treatment. Same
 * component flowstarter-main uses, so the editor sign-in is
 * pixel-identical. No bounce to localhost:3000, no second app boot.
 *
 * `loginUrl` / `reason` are kept in the signature for the gate's
 * call-site contract but are no longer needed for a redirect — the
 * form drives the whole sign-in in-place via Clerk.
 */
function ClerkRedirectScreen(_props: {
  readonly loginUrl: string | null;
  readonly reason: string;
}) {
  // Client ↔ team toggled in place — same shared LoginForm, no
  // cross-app bounce. Mirrors the platform's "Admin? Sign in here →"
  // affordance (which on flowstarter-main navigates to /admin/login;
  // the editor has no separate route, so we flip the variant).
  const [variant, setVariant] = useState<"client" | "team">("client");

  return (
    <div
      // `h-dvh` (dynamic viewport) instead of `min-h-screen` so the
      // flex centering actually puts the card at the visual midline on
      // every device — `min-h-screen` only floors the height, allowing
      // a tall content stack to push the card down off-center.
      className="relative flex h-dvh w-full items-center justify-center overflow-y-auto px-6 py-10"
      style={{
        fontFamily:
          '"Onest Variable", "Onest", "Plus Jakarta Sans", system-ui, sans-serif',
      }}
    >
      {/* 540px — matches the platform's AuthFormCard max width. */}
      <div className="my-auto flex w-full max-w-[540px] flex-col items-center gap-7">
        {/* Brand lockup: mark + "Flowstarter Assistant" inline (same
            wordmark as the editor header), not a stacked overline. */}
        <FlowstarterWordmark size="lg" />
        <div className="flex flex-col items-center gap-2 text-center">
          <h1
            style={{
              fontFamily:
                '"Onest Variable", "Onest", "Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: "clamp(1.05rem, 1.9vw, 1.3rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--fs-ink)",
              margin: 0,
            }}
          >
            {variant === "team" ? (
              <>
                Admin <em className="fs-flourish">sign-in</em>
              </>
            ) : (
              <>
                Sign in to your{" "}
                <em className="fs-flourish">workspace</em>
              </>
            )}
          </h1>
          {/* Subtitle mirrors flowstarter-main's AuthLayout (title + muted
              subtitle), so the editor sign-in reads as the same screen. */}
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              color: "var(--fs-ink-faint)",
              margin: 0,
              maxWidth: "40ch",
            }}
          >
            {variant === "team"
              ? "Team access to manage client workspaces and publish their sites."
              : "Sign in to edit and publish your website with your Flowstarter assistant."}
          </p>
        </div>
        {/* Platform AuthFormCard treatment: glass card, hairline edge,
            landing 4-stop shadow, with the footer admin/client toggle
            link exactly like flowstarter-main's LoginClient. */}
        <div
          className="w-full rounded-2xl px-7 py-8 md:px-8"
          style={{
            background: "var(--fs-glass-bg)",
            border: "1px solid var(--fs-glass-edge)",
            boxShadow: "var(--fs-glass-shadow)",
            backdropFilter: "blur(24px) saturate(150%)",
            WebkitBackdropFilter: "blur(24px) saturate(150%)",
          }}
        >
          <EditorLoginForm variant={variant} />
          <div className="mt-5 border-t border-[var(--fs-rule)] pt-4 text-center">
            <button
              type="button"
              onClick={() =>
                setVariant((v) => (v === "client" ? "team" : "client"))
              }
              className="text-sm transition-colors"
              style={{ color: "var(--fs-ink-faint)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--purple)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--fs-ink-faint)";
              }}
            >
              {variant === "client"
                ? "Admin? Sign in here →"
                : "← Back to client sign-in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClerkNoWorkspaceScreen({ reason }: { readonly reason: string }) {
  return (
    <EditorAuthShell
      state="info"
      overline="Almost there"
      title={
        <>
          Your <em className="fs-flourish">workspace</em> is being set up
        </>
      }
      body={reason}
      footnote="The Flowstarter team will add you to a workspace once your project is ready. Reach out at support@flowstarter.dev if you've been waiting longer than a day."
    />
  );
}

function ClerkConfigErrorScreen({ reason }: { readonly reason: string }) {
  return (
    <EditorAuthShell
      state="error"
      overline="Configuration"
      title={
        <>
          The editor isn't <em className="fs-flourish">wired up</em> yet
        </>
      }
      body={reason}
      footnote={
        <>
          Set <code>CLERK_SECRET_KEY</code>,{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> on the editor server, then
          restart. For local dev without Clerk, append{" "}
          <code>?clerk-skip=true</code> to the URL.
        </>
      }
    />
  );
}

function ClerkErrorScreen({ reason }: { readonly reason: string }) {
  return (
    <EditorAuthShell
      state="error"
      overline="Connection"
      title={
        <>
          Couldn't reach <em className="fs-flourish">your editor</em>
        </>
      }
      body={reason}
      actions={[
        {
          label: "Try again",
          onClick: () => window.location.reload(),
          tone: "primary",
        },
      ]}
    />
  );
}
