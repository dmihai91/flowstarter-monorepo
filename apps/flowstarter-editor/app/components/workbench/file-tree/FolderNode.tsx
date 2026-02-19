/**
 * FileTree - FolderNode Component
 *
 * Renders a folder in the file tree.
 */

import { classNames } from '~/utils/classNames';
import { workbenchStore } from '~/lib/stores/workbench';
import { NodeButton } from './NodeButton';
import { FileContextMenu } from './FileContextMenu';
import type { FolderNode as FolderNodeType } from './types';

interface FolderNodeProps {
  folder: FolderNodeType;
  collapsed: boolean;
  selected?: boolean;
  onCopyPath: () => void;
  onCopyRelativePath: () => void;
  onClick: () => void;
}

export function FolderNode({
  folder,
  collapsed,
  selected = false,
  onCopyPath,
  onCopyRelativePath,
  onClick,
}: FolderNodeProps) {
  // Check if the folder is locked
  const { isLocked } = workbenchStore.isFolderLocked(folder.fullPath);

  return (
    <FileContextMenu onCopyPath={onCopyPath} onCopyRelativePath={onCopyRelativePath} fullPath={folder.fullPath}>
      <NodeButton
        className={classNames('group', {
          'bg-transparent text-flowstarter-elements-item-contentDefault hover:text-flowstarter-elements-item-contentActive hover:bg-flowstarter-elements-item-backgroundActive hover:shadow-sm':
            !selected,
          'bg-flowstarter-elements-item-backgroundAccent text-flowstarter-elements-item-contentAccent shadow-sm':
            selected,
        })}
        depth={folder.depth}
        iconClasses={classNames({
          'i-ph:caret-right scale-90': collapsed,
          'i-ph:caret-down scale-90': !collapsed,
        })}
        onClick={onClick}
      >
        <div className="flex items-center w-full">
          <div className="flex-1 truncate pr-2">{folder.name}</div>
          {isLocked && (
            <span
              className={classNames('shrink-0', 'i-ph:lock-simple scale-80 text-red-500')}
              title={'Folder is locked'}
            />
          )}
        </div>
      </NodeButton>
    </FileContextMenu>
  );
}
