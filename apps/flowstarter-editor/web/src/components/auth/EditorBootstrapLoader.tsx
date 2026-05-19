import { colors } from "@flowstarter/flow-design-system/tokens";

import { APP_DISPLAY_NAME } from "../../branding";

export interface EditorBootstrapLoaderProps {
  /**
   * Announced to assistive tech; keep specific to the phase (loading vs redirecting).
   */
  readonly statusLabel: string;
}

/**
 * Full-viewport minimal loader used during Clerk bootstrap, auth redirects,
 * and pairing handshakes. Matches `SplashScreen` / index.css bar motion so
 * cold load → gate → redirect feels like one shell. The inner column is
 * width-capped to 540px so it lines up with the sign-in card.
 */
export function EditorBootstrapLoader(props: EditorBootstrapLoaderProps) {
  const splashGradient = colors.brand.gradient;
  return (
    <div
      className="flex min-h-screen w-full flex-1 items-center justify-center bg-transparent"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{props.statusLabel}</span>
      <div
        className="flex w-full max-w-[540px] flex-col items-center gap-4"
        aria-hidden
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundImage: splashGradient }}
          >
            F
          </div>
          <span className="text-lg font-semibold text-foreground">{APP_DISPLAY_NAME}</span>
        </div>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full animate-pulse rounded-full"
            style={{
              backgroundImage: splashGradient,
              width: "60%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
