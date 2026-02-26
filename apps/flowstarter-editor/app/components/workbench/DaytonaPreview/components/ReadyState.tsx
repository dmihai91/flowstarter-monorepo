import { memo, useRef, useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Colors {
  bgGradient: string;
  bgSecondary: string;
  bgTertiary: string;
  borderLight: string;
  borderSubtle: string;
  surfaceLight: string;
  textSubtle: string;
  textMuted: string;
}

interface ReadyStateProps {
  previewUrl: string | null;
  displayUrl?: string;
  isDark: boolean;
  colors: Colors;
  onRefresh?: () => void;
}

const IframeBlockedFallback = memo(
  ({
    isDark,
    shownUrl,
    onOpenInNewTab,
    colors,
  }: {
    isDark: boolean;
    shownUrl: string;
    onOpenInNewTab: () => void;
    colors: Colors;
  }) => (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.bgGradient,
        padding: '24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isDark ? '#22c55e' : '#16a34a'}
            strokeWidth="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h3
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
            marginBottom: '8px',
          }}
        >
          Preview Ready!
        </h3>

        <p
          style={{
            fontSize: '14px',
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            marginBottom: '24px',
            lineHeight: 1.5,
          }}
        >
          Your app is running but can't be displayed in an iframe due to security restrictions. Click below to open it
          in a new tab.
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenInNewTab}
          style={{
            padding: '12px 24px',
            background: isDark
              ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
              : 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15,3 21,3 21,9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Open in New Tab
        </motion.button>

        <p
          style={{
            fontSize: '12px',
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            marginTop: '16px',
          }}
        >
          {shownUrl}
        </p>
      </motion.div>
    </div>
  ),
);

IframeBlockedFallback.displayName = 'IframeBlockedFallback';

const AddressBar = memo(
  ({
    shownUrl,
    colors,
    onRefresh,
    onOpenInNewTab,
  }: {
    shownUrl: string;
    colors: Colors;
    onRefresh: () => void;
    onOpenInNewTab: () => void;
  }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: colors.bgSecondary,
        borderBottom: colors.borderLight,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '8px',
          background: colors.surfaceLight,
          border: colors.borderSubtle,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span
          style={{
            fontSize: '13px',
            color: colors.textMuted,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {shownUrl}
        </span>
      </div>
      <button
        onClick={onRefresh}
        style={{
          padding: '6px',
          borderRadius: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Refresh"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
          <path d="M21 3v6h-6" />
        </svg>
      </button>
      <button
        onClick={onOpenInNewTab}
        style={{
          padding: '6px',
          borderRadius: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Open in new tab"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15,3 21,3 21,9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </button>
    </div>
  ),
);

AddressBar.displayName = 'AddressBar';

export const ReadyState = memo(({ previewUrl, displayUrl, isDark, colors, onRefresh }: ReadyStateProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeBlocked, setIframeBlocked] = useState(false);

  // The URL to show in the address bar (friendly URL)
  const shownUrl = displayUrl || previewUrl || '';

  // Reset iframe blocked state when URL changes
  useEffect(() => {
    setIframeBlocked(false);
  }, [previewUrl]);

  const handleRefresh = useCallback(() => {
    setIframeBlocked(false);

    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl;
    }

    onRefresh?.();
  }, [previewUrl, onRefresh]);

  const handleOpenInNewTab = useCallback(() => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  }, [previewUrl]);

  const handleIframeBlocked = useCallback(() => {
    setIframeBlocked(true);
  }, []);

  const handleIframeLoad = useCallback((e: React.SyntheticEvent<HTMLIFrameElement>) => {
    // Check if iframe loaded successfully or was blocked
    try {
      const iframe = e.target as HTMLIFrameElement;

      // If we can't access contentWindow, it might be blocked
      if (iframe.contentWindow?.location.href === 'about:blank') {
        setIframeBlocked(true);
      }
    } catch {
      /*
       * Cross-origin error means it loaded (but we can't access it)
       * This is actually fine - the content is showing
       */
    }
  }, []);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: colors.bgTertiary }}
    >
      {/* Address bar */}
      <AddressBar
        shownUrl={shownUrl}
        colors={colors}
        onRefresh={handleRefresh}
        onOpenInNewTab={handleOpenInNewTab}
      />

      {/* Preview iframe or fallback */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {iframeBlocked ? (
          <IframeBlockedFallback
            isDark={isDark}
            shownUrl={shownUrl}
            onOpenInNewTab={handleOpenInNewTab}
            colors={colors}
          />
        ) : (
          <iframe
            ref={iframeRef}
            title="Daytona Preview"
            style={{ width: '100%', height: '100%', border: 'none', background: '#ffffff' }}
            src={previewUrl || ''}
            sandbox="allow-scripts allow-forms allow-popups allow-modals allow-storage-access-by-user-activation allow-same-origin"
            allow="cross-origin-isolated"
            onError={handleIframeBlocked}
            onLoad={handleIframeLoad}
          />
        )}
      </div>
    </div>
  );
});

ReadyState.displayName = 'ReadyState';
