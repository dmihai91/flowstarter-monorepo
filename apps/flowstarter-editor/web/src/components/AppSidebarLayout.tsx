import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { ApprovalBanner } from "./ApprovalBanner";
import { isTerminalFocused } from "~/lib/terminalFocus";
import ThreadSidebar from "./Sidebar";
import { Sidebar, SidebarProvider, SidebarRail, useSidebar } from "./ui/sidebar";

const THREAD_SIDEBAR_WIDTH_STORAGE_KEY = "chat_thread_sidebar_width";
const THREAD_SIDEBAR_MIN_WIDTH = 13 * 16;
const THREAD_MAIN_CONTENT_MIN_WIDTH = 40 * 16;

/** When set to `"1"`, main thread sidebar starts collapsed (offcanvas). */
export const FS_EDITOR_SIDEBAR_COLLAPSED_KEY = "fs-editor-sidebar-collapsed";

function readThreadSidebarOpenFromStorage(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(FS_EDITOR_SIDEBAR_COLLAPSED_KEY) !== "1";
  } catch {
    return true;
  }
}

function persistThreadSidebarCollapsed(collapsed: boolean) {
  try {
    if (collapsed) {
      window.localStorage.setItem(FS_EDITOR_SIDEBAR_COLLAPSED_KEY, "1");
    } else {
      window.localStorage.removeItem(FS_EDITOR_SIDEBAR_COLLAPSED_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

function EditorSidebarBracketShortcut() {
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== "[" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (isTerminalFocused()) return;
      event.preventDefault();
      toggleSidebar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSidebar]);

  return null;
}

export function AppSidebarLayout({ children }: { children: ReactNode }) {
  const [threadSidebarOpen, setThreadSidebarOpen] = useState(readThreadSidebarOpenFromStorage);

  const onThreadSidebarOpenChange = useCallback((open: boolean) => {
    setThreadSidebarOpen(open);
    persistThreadSidebarCollapsed(!open);
  }, []);

  return (
    <SidebarProvider open={threadSidebarOpen} onOpenChange={onThreadSidebarOpenChange}>
      <EditorSidebarBracketShortcut />
      <Sidebar
        side="left"
        collapsible="offcanvas"
        className="border-r-0 bg-transparent text-foreground"
        resizable={{
          minWidth: THREAD_SIDEBAR_MIN_WIDTH,
          shouldAcceptWidth: ({ nextWidth, wrapper }) =>
            wrapper.clientWidth - nextWidth >= THREAD_MAIN_CONTENT_MIN_WIDTH,
          storageKey: THREAD_SIDEBAR_WIDTH_STORAGE_KEY,
        }}
      >
        <ThreadSidebar />
        <SidebarRail />
      </Sidebar>
      <div className="flex h-full min-w-0 flex-1 flex-col bg-transparent">
        <ApprovalBanner />
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </SidebarProvider>
  );
}
