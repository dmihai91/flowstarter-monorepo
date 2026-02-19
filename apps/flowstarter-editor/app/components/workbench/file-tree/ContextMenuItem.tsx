/**
 * FileTree - ContextMenuItem Component
 *
 * Styled context menu item.
 */

import type { ReactNode } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';

interface ContextMenuItemProps {
  onSelect?: () => void;
  children: ReactNode;
}

export function ContextMenuItem({ onSelect, children }: ContextMenuItemProps) {
  return (
    <ContextMenu.Item
      onSelect={onSelect}
      className="flex items-center gap-2 px-2 py-1.5 outline-0 text-sm text-flowstarter-elements-textPrimary cursor-pointer ws-nowrap text-flowstarter-elements-item-contentDefault hover:text-flowstarter-elements-item-contentActive hover:bg-flowstarter-elements-item-backgroundActive rounded-md"
    >
      <span className="size-4 shrink-0"></span>
      <span>{children}</span>
    </ContextMenu.Item>
  );
}
