import { memo, useMemo } from 'react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { useMessageStyles } from '~/components/editor/editor-message/hooks';
import { FileUpdateCard } from './FileUpdateCard';

interface MessageContentProps {
  content: string;
  isDark: boolean;
  children?: ReactNode;
  onOpenFile?: (path: string) => void;
}

/**
 * Parse FlowstarterAction tags from content
 * Format: <FlowstarterAction type="file" path="/path/to/file.tsx">content</FlowstarterAction>
 */
interface ParsedAction {
  type: 'file' | 'shell' | 'unknown';
  path?: string;
  content: string;
  isNew?: boolean;
}

interface ParsedContent {
  type: 'text' | 'action';
  value: string | ParsedAction;
}

function parseFlowstarterActions(content: string): ParsedContent[] {
  const results: ParsedContent[] = [];

  // Regex to match FlowstarterAction tags
  const actionRegex =
    /<FlowstarterAction\s+type="([^"]+)"(?:\s+path="([^"]+)")?(?:\s+isNew="([^"]+)")?\s*>([\s\S]*?)<\/FlowstarterAction>/gi;

  let lastIndex = 0;
  let match;

  while ((match = actionRegex.exec(content)) !== null) {
    // Add text before this action
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).trim();

      if (textBefore) {
        results.push({ type: 'text', value: textBefore });
      }
    }

    const [, actionType, path, isNew, actionContent] = match;
    results.push({
      type: 'action',
      value: {
        type: actionType as 'file' | 'shell' | 'unknown',
        path,
        content: actionContent.trim(),
        isNew: isNew === 'true',
      },
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last action
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex).trim();

    if (remainingText) {
      results.push({ type: 'text', value: remainingText });
    }
  }

  // If no actions found, return original content as text
  if (results.length === 0) {
    return [{ type: 'text', value: content }];
  }

  return results;
}

/**
 * Renders message content with basic markdown support (bold text)
 * and FlowstarterAction tags as special UI components
 */
export const MessageContent = memo(({ content, isDark, children, onOpenFile }: MessageContentProps) => {
  const styles = useMessageStyles({ isDark });

  // Parse content for FlowstarterAction tags
  const parsedContent = useMemo(() => parseFlowstarterActions(content), [content]);

  // Markdown components with proper styling
  const markdownComponents = useMemo(
    () => ({
      p: ({ children }: { children?: React.ReactNode }) => (
        <p className="whitespace-pre-wrap mb-3 last:mb-0" style={{ color: styles.textSecondary }}>
          {children}
        </p>
      ),
      strong: ({ children }: { children?: React.ReactNode }) => (
        <strong style={{ color: styles.textPrimary, fontWeight: 600 }}>{children}</strong>
      ),
      h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className="text-xl font-semibold mb-3 mt-4 first:mt-0" style={{ color: styles.textPrimary }}>
          {children}
        </h1>
      ),
      h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0" style={{ color: styles.textPrimary }}>
          {children}
        </h2>
      ),
      h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="font-semibold mb-2 mt-3 first:mt-0" style={{ color: styles.textPrimary }}>
          {children}
        </h3>
      ),
      ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="list-disc pl-5 mb-3 space-y-1" style={{ color: styles.textSecondary }}>
          {children}
        </ul>
      ),
      ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="list-decimal pl-5 mb-3 space-y-1" style={{ color: styles.textSecondary }}>
          {children}
        </ol>
      ),
      li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
      code: ({ children }: { children?: React.ReactNode }) => (
        <code
          className="px-1.5 py-0.5 rounded text-xs font-mono"
          style={{
            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            color: styles.textPrimary,
          }}
        >
          {children}
        </code>
      ),
    }),
    [styles, isDark],
  );

  // Render text with full markdown support
  const renderMarkdown = (text: string) => {
    return <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>;
  };

  return (
    <div className="text-sm leading-relaxed" style={{ color: styles.textSecondary }}>
      {parsedContent.map((item, index) => {
        if (item.type === 'text') {
          return <div key={index}>{renderMarkdown(item.value as string)}</div>;
        }

        // Render action as special component
        const action = item.value as ParsedAction;

        if (action.type === 'file' && action.path) {
          return (
            <FileUpdateCard
              key={index}
              filePath={action.path}
              content={action.content}
              isDark={isDark}
              isNew={action.isNew}
              onOpenInEditor={onOpenFile}
            />
          );
        }

        // Unknown action type - render as code block
        return (
          <pre
            key={index}
            style={{
              marginTop: '12px',
              padding: '12px',
              borderRadius: '8px',
              background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
              fontSize: '12px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              overflow: 'auto',
            }}
          >
            {action.content}
          </pre>
        );
      })}
      {children}
    </div>
  );
});

MessageContent.displayName = 'MessageContent';
