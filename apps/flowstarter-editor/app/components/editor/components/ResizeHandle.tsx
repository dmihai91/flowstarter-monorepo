import React from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';

interface ResizeHandleProps {
  isResizing: boolean;
  isHovered: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function ResizeHandle({ isResizing, isHovered, onMouseDown, onMouseEnter, onMouseLeave }: ResizeHandleProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  const getIndicatorBackground = () => {
    if (isResizing) {
      return colors.accentResize;
    }

    if (isHovered) {
      return colors.accentResizeHover;
    }

    return 'transparent';
  };

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        width: '16px',
        marginLeft: '-8px',
        marginRight: '-8px',
        cursor: 'col-resize',
        background: 'transparent',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Visible divider line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1px',
          background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
        }}
      />
      {/* Drag indicator */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '4px',
          height: '40px',
          borderRadius: '4px',
          background: getIndicatorBackground(),
          transition: 'background 0.15s, opacity 0.15s',
        }}
      />
    </div>
  );
}
