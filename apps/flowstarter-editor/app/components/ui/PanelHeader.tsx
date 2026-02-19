import { memo } from 'react';
import { classNames } from '~/utils/classNames';

interface PanelHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const PanelHeader = memo(({ className, children }: PanelHeaderProps) => {
  return (
    <div
      className={classNames(
        'flex items-center gap-2 bg-flowstarter-elements-background-depth-1 text-flowstarter-elements-textSecondary border-b border-flowstarter-elements-borderColor px-4 py-1 min-h-[34px] text-sm z-50 relative',
        className,
      )}
    >
      {children}
    </div>
  );
});
