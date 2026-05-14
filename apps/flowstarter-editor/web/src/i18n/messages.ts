export const editorMessagesEn = {
  "editorUi.chatHeader.noGit": "No Git",
  "editorUi.chatHeader.preview": "Preview",
  "editorUi.chatHeader.previewAria":
    "Toggle the side preview panel (shift-click to open in a new tab)",
  "editorUi.chatHeader.previewTitle":
    "Toggle preview · Shift-click to open in new tab",
  "editorUi.chatHeader.terminalAria": "Toggle terminal drawer",
  "editorUi.chatHeader.terminalUnavailable":
    "Terminal is unavailable until this thread has an active project.",
  "editorUi.chatHeader.terminalWithShortcut":
    "Toggle terminal drawer ({shortcut})",
  "editorUi.chatHeader.diffAria": "Toggle diff panel",
  "editorUi.chatHeader.diffUnavailable":
    "Diff panel is unavailable because this project is not a git repository.",
  "editorUi.chatHeader.diffWithShortcut": "Toggle diff panel ({shortcut})",

  "editorUi.noActiveThread.eyebrow": "No active thread",
  "editorUi.noActiveThread.headline": "Pick a thread",
  "editorUi.noActiveThread.flourish": "to keep going.",
  "editorUi.noActiveThread.body":
    "Open an existing thread from the sidebar, or start a new one.",

  "editorUi.previewPanel.complementaryLabel": "Live site preview",
  "editorUi.previewPanel.toolbarTitle": "Preview",
  "editorUi.previewPanel.urlAria": "Preview URL",
  "editorUi.previewPanel.reloadAria": "Reload preview",
  "editorUi.previewPanel.reloadTitle": "Reload preview",
  "editorUi.previewPanel.openTabAria": "Open preview in a new tab",
  "editorUi.previewPanel.openTabTitle": "Open in new tab",
  "editorUi.previewPanel.closeAria": "Close preview",
  "editorUi.previewPanel.closeTitle": "Close (Esc)",
  "editorUi.previewPanel.iframeTitle": "Live preview",
} as const;

export type EditorUiKey = keyof typeof editorMessagesEn;
