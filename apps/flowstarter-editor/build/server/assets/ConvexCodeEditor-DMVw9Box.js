import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { memo, useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { u as useThemeStyles, n as api, o as getColors } from './server-build-58eiE3Ew.js';
import Editor from '@monaco-editor/react';
import '@remix-run/react';
import 'isbot';
import 'react-dom/server';
import 'node:stream';
import 'remix-island';
import '@nanostores/react';
import '@remix-run/cloudflare';
import 'nanostores';
import 'js-cookie';
import 'chalk';
import 'vite-plugin-node-polyfills/shims/process';
import '@radix-ui/react-slot';
import 'tailwind-merge';
import 'remix-utils/client-only';
import 'react-toastify';
import '@tanstack/react-query';
import '@clerk/remix';
import '@clerk/remix/ssr.server';
import '@supabase/supabase-js';
import '@openrouter/ai-sdk-provider';
import '@ai-sdk/openai';
import 'ai';
import '@remix-run/node';
import 'convex/server';
import 'vite-plugin-node-polyfills/shims/buffer';
import '@daytonaio/sdk';
import 'crypto';
import 'convex/browser';
import 'node:path';
import 'path-browserify';
import 'jszip';
import 'file-saver';
import 'diff';
import 'framer-motion';
import '@radix-ui/react-dialog';
import 'lucide-react';
import '@radix-ui/react-dropdown-menu';
import 'class-variance-authority';
import 'react-markdown';
import '@anthropic-ai/claude-agent-sdk';
import '@modelcontextprotocol/sdk/client/streamableHttp.js';
import 'rehype-sanitize';
import 'ignore';
import 'fs/promises';
import 'os';
import 'path';

function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    }
    return "dark";
  });
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          const newTheme = document.documentElement.getAttribute("data-theme");
          setTheme(newTheme === "light" ? "light" : "dark");
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);
  return theme;
}
function getMonacoLanguage(filePath) {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const languageMap = {
    // JavaScript/TypeScript
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    mjs: "javascript",
    cjs: "javascript",
    // Web
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "scss",
    less: "less",
    // Data formats
    json: "json",
    jsonc: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    toml: "ini",
    // Config
    md: "markdown",
    mdx: "markdown",
    env: "ini",
    gitignore: "ini",
    // Other languages
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    sh: "shell",
    bash: "shell",
    sql: "sql",
    graphql: "graphql",
    gql: "graphql",
    dockerfile: "dockerfile",
    // Fallback
    txt: "plaintext"
  };
  const filename = filePath.split("/").pop()?.toLowerCase() || "";
  if (filename === "dockerfile") {
    return "dockerfile";
  }
  if (filename.startsWith(".env")) {
    return "ini";
  }
  if (filename === "makefile") {
    return "makefile";
  }
  return languageMap[ext] || "plaintext";
}
const MonacoEditor = memo(
  ({
    doc,
    editable = true,
    theme: themeProp,
    onChange,
    onSave,
    className = "",
    fontSize = 14,
    tabSize = 2
  }) => {
    const detectedTheme = useTheme();
    const theme = themeProp ?? detectedTheme;
    const editorRef = useRef(null);
    const handleMount = useCallback(
      (editor, monaco) => {
        editorRef.current = editor;
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          onSave?.();
        });
        editor.focus();
      },
      [onSave]
    );
    const handleChange = useCallback(
      (value) => {
        if (value !== void 0) {
          onChange?.(value);
        }
      },
      [onChange]
    );
    if (doc.isBinary) {
      return /* @__PURE__ */ jsx("div", { className: `flex items-center justify-center h-full bg-bolt-elements-background-depth-1 ${className}`, children: /* @__PURE__ */ jsxs("div", { className: "text-center text-bolt-elements-textSecondary", children: [
        /* @__PURE__ */ jsx("div", { className: "i-ph:file-binary text-4xl mb-2" }),
        /* @__PURE__ */ jsx("p", { children: "Binary file cannot be displayed" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm mt-1 opacity-70", children: doc.filePath })
      ] }) });
    }
    const monacoLanguage = getMonacoLanguage(doc.filePath);
    const monacoTheme = theme === "dark" ? "vs-dark" : "vs";
    return /* @__PURE__ */ jsx("div", { className: `h-full w-full ${className}`, children: /* @__PURE__ */ jsx(
      Editor,
      {
        height: "100%",
        language: monacoLanguage,
        value: doc.value,
        theme: monacoTheme,
        onChange: handleChange,
        onMount: handleMount,
        options: {
          readOnly: !editable,
          fontSize,
          tabSize,
          minimap: { enabled: true },
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
          fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, 'Courier New', monospace",
          fontLigatures: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          renderWhitespace: "selection",
          guides: {
            bracketPairs: true,
            indentation: true
          },
          padding: { top: 16, bottom: 16 }
        },
        loading: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full bg-bolt-elements-background-depth-1", children: /* @__PURE__ */ jsx("div", { className: "text-bolt-elements-textSecondary", children: "Loading editor..." }) })
      }
    ) });
  }
);

