import React, { memo, useState, useCallback, useEffect } from 'react';
import { useMessageStyles } from '../hooks';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface FileUpdateCardProps {
  filePath: string;
  content: string;
  isDark: boolean;
  isNew?: boolean;
  onOpenInEditor?: (path: string) => void;
}

// Language detection for syntax highlighting
function getLanguageFromPath(path: string): { display: string; shiki: string } {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, { display: string; shiki: string }> = {
    ts: { display: 'TypeScript', shiki: 'typescript' },
    tsx: { display: 'React', shiki: 'tsx' },
    js: { display: 'JavaScript', shiki: 'javascript' },
    jsx: { display: 'React', shiki: 'jsx' },
    css: { display: 'CSS', shiki: 'css' },
    scss: { display: 'SCSS', shiki: 'scss' },
    html: { display: 'HTML', shiki: 'html' },
    json: { display: 'JSON', shiki: 'json' },
    md: { display: 'Markdown', shiki: 'markdown' },
    py: { display: 'Python', shiki: 'python' },
    rs: { display: 'Rust', shiki: 'rust' },
    go: { display: 'Go', shiki: 'go' },
    java: { display: 'Java', shiki: 'java' },
    kt: { display: 'Kotlin', shiki: 'kotlin' },
    swift: { display: 'Swift', shiki: 'swift' },
    yml: { display: 'YAML', shiki: 'yaml' },
    yaml: { display: 'YAML', shiki: 'yaml' },
    toml: { display: 'TOML', shiki: 'toml' },
    sql: { display: 'SQL', shiki: 'sql' },
    sh: { display: 'Shell', shiki: 'bash' },
    bash: { display: 'Bash', shiki: 'bash' },
  };

  return langMap[ext] || { display: 'Text', shiki: 'text' };
}

// React/Atom icon SVG
const ReactIcon = ({ size = 16, color = '#61dafb' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke={color} strokeWidth="1.5" fill="none" />
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke={color} strokeWidth="1.5" fill="none" transform="rotate(60 12 12)" />
    <ellipse
      cx="12"
      cy="12"
      rx="10"
      ry="4"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
      transform="rotate(120 12 12)"
    />
    <circle cx="12" cy="12" r="2" fill={color} />
  </svg>
);

// TypeScript icon
const TypeScriptIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="2" fill="#3178c6" />
    <path
      d="M14.5 17.5V13h-1.5v4.5h1.5zm.5-6.5c0-1.38-1.12-2.5-2.5-2.5h-3v7h1.5v-2h1.5c1.38 0 2.5-1.12 2.5-2.5zm-2.5 1h-1.5v-2h1.5c.55 0 1 .45 1 1s-.45 1-1 1z"
      fill="none"
    />
    <text x="6" y="17" fontSize="9" fontWeight="bold" fill="white" fontFamily="Arial">
      TS
    </text>
  </svg>
);

// JavaScript icon
const JavaScriptIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="2" fill="#f7df1e" />
    <text x="6" y="17" fontSize="9" fontWeight="bold" fill="#000" fontFamily="Arial">
      JS
    </text>
  </svg>
);

// CSS icon
const CSSIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="2" fill="#264de4" />
    <text x="4" y="17" fontSize="8" fontWeight="bold" fill="white" fontFamily="Arial">
      CSS
    </text>
  </svg>
);

// JSON icon
const JSONIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="2" fill="#5a5a5a" />
    <text x="3" y="16" fontSize="7" fontWeight="bold" fill="#f5de19" fontFamily="monospace">
      {'{}'}
    </text>
  </svg>
);

// Markdown icon
const MarkdownIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="2" fill="#083fa1" />
    <text x="4" y="16" fontSize="8" fontWeight="bold" fill="white" fontFamily="Arial">
      MD
    </text>
  </svg>
);

// HTML icon
const HTMLIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="2" fill="#e34c26" />
    <text x="3" y="16" fontSize="6" fontWeight="bold" fill="white" fontFamily="Arial">
      HTML
    </text>
  </svg>
);

