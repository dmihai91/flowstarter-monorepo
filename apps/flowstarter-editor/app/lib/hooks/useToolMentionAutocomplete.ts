import { useCallback, useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { shouldShowAutocomplete, calculateDropdownPosition, detectReferenceType } from '~/utils/toolMentionParser';
import type { FileMap } from '~/lib/stores/files';
import { WORK_DIR } from '~/utils/constants';

export interface ToolItem {
  name: string;
  description: string;
  serverName: string;
  inputSchema?: Record<string, unknown>;
}

export interface FileItem {
  name: string;
  path: string;
  relativePath: string;
  type: 'file';
}

interface UseToolMentionAutocompleteOptions {
  input: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null> | undefined;
  onToolSelected: (toolName: string) => void;
  onFileSelected?: (filePath: string) => void;
  files?: FileMap;
}

export type ReferenceItem = ToolItem | FileItem;

interface UseToolMentionAutocompleteReturn {
  isOpen: boolean;
  searchQuery: string;
  filteredTools: ToolItem[];
  filteredFiles: FileItem[];
  selectedIndex: number;
  dropdownPosition: { x: number; y: number } | null;
  handleKeyDown: (e: React.KeyboardEvent) => boolean;
  handleToolSelect: (toolName: string) => void;
  handleFileSelect: (filePath: string) => void;
  handleClose: () => void;
  setSelectedIndex: (index: number) => void;
  referenceType: 'file' | 'tool' | 'mixed';
}

function getAvailableFiles(files?: FileMap): FileItem[] {
  if (!files) {
    return [];
  }

  const fileItems: FileItem[] = [];
  const workDir = WORK_DIR;

  Object.entries(files).forEach(([path, dirent]) => {
    if (dirent?.type === 'file') {
      const relativePath = path.startsWith(workDir) ? path.slice(workDir.length + 1) : path;
      const name = relativePath.split('/').pop() || relativePath;

      fileItems.push({
        name,
        path,
        relativePath,
        type: 'file',
      });
    }
  });

  return fileItems;
}

function fuzzyFilterFiles(files: FileItem[], query: string): FileItem[] {
  if (!query) {
    return files.slice(0, 50);
  }

  const fuse = new Fuse(files, {
    keys: ['relativePath', 'name'],
    threshold: 0.4,
    distance: 200,
    includeScore: true,
  });

  const results = fuse.search(query);

  return results.map((result) => result.item).slice(0, 50);
}

export function useToolMentionAutocomplete(
  options: UseToolMentionAutocompleteOptions,
): UseToolMentionAutocompleteReturn {
  const { input, textareaRef, onToolSelected, onFileSelected, files } = options;

  const autocompleteState = useMemo(() => {
    const cursorPos = textareaRef?.current?.selectionStart || 0;

    return shouldShowAutocomplete(input, cursorPos);
  }, [input, textareaRef]);

  const { isOpen, searchQuery, atPosition } = autocompleteState;

  const referenceType = useMemo(() => {
    return detectReferenceType(searchQuery);
  }, [searchQuery]);

  const availableFiles = useMemo(() => {
    return getAvailableFiles(files);
  }, [files]);

  // No tools available since MCP is disabled
  const filteredTools: ToolItem[] = [];

  const filteredFiles = useMemo(() => {
    if (referenceType === 'tool') {
      return [];
    }

    return fuzzyFilterFiles(availableFiles, searchQuery);
  }, [availableFiles, searchQuery, referenceType]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const dropdownPosition = useMemo(() => {
    if (!isOpen || !textareaRef?.current) {
      return null;
    }

    return calculateDropdownPosition(textareaRef.current, atPosition);
  }, [isOpen, textareaRef, atPosition]);

  const handleClose = useCallback(() => {
    setSelectedIndex(0);
  }, []);

  const handleToolSelect = useCallback(
    (toolName: string) => {
      onToolSelected(toolName);
      handleClose();
    },
    [onToolSelected, handleClose],
  );

  const handleFileSelect = useCallback(
    (filePath: string) => {
      if (onFileSelected) {
        onFileSelected(filePath);
      }

      handleClose();
    },
    [onFileSelected, handleClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      const items: ReferenceItem[] = filteredFiles;

      if (!isOpen || items.length === 0) {
        return false;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
          return true;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          return true;

        case 'Enter':
        case 'Tab':
          if (items[selectedIndex]) {
            e.preventDefault();

            const selectedItem = items[selectedIndex];

            if ('type' in selectedItem && selectedItem.type === 'file') {
              handleFileSelect(selectedItem.relativePath);
            } else {
              handleToolSelect((selectedItem as ToolItem).name);
            }

            return true;
          }

          return false;

        case 'Escape':
          e.preventDefault();
          handleClose();
          return true;

        default:
          return false;
      }
    },
    [isOpen, filteredFiles, selectedIndex, handleToolSelect, handleFileSelect, handleClose],
  );

  return {
    isOpen,
    searchQuery,
    filteredTools,
    filteredFiles,
    selectedIndex,
    dropdownPosition,
    handleKeyDown,
    handleToolSelect,
    handleFileSelect,
    handleClose,
    setSelectedIndex,
    referenceType,
  };
}

