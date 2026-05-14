import { SidebarInset, SidebarTrigger } from "./ui/sidebar";

/* Empty state when no thread is selected. Editorial concierge voice
   (mono eyebrow, sans display headline with an italic indigo flourish,
   lead body) — matches the landing's hero treatment instead of the
   stock shadcn `Empty` card. The whole card is centered against the
   viewport via `min-h-screen` + flex centering, not against an `Empty`
   wrapper that may collapse. */
export function NoActiveThreadState() {
  return (
    <SidebarInset className="h-dvh min-h-0 overflow-hidden overscroll-y-none bg-background text-foreground">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-background">
        <header className="border-b border-border px-3 py-2 sm:px-5 sm:py-3">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="size-7 shrink-0" aria-label="Toggle thread sidebar" />
            <span
              style={{
                fontFamily: "var(--fs-font-mono)",
                fontSize: 9.5,
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "var(--fs-ink-faint)",
              }}
            >
              No active thread
            </span>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-6 py-12">
          <div className="relative z-10 mx-auto w-full max-w-xl text-center">
            <h1
              className="text-balance"
              style={{
                fontFamily: "var(--fs-font-sans)",
                fontWeight: 400,
                letterSpacing: "-0.025em",
                lineHeight: 1.06,
                color: "var(--fs-ink)",
                fontSize: "clamp(1.85rem, 3.6vw, 2.6rem)",
              }}
            >
              <span className="block">Pick a thread</span>
              <span className="fs-flourish mt-2 block">to keep going.</span>
            </h1>
            <p
              className="mx-auto mt-7 text-balance"
              style={{
                fontFamily: "var(--fs-font-sans)",
                fontSize: "clamp(0.98rem, 1.05vw, 1.05rem)",
                lineHeight: 1.6,
                color: "var(--fs-ink-dim)",
                maxWidth: "44ch",
              }}
            >
              Open an existing thread from the sidebar, or start a new one.
            </p>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