function buildFileTree(files) {
  const root = [];
  const nodeMap = /* @__PURE__ */ new Map();
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type === "directory" && b.type !== "directory") {
      return -1;
    }
    if (a.type !== "directory" && b.type === "directory") {
      return 1;
    }
    return a.path.localeCompare(b.path);
  });
  for (const file of sortedFiles) {
    const normalizedPath = file.path.replace(/\\/g, "/");
    const parts = normalizedPath.split("/").filter(Boolean);
    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
      if (!nodeMap.has(currentPath)) {
        const isLast = i === parts.length - 1;
        const node = {
          name: part,
          path: currentPath,
          type: isLast ? file.type : "directory",
          children: isLast && file.type === "file" ? void 0 : []
        };
        nodeMap.set(currentPath, node);
        if (parentPath) {
          const parent = nodeMap.get(parentPath);
          parent?.children?.push(node);
        } else {
          root.push(node);
        }
      }
    }
  }
  return root;
}
function getFileIcon(fileName, isDirectory, isExpanded = false) {
  if (isDirectory) {
    return isExpanded ? "i-ph:folder-open-duotone" : "i-ph:folder-duotone";
  }
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "i-vscode-icons:file-type-typescript-official";
    case "js":
    case "jsx":
      return "i-vscode-icons:file-type-js-official";
    case "css":
      return "i-vscode-icons:file-type-css";
    case "html":
      return "i-vscode-icons:file-type-html";
    case "json":
      return "i-vscode-icons:file-type-json";
    case "md":
      return "i-vscode-icons:file-type-markdown";
    case "svg":
      return "i-vscode-icons:file-type-svg";
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
      return "i-ph:image-duotone";
    case "astro":
      return "i-vscode-icons:file-type-astro";
    case "vue":
      return "i-vscode-icons:file-type-vue";
    case "scss":
    case "sass":
      return "i-vscode-icons:file-type-sass";
    case "yaml":
    case "yml":
      return "i-vscode-icons:file-type-yaml";
    default:
      return "i-ph:file-duotone";
  }
}

