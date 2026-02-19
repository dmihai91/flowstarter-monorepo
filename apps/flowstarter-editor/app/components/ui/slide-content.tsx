import { cn } from '~/lib/utils';

interface SlideContentProps {
  action: string;
  target: string;
  className?: string;
}

const actionLabels: Record<string, string> = {
  wrote: 'Wrote',
  created: 'Created',
  modified: 'Modified',
  deleted: 'Deleted',
  analyzed: 'Analyzed',
  processed: 'Processed',
};

export function SlideContent({ action, target, className }: SlideContentProps) {
  const displayAction = actionLabels[action] || action;

  return (
    <div
      className={cn(
        'flex min-h-6 items-center gap-2 leading-6 truncate px-3 py-2 hover:bg-flowstarter-elements-item-backgroundHover',
        className,
      )}
    >
      <div className="truncate text-flowstarter-elements-textSecondary">{displayAction}</div>
      <code className="text-flowstarter-elements-textPrimary truncate bg-flowstarter-elements-surfaceHighlight p-1 px-1.5 text-xs rounded font-mono">
        {target}
      </code>
    </div>
  );
}
