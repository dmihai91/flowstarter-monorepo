import React, { useEffect, useRef, useState } from 'react';
import type { ResizeSide } from './preview-constants';

interface ResizingState {
  isResizing: boolean;
  side: ResizeSide;
  startX: number;
  startWidthPercent: number;
  windowWidth: number;
  pointerId: number | null;
}

export function usePreviewResize(containerRef: React.RefObject<HTMLDivElement | null>, isDeviceModeOn: boolean) {
  const [widthPercent, setWidthPercent] = useState<number>(37.5);
  const [currentWidth, setCurrentWidth] = useState<number>(0);
  const SCALING_FACTOR = 1;

  const resizingState = useRef<ResizingState>({
    isResizing: false, side: null, startX: 0,
    startWidthPercent: 37.5, windowWidth: window.innerWidth, pointerId: null,
  });

  const startResizing = (e: React.PointerEvent, side: ResizeSide) => {
    if (!isDeviceModeOn) return;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
    resizingState.current = {
      isResizing: true, side, startX: e.clientX,
      startWidthPercent: widthPercent, windowWidth: window.innerWidth, pointerId: e.pointerId,
    };
  };

  useEffect(() => {
    if (!isDeviceModeOn) return;

    const handlePointerMove = (e: PointerEvent) => {
      const state = resizingState.current;
      if (!state.isResizing || e.pointerId !== state.pointerId) return;

      const dx = e.clientX - state.startX;
      const dxPercent = (dx / state.windowWidth) * 100 * SCALING_FACTOR;
      let newWidthPercent = state.startWidthPercent;
      if (state.side === 'right') newWidthPercent = state.startWidthPercent + dxPercent;
      else if (state.side === 'left') newWidthPercent = state.startWidthPercent - dxPercent;
      newWidthPercent = Math.max(10, Math.min(newWidthPercent, 90));

      setWidthPercent(newWidthPercent);
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setCurrentWidth(Math.round((containerWidth * newWidthPercent) / 100));
        const previewContainer = containerRef.current.querySelector('div[style*="width"]');
        if (previewContainer) (previewContainer as HTMLElement).style.width = `${newWidthPercent}%`;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const state = resizingState.current;
      if (!state.isResizing || e.pointerId !== state.pointerId) return;
      const handles = document.querySelectorAll('.resize-handle-left, .resize-handle-right');
      handles.forEach((handle) => {
        if ((handle as HTMLElement).hasPointerCapture?.(e.pointerId)) {
          (handle as HTMLElement).releasePointerCapture(e.pointerId);
        }
      });
      resizingState.current = { ...resizingState.current, isResizing: false, side: null, pointerId: null };
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.addEventListener('pointermove', handlePointerMove, { passive: false });
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
      if (resizingState.current.pointerId !== null) {
        const handles = document.querySelectorAll('.resize-handle-left, .resize-handle-right');
        handles.forEach((handle) => {
          if ((handle as HTMLElement).hasPointerCapture?.(resizingState.current.pointerId!)) {
            (handle as HTMLElement).releasePointerCapture(resizingState.current.pointerId!);
          }
        });
        resizingState.current = { ...resizingState.current, isResizing: false, side: null, pointerId: null };
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };
  }, [isDeviceModeOn, SCALING_FACTOR]);

  useEffect(() => {
    const handleWindowResize = () => {
      resizingState.current.windowWidth = window.innerWidth;
      if (containerRef.current && isDeviceModeOn) {
        setCurrentWidth(Math.round((containerRef.current.clientWidth * widthPercent) / 100));
      }
    };
    window.addEventListener('resize', handleWindowResize);
    if (containerRef.current && isDeviceModeOn) {
      setCurrentWidth(Math.round((containerRef.current.clientWidth * widthPercent) / 100));
    }
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [isDeviceModeOn, widthPercent]);

  useEffect(() => {
    if (containerRef.current && isDeviceModeOn) {
      setCurrentWidth(Math.round((containerRef.current.clientWidth * widthPercent) / 100));
    }
  }, [isDeviceModeOn]);

  return { widthPercent, currentWidth, resizingState, startResizing };
}

// ─── Helper Components ──────────────────────────────────────────────────────

export const GripIcon = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', pointerEvents: 'none' }}>
    <div style={{ color: 'var(--flowstarter-elements-textSecondary, rgba(0,0,0,0.5))', fontSize: '10px', lineHeight: '5px', userSelect: 'none', marginLeft: '1px' }}>
      ••• •••
    </div>
  </div>
);

export const ResizeHandle = ({ side, onPointerDown }: { side: ResizeSide; onPointerDown: (e: React.PointerEvent, side: ResizeSide) => void }) => {
  if (!side) return null;
  return (
    <div
      className={`resize-handle-${side}`}
      onPointerDown={(e) => onPointerDown(e, side)}
      style={{
        position: 'absolute', top: 0, width: '15px', height: '100%', cursor: 'ew-resize',
        ...(side === 'left' ? { left: 0, marginLeft: '-7px' } : { right: 0, marginRight: '-7px' }),
        background: 'var(--flowstarter-elements-background-depth-4, rgba(0,0,0,.3))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s', userSelect: 'none', touchAction: 'none', zIndex: 10,
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = 'var(--flowstarter-elements-background-depth-4, rgba(0,0,0,.3))')}
      onMouseOut={(e) => (e.currentTarget.style.background = 'var(--flowstarter-elements-background-depth-3, rgba(0,0,0,.15))')}
      title="Drag to resize width"
    >
      <GripIcon />
    </div>
  );
};
