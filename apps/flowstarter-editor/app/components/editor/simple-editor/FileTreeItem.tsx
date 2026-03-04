/**
 * FileTreeItem Component
 *
 * Recursive file tree node for the simple project editor sidebar.
 */

import { memo, useState } from 'react';
import { getFileIcon, type FileNode } from '~/lib/utils/fileTree';

interface FileTreeItemProps {
  node: FileNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  depth?: number;
}

export const FileTreeItem = memo(function FileTreeItem({
  node,
  selectedPath,
  onSelect,
  depth = 0,
}: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const isSelected = node.path === selectedPath;
  const isDirectory = node.type === 'directory';

  const handleClick = () => {
    if (isDirectory) {
      setIsExpanded(!isExpanded);
    } else {
      onSelect(node.path);
    }
  };

  const iconClass = getFileIcon(node.name, isDirectory, isExpanded);

  return (
    <div>
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center gap-2 px-2 py-1 text-left text-sm
          hover:bg-flowstarter-elements-item-backgroundActive rounded transition-colors
          ${isSelected ? 'bg-flowstarter-elements-item-backgroundAccent text-flowstarter-accent-purple' : 'text-flowstarter-elements-textSecondary'}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className={`${iconClass} text-base flex-shrink-0`} />
        <span className="truncate">{node.name}</span>
      </button>

      {isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});
