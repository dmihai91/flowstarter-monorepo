/**
 * FileTree - FileNode Component
 *
 * Renders a file in the file tree.
 */

import { useMemo } from 'react';
import { diffLines, type Change } from 'diff';
import { classNames } from '~/utils/classNames';
import { workbenchStore } from '~/lib/stores/workbench';
import type { FileHistory } from '~/types/actions';
import { NodeButton } from './NodeButton';
import { FileContextMenu } from './FileContextMenu';
import type { FileNode as FileNodeType } from './types';

interface FileNodeProps {
  file: FileNodeType;
  selected: boolean;
  unsavedChanges?: boolean;
  fileHistory?: Record<string, FileHistory>;
  onCopyPath: () => void;
  onCopyRelativePath: () => void;
  onClick: () => void;
}

export function FileNode({
  file,
  onClick,
  onCopyPath,
  onCopyRelativePath,
  selected,
  unsavedChanges = false,
  fileHistory = {},
}: FileNodeProps) {
  const { depth, name, fullPath } = file;

  // Check if the file is locked
  const { locked } = workbenchStore.isFileLocked(fullPath);

  const fileModifications = fileHistory[fullPath];

  const { additions, deletions } = useMemo(() => {
    if (!fileModifications?.originalContent) {
      return { additions: 0, deletions: 0 };
    }

    const normalizedOriginal = fileModifications.originalContent.replace(/\r\n/g, '\n');
    const normalizedCurrent =
      fileModifications.versions[fileModifications.versions.length - 1]?.content.replace(/\r\n/g, '\n') || '';

    if (normalizedOriginal === normalizedCurrent) {
      return { additions: 0, deletions: 0 };
    }

    const changes = diffLines(normalizedOriginal, normalizedCurrent, {
      newlineIsToken: false,
      ignoreWhitespace: true,
      ignoreCase: false,
    });

    return changes.reduce(
      (acc: { additions: number; deletions: number }, change: Change) => {
        if (change.added) {
          acc.additions += change.value.split('\n').length;
        }

        if (change.removed) {
          acc.deletions += change.value.split('\n').length;
        }

        return acc;
      },
      { additions: 0, deletions: 0 },
    );
  }, [fileModifications]);

  const showStats = additions > 0 || deletions > 0;

  return (
    <FileContextMenu onCopyPath={onCopyPath} onCopyRelativePath={onCopyRelativePath} fullPath={fullPath}>
      <NodeButton
        className={classNames('group', {
          'bg-transparent hover:bg-flowstarter-elements-item-backgroundActive hover:shadow-sm text-flowstarter-elements-item-contentDefault':
            !selected,
          'bg-flowstarter-elements-item-backgroundAccent text-flowstarter-elements-item-contentAccent shadow-sm':
            selected,
        })}
        depth={depth}
        iconClasses={classNames('i-ph:file-duotone scale-90', {
          'group-hover:text-flowstarter-elements-item-contentActive': !selected,
        })}
        onClick={onClick}
      >
        <div
          className={classNames('flex items-center', {
            'group-hover:text-flowstarter-elements-item-contentActive': !selected,
          })}
        >
          <div className="flex-1 truncate pr-2">{name}</div>
          <div className="flex items-center gap-1">
            {showStats && (
              <div className="flex items-center gap-1 text-xs">
                {additions > 0 && <span className="text-green-500">+{additions}</span>}
                {deletions > 0 && <span className="text-red-500">-{deletions}</span>}
              </div>
            )}
            {locked && (
              <span
                className={classNames('shrink-0', 'i-ph:lock-simple scale-80 text-red-500')}
                title={'File is locked'}
              />
            )}
            {unsavedChanges && <span className="i-ph:circle-fill scale-68 shrink-0 text-orange-500" />}
          </div>
        </div>
      </NodeButton>
    </FileContextMenu>
  );
}
