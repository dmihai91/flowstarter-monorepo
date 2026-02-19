import { useCallback, useEffect, useState } from 'react';

interface UsePanelResizeProps {
  storageKey: string;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
}

export function usePanelResize({
  storageKey,
  defaultWidth,
  minWidth = 400,
  maxWidth = 1200,
}: UsePanelResizeProps) {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      return saved ? parseInt(saved, 10) : defaultWidth;
    }
    return defaultWidth;
  });
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(constrainedWidth);
    },
    [isResizing, minWidth, maxWidth]
  );

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      localStorage.setItem(storageKey, width.toString());
    }
  }, [isResizing, width, storageKey]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
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
    handleMouseDown,
  };
}
