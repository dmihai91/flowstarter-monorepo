import type { EnvironmentId, ProjectEntry } from "@flowstarter/editor-contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileIcon, FolderIcon, CopyIcon, RefreshCwIcon, XIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";

import { useTier } from "~/hooks/useTier";
import { useEnvironmentConnectionEpoch } from "~/hooks/useEnvironmentConnectionEpoch";
import {
  projectListWorkspaceEntriesQueryOptions,
  projectQueryKeys,
  projectReadWorkspaceFileQueryOptions,
} from "~/lib/projectReactQuery";
import { readEnvironmentApi } from "~/environmentApi";
import { WorkspaceFileMonacoPreview } from "~/components/admin/WorkspaceFileMonacoPreview";
import { toastManager } from "./ui/toast";

const LIST_LIMIT = 200;

const FILES_WIDTH_STORAGE_KEY = "fs-editor-files-panel-width";
const FILES_MIN_WIDTH_PX = 280;
const FILES_NARROW_MAX_PX = 640;
const FILES_MAX_VW = 0.7;
const FILES_DEFAULT_VW = 0.42;
const FILES_DEFAULT_CAP_PX = 520;
const FILES_ENTRY_ANIM_MS = 230;

function maxFilesWidthPx(): number {
  if (typeof window === "undefined") return FILES_DEFAULT_CAP_PX;
  return Math.floor(window.innerWidth * FILES_MAX_VW);
}

function defaultFilesWidthPx(): number {
  if (typeof window === "undefined") return 420;
  return Math.min(Math.floor(window.innerWidth * FILES_DEFAULT_VW), FILES_DEFAULT_CAP_PX);
}

function clampFilesWidth(px: number): number {
  const max = maxFilesWidthPx();
  const min = FILES_MIN_WIDTH_PX;
  if (max < min) return Math.max(1, max);
  return Math.min(max, Math.max(min, px));
}

function readStoredFilesWidth(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FILES_WIDTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function resolveInitialFilesWidth(): number {
  const stored = readStoredFilesWidth();
  const base = stored ?? defaultFilesWidthPx();
  return clampFilesWidth(base);
}

/** Session visibility for the admin files drawer (same tab). */
const FILES_PANEL_OPEN_STORAGE_KEY = "fs-editor-files-panel-open";
/** Same-tab header sync (Preview vs Files toggle). */
const PANELS_STATE_EVENT = "flowstarter:panels-state";

interface FilesPanelTarget {
  readonly environmentId: EnvironmentId;
  readonly cwd: string;
}

function persistFilesPanelOpen(next: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(FILES_PANEL_OPEN_STORAGE_KEY, next ? "true" : "false");
  } catch {
    /* private mode / quota */
  }
}

/**
 * Admin-only workspace file browser. Slides in from the **right** (same shell as
 * `PreviewPanel`). Opens from the chat header via `flowstarter:toggle-files`.
 * Width is persisted under `fs-editor-files-panel-width` (localStorage); open
 * state is mirrored to `sessionStorage` under `fs-editor-files-panel-open`.
 */
