/**
 * The editor wordmark. The "Flowstarter" mark is ported to match
 * flowstarter-main's header logo exactly (apps/flowstarter-main/src/
 * components/ui/logo.tsx → `LogoWordmark`): the shared design-system
 * `LogoMark` (gradient F square) beside an Inter 700 "Flowstarter" —
 * "Flow" in brand purple, "starter" in ink — followed by the editor's
 * product name, "Assistant", in a lighter muted weight so it reads as
 * one lockup: "Flowstarter Assistant".
 *
 * Single source of truth for the editor: used by the chat header (so
 * the editor reads like the marketing app's top bar) and the sidebar.
 * Keep the "Flowstarter" mark in sync with the platform `Logo`.
 */

import { LogoMark } from "@flowstarter/flow-design-system";

/** Mirrors the platform's `textSizes` / `markSizeBesideWordmark` maps. */
const TEXT_PX = { sm: 20, md: 24, lg: 30, xl: 36 } as const;
const MARK_SIZE = { sm: "xs", md: "sm", lg: "md", xl: "lg" } as const;

export function FlowstarterWordmark({
  size = "sm",
}: {
  readonly size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <span
      aria-label="Flowstarter Assistant"
      className="flex shrink-0 items-center gap-2.5"
    >
      <LogoMark size={MARK_SIZE[size]} className="shrink-0 self-center" />
      <span
        style={{
          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
          fontSize: TEXT_PX[size],
          letterSpacing: "-0.025em",
          lineHeight: 1,
        }}
      >
        <span style={{ fontWeight: 700 }}>
          <span
            style={{
              background:
                "linear-gradient(to right, var(--purple), var(--purple))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Flow
          </span>
          <span style={{ color: "var(--fs-ink)" }}>starter</span>
        </span>
        <span
          style={{
            fontWeight: 500,
            color: "var(--fs-ink-dim)",
            marginLeft: "0.4em",
          }}
        >
          Assistant
        </span>
      </span>
    </span>
  );
}
