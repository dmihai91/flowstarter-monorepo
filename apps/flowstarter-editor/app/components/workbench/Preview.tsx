import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ScreenshotSelector } from './ScreenshotSelector';
import { workbenchStore } from '~/lib/stores/workbench';
import { TextShimmer } from '~/components/ui/text-shimmer';
import { WINDOW_SIZES } from './preview-constants';
import { usePreviewResize, ResizeHandle } from './usePreviewResize';

export const Preview = memo(() => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const daytonaPreview = useStore(workbenchStore.daytonaPreview);
  const activePreview = daytonaPreview.url ? { baseUrl: daytonaPreview.url } : null;

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeviceModeOn] = useState(false);
  const [selectedWindowSize] = useState(WINDOW_SIZES[0]);
  const [isLandscape] = useState(false);
  const [showDeviceFrameInPreview, setShowDeviceFrameInPreview] = useState(false);

  const { widthPercent, currentWidth, resizingState, startResizing } = usePreviewResize(containerRef, isDeviceModeOn);

  const getFramePadding = useCallback(() => {
    if (!selectedWindowSize) return '40px 20px';
    const isMobile = selectedWindowSize.frameType === 'mobile';
    if (isLandscape) return isMobile ? '40px 60px' : '30px 50px';
    return isMobile ? '40px 20px' : '50px 30px';
  }, [isLandscape, selectedWindowSize]);

  const getFrameColor = useCallback(() => {
    const isDarkMode =
      document.documentElement.classList.contains('dark') ||
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDarkMode ? '#555' : '#111';
  }, []);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => { if (showDeviceFrameInPreview) setShowDeviceFrameInPreview(true); };
    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, [showDeviceFrameInPreview]);

  const ws = selectedWindowSize;
  const isMobile = ws.frameType === 'mobile';
  const iframeSandbox = 'allow-scripts allow-forms allow-popups allow-modals allow-storage-access-by-user-activation allow-same-origin';

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col relative">
      <div className="flex-1 flex justify-center items-center overflow-auto">
        <div style={{
          width: isDeviceModeOn ? (showDeviceFrameInPreview ? '100%' : `${widthPercent}%`) : '100%',
          height: '100%', overflow: 'auto', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center',
          background: 'var(--flowstarter-elements-background-depth-1)',
        }}>
          {activePreview && activePreview.baseUrl ? (
            <>
              {isDeviceModeOn && showDeviceFrameInPreview ? (
                <div className="device-wrapper" style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  width: '100%', height: '100%', padding: '0', overflow: 'auto', transition: 'all 0.3s ease', position: 'relative',
                }}>
                  <div className="device-frame-container" style={{
                    position: 'relative', overflow: 'hidden', margin: '40px',
                    borderRadius: isMobile ? '36px' : '20px',
                    background: getFrameColor(), padding: getFramePadding(),
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    transform: 'scale(1)', transformOrigin: 'center center', transition: 'all 0.3s ease',
                    width: isLandscape
                      ? `${ws.height + (isMobile ? 120 : 60)}px`
                      : `${ws.width + (isMobile ? 40 : 60)}px`,
                    height: isLandscape
                      ? `${ws.width + (isMobile ? 80 : 60)}px`
                      : `${ws.height + (isMobile ? 80 : 100)}px`,
                  }}>
                    {/* Notch */}
                    <div style={{
                      position: 'absolute', background: '#333', borderRadius: '4px', zIndex: 2,
                      top: isLandscape ? '50%' : '20px', left: isLandscape ? '30px' : '50%',
                      transform: isLandscape ? 'translateY(-50%)' : 'translateX(-50%)',
                      width: isLandscape ? '8px' : (isMobile ? '60px' : '80px'),
                      height: isLandscape ? (isMobile ? '60px' : '80px') : '8px',
                    }} />
                    {/* Home button */}
                    <div style={{
                      position: 'absolute', background: '#333', borderRadius: '50%', zIndex: 2,
                      bottom: isLandscape ? '50%' : '15px', right: isLandscape ? '30px' : '50%',
                      transform: isLandscape ? 'translateY(50%)' : 'translateX(50%)',
                      width: isLandscape ? '4px' : '40px', height: isLandscape ? '40px' : '4px',
                    }} />
                    <iframe ref={iframeRef} title="preview" style={{
                      border: 'none', background: 'white', display: 'block',
                      width: isLandscape ? `${ws.height}px` : `${ws.width}px`,
                      height: isLandscape ? `${ws.width}px` : `${ws.height}px`,
                    }} src={activePreview.baseUrl} sandbox={iframeSandbox} allow="cross-origin-isolated" />
                  </div>
                </div>
              ) : (
                <iframe
                  ref={iframeRef} title="preview" className="border-none w-full h-full bg-white"
                  src={activePreview.baseUrl} sandbox={iframeSandbox}
                  allow="geolocation; ch-ua-full-version-list; cross-origin-isolated; screen-wake-lock; publickey-credentials-get; shared-storage-select-url; ch-ua-arch; bluetooth; compute-pressure; ch-prefers-reduced-transparency; deferred-fetch; usb; ch-save-data; publickey-credentials-create; shared-storage; deferred-fetch-minimal; run-ad-auction; ch-ua-form-factors; ch-downlink; otp-credentials; payment; ch-ua; ch-ua-model; ch-ect; autoplay; camera; private-state-token-issuance; accelerometer; ch-ua-platform-version; idle-detection; private-aggregation; interest-cohort; ch-viewport-height; local-fonts; ch-ua-platform; midi; ch-ua-full-version; xr-spatial-tracking; clipboard-read; gamepad; display-capture; keyboard-map; join-ad-interest-group; ch-width; ch-prefers-reduced-motion; browsing-topics; encrypted-media; gyroscope; serial; ch-rtt; ch-ua-mobile; window-management; unload; ch-dpr; ch-prefers-color-scheme; ch-ua-wow64; attribution-reporting; fullscreen; identity-credentials-get; private-state-token-redemption; hid; ch-ua-bitness; storage-access; sync-xhr; ch-device-memory; ch-viewport-width; picture-in-picture; magnetometer; clipboard-write; microphone"
                />
              )}
              <ScreenshotSelector isSelectionMode={isSelectionMode} setIsSelectionMode={setIsSelectionMode} containerRef={iframeRef} />
            </>
          ) : activePreview ? (
            <div className="flex w-full h-full justify-center items-center bg-flowstarter-elements-background-depth-1 text-flowstarter-elements-textPrimary">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">Preview Starting...</div>
                <div className="text-sm text-flowstarter-elements-textSecondary">Waiting for development server to start</div>
              </div>
            </div>
          ) : (
            <div className="flex w-full h-full justify-center items-center bg-flowstarter-elements-background-depth-1 text-flowstarter-elements-textPrimary">
              <div className="text-center p-8 rounded-2xl bg-flowstarter-elements-background-depth-2 border border-flowstarter-elements-borderColor shadow-inner">
                <TextShimmer>
                  <div className="i-lucide:monitor-off w-12 h-12 mx-auto mb-4 opacity-50" />
                  <div className="text-xl font-semibold mb-2 tracking-tight">Ready to Build?</div>
                  <div className="text-sm text-flowstarter-elements-textSecondary max-w-[200px] mx-auto leading-relaxed">
                    Start a development server or prompt the AI to see your app in action.
                  </div>
                </TextShimmer>
              </div>
            </div>
          )}

          {isDeviceModeOn && !showDeviceFrameInPreview && (
            <>
              <div style={{
                position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)',
                background: 'var(--flowstarter-elements-background-depth-3, rgba(0,0,0,0.7))',
                color: 'var(--flowstarter-elements-textPrimary, white)',
                padding: '2px 8px', borderRadius: '4px', fontSize: '12px', pointerEvents: 'none',
                opacity: resizingState.current.isResizing ? 1 : 0, transition: 'opacity 0.3s',
              }}>
                {currentWidth}px
              </div>
              <ResizeHandle side="left" onPointerDown={startResizing} />
              <ResizeHandle side="right" onPointerDown={startResizing} />
            </>
          )}
        </div>
      </div>
    </div>
  );
});
