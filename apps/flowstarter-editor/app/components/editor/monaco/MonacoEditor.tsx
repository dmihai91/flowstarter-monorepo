/**
 * Monaco Editor wrapper component.
 *
 * A simpler alternative to the CodeMirror-based workbench editor,
 * using VS Code's Monaco editor for a familiar editing experience.
 */

import { memo, useCallback, useRef, useState, useEffect } from 'react';
import Editor, { type OnMount, type OnChange, type Monaco } from '@monaco-editor/react';
import { getLanguageFromExtension } from '~/utils/getLanguageFromExtension';

// Type alias for Monaco editor instance
type MonacoEditor = Parameters<OnMount>[0];

// Hook to detect theme from DOM
function useTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    return 'dark';
  });

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme');
          setTheme(newTheme === 'light' ? 'light' : 'dark');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return theme;
}

export interface EditorDocument {
  value: string;
  filePath: string;
  isBinary?: boolean;
}

interface MonacoEditorProps {
  doc: EditorDocument;
  editable?: boolean;
  theme?: 'light' | 'dark'; // If not provided, auto-detects from DOM
  onChange?: (content: string) => void;
  onSave?: () => void;
  className?: string;
  fontSize?: number;
  tabSize?: number;
}

// Map common extensions to Monaco language IDs
function getMonacoLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';

  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    mjs: 'javascript',
    cjs: 'javascript',

    // Web
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'scss',
    less: 'less',

    // Data formats
    json: 'json',
    jsonc: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'ini',

    // Config
    md: 'markdown',
    mdx: 'markdown',
    env: 'ini',
    gitignore: 'ini',

    // Other languages
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    sh: 'shell',
    bash: 'shell',
    sql: 'sql',
    graphql: 'graphql',
    gql: 'graphql',
    dockerfile: 'dockerfile',

    // Fallback
    txt: 'plaintext',
  };

  // Check for specific filenames
  const filename = filePath.split('/').pop()?.toLowerCase() || '';

  if (filename === 'dockerfile') {
    return 'dockerfile';
  }

  if (filename.startsWith('.env')) {
    return 'ini';
  }

  if (filename === 'makefile') {
    return 'makefile';
  }

  return languageMap[ext] || 'plaintext';
}

export const MonacoEditor = memo(
  ({
    doc,
    editable = true,
    theme: themeProp,
    onChange,
    onSave,
    className = '',
    fontSize = 14,
    tabSize = 2,
  }: MonacoEditorProps) => {
    const detectedTheme = useTheme();
    const theme = themeProp ?? detectedTheme;
    const editorRef = useRef<MonacoEditor | null>(null);

    // Handle editor mount
    const handleMount: OnMount = useCallback(
      (editor, monaco) => {
        editorRef.current = editor;

        // Add save shortcut (Ctrl/Cmd + S)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          onSave?.();
        });

        // Focus the editor
        editor.focus();
      },
      [onSave],
    );

    // Handle content changes
    const handleChange: OnChange = useCallback(
      (value) => {
        if (value !== undefined) {
          onChange?.(value);
        }
      },
      [onChange],
    );

    // Don't render editor for binary files
    if (doc.isBinary) {
      return (
        <div className={`flex items-center justify-center h-full bg-bolt-elements-background-depth-1 ${className}`}>
          <div className="text-center text-bolt-elements-textSecondary">
            <div className="i-ph:file-binary text-4xl mb-2" />
            <p>Binary file cannot be displayed</p>
            <p className="text-sm mt-1 opacity-70">{doc.filePath}</p>
          </div>
        </div>
      );
    }

    const monacoLanguage = getMonacoLanguage(doc.filePath);
    const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';

    return (
      <div className={`h-full w-full ${className}`}>
        <Editor
          height="100%"
          language={monacoLanguage}
          value={doc.value}
          theme={monacoTheme}
          onChange={handleChange}
          onMount={handleMount}
          options={{
            readOnly: !editable,
            fontSize,
            tabSize,
            minimap: { enabled: true },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
            fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, 'Courier New', monospace",
            fontLigatures: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            renderWhitespace: 'selection',
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            padding: { top: 16, bottom: 16 },
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-bolt-elements-background-depth-1">
              <div className="text-bolt-elements-textSecondary">Loading editor...</div>
            </div>
          }
        />
      </div>
    );
  },
);
