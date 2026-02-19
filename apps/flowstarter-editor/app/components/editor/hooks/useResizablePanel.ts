import { useState, useCallback, useEffect, useRef, type RefObject } from 'react';

interface UseResizablePanelOptions {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
}

interface UseResizablePanelReturn {
  width: number;
  isResizing: boolean;
  isHandleHovered: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  handleMouseDown: (e: React.MouseEvent) => void;
  setIsHandleHovered: (hovered: boolean) => void;
}

export function useResizablePanel({
  initialWidth,
  minWidth,
  maxWidth,
}: UseResizablePanelOptions): UseResizablePanelReturn {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isHandleHovered, setIsHandleHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) {
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    },
    [isResizing, minWidth, maxWidth],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return {
    width,
    isResizing,
    isHandleHovered,
    containerRef,
    handleMouseDown,
    setIsHandleHovered,
  };
}

