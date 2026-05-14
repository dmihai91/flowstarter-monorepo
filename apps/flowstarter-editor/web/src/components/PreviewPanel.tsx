import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { ExternalLinkIcon, RefreshCwIcon, XIcon } from "lucide-react";

/**
 * Side-panel preview of the live demo site. Slides in from the right
 * over the editor when opened.
 *
 * Toggle via the global window event `flowstarter:toggle-preview` —
 * dispatched by the chat header's Preview button. Dispatching with
 * `{ detail: { open: true | false } }` forces a state; dispatching
 * with no detail toggles.
 *
 * Listens for `flowstarter:reload-preview` to bust the iframe (used
 * after the agent saves a file in a non-HMR demo).
 *
 * Emits `flowstarter:panels-state` so the header toggle stays in sync
 * when the panel is closed from the chrome or Escape.
 */

const PREVIEW_DEFAULT_URL =
  ((typeof window !== "undefined"
    ? (import.meta.env.VITE_PREVIEW_URL as string | undefined)
    : undefined) ?? "http://localhost:4322")
    .toString()
    .trim() || "http://localhost:4322";

const PREVIEW_WIDTH_STORAGE_KEY = "fs-editor-preview-width";
/** Same-tab header sync (Preview vs Files toggle). */
const PANELS_STATE_EVENT = "flowstarter:panels-state";
const PREVIEW_MIN_WIDTH_PX = 280;
/** Viewports at or below this width use full-bleed preview; resize rail hidden. */
const PREVIEW_NARROW_MAX_PX = 640;
const PREVIEW_MAX_VW = 0.7;
const PREVIEW_DEFAULT_VW = 0.54;
const PREVIEW_DEFAULT_CAP_PX = 920;
const ENTRY_ANIM_MS = 230;

function maxPreviewWidthPx(): number {
  if (typeof window === "undefined") return PREVIEW_DEFAULT_CAP_PX;
  return Math.floor(window.innerWidth * PREVIEW_MAX_VW);
}

function defaultPreviewWidthPx(): number {
  if (typeof window === "undefined") return 640;
  return Math.min(Math.floor(window.innerWidth * PREVIEW_DEFAULT_VW), PREVIEW_DEFAULT_CAP_PX);
}

function clampPreviewWidth(px: number): number {
  const max = maxPreviewWidthPx();
  const min = PREVIEW_MIN_WIDTH_PX;
  if (max < min) return Math.max(1, max);
  return Math.min(max, Math.max(min, px));
}

