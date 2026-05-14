import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  editorMessagesEn,
  type EditorUiKey,
} from "./messages";

export type EditorT = (
  key: EditorUiKey,
  vars?: Record<string, string | number>,
) => string;

function compileMessage(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return out;
}

const EditorI18nContext = createContext<EditorT | null>(null);

export function EditorI18nProvider({ children }: { children: ReactNode }) {
  const t = useMemo<EditorT>(
    () => (key, vars) =>
      compileMessage(editorMessagesEn[key] ?? String(key), vars),
    [],
  );
  return (
    <EditorI18nContext.Provider value={t}>{children}</EditorI18nContext.Provider>
  );
}

export function useEditorT(): EditorT {
  const ctx = useContext(EditorI18nContext);
  if (!ctx) {
    throw new Error("useEditorT must be used within EditorI18nProvider");
  }
  return ctx;
}
