import type { EditorProps } from "@monaco-editor/react";
import { useEffect, useState, type ComponentType } from "react";

import { useTheme } from "~/hooks/useTheme";

const readOnlyEditorOptions: NonNullable<EditorProps["options"]> = {
  readOnly: true,
  minimap: { enabled: false },
  wordWrap: "on",
  fontSize: 12,
  scrollBeyondLastLine: false,
  automaticLayout: true,
};

export function monacoLanguageIdForPath(filePath: string): string {
  const lower = filePath.toLowerCase();
  const dot = lower.lastIndexOf(".");
  const ext = dot >= 0 ? lower.slice(dot) : "";

  const map: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".mts": "typescript",
    ".cts": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".json": "json",
    ".css": "css",
    ".scss": "scss",
    ".less": "less",
    ".md": "markdown",
    ".mdx": "markdown",
    ".astro": "html",
    ".vue": "html",
    ".html": "html",
    ".htm": "html",
    ".yml": "yaml",
    ".yaml": "yaml",
    ".rs": "rust",
    ".go": "go",
    ".py": "python",
    ".sql": "sql",
    ".sh": "shell",
    ".bash": "shell",
    ".zsh": "shell",
    ".toml": "plaintext",
  };

  return map[ext] ?? "plaintext";
}

export function WorkspaceFileMonacoPreview(props: {
  readonly path: string;
  readonly content: string;
}) {
  const { resolvedTheme } = useTheme();
  const [Editor, setEditor] = useState<ComponentType<EditorProps> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("~/monaco/monacoEditorEntry")
      .then((m) => {
        if (!cancelled) {
          setEditor(() => m.default);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : String(e);
          console.error("[flowstarter] Monaco bundle failed to load", e);
          setLoadError(message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const theme = resolvedTheme === "dark" ? "vs-dark" : "vs";

  if (loadError) {
    return (
      <pre
        className="m-0 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed"
        style={{ color: "var(--fs-warm)" }}
      >
        {`Could not load syntax editor.\n${loadError}`}
      </pre>
    );
  }

  if (!Editor) {
    return (
      <p className="font-mono text-xs" style={{ color: "var(--fs-ink-dim)" }}>
        Loading editor…
      </p>
    );
  }

  return (
    <div className="h-full min-h-[12rem] w-full min-w-0 [&_.monaco-editor]:rounded-md [&_.monaco-editor]:border [&_.monaco-editor]:border-[var(--fs-rule)]">
      <Editor
        height="100%"
        path={props.path}
        language={monacoLanguageIdForPath(props.path)}
        value={props.content}
        theme={theme}
        options={readOnlyEditorOptions}
      />
    </div>
  );
}