function readStoredPreviewWidth(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREVIEW_WIDTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function resolveInitialPanelWidth(): number {
  const stored = readStoredPreviewWidth();
  const base = stored ?? defaultPreviewWidthPx();
  return clampPreviewWidth(base);
}

export function PreviewPanel() {
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [url, setUrl] = useState(PREVIEW_DEFAULT_URL);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [panelWidth, setPanelWidth] = useState(resolveInitialPanelWidth);
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= PREVIEW_NARROW_MAX_PX : false,
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [playEntryAnimation, setPlayEntryAnimation] = useState(false);

  const entryAnimGenerationRef = useRef(0);
  const resizeStateRef = useRef<{
    pointerId: number;
    startX: number;
    startWidth: number;
    pendingWidth: number;
    rafId: number | null;
    rail: HTMLButtonElement;
  } | null>(null);

  useEffect(() => {
    const onToggle = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { open?: boolean; url?: string }
        | undefined;
      if (detail?.url) setUrl(detail.url);
      if (typeof detail?.open === "boolean") setOpen(detail.open);
      else setOpen((prev) => !prev);
    };
    const onReload = () => setReloadKey((k) => k + 1);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("flowstarter:toggle-preview", onToggle);
    window.addEventListener("flowstarter:reload-preview", onReload);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("flowstarter:toggle-preview", onToggle);
      window.removeEventListener("flowstarter:reload-preview", onReload);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(PANELS_STATE_EVENT, { detail: { preview: open } }),
    );
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(max-width: ${PREVIEW_NARROW_MAX_PX}px)`);
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) {
      setPlayEntryAnimation(false);
      return;
    }
    entryAnimGenerationRef.current += 1;
    const generation = entryAnimGenerationRef.current;
    setPlayEntryAnimation(true);
    const id = window.setTimeout(() => {
      if (entryAnimGenerationRef.current === generation) {
        setPlayEntryAnimation(false);
      }
    }, ENTRY_ANIM_MS);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    const onResize = () => {
      if (resizeStateRef.current) return;
      setPanelWidth((w) => clampPreviewWidth(w));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const stopResize = useCallback((pointerId: number) => {
    const st = resizeStateRef.current;
    if (!st) return;
    if (st.rafId !== null) {
      window.cancelAnimationFrame(st.rafId);
      st.rafId = null;
    }
    const finalWidth = clampPreviewWidth(st.pendingWidth);
    try {
      localStorage.setItem(PREVIEW_WIDTH_STORAGE_KEY, String(Math.round(finalWidth)));
    } catch {
      // ignore quota / private mode
    }
    setPanelWidth(finalWidth);
    if (st.rail.hasPointerCapture(pointerId)) {
      st.rail.releasePointerCapture(pointerId);
    }
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
    resizeStateRef.current = null;
  }, []);

  const onResizePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (isNarrow || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
      resizeStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startWidth: panelWidth,
        pendingWidth: panelWidth,
        rafId: null,
        rail: event.currentTarget,
      };
    },
    [isNarrow, panelWidth],
  );

  const onResizePointerMove = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    const st = resizeStateRef.current;
    if (!st || st.pointerId !== event.pointerId) return;
    event.preventDefault();
    const next = clampPreviewWidth(st.startWidth + (st.startX - event.clientX));
    st.pendingWidth = next;
    if (st.rafId !== null) return;
    st.rafId = window.requestAnimationFrame(() => {
      const cur = resizeStateRef.current;
      if (!cur) return;
      cur.rafId = null;
      setPanelWidth(cur.pendingWidth);
    });
  }, []);

  const onResizePointerEnd = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const st = resizeStateRef.current;
      if (!st || st.pointerId !== event.pointerId) return;
      stopResize(event.pointerId);
    },
    [stopResize],
  );

  useEffect(() => {
    return () => {
      const st = resizeStateRef.current;
      if (st?.rafId != null) {
        window.cancelAnimationFrame(st.rafId);
      }
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
  }, []);

  if (!open) return null;

  const entryAnimation =
    playEntryAnimation && !prefersReducedMotion
      ? "fs-side-drawer-slide-in 220ms cubic-bezier(0.22, 1, 0.36, 1)"
      : undefined;

  const widthStyle = isNarrow
    ? { width: "100%", maxWidth: "100vw" as const }
    : { width: `${clampPreviewWidth(panelWidth)}px` };

  return (
    <aside
      role="complementary"
      aria-label="Live site preview"
      className="fs-preview-drawer fixed right-0 top-0 z-40 flex h-screen flex-col"
      style={{
        ...widthStyle,
        left: "auto",
        right: 0,
        animation: entryAnimation,
      }}
    >
      {!isNarrow ? (
        <button
          type="button"
          className="fs-preview-drawer-resize absolute bottom-0 left-0 top-0 z-50 w-3 cursor-ew-resize"
          aria-label="Resize preview panel"
          title="Drag to resize preview"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerEnd}
          onPointerCancel={onResizePointerEnd}
          onLostPointerCapture={(event) => {
            if (resizeStateRef.current?.pointerId === event.pointerId) {
              stopResize(event.pointerId);
            }
          }}
        />
      ) : null}

      {/* ── Toolbar ── editorial: mono label · warm bullet · url ── */}
      <div
        className="fs-preview-drawer-toolbar flex shrink-0 items-center gap-2 px-4"
        style={{
          height: 48,
        }}
      >
        <span
          className="text-[10px] font-medium uppercase"
          style={{
            fontFamily: "var(--fs-font-mono)",
            letterSpacing: "0.28em",
            color: "var(--fs-ink-mono)",
          }}
        >
          Preview
        </span>
        <span
          aria-hidden
          className="select-none text-[12px]"
          style={{ color: "var(--fs-warm)" }}
        >
          ·
        </span>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setReloadKey((k) => k + 1);
          }}
          className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-[12px] outline-none transition-colors"
          style={{
            color: "var(--fs-ink)",
            background: "var(--fs-glass-bg)",
            border: "1px solid var(--fs-glass-edge)",
          }}
          spellCheck={false}
          aria-label="Preview URL"
        />
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--fs-accent-bg)]"
          style={{ color: "var(--fs-ink-dim)" }}
          aria-label="Reload preview"
          title="Reload preview"
        >
          <RefreshCwIcon className="size-3.5" />
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--fs-accent-bg)]"
          style={{ color: "var(--fs-ink-dim)" }}
          aria-label="Open preview in a new tab"
          title="Open in new tab"
        >
          <ExternalLinkIcon className="size-3.5" />
        </a>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--fs-accent-bg)]"
          style={{ color: "var(--fs-ink-dim)" }}
          aria-label="Close preview"
          title="Close (Esc)"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>

      {/* ── Iframe ─────────────────────────────────────────────── */}
      <div className="fs-preview-drawer-frame">
        <iframe
          key={reloadKey}
          ref={iframeRef}
          src={url}
          title="Live preview"
          className="min-h-0 w-full flex-1 border-0"
          style={{ background: "var(--fs-bg-base)" }}
        />
      </div>
    </aside>
  );
}