function FileTreeItem({
  node,
  selectedPath,
  onSelect,
  depth = 0,
  isDark,
  colors
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const isSelected = node.path === selectedPath;
  const isDirectory = node.type === "directory";
  const handleClick = () => {
    if (isDirectory) {
      setIsExpanded(!isExpanded);
    } else {
      onSelect(node.path);
    }
  };
  const iconClass = getFileIcon(node.name, isDirectory, isExpanded);
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: handleClick,
        style: {
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 8px",
          paddingLeft: `${depth * 12 + 8}px`,
          textAlign: "left",
          fontSize: "13px",
          background: isSelected ? colors.surfaceSelected : "transparent",
          color: isSelected ? colors.textPrimary : colors.textMuted,
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          transition: "background 0.15s, color 0.15s"
        },
        onMouseEnter: (e) => {
          if (!isSelected) {
            e.currentTarget.style.background = colors.surfaceHover;
          }
        },
        onMouseLeave: (e) => {
          if (!isSelected) {
            e.currentTarget.style.background = "transparent";
          }
        },
        children: [
          /* @__PURE__ */ jsx("span", { className: `${iconClass} flex-shrink-0`, style: { fontSize: "16px" } }),
          /* @__PURE__ */ jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: node.name })
        ]
      }
    ),
    isDirectory && isExpanded && node.children && /* @__PURE__ */ jsx("div", { children: node.children.map((child) => /* @__PURE__ */ jsx(
      FileTreeItem,
      {
        node: child,
        selectedPath,
        onSelect,
        depth: depth + 1,
        isDark,
        colors
      },
      child.path
    )) })
  ] });
}
function ConvexCodeEditor({ projectId, onSaveComplete }) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);
  const [selectedFilePath, setSelectedFilePath] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(/* @__PURE__ */ new Map());
  const [isSaving, setIsSaving] = useState(false);
  const files = useQuery(api.files.getProjectFiles, { projectId });
  const updateFileContent = useMutation(api.files.updateContent);
  const fileTree = useMemo(() => {
    if (!files) {
      return [];
    }
    return buildFileTree(files.map((f) => ({ path: f.path, type: f.type })));
  }, [files]);
  const selectedFile = useMemo(() => {
    if (!selectedFilePath || !files) {
      return null;
    }
    return files.find((f) => f.path === selectedFilePath);
  }, [selectedFilePath, files]);
  const editorDoc = useMemo(() => {
    if (!selectedFile) {
      return null;
    }
    const pendingContent = pendingChanges.get(selectedFile.path);
    return {
      value: pendingContent ?? selectedFile.content,
      filePath: selectedFile.path,
      isBinary: selectedFile.isBinary
    };
  }, [selectedFile, pendingChanges]);
  const handleFileChange = useCallback(
    (content) => {
      if (!selectedFilePath) {
        return;
      }
      setPendingChanges((prev) => {
        const next = new Map(prev);
        next.set(selectedFilePath, content);
        return next;
      });
    },
    [selectedFilePath]
  );
  const handleSave = useCallback(async () => {
    if (!selectedFile || !pendingChanges.has(selectedFile.path)) {
      return;
    }
    const content = pendingChanges.get(selectedFile.path);
    if (!content) {
      return;
    }
    setIsSaving(true);
    try {
      await updateFileContent({
        projectId,
        path: selectedFile.path,
        content
      });
      setPendingChanges((prev) => {
        const next = new Map(prev);
        next.delete(selectedFile.path);
        return next;
      });
      onSaveComplete?.();
      console.log(`[ConvexCodeEditor] Saved ${selectedFile.path}`);
    } catch (error) {
      console.error("[ConvexCodeEditor] Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedFile, pendingChanges, projectId, updateFileContent, onSaveComplete]);
  useEffect(() => {
    if (!selectedFilePath && fileTree.length > 0) {
      const findFirstFile = (nodes) => {
        for (const node of nodes) {
          if (node.type === "file") {
            return node.path;
          }
          if (node.children) {
            const found = findFirstFile(node.children);
            if (found) {
              return found;
            }
          }
        }
        return null;
      };
      const firstFile = findFirstFile(fileTree);
      if (firstFile) {
        setSelectedFilePath(firstFile);
      }
    }
  }, [fileTree, selectedFilePath]);
  const hasPendingChanges = selectedFilePath ? pendingChanges.has(selectedFilePath) : false;
  return /* @__PURE__ */ jsxs("div", { style: { height: "100%", display: "flex", flexDirection: "column", background: colors.bgTertiary }, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: colors.bgSecondary,
          borderBottom: colors.borderLight
        },
        children: [
          /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: selectedFilePath && /* @__PURE__ */ jsxs(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                background: colors.surfaceLight,
                borderRadius: "6px",
                fontSize: "13px",
                color: colors.textSecondary
              },
              children: [
                /* @__PURE__ */ jsx("span", { className: "i-ph:file-code", style: { fontSize: "14px" } }),
                /* @__PURE__ */ jsx("span", { children: selectedFilePath.split("/").pop() }),
                hasPendingChanges && /* @__PURE__ */ jsx("span", { style: { color: isDark ? "#fbbf24" : "#d97706", marginLeft: "4px" }, children: "*" })
              ]
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
            hasPendingChanges && /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", color: isDark ? "#fbbf24" : "#d97706" }, children: "Unsaved" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleSave,
                disabled: !hasPendingChanges || isSaving,
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  background: hasPendingChanges ? colors.primaryGradient : colors.surfaceLight,
                  color: hasPendingChanges ? isDark ? "#0a0a0f" : "#ffffff" : colors.textMuted,
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: hasPendingChanges ? "pointer" : "not-allowed",
                  opacity: hasPendingChanges ? 1 : 0.5,
                  transition: "opacity 0.2s"
                },
                children: isSaving ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("span", { className: "i-svg-spinners:90-ring-with-bg", style: { fontSize: "14px" } }),
                  "Saving..."
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("span", { className: "i-ph:floppy-disk", style: { fontSize: "14px" } }),
                  "Save"
                ] })
              }
            )
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { style: { flex: 1, overflow: "hidden" }, children: /* @__PURE__ */ jsxs(PanelGroup, { direction: "horizontal", children: [
      /* @__PURE__ */ jsx(Panel, { defaultSize: 20, minSize: 15, maxSize: 35, children: /* @__PURE__ */ jsx(
        "div",
        {
          style: {
            height: "100%",
            background: colors.bgSecondary,
            borderRight: colors.borderLight,
            overflow: "auto"
          },
          children: /* @__PURE__ */ jsxs("div", { style: { padding: "8px" }, children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: colors.textSubtle,
                  marginBottom: "8px",
                  padding: "0 8px"
                },
                children: "Files"
              }
            ),
            fileTree.map((node) => /* @__PURE__ */ jsx(
              FileTreeItem,
              {
                node,
                selectedPath: selectedFilePath,
                onSelect: setSelectedFilePath,
                isDark,
                colors
              },
              node.path
            )),
            fileTree.length === 0 && /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  color: colors.textSubtle,
                  fontSize: "13px",
                  padding: "16px 8px",
                  textAlign: "center"
                },
                children: files === void 0 ? "Loading files..." : "No files yet"
              }
            )
          ] })
        }
      ) }),
      /* @__PURE__ */ jsx(
        PanelResizeHandle,
        {
          style: {
            width: "4px",
            background: colors.surfaceSubtle,
            transition: "background 0.2s"
            // CSS hover handled via global style injection — avoids typed event handler incompatibility with PanelResizeHandle
          },
          className: "convex-resize-handle"
        }
      ),
      /* @__PURE__ */ jsx(Panel, { defaultSize: 80, minSize: 50, children: /* @__PURE__ */ jsx("div", { style: { height: "100%", background: colors.bgTertiary }, children: editorDoc ? /* @__PURE__ */ jsx(MonacoEditor, { doc: editorDoc, onChange: handleFileChange, onSave: handleSave }) : /* @__PURE__ */ jsx(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: colors.textSubtle
          },
          children: /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                className: "i-ph:file-code",
                style: { fontSize: "48px", display: "block", marginBottom: "12px", opacity: 0.5 }
              }
            ),
            /* @__PURE__ */ jsx("p", { style: { fontSize: "14px" }, children: "Select a file to edit" })
          ] })
        }
      ) }) })
    ] }) })
  ] });
}

export { ConvexCodeEditor };