// Generic file icon
const FileIcon = ({ size = 16, color = '#888' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

// Get file icon component based on extension
function getFileIconComponent(path: string, isDark: boolean): React.ReactElement {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const size = 16;

  switch (ext) {
    case 'tsx':
    case 'jsx':
      return <ReactIcon size={size} color={isDark ? '#61dafb' : '#087ea4'} />;
    case 'ts':
      return <TypeScriptIcon size={size} />;
    case 'js':
      return <JavaScriptIcon size={size} />;
    case 'css':
    case 'scss':
      return <CSSIcon size={size} />;
    case 'json':
      return <JSONIcon size={size} />;
    case 'md':
      return <MarkdownIcon size={size} />;
    case 'html':
      return <HTMLIcon size={size} />;
    default:
      return <FileIcon size={size} color={isDark ? '#888' : '#666'} />;
  }
}

// Simple syntax highlighting with regex (lightweight alternative to shiki)
function highlightCode(code: string, lang: string, isDark: boolean): string {
  const colors = isDark
    ? {
        keyword: '#c792ea',
        string: '#c3e88d',
        comment: '#676e95',
        number: '#f78c6c',
        function: '#82aaff',
        type: '#ffcb6b',
        operator: '#89ddff',
        punctuation: '#89ddff',
        property: '#f07178',
        tag: '#f07178',
        attr: '#c792ea',
        variable: '#eeffff',
      }
    : {
        keyword: '#7c3aed',
        string: '#059669',
        comment: '#6b7280',
        number: '#ea580c',
        function: '#2563eb',
        type: '#ca8a04',
        operator: '#374151',
        punctuation: '#374151',
        property: '#dc2626',
        tag: '#dc2626',
        attr: '#7c3aed',
        variable: '#111827',
      };

  // Escape HTML
  let highlighted = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Highlight based on language
  if (['typescript', 'tsx', 'javascript', 'jsx'].includes(lang)) {
    // Comments (single line and multi-line)
    highlighted = highlighted.replace(
      /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g,
      `<span style="color:${colors.comment}">$1</span>`,
    );

    // Strings (single, double quotes, template literals)
    highlighted = highlighted.replace(
      /(['"`])(?:(?!\1)[^\\]|\\.)*?\1/g,
      `<span style="color:${colors.string}">$&</span>`,
    );

    // Keywords
    const keywords =
      /\b(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|new|this|super|async|await|try|catch|throw|default|switch|case|break|continue|typeof|instanceof|in|of|as|is)\b/g;
    highlighted = highlighted.replace(keywords, `<span style="color:${colors.keyword}">$1</span>`);

    // Types (capitalized words that aren't at the start of a sentence)
    highlighted = highlighted.replace(
      /\b([A-Z][a-zA-Z0-9]*)\b(?!\s*:)/g,
      `<span style="color:${colors.type}">$1</span>`,
    );

    // Numbers
    highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, `<span style="color:${colors.number}">$1</span>`);

    // Function calls
    highlighted = highlighted.replace(
      /\b([a-z_][a-zA-Z0-9_]*)\s*(?=\()/g,
      `<span style="color:${colors.function}">$1</span>`,
    );
  } else if (lang === 'json') {
    // Strings
    highlighted = highlighted.replace(/"([^"\\]|\\.)*"/g, (match) => {
      if (match.endsWith('":')) {
        return `<span style="color:${colors.property}">${match}</span>`;
      }

      return `<span style="color:${colors.string}">${match}</span>`;
    });

    // Numbers
    highlighted = highlighted.replace(/:\s*(\d+\.?\d*)/g, `: <span style="color:${colors.number}">$1</span>`);

    // Booleans and null
    highlighted = highlighted.replace(/\b(true|false|null)\b/g, `<span style="color:${colors.keyword}">$1</span>`);
  } else if (lang === 'css' || lang === 'scss') {
    // Selectors
    highlighted = highlighted.replace(
      /^([.#]?[a-zA-Z_-][a-zA-Z0-9_-]*)/gm,
      `<span style="color:${colors.tag}">$1</span>`,
    );

    // Properties
    highlighted = highlighted.replace(/([a-z-]+)\s*:/g, `<span style="color:${colors.property}">$1</span>:`);

    // Values
    highlighted = highlighted.replace(/:\s*([^;{]+)/g, `: <span style="color:${colors.string}">$1</span>`);
  } else if (lang === 'html') {
    // Tags
    highlighted = highlighted.replace(/(&lt;\/?[a-zA-Z][a-zA-Z0-9]*)/g, `<span style="color:${colors.tag}">$1</span>`);

    // Attributes
    highlighted = highlighted.replace(/([a-zA-Z-]+)=/g, `<span style="color:${colors.attr}">$1</span>=`);
  } else if (lang === 'markdown') {
    // Headers
    highlighted = highlighted.replace(
      /^(#{1,6})\s+(.*)$/gm,
      `<span style="color:${colors.keyword}">$1</span> <span style="color:${colors.type}">$2</span>`,
    );

    // Bold
    highlighted = highlighted.replace(
      /\*\*([^*]+)\*\*/g,
      `<span style="color:${colors.keyword};font-weight:bold">**$1**</span>`,
    );

    // Links
    highlighted = highlighted.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      `<span style="color:${colors.function}">[$1]</span><span style="color:${colors.string}">($2)</span>`,
    );
  }

  return highlighted;
}

/**
 * FileUpdateCard - Displays a modified file in a code editor style card
 * Used in chat to show AI-modified template files
 */
export const FileUpdateCard = memo(
  ({ filePath, content, isDark, isNew = false, onOpenInEditor }: FileUpdateCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const styles = useMessageStyles({ isDark });

    const fileName = filePath.split(/[/\\]/).pop() || filePath;
    const language = getLanguageFromPath(filePath);
    const lineCount = content.split('\n').length;
    const previewLines = 8;

    // Truncate content for preview
    const lines = content.split('\n');
    const previewContent = lines.slice(0, previewLines).join('\n');
    const hasMore = lines.length > previewLines;

    // Highlighted code
    const displayContent = isExpanded ? content : '';
    const highlightedCode = isExpanded ? highlightCode(displayContent, language.shiki, isDark) : '';

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }, [content]);

    const handleOpenInEditor = useCallback(() => {
      onOpenInEditor?.(filePath);
    }, [filePath, onOpenInEditor]);

    return (
      <div
        style={{
          marginTop: '12px',
          borderRadius: '10px',
          overflow: 'hidden',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          background: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(249, 250, 251, 0.95)',
          boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
          maxWidth: '100%',
          minWidth: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(243, 244, 246, 0.95)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            gap: '8px',
            flexWrap: 'wrap',
            minWidth: 0,
          }}
        >
          {/* File info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: 0,
              flex: '1 1 auto',
              overflow: 'hidden',
            }}
          >
            <div style={{ flexShrink: 0 }}>{getFileIconComponent(filePath, isDark)}</div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: styles.textPrimary,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
              title={fileName}
            >
              {fileName}
            </span>
            {isNew && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                  color: isDark ? '#4ade80' : '#16a34a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  flexShrink: 0,
                }}
              >
                {t(EDITOR_LABEL_KEYS.FILE_NEW)}
              </span>
            )}
            <span
              style={{
                fontSize: '10px',
                color: styles.textMuted,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {language.display} • {lineCount} lines
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {/* Copy button */}
            <button
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '5px',
                border: 'none',
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                color: isCopied ? (isDark ? '#4ade80' : '#16a34a') : styles.textSecondary,
                fontSize: '10px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
              }}
            >
              {isCopied ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t(EDITOR_LABEL_KEYS.COMMON_COPIED)}
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  {t(EDITOR_LABEL_KEYS.COMMON_COPY)}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code content - collapsed by default, click to expand */}
        {isExpanded ? (
          <>
            <div
              style={{
                padding: '10px 12px',
                maxHeight: '400px',
                overflow: 'auto',
                background: isDark ? 'rgba(13, 17, 23, 0.95)' : '#fafbfc',
              }}
            >
              <pre
                style={{
                  margin: 0,
                  padding: 0,
                  fontSize: '11px',
                  lineHeight: '1.6',
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  color: isDark ? '#e6edf3' : '#24292f',
                  whiteSpace: 'pre',
                  overflowX: 'auto',
                  tabSize: 2,
                }}
              >
                <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
              </pre>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                width: '100%',
                padding: '6px 12px',
                border: 'none',
                background: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(243, 244, 246, 0.9)',
                color: isDark ? '#a78bfa' : '#6366f1',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(31, 41, 55, 1)' : 'rgba(243, 244, 246, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(243, 244, 246, 0.9)';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              {t(EDITOR_LABEL_KEYS.FILE_SHOW_LESS)}
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: isDark ? 'rgba(31, 41, 55, 0.6)' : 'rgba(243, 244, 246, 0.7)',
              color: isDark ? '#a78bfa' : '#6366f1',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(31, 41, 55, 1)' : 'rgba(243, 244, 246, 1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(31, 41, 55, 0.6)' : 'rgba(243, 244, 246, 0.7)';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            Show code ({lineCount} lines)
          </button>
        )}
      </div>
    );
  },
);

FileUpdateCard.displayName = 'FileUpdateCard';
