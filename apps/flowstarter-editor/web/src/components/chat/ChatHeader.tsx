import { type EnvironmentId, type ThreadId } from "@flowstarter/editor-contracts";
import { scopeThreadRef } from "@flowstarter/editor-client-runtime";
import { memo, useCallback, useEffect, useState, type KeyboardEvent, type MouseEvent } from "react";
import GitActionsControl from "../GitActionsControl";
import { EyeIcon, FilesIcon, RocketIcon } from "lucide-react";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { SidebarTrigger } from "../ui/sidebar";
import { PowerUserOnly } from "../auth/TierGate";
import { useTier } from "~/hooks/useTier";
import { EditorAccountChip, EditorThemeSwitcher } from "../HeaderChromeControls";
import { FlowstarterWordmark } from "../brand/FlowstarterWordmark";
import { toastManager } from "../ui/toast";
import { runPublish } from "~/lib/publishSite";

interface ChatHeaderProps {
  activeThreadEnvironmentId: EnvironmentId;
  /** Live websocket id for workspace file RPC (draft threads may fall back to primary). */
  filesPanelRpcEnvironmentId: EnvironmentId;
  activeThreadId: ThreadId;
  activeThreadTitle: string;
  activeProjectName: string | undefined;
  isGitRepo: boolean;
  openInCwd: string | null;
  /**
   * Thread worktree or project root for the admin files indexer.
   * When set, Files can open even if `gitCwd` is still null (no hydrated project).
   */
  filesPanelCwd?: string | null;
  gitCwd: string | null;
  /** True when git reports local changes or unpushed commits — Publish stays disabled otherwise. */
  publishEnabled: boolean;
}

