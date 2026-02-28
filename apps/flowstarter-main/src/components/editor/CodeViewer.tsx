'use client';

import { useCallback, useEffect, useState } from 'react';
import { Spinner } from '@flowstarter/flow-design-system';

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
}

interface OpenTab {
  path: string;
  name: string;
  content: string;
}

interface CodeViewerProps {
  projectId: string;
  refreshKey?: number; // increment to trigger file tree refresh
}

// File extension to language mapping for syntax highlighting
const extToLang: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript',
  js: 'javascript', jsx: 'javascript',
  json: 'json', css: 'css', html: 'html',
  md: 'markdown', py: 'python', sh: 'shell',
  yml: 'yaml', yaml: 'yaml',
};

function getLang(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return extToLang[ext] || 'text';
}

// File icons by extension
function getFileIcon(name: string, isDir: boolean): string {
  if (isDir) return '';
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const icons: Record<string, string> = {
    ts: 'TS', tsx: 'TX', js: 'JS', jsx: 'JX',
    json: '{}', css: '#', html: '<>', md: 'M',
    py: 'Py', sh: '$', yml: 'Y', yaml: 'Y',
    svg: 'Sv', png: 'Img', jpg: 'Img',
  };
  return icons[ext] || '';
}

export function CodeViewer({ projectId, refreshKey = 0 }: CodeViewerProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  // Fetch file tree
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/editor/files?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setFileTree(data.files || []);
    } catch {
      setFileTree([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles, refreshKey]);

  // Open a file
  const openFile = async (node: FileNode) => {
    if (node.isDir) return;

    // If already open, switch to it
    const existing = tabs.find((t) => t.path === node.path);
    if (existing) {
      setActiveTab(node.path);
      return;
    }

    setLoadingFile(true);
    try {
      const res = await fetch(`/api/editor/files?projectId=${projectId}&path=${encodeURIComponent(node.path)}`);
      if (!res.ok) throw new Error('Failed to read file');
      const data = await res.json();

      const newTab: OpenTab = {
        path: node.path,
        name: node.name,
        content: data.content || '',
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTab(node.path);
    } catch {
      // ignore
    } finally {
      setLoadingFile(false);
    }
  };

  // Close a tab
  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs((prev) => {
      const next = prev.filter((t) => t.path !== path);
      if (activeTab === path) {
        setActiveTab(next.length > 0 ? next[next.length - 1].path : null);
      }
      return next;
    });
  };

  const activeFile = tabs.find((t) => t.path === activeTab);
  const breadcrumb = activeFile?.path.replace('/workspace/', '').split('/') || [];

  return (
    <div className="flex h-full bg-[var(--flow-bg-secondary)]">
      {/* File tree sidebar */}
      <div className="w-[220px] min-w-[180px] border-r border-[var(--flow-border-default)] flex flex-col">
        <div className="px-3 py-2 text-xs font-semibold text-[var(--flow-text-muted)] uppercase tracking-wider border-b border-[var(--flow-border-default)]">
          Explorer
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : fileTree.length === 0 ? (
            <div className="px-3 py-4 text-xs text-[var(--flow-text-muted)]">
              No files yet. Start chatting to generate code.
            </div>
          ) : (
            fileTree.map((node) => (
              <TreeNode
                key={node.path}
                node={node}
                depth={0}
                onFileClick={openFile}
                activePath={activeTab}
              />
            ))
          )}
        </div>
      </div>

      {/* Code content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs bar */}
        {tabs.length > 0 && (
          <div className="flex items-center border-b border-[var(--flow-border-default)] bg-[var(--flow-bg-primary)] overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.path}
                onClick={() => setActiveTab(tab.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-[var(--flow-border-default)] whitespace-nowrap transition-colors ${
                  activeTab === tab.path
                    ? 'bg-[var(--flow-bg-secondary)] text-[var(--flow-text-primary)] border-b-2 border-b-[var(--flow-accent-cyan)]'
                    : 'text-[var(--flow-text-tertiary)] hover:text-[var(--flow-text-secondary)] hover:bg-[var(--flow-bg-tertiary)]'
                }`}
              >
                <span className="code-icon">{getFileIcon(tab.name, false)}</span>
                <span>{tab.name}</span>
                <span
                  onClick={(e) => closeTab(tab.path, e)}
                  className="ml-1 hover:text-[var(--flow-text-primary)] cursor-pointer opacity-60 hover:opacity-100"
                >
                  x
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Breadcrumb */}
        {activeFile && (
          <div className="flex items-center gap-1 px-3 py-1 text-xs text-[var(--flow-text-muted)] bg-[var(--flow-bg-primary)] border-b border-[var(--flow-border-default)]">
            {breadcrumb.map((part, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-[var(--flow-border-strong)]">/</span>}
                <span className={i === breadcrumb.length - 1 ? 'text-[var(--flow-text-secondary)]' : ''}>
                  {part}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* File content */}
        <div className="flex-1 overflow-auto">
          {loadingFile ? (
            <div className="flex items-center justify-center h-full">
              <Spinner />
            </div>
          ) : activeFile ? (
            <CodeBlock content={activeFile.content} lang={getLang(activeFile.name)} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--flow-text-muted)]">
              <div className="text-3xl mb-2 opacity-40">{ }</div>
              <p className="text-sm">Select a file to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Tree Node ---

function TreeNode({
  node,
  depth,
  onFileClick,
  activePath,
}: {
  node: FileNode;
  depth: number;
  onFileClick: (node: FileNode) => void;
  activePath: string | null;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isActive = !node.isDir && activePath === node.path;

  const handleClick = () => {
    if (node.isDir) {
      setExpanded(!expanded);
    } else {
      onFileClick(node);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-1 px-2 py-[3px] text-xs text-left transition-colors ${
          isActive
            ? 'bg-[var(--flow-bg-elevated)] text-[var(--flow-text-primary)]'
            : 'text-[var(--flow-text-secondary)] hover:bg-[var(--flow-bg-tertiary)]'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.isDir ? (
          <span className="text-[var(--flow-text-muted)] w-3 text-center">
            {expanded ? '\u25BE' : '\u25B8'}
          </span>
        ) : (
          <span className="code-icon w-3 text-center">{getFileIcon(node.name, false)}</span>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {node.isDir && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              onFileClick={onFileClick}
              activePath={activePath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Code Block with simple CSS-based syntax highlighting ---

function CodeBlock({ content, lang }: { content: string; lang: string }) {
  const lines = content.split('\n');

  return (
    <div className="code-viewer">
      <table className="code-table">
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="code-line">
              <td className="code-line-number">{i + 1}</td>
              <td className="code-line-content">
                <HighlightedLine text={line} lang={lang} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Simple regex-based syntax highlighting (no heavy deps)
function HighlightedLine({ text, lang }: { text: string; lang: string }) {
  if (!text.trim()) return <span>{'\n'}</span>;

  const tokens = tokenize(text, lang);
  return (
    <span>
      {tokens.map((token, i) => (
        <span key={i} className={token.type ? `syn-${token.type}` : ''}>
          {token.text}
        </span>
      ))}
    </span>
  );
}

interface Token {
  text: string;
  type?: string;
}

function tokenize(line: string, lang: string): Token[] {
  if (lang === 'text' || lang === 'markdown') {
    return [{ text: line }];
  }

  const tokens: Token[] = [];
  let remaining = line;

  const rules: Array<{ pattern: RegExp; type: string }> = [
    // Comments
    { pattern: /^(\/\/.*)/, type: 'comment' },
    { pattern: /^(\/\*.*?\*\/)/, type: 'comment' },
    { pattern: /^(#.*)/, type: 'comment' },
    // Strings
    { pattern: /^("(?:[^"\\]|\\.)*")/, type: 'string' },
    { pattern: /^('(?:[^'\\]|\\.)*')/, type: 'string' },
    { pattern: /^(`(?:[^`\\]|\\.)*`)/, type: 'string' },
    // Numbers
    { pattern: /^(\b\d+\.?\d*\b)/, type: 'number' },
    // Keywords (JS/TS)
    ...(lang === 'typescript' || lang === 'javascript'
      ? [
          { pattern: /^(\b(?:import|export|from|default|as|type|interface|enum)\b)/, type: 'keyword2' },
          { pattern: /^(\b(?:const|let|var|function|class|return|if|else|for|while|do|switch|case|break|continue|new|this|typeof|instanceof|void|delete|throw|try|catch|finally|async|await|yield)\b)/, type: 'keyword' },
          { pattern: /^(\b(?:true|false|null|undefined|NaN|Infinity)\b)/, type: 'literal' },
          { pattern: /^(\b(?:string|number|boolean|any|never|unknown|object|Promise|Array|Record|Map|Set)\b)/, type: 'type' },
        ]
      : []),
    // Keywords (Python)
    ...(lang === 'python'
      ? [
          { pattern: /^(\b(?:def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|yield|pass|break|continue|and|or|not|in|is|lambda|async|await)\b)/, type: 'keyword' },
          { pattern: /^(\b(?:True|False|None)\b)/, type: 'literal' },
        ]
      : []),
    // Keywords (CSS)
    ...(lang === 'css'
      ? [
          { pattern: /^([.#][\w-]+)/, type: 'keyword2' },
          { pattern: /^(\b(?:px|em|rem|vh|vw|%|rgb|rgba|hsl|hsla|var)\b)/, type: 'literal' },
        ]
      : []),
    // HTML tags
    ...(lang === 'html'
      ? [
          { pattern: /^(<\/?[\w-]+)/, type: 'keyword' },
          { pattern: /^(\/>|>)/, type: 'keyword' },
        ]
      : []),
    // JSON keys
    ...(lang === 'json'
      ? [
          { pattern: /^("[\w-]+")(\s*:)/, type: 'keyword2' },
        ]
      : []),
    // Operators/punctuation
    { pattern: /^([{}[\]().,;:?!<>=+\-*/%&|^~@])/, type: 'punct' },
  ];

  while (remaining.length > 0) {
    let matched = false;

    for (const rule of rules) {
      const match = remaining.match(rule.pattern);
      if (match) {
        tokens.push({ text: match[1], type: rule.type });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Take one character or a word
      const wordMatch = remaining.match(/^[\w$]+/);
      if (wordMatch) {
        tokens.push({ text: wordMatch[0] });
        remaining = remaining.slice(wordMatch[0].length);
      } else {
        tokens.push({ text: remaining[0] });
        remaining = remaining.slice(1);
      }
    }
  }

  return tokens;
}
