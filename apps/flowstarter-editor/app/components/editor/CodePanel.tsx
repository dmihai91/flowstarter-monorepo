/**
 * Code Viewer Panel (team only)
 *
 * Shows file tree + tabbed code viewer.
 * Read-only by default - Claude Code makes the edits.
 */

import { File, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { BrowserChrome } from './BrowserChrome';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface CodePanelProps {
  projectId: string;
  files?: FileNode[];
  activeFile?: string;
  onFileSelect?: (path: string) => void;
}

export function CodePanel({ projectId, files, activeFile, onFileSelect }: CodePanelProps) {
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const loadFileContent = useCallback(async (filePath: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/files/read?projectId=${projectId}&path=${encodeURIComponent(filePath)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setFileContent(data.content || '');
      }
    } catch {
      setFileContent('// Failed to load file');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (activeFile) {
      loadFileContent(activeFile);
    }
  }, [activeFile, loadFileContent]);

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <BrowserChrome filePath={activeFile || '/workspace'} />

      <div className="flex flex-1 min-h-0">
        {/* File tree sidebar */}
        <div className="w-56 border-r border-gray-200 dark:border-zinc-800 overflow-y-auto shrink-0">
          <div className="py-2">
            {files?.map((node) => (
              <FileTreeNode
                key={node.path}
                node={node}
                depth={0}
                activeFile={activeFile}
                expandedDirs={expandedDirs}
                onFileSelect={onFileSelect}
                onToggleDir={toggleDir}
              />
            ))}
            {!files?.length && (
              <p className="px-4 py-3 text-xs text-gray-400 dark:text-zinc-500">
                No files loaded
              </p>
            )}
          </div>
        </div>

        {/* Code viewer */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <pre className="p-4 text-sm text-gray-800 dark:text-zinc-200 font-mono leading-relaxed whitespace-pre overflow-x-auto">
              <code>{fileContent || '// Select a file to view its contents'}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function FileTreeNode({
  node,
  depth,
  activeFile,
  expandedDirs,
  onFileSelect,
  onToggleDir,
}: {
  node: FileNode;
  depth: number;
  activeFile?: string;
  expandedDirs: Set<string>;
  onFileSelect?: (path: string) => void;
  onToggleDir: (path: string) => void;
}) {
  const isDir = node.type === 'directory';
  const isExpanded = expandedDirs.has(node.path);
  const isActive = node.path === activeFile;

  return (
    <>
      <button
        onClick={() => {
          if (isDir) {
            onToggleDir(node.path);
          } else {
            onFileSelect?.(node.path);
          }
        }}
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${
          isActive ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-zinc-400'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isDir ? (
          <>
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <Folder size={14} className="text-yellow-500" />
          </>
        ) : (
          <>
            <span className="w-3" />
            <File size={14} />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isDir && isExpanded && node.children?.map((child) => (
        <FileTreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          activeFile={activeFile}
          expandedDirs={expandedDirs}
          onFileSelect={onFileSelect}
          onToggleDir={onToggleDir}
        />
      ))}
    </>
  );
}