export const ChatHeader = memo(function ChatHeader({
  activeThreadEnvironmentId,
  filesPanelRpcEnvironmentId,
  activeThreadId,
  activeThreadTitle,
  activeProjectName,
  isGitRepo,
  openInCwd,
  filesPanelCwd,
  gitCwd,
  publishEnabled,
}: ChatHeaderProps) {
  const tier = useTier();
  const isTeamAdmin = tier.role === "admin";

  const [panels, setPanels] = useState({ preview: false, files: false });

  const syncHeaderPanelsState = useCallback((preview: boolean, files: boolean) => {
    window.dispatchEvent(
      new CustomEvent("flowstarter:panels-state", { detail: { preview, files } }),
    );
  }, []);

  useEffect(() => {
    const onState = (event: Event) => {
      const detail = (event as CustomEvent<{ preview?: boolean; files?: boolean }>).detail;
      if (!detail) return;
      setPanels((prev) => ({
        preview: typeof detail.preview === "boolean" ? detail.preview : prev.preview,
        files: typeof detail.files === "boolean" ? detail.files : prev.files,
      }));
    };
    window.addEventListener("flowstarter:panels-state", onState);
    return () => window.removeEventListener("flowstarter:panels-state", onState);
  }, []);

  // Preview opens the workspace's running dev server in a new tab.
  // Default to the demo-coach Astro port (4322); when a different demo
  // is active the operator can override via VITE_PREVIEW_URL at build
  // time. Production wires this to the deploy-agent's preview URL.
  const previewUrl =
    (import.meta.env.VITE_PREVIEW_URL as string | undefined)?.trim() ||
    "http://localhost:4322";

  const trimPath = (s: string | null | undefined) => {
    if (s == null) return null;
    const t = s.trim();
    return t.length > 0 ? t : null;
  };
  const filesCwd = trimPath(filesPanelCwd) ?? trimPath(gitCwd) ?? trimPath(openInCwd);

  const onSidePanelValueChange = useCallback(
    (values: string[]) => {
      const hasPreview = values.includes("preview");
      const hasFiles = values.includes("files");
      const closeBoth = () => {
        window.dispatchEvent(new CustomEvent("flowstarter:toggle-preview", { detail: { open: false } }));
        window.dispatchEvent(new CustomEvent("flowstarter:toggle-files", { detail: { open: false } }));
        syncHeaderPanelsState(false, false);
      };
      if (!hasPreview && !hasFiles) {
        closeBoth();
        return;
      }
      // Defensive: header controls never pass both, but merging partial panel events can transiently disagree.
      if (hasPreview && hasFiles) {
        if (!filesCwd) {
          window.dispatchEvent(new CustomEvent("flowstarter:toggle-files", { detail: { open: false } }));
          window.dispatchEvent(
            new CustomEvent("flowstarter:toggle-preview", {
              detail: { open: true, url: previewUrl },
            }),
          );
          syncHeaderPanelsState(true, false);
          return;
        }
        window.dispatchEvent(new CustomEvent("flowstarter:toggle-preview", { detail: { open: false } }));
        window.dispatchEvent(
          new CustomEvent("flowstarter:toggle-files", {
            detail: { open: true, environmentId: filesPanelRpcEnvironmentId, cwd: filesCwd },
          }),
        );
        syncHeaderPanelsState(false, true);
        return;
      }
      if (hasPreview) {
        window.dispatchEvent(new CustomEvent("flowstarter:toggle-files", { detail: { open: false } }));
        window.dispatchEvent(
          new CustomEvent("flowstarter:toggle-preview", {
            detail: { open: true, url: previewUrl },
          }),
        );
        syncHeaderPanelsState(true, false);
        return;
      }
      const cwd = filesCwd;
      if (!cwd) {
        return;
      }
      window.dispatchEvent(new CustomEvent("flowstarter:toggle-preview", { detail: { open: false } }));
      window.dispatchEvent(
        new CustomEvent("flowstarter:toggle-files", {
          detail: { open: true, environmentId: filesPanelRpcEnvironmentId, cwd },
        }),
      );
      syncHeaderPanelsState(false, true);
    },
    [filesPanelRpcEnvironmentId, filesCwd, previewUrl, syncHeaderPanelsState],
  );

  const onPreviewSegmentClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (e.shiftKey) {
        e.preventDefault();
        window.open(previewUrl, "_blank", "noopener");
        return;
      }
      if (panels.preview && !panels.files) {
        onSidePanelValueChange([]);
      } else {
        onSidePanelValueChange(["preview"]);
      }
    },
    [onSidePanelValueChange, panels.files, panels.preview, previewUrl],
  );

  /** Always select Files (idempotent). Closing is Esc / backdrop / Preview segment / popover elsewhere. */
  const onFilesSegmentClick = useCallback(() => {
    onSidePanelValueChange(["files"]);
  }, [onSidePanelValueChange]);

  /** Mutually exclusive panels; `none` = both closed. */
  const adminSegment = panels.files ? "files" : panels.preview ? "preview" : "none";
  const previewRadioChecked = adminSegment === "preview";
  const filesRadioChecked = adminSegment === "files";

  const onPreviewFilesRadioKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      if (e.key === "ArrowRight") {
        if (!filesCwd) return;
        onSidePanelValueChange(["files"]);
        return;
      }
      onSidePanelValueChange(["preview"]);
    },
    [filesCwd, onSidePanelValueChange],
  );

  const previewTabIndex = filesRadioChecked ? -1 : 0;
  const filesTabIndex = filesRadioChecked ? 0 : -1;

  const previewFilesToggle = isTeamAdmin ? (
    <div
      data-fs="preview-files-toggle"
      className="fs-preview-files-segmented"
      role="radiogroup"
      aria-label="Preview or workspace files panel"
      data-active-segment={adminSegment}
      title={!filesCwd ? "Files needs a workspace folder on disk (thread worktree or project)." : undefined}
      onKeyDown={onPreviewFilesRadioKeyDown}
    >
      <div className="fs-preview-files-slider-track">
        <span className="fs-preview-files-slider-pill" aria-hidden />
        <button
          type="button"
          className="fs-preview-files-seg"
          role="radio"
          aria-checked={previewRadioChecked}
          tabIndex={previewTabIndex}
          aria-label="Toggle the side preview panel (shift-click to open in a new tab)"
          title="Preview · Shift-click opens in a new tab"
          onClick={onPreviewSegmentClick}
        >
          <EyeIcon className="size-3.5" strokeWidth={1.75} />
          <span className="fs-preview-files-seg-label">Preview</span>
        </button>
        <button
          type="button"
          className="fs-preview-files-seg"
          role="radio"
          aria-checked={filesRadioChecked}
          tabIndex={filesTabIndex}
          disabled={!filesCwd}
          aria-label="Toggle the admin workspace files panel"
          title={
            !filesCwd
              ? "Files needs a workspace folder on disk."
              : "Browse indexed workspace paths (team admin only)."
          }
          onClick={onFilesSegmentClick}
        >
          <FilesIcon className="size-3.5" strokeWidth={1.75} />
          <span className="fs-preview-files-seg-label">Files</span>
        </button>
      </div>
    </div>
  ) : (
    <div
      data-fs="preview-files-toggle"
      className="fs-preview-files-segmented fs-preview-files-segmented--solo"
      role="tablist"
      aria-label="Preview panel"
      data-active-segment={panels.preview ? "preview" : "none"}
    >
      <div className="fs-preview-files-slider-track">
        <span className="fs-preview-files-slider-pill" aria-hidden />
        <button
          type="button"
          className="fs-preview-files-seg fs-preview-files-seg--solo"
          role="tab"
          aria-selected={panels.preview}
          tabIndex={0}
          aria-label="Toggle the side preview panel (shift-click to open in a new tab)"
          title="Toggle preview · Shift-click to open in new tab"
          onClick={(e) => {
            if (e.shiftKey) {
              e.preventDefault();
              window.open(previewUrl, "_blank", "noopener");
              return;
            }
            window.dispatchEvent(new CustomEvent("flowstarter:toggle-files", { detail: { open: false } }));
            window.dispatchEvent(
              new CustomEvent("flowstarter:toggle-preview", {
                detail: { url: previewUrl },
              }),
            );
          }}
        >
          <EyeIcon className="size-3.5" strokeWidth={1.75} />
          <span className="fs-preview-files-seg-label">Preview</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="fs-chat-header-root @container/chrome-tools flex w-full min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
      {/* ── Left: brand mark + project name (grows; keeps title readable) ─ */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
        {/* Logo on the far left — mirrors flowstarter-main's NavbarLogo so
            the editor top bar reads like the marketing app's header. */}
        <FlowstarterWordmark />
        <span
          aria-hidden
          className="hidden h-4 w-px shrink-0 sm:block"
          style={{ background: "var(--fs-rule-strong)" }}
        />
        <Tooltip>
          <TooltipTrigger
            render={<SidebarTrigger className="size-7 shrink-0" aria-label="Toggle thread sidebar" />}
          />
          <TooltipPopup side="bottom" sideOffset={4}>
            Toggle sidebar · [
          </TooltipPopup>
        </Tooltip>
        {/* Mono editorial kicker — landing parity (`.ls-eyebrow`).
            Keeps the project name from reading as a generic chat title. */}
        <span aria-hidden="true" className="fs-chat-header-kicker hidden shrink-0 sm:inline-flex">
          {activeProjectName ? "Project" : "Thread"}
        </span>
        <span
          aria-hidden="true"
          className="hidden h-3 w-px shrink-0 sm:block"
          style={{ background: "var(--fs-rule-strong)" }}
        />
        <h2
          className="fs-chat-header-title min-w-0 shrink truncate"
          title={activeProjectName ?? activeThreadTitle}
        >
          {activeProjectName ?? activeThreadTitle}
        </h2>
        {activeProjectName && !isGitRepo ? (
          <span
            className="hidden shrink-0 px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex"
            style={{
              fontFamily: "var(--fs-font-mono)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              borderRadius: 3,
              color: "var(--fs-warm)",
              background: "transparent",
              border: "1px solid var(--fs-rule)",
            }}
          >
            No Git
          </span>
        ) : null}
      </div>

      {/* ── Right: tight cluster (Preview|Files · Git · Publish) then theme ─ */}
      <div className="flex min-w-0 max-w-full shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-1.5 sm:gap-x-3">
        <div
          className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-x-1.5 gap-y-1.5 sm:gap-x-2"
          data-fs="chat-header-tool-cluster"
        >
          <PowerUserOnly>
            {activeProjectName && gitCwd ? (
              <>
                <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
                  <GitActionsControl
                    gitCwd={gitCwd}
                    activeThreadRef={scopeThreadRef(activeThreadEnvironmentId, activeThreadId)}
                    headerChrome
                  />
                </div>
                {/* Separator — Git/Commit reads as repo housekeeping;
                    Preview/Files + Publish read as the ship-it zone. */}
                <span
                  aria-hidden
                  className="hidden h-5 w-px shrink-0 self-center min-[480px]:block sm:mx-1"
                  style={{ background: "var(--fs-rule)" }}
                />
              </>
            ) : null}
          </PowerUserOnly>

          {/* Preview / Files + Publish travel as one cluster — grouped on
              the right edge so the action zone reads as a single ship-it
              area instead of being split across the toolbar. */}
          <div className="pointer-events-auto flex min-w-0 max-w-full shrink-0 items-center">
            <div className="min-w-0 max-w-full">{previewFilesToggle}</div>
          </div>

          <button
            type="button"
            disabled={!publishEnabled}
            title={
              publishEnabled
                ? "Build and deploy the workspace site."
                : !activeProjectName
                  ? "Open a project to publish."
                  : !isGitRepo
                    ? "Publish needs a git repo to detect changes."
                    : "Publish when you have uncommitted changes or unpushed commits."
            }
            onClick={() => {
              if (!publishEnabled) return;
              window.dispatchEvent(
                new CustomEvent("flowstarter:publish-clicked", {
                  detail: { project: activeProjectName, cwd: gitCwd },
                }),
              );
              let progressToastId: ReturnType<typeof toastManager.add> | null = null;
              void runPublish(tier, {
                onBuildStart: (target) => {
                  progressToastId = toastManager.add({
                    type: "loading",
                    title: "Building site",
                    description: `Bundling ${activeProjectName ?? target.slug} for ${target.url.replace(/^https?:\/\//, "")}…`,
                  });
                },
                onDeployStart: (target) => {
                  if (progressToastId !== null) {
                    toastManager.close(progressToastId);
                  }
                  progressToastId = toastManager.add({
                    type: "loading",
                    title: "Deploying",
                    description: `Pushing artifact to ${target.url.replace(/^https?:\/\//, "")}…`,
                  });
                },
                onSuccess: (target) => {
                  if (progressToastId !== null) {
                    toastManager.close(progressToastId);
                  }
                  toastManager.add({
                    type: "success",
                    title: "Published",
                    description: target.local
                      ? `Local simulation — would ship to ${target.url}. Wire the editor server's /api/site/publish route to make this real.`
                      : `Live at ${target.url}`,
                    actionProps: {
                      children: "Visit site",
                      onClick: () => window.open(target.url, "_blank", "noopener"),
                    },
                    // Auto-dismiss after 5s of being visible — the success
                    // state is informational, not actionable; the "Visit
                    // site" action is still clickable while it shows.
                    data: { dismissAfterVisibleMs: 5000 },
                  });
                },
                onFailure: (_target, reason) => {
                  if (progressToastId !== null) {
                    toastManager.close(progressToastId);
                  }
                  toastManager.add({
                    type: "error",
                    title: "Publish failed",
                    description: reason,
                  });
                },
              });
            }}
            className="fs-cta fs-cta--toolbar relative z-0 min-w-[110px] shrink-0 disabled:pointer-events-none"
            aria-label="Publish changes"
          >
            <RocketIcon className="size-3.5" strokeWidth={1.75} />
            Publish
          </button>
        </div>

        <span
          aria-hidden
          className="hidden h-5 w-px shrink-0 min-[480px]:block"
          style={{ background: "var(--fs-rule)" }}
        />

        <div className="flex h-[var(--fs-chrome-control-h)] shrink-0 items-center gap-1.5 min-[480px]:gap-2">
          <EditorThemeSwitcher />
          <EditorAccountChip variant="header" />
        </div>
      </div>
    </div>
  );
});
