/**
 * FileTree - NodeButton Component
 *
 * Base button component for file tree nodes.
 */

import type { ReactNode } from 'react';
import { classNames } from '~/utils/classNames';
import { NODE_PADDING_LEFT } from './types';

interface NodeButtonProps {
  depth: number;
  iconClasses: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function NodeButton({ depth, iconClasses, onClick, className, children }: NodeButtonProps) {
  return (
    <button
      className={classNames(
        'flex items-center gap-1.5 w-full pr-2 border-2 border-transparent text-faded py-0.25',
        className,
      )}
      style={{ paddingLeft: `${6 + depth * NODE_PADDING_LEFT}px` }}
      onClick={() => onClick?.()}
    >
      <div className={classNames('scale-120 shrink-0', iconClasses)}></div>
      <div className="truncate w-full text-left">{children}</div>
    </button>
  );
}
