import { EditorId, type ResolvedKeybindingsConfig } from "@flowstarter/editor-contracts";
import { memo, useCallback, useEffect, useMemo } from "react";
import { isOpenFavoriteEditorShortcut, shortcutLabelForCommand } from "../../keybindings";
import { usePreferredEditor } from "../../editorPreferences";
import { ChevronDownIcon, FolderClosedIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Group, GroupSeparator } from "../ui/group";
import { Menu, MenuItem, MenuPopup, MenuShortcut, MenuTrigger } from "../ui/menu";
import {
  AntigravityIcon,
  CursorIcon,
  Icon,
  TraeIcon,
  IntelliJIdeaIcon,
  VisualStudioCode,
  VisualStudioCodeInsiders,
  VSCodium,
  Zed,
} from "../Icons";
import { isMacPlatform, isWindowsPlatform } from "~/lib/utils";
import { readLocalApi } from "~/localApi";

/** In the hosted web editor, "open in Cursor/VS Code" is redundant; keep server folder reveal only. */
const EDITOR_WEB_OPEN_IN_ALLOWED = new Set<EditorId>(["file-manager"]);

export function filterAvailableEditorsForOpenInPicker(
  variant: "default" | "editor" | undefined,
  availableEditors: ReadonlyArray<EditorId>,
): ReadonlyArray<EditorId> {
  if (variant !== "editor") return availableEditors;
  return availableEditors.filter((id) => EDITOR_WEB_OPEN_IN_ALLOWED.has(id));
}

const resolveOptions = (platform: string, availableEditors: ReadonlyArray<EditorId>) => {
  const baseOptions: ReadonlyArray<{ label: string; Icon: Icon; value: EditorId }> = [
    {
      label: "Cursor",
      Icon: CursorIcon,
      value: "cursor",
    },
    {
      label: "Trae",
      Icon: TraeIcon,
      value: "trae",
    },
    {
      label: "VS Code",
      Icon: VisualStudioCode,
      value: "vscode",
    },
    {
      label: "VS Code Insiders",
      Icon: VisualStudioCodeInsiders,
      value: "vscode-insiders",
    },
    {
      label: "VSCodium",
      Icon: VSCodium,
      value: "vscodium",
    },
    {
      label: "Zed",
      Icon: Zed,
      value: "zed",
    },
    {
      label: "Antigravity",
      Icon: AntigravityIcon,
      value: "antigravity",
    },
    {
      label: "IntelliJ IDEA",
      Icon: IntelliJIdeaIcon,
      value: "idea",
    },
    {
      label: isMacPlatform(platform)
        ? "Finder"
        : isWindowsPlatform(platform)
          ? "Explorer"
          : "Files",
      Icon: FolderClosedIcon,
      value: "file-manager",
    },
  ];
  return baseOptions.filter((option) => availableEditors.includes(option.value));
};

export const OpenInPicker = memo(function OpenInPicker({
  keybindings,
  availableEditors,
  openInCwd,
  variant = "default",
}: {
  keybindings: ResolvedKeybindingsConfig;
  availableEditors: ReadonlyArray<EditorId>;
  openInCwd: string | null;
  variant?: "default" | "editor";
}) {
  const effectiveEditors = useMemo(
    () => filterAvailableEditorsForOpenInPicker(variant, availableEditors),
    [variant, availableEditors],
  );
  const [preferredEditor, setPreferredEditor] = usePreferredEditor(effectiveEditors);
  const options = useMemo(
    () => resolveOptions(navigator.platform, effectiveEditors),
    [effectiveEditors],
  );
  const primaryOption = options.find(({ value }) => value === preferredEditor) ?? null;

  const openInEditor = useCallback(
    (editorId: EditorId | null) => {
      const api = readLocalApi();
      if (!api || !openInCwd) return;
      const editor = editorId ?? preferredEditor;
      if (!editor) return;
      void api.shell.openInEditor(openInCwd, editor);
      setPreferredEditor(editor);
    },
    [preferredEditor, openInCwd, setPreferredEditor],
  );

  const openFavoriteEditorShortcutLabel = useMemo(
    () => shortcutLabelForCommand(keybindings, "editor.openFavorite"),
    [keybindings],
  );

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      const api = readLocalApi();
      if (!isOpenFavoriteEditorShortcut(e, keybindings)) return;
      if (!api || !openInCwd) return;
      if (!preferredEditor) return;

      e.preventDefault();
      void api.shell.openInEditor(openInCwd, preferredEditor);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [preferredEditor, keybindings, openInCwd]);

  if (effectiveEditors.length === 0) {
    return null;
  }

  const primaryOpenAriaLabel =
    !openInCwd
      ? variant === "editor"
        ? "Reveal folder (no folder path)"
        : "Open in editor (no folder path)"
      : !preferredEditor
        ? variant === "editor"
          ? "Reveal folder"
          : "Open in editor"
        : variant === "editor"
          ? `Reveal folder with ${primaryOption?.label ?? "selected app"}`
          : `Open in ${primaryOption?.label ?? "selected editor"}`;

  const primaryOpenTitle =
    !openInCwd || !preferredEditor
      ? undefined
      : variant === "editor"
        ? `Reveal folder (${primaryOption?.label})`
        : `Open in ${primaryOption?.label}`;

  return (
    <Group aria-label="Open project folder">
      <Button
        size="xs"
        variant="outline"
        disabled={!preferredEditor || !openInCwd}
        onClick={() => openInEditor(preferredEditor)}
        aria-label={primaryOpenAriaLabel}
        title={primaryOpenTitle}
      >
        {primaryOption?.Icon && <primaryOption.Icon aria-hidden="true" className="size-3.5" />}
        <span className="sr-only @3xl/chrome-tools:not-sr-only @3xl/chrome-tools:ml-0.5">
          {variant === "editor" ? "Reveal" : "Open"}
        </span>
      </Button>
      <GroupSeparator className="hidden @3xl/chrome-tools:block" />
      <Menu>
        <MenuTrigger
          render={
            <Button
              aria-label="Choose app or folder reveal option"
              title="Choose app or folder reveal option"
              className="fs-chat-submenu-chevron-trigger"
              size="icon-xs"
              variant="outline"
            />
          }
        >
          <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
        </MenuTrigger>
        <MenuPopup align="end">
          {options.length === 0 && (
            <MenuItem disabled>
              {variant === "editor"
                ? "Folder reveal is unavailable on this host."
                : "No installed editors found"}
            </MenuItem>
          )}
          {options.map(({ label, Icon, value }) => (
            <MenuItem key={value} onClick={() => openInEditor(value)}>
              <Icon aria-hidden="true" className="text-muted-foreground" />
              {label}
              {value === preferredEditor && openFavoriteEditorShortcutLabel && (
                <MenuShortcut>{openFavoriteEditorShortcutLabel}</MenuShortcut>
              )}
            </MenuItem>
          ))}
        </MenuPopup>
      </Menu>
    </Group>
  );
});