export function AdminFilesPanel() {
  const tier = useTier();
  useEnvironmentConnectionEpoch();
  const queryClient = useQueryClient();
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<FilesPanelTarget | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const [panelWidth, setPanelWidth] = useState(resolveInitialFilesWidth);
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= FILES_NARROW_MAX_PX : false,
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

  const commitOpen = useCallback((next: boolean) => {
    openRef.current = next;
    setOpen(next);
    persistFilesPanelOpen(next);
  }, []);

  const canReachEnvironmentRpc =
    tier.role === "admin" &&
    target !== null &&
    readEnvironmentApi(target.environmentId) !== undefined;

  const listQuery = useQuery(
    projectListWorkspaceEntriesQueryOptions({
      environmentId: target?.environmentId ?? null,
      cwd: target?.cwd ?? null,
      limit: LIST_LIMIT,
      enabled: open && canReachEnvironmentRpc,
    }),
  );

  useEffect(() => {
    setSelectedPath(null);
  }, [target?.environmentId, target?.cwd]);

  useEffect(() => {
    const onToggle = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { open?: boolean; environmentId?: EnvironmentId; cwd?: string | null }
        | undefined;

      if (typeof detail?.open === "boolean" && detail.open) {
        const trimmed = typeof detail.cwd === "string" ? detail.cwd.trim() : "";
        if (detail.environmentId && trimmed.length > 0) {
          setTarget({ environmentId: detail.environmentId, cwd: trimmed });
        } else {
          setTarget(null);
        }
      } else if (detail?.environmentId) {
        const trimmed = typeof detail.cwd === "string" ? detail.cwd.trim() : "";
        if (trimmed.length > 0) {
          setTarget({ environmentId: detail.environmentId, cwd: trimmed });
        }
      }

      if (typeof detail?.open === "boolean") {
        commitOpen(detail.open);
        return;
      }

      commitOpen(!openRef.current);
    };

    window.addEventListener("flowstarter:toggle-files", onToggle);
    return () => {
      window.removeEventListener("flowstarter:toggle-files", onToggle);
    };
  }, [commitOpen]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(PANELS_STATE_EVENT, { detail: { files: open } }));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      commitOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, commitOpen]);

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
    const mq = window.matchMedia(`(max-width: ${FILES_NARROW_MAX_PX}px)`);
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
    }, FILES_ENTRY_ANIM_MS);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    const onResize = () => {
      if (resizeStateRef.current) return;
      setPanelWidth((w) => clampFilesWidth(w));
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
    const finalWidth = clampFilesWidth(st.pendingWidth);
    try {
      localStorage.setItem(FILES_WIDTH_STORAGE_KEY, String(Math.round(finalWidth)));
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
    const next = clampFilesWidth(st.startWidth + (st.startX - event.clientX));
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

  const refetchList = useCallback(() => {
    if (!target) return;
    void queryClient.invalidateQueries({
      queryKey: projectQueryKeys.listWorkspaceEntries(target.environmentId, target.cwd, LIST_LIMIT),
    });
  }, [queryClient, target]);

  const copyAtPath = useCallback((entryPath: string) => {
    const token = `@${entryPath} `;
    void navigator.clipboard.writeText(token).then(
      () => {
        toastManager.add({
          title: "Copied for composer",
          description: `${token.trim()} — paste into the message field.`,
          type: "success",
        });
      },
      () => {
        toastManager.add({
          title: "Could not copy",
          description: "Clipboard permission was denied.",
          type: "error",
        });
      },
    );
  }, []);

  const entries = listQuery.data?.entries ?? [];
  const truncated = listQuery.data?.truncated ?? false;

  const treeRows = useMemo(() => flattenEntriesToTreeRows(entries), [entries]);

  const selectedEntry = useMemo(() => {
    if (!selectedPath) return null;
    return treeRows.find((row) => row.path === selectedPath) ?? null;
  }, [treeRows, selectedPath]);

  const previewPath = selectedEntry?.kind === "file" ? selectedPath : null;

  const previewQuery = useQuery(
    projectReadWorkspaceFileQueryOptions({
      environmentId: target?.environmentId ?? null,
      cwd: target?.cwd ?? null,
      relativePath: previewPath,
      enabled: open && canReachEnvironmentRpc && previewPath !== null,
    }),
  );

  // Prefer `isLoading` over `isPending`: in TanStack Query v5, disabled queries stay
  // `pending` with `fetchStatus: idle`, which would otherwise spin forever if we
  // treated `isPending` alone as “loading”.
  const showPreviewSpinner =
    previewPath !== null &&
    !previewQuery.isError &&
    (previewQuery.isLoading ||
      (previewQuery.isFetching && previewQuery.data === undefined));

  const onRowClick = useCallback((entry: ProjectEntry) => {
    setSelectedPath(entry.path);
  }, []);

  const entryAnimation =
    playEntryAnimation && !prefersReducedMotion
      ? "fs-side-drawer-slide-in 220ms cubic-bezier(0.22, 1, 0.36, 1)"
      : undefined;

  const widthStyle = isNarrow
    ? { width: "100%", maxWidth: "100vw" as const }
    : { width: `${clampFilesWidth(panelWidth)}px` };

  if (!open) {
    return null;
  }

  /**
   * Portal to `document.body`: `#root` uses `z-index: 1` (see `index.css`), while
   * sheet/dialog portals (e.g. diff `Sheet` at `z-50`) render as body siblings above
   * the whole React tree. A fixed panel inside `#root` cannot paint above those
   * layers no matter how high its own z-index is. Drawer uses `z-[41]` (backdrop
   * `z-[39]`) so it stays above in-root `PreviewPanel` (`z-40`) when both mount.
   */
  const body = typeof document !== "undefined" ? document.body : null;
  if (!body) {
    return null;
  }

  const panel = (
    <>
      <button
        type="button"
        aria-label="Dismiss workspace files panel"
        className="fixed inset-0 z-[39] bg-black/20 backdrop-blur-[2px] transition-opacity dark:bg-black/35"
        onClick={() => commitOpen(false)}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Workspace files"
        className="fs-preview-drawer fixed right-0 top-0 z-[41] flex h-screen flex-col"
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
            aria-label="Resize files panel"
            title="Drag to resize files panel"
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

        {tier.role !== "admin" ? (
          <DeniedChrome onClose={() => commitOpen(false)} />
        ) : !target ? (
          <>
            <div
              className="fs-preview-drawer-toolbar flex shrink-0 items-center justify-between gap-2 px-4"
              style={{ height: 48 }}
            >
              <span
                className="text-[10px] font-medium uppercase"
                style={{
                  fontFamily: "var(--fs-font-mono)",
                  letterSpacing: "0.28em",
                  color: "var(--fs-ink-mono)",
                }}
              >
                Files
              </span>
              <button
                type="button"
                onClick={() => commitOpen(false)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--fs-accent-bg)]"
                style={{ color: "var(--fs-ink-dim)" }}
                aria-label="Close files panel"
                title="Close (Esc)"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
            <div
              className="flex flex-1 flex-col items-start gap-2 px-5 py-6 text-[13px]"
              style={{ color: "var(--fs-ink-dim)" }}
            >
              <p style={{ color: "var(--fs-ink)" }}>No project folder in this context.</p>
              <p>Open a thread with an active project, then use Files again.</p>
            </div>
          </>
        ) : !canReachEnvironmentRpc ? (
          <>
            <div
              className="fs-preview-drawer-toolbar flex shrink-0 items-center justify-between gap-2 px-4"
              style={{ height: 48 }}
            >
              <span
                className="text-[10px] font-medium uppercase"
                style={{
                  fontFamily: "var(--fs-font-mono)",
                  letterSpacing: "0.28em",
                  color: "var(--fs-ink-mono)",
                }}
              >
                Files
              </span>
              <button
                type="button"
                onClick={() => commitOpen(false)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--fs-accent-bg)]"
                style={{ color: "var(--fs-ink-dim)" }}
                aria-label="Close files panel"
                title="Close (Esc)"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
            <div
              className="flex flex-1 flex-col items-start gap-2 px-5 py-6 text-[13px]"
              style={{ color: "var(--fs-ink-dim)" }}
            >
              <p style={{ color: "var(--fs-ink)" }}>Connect workspace</p>
              <p>
                This browser tab does not have an active WebSocket RPC session for this workspace yet.
                Finish pairing (or wait until the environment shows connected), then open Files again.
              </p>
            </div>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div
              className="fs-preview-drawer-toolbar flex shrink-0 items-center gap-2 px-4"
              style={{ height: 48 }}
            >
              <span
                className="text-[10px] font-medium uppercase"
                style={{
                  fontFamily: "var(--fs-font-mono)",
                  letterSpacing: "0.28em",
                  color: "var(--fs-ink-mono)",
                }}
              >
                Files
              </span>
              <span aria-hidden className="select-none text-[12px]" style={{ color: "var(--fs-warm)" }}>
                ·
              </span>
              <span
                className="min-w-0 flex-1 truncate font-mono text-[11px]"
                style={{ color: "var(--fs-ink-dim)" }}
                title={target.cwd}
              >
                {target.cwd}
              </span>
              <button
                type="button"
                onClick={() => refetchList()}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--fs-accent-bg)]"
                style={{ color: "var(--fs-ink-dim)" }}
                aria-label="Refresh file list"
                title="Refresh file list"
                disabled={listQuery.isFetching}
              >
                <RefreshCwIcon className={`size-3.5 ${listQuery.isFetching ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => commitOpen(false)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--fs-accent-bg)]"
                style={{ color: "var(--fs-ink-dim)" }}
                aria-label="Close files panel"
                title="Close (Esc)"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>

            <div className="fs-preview-drawer-frame flex min-h-0 flex-1 flex-col overflow-hidden !m-3 !mt-2">
              {listQuery.isLoading ? (
                <div
                  className="flex flex-1 items-center justify-center px-4 py-10 text-[13px]"
                  style={{ color: "var(--fs-ink-dim)" }}
                >
                  Loading workspace index…
                </div>
              ) : listQuery.isError ? (
                <div
                  className="flex flex-1 flex-col gap-2 px-4 py-5 text-[13px]"
                  style={{ color: "var(--fs-ink)" }}
                >
                  <p className="font-medium">Could not load files</p>
                  <p style={{ color: "var(--fs-ink-dim)" }}>{formatListError(listQuery.error)}</p>
                </div>
              ) : treeRows.length === 0 ? (
                <div
                  className="flex flex-1 items-center justify-center px-4 py-10 text-[13px]"
                  style={{ color: "var(--fs-ink-dim)" }}
                >
                  No indexed paths in this workspace (yet).
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 gap-2">
                  <div
                    className="flex min-h-0 min-w-[140px] w-[min(42%,280px)] shrink-0 flex-col rounded-md border border-[var(--fs-rule)]"
                    style={{ background: "var(--fs-sidebar-lavender-veil)" }}
                  >
                    <ul
                      className="fs-files-scroll min-h-0 flex-1 list-none overflow-y-auto p-1"
                      style={{ margin: 0 }}
                    >
                      {treeRows.map((row) => {
                        const isDir = row.kind === "directory";
                        const isSelected = selectedPath === row.path;
                        return (
                          <li key={row.path}>
                            <button
                              type="button"
                              onClick={() => onRowClick(row)}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors"
                              style={{
                                paddingLeft: 8 + row.depth * 14,
                                fontFamily: "var(--fs-font-mono)",
                                color: "var(--fs-ink)",
                                background: isSelected ? "var(--fs-accent-bg)" : "transparent",
                                border: isSelected
                                  ? "1px solid var(--fs-glass-edge)"
                                  : "1px solid transparent",
                              }}
                              title={isDir ? "Folder" : "File — preview on the right"}
                            >
                              {isDir ? (
                                <FolderIcon
                                  className="size-3.5 shrink-0"
                                  style={{ color: "var(--fs-warm)" }}
                                />
                              ) : (
                                <FileIcon
                                  className="size-3.5 shrink-0"
                                  style={{ color: "var(--fs-ink-dim)" }}
                                />
                              )}
                              <span className="min-w-0 flex-1 truncate">{row.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div
                    className="flex min-h-0 min-w-0 flex-1 flex-col rounded-md border border-[var(--fs-rule)]"
                    style={{ background: "var(--fs-sidebar-lavender-veil)" }}
                  >
                    <div
                      className="flex shrink-0 items-center gap-2 border-b border-[var(--fs-rule)] px-2 py-1.5"
                      style={{ minHeight: 36 }}
                    >
                      {selectedEntry && selectedEntry.kind === "file" ? (
                        <>
                          <span
                            className="min-w-0 flex-1 truncate font-mono text-[11px]"
                            style={{ color: "var(--fs-ink-dim)" }}
                            title={selectedEntry.path}
                          >
                            {selectedEntry.path}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyAtPath(selectedEntry.path)}
                            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-[11px] transition-colors hover:bg-[var(--fs-accent-bg)]"
                            style={{ color: "var(--fs-ink-dim)" }}
                            title="Copy @path for the composer"
                          >
                            <CopyIcon className="size-3" />
                            <span className="hidden sm:inline">Copy</span>
                          </button>
                        </>
                      ) : selectedEntry && selectedEntry.kind === "directory" ? (
                        <span className="text-[12px]" style={{ color: "var(--fs-ink-dim)" }}>
                          Folders are not previewed — pick a file.
                        </span>
                      ) : (
                        <span className="text-[12px]" style={{ color: "var(--fs-ink-dim)" }}>
                          Select a file to preview
                        </span>
                      )}
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                      {!previewPath ? null : showPreviewSpinner ? (
                        <div className="p-2">
                          <p className="font-mono text-xs" style={{ color: "var(--fs-ink-dim)" }}>
                            Loading…
                          </p>
                        </div>
                      ) : previewQuery.isError ? (
                        <div
                          role="alert"
                          className="space-y-1 p-2 text-[12px]"
                          style={{ color: "var(--fs-ink)" }}
                        >
                          <p className="font-medium">Could not load file</p>
                          <p style={{ color: "var(--fs-ink-dim)" }}>
                            {formatReadError(previewQuery.error)}
                          </p>
                        </div>
                      ) : previewQuery.data?.kind === "binary" ? (
                        <div className="p-2">
                          <p className="font-mono text-xs" style={{ color: "var(--fs-warm)" }}>
                            Binary file — preview not available.
                          </p>
                        </div>
                      ) : (
                        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2">
                          {previewQuery.data?.truncated ? (
                            <p
                              className="shrink-0 font-mono text-[11px]"
                              style={{ color: "var(--fs-warm)" }}
                            >
                              Preview truncated (first 512 KiB).
                            </p>
                          ) : null}
                          <div className="min-h-0 min-w-0 flex-1">
                            <WorkspaceFileMonacoPreview
                              path={previewPath}
                              content={previewQuery.data?.content ?? ""}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {truncated ? (
                <p
                  className="shrink-0 border-t border-[var(--fs-rule)] px-3 py-2 text-[11px]"
                  style={{ color: "var(--fs-warm)" }}
                >
                  List truncated at {LIST_LIMIT} paths. Narrow the workspace or raise the limit later.
                </p>
              ) : null}
            </div>
          </div>
        )}
      </aside>
    </>
  );

  return createPortal(panel, body);
}

function DeniedChrome(props: { readonly onClose: () => void }) {
  return (
    <>
      <div
        className="fs-preview-drawer-toolbar flex shrink-0 items-center justify-between gap-2 px-4"
        style={{ height: 48 }}
      >
        <span
          className="text-[10px] font-medium uppercase"
          style={{
            fontFamily: "var(--fs-font-mono)",
            letterSpacing: "0.28em",
            color: "var(--fs-ink-mono)",
          }}
        >
          Files
        </span>
        <button
          type="button"
          onClick={props.onClose}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--fs-accent-bg)]"
          style={{ color: "var(--fs-ink-dim)" }}
          aria-label="Close files panel"
          title="Close (Esc)"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-6 text-[13px]" style={{ color: "var(--fs-ink-dim)" }}>
        <p style={{ color: "var(--fs-ink)" }}>Team admin only</p>
        <p>Your account does not have access to the workspace file browser.</p>
      </div>
    </>
  );
}

interface TreeRow extends ProjectEntry {
  readonly depth: number;
  readonly label: string;
}

function flattenEntriesToTreeRows(entries: ReadonlyArray<ProjectEntry>): TreeRow[] {
  return [...entries]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((entry) => {
      const segments = entry.path.split("/").filter((s) => s.length > 0);
      const depth = Math.max(0, segments.length - 1);
      const label = segments[segments.length - 1] ?? entry.path;
      return { ...entry, depth, label };
    });
}

function messageFromUnknown(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const m = (error as { message: unknown }).message;
    if (typeof m === "string" && m.trim().length > 0) {
      return m;
    }
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function formatReadError(error: unknown): string {
  const msg = messageFromUnknown(error);
  if (msg.includes("Timed out after")) {
    return `${msg} Reconnect from the environment menu if this keeps happening.`;
  }
  if (msg.includes("Team admin access") || msg.includes("read workspace")) {
    return "You need a team admin session (owner role) to read files from the server.";
  }
  if (msg.includes("Environment API not found")) {
    return "This workspace is not connected over WebSocket — reconnect and try again.";
  }
  return msg;
}

function formatListError(error: unknown): string {
  const msg = messageFromUnknown(error);
  if (msg.includes("Team admin access") || msg.includes("list workspace")) {
    return "You need a team admin session (owner role) to list files from the server.";
  }
  if (msg.includes("Environment API not found")) {
    return "This workspace is not connected over WebSocket — reconnect and try again.";
  }
  return msg;
}
