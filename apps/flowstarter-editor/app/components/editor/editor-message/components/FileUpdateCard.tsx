import React, { memo, useState, useCallback } from 'react';
import { useMessageStyles } from '../hooks';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import { getFileIconComponent } from './file-icons';
import { getLanguageFromPath, highlightCode } from './syntax-highlight';

interface FileUpdateCardProps {
  filePath: string;
  content: string;
  isDark: boolean;
  isNew?: boolean;
  onOpenInEditor?: (path: string) => void;
}

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

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
    const highlightedCode = isExpanded ? highlightCode(content, language.shiki, isDark) : '';

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }, [content]);

    const border05 = `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`;
    const toggleColor = isDark ? '#a78bfa' : '#6366f1';
    const toggleBgBase = isDark ? 'rgba(31, 41, 55,' : 'rgba(243, 244, 246,';
    const toggleBgHover = isDark ? 'rgba(31, 41, 55, 1)' : 'rgba(243, 244, 246, 1)';
    const toggleBaseStyle: React.CSSProperties = {
      width: '100%', border: 'none', color: toggleColor,
      fontSize: '11px', fontWeight: 500, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '5px', transition: 'all 0.15s ease',
    };

    return (
      <div style={{
        marginTop: '12px', borderRadius: '10px', overflow: 'hidden', maxWidth: '100%', minWidth: 0,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        background: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(249, 250, 251, 0.95)',
        boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', gap: '8px', flexWrap: 'wrap', minWidth: 0,
          background: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(243, 244, 246, 0.95)',
          borderBottom: border05,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
            <div style={{ flexShrink: 0 }}>{getFileIconComponent(filePath, isDark)}</div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: styles.textPrimary, fontFamily: MONO_FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }} title={fileName}>
              {fileName}
            </span>
            {isNew && (
              <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 5px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0, background: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)', color: isDark ? '#4ade80' : '#16a34a' }}>
                {t(EDITOR_LABEL_KEYS.FILE_NEW)}
              </span>
            )}
            <span style={{ fontSize: '10px', color: styles.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {language.display} • {lineCount} lines
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <button
              onClick={handleCopy}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '5px', border: 'none', fontSize: '10px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: isCopied ? (isDark ? '#4ade80' : '#16a34a') : styles.textSecondary }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'; }}
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

        {isExpanded ? (
          <>
            <div style={{ padding: '10px 12px', maxHeight: '400px', overflow: 'auto', background: isDark ? 'rgba(13, 17, 23, 0.95)' : '#fafbfc' }}>
              <pre style={{ margin: 0, padding: 0, fontSize: '11px', lineHeight: '1.6', fontFamily: MONO_FONT, color: isDark ? '#e6edf3' : '#24292f', whiteSpace: 'pre', overflowX: 'auto', tabSize: 2 }}>
                <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
              </pre>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{ ...toggleBaseStyle, padding: '6px 12px', background: `${toggleBgBase} 0.8)`, borderTop: border05 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = toggleBgHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${toggleBgBase} 0.8)`; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
              {t(EDITOR_LABEL_KEYS.FILE_SHOW_LESS)}
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            style={{ ...toggleBaseStyle, padding: '8px 12px', background: `${toggleBgBase} 0.6)` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = toggleBgHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${toggleBgBase} 0.6)`; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            Show code ({lineCount} lines)
          </button>
        )}
      </div>
    );
  },
);

FileUpdateCard.displayName = 'FileUpdateCard';
