import { memo, useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { DaytonaPreviewState } from '~/lib/hooks/useDaytonaPreview';
import { useThemeStyles, getColors } from '~/components/editor/hooks';

interface DaytonaPreviewProps {
  state: DaytonaPreviewState;
  onRefresh?: () => void;
  onRetry?: () => void;
}

// Memoized animation variants to prevent recreation
const orbAnimations = {
  opacity: [0.3, 0.6, 0.3],
  scale: [0.8, 1.1, 0.8],
  x: [0, 20, 0],
  y: [0, -15, 0],
};

const orbTransition = (delay: number) => ({
  duration: 8,
  delay,
  repeat: Infinity,
  ease: 'easeInOut' as const,
});

// Animated background orb - memoized
const FloatingOrb = memo(({
  delay,
  size,
  x,
  y,
  color,
}: {
  delay: number;
  size: number;
  x: string;
  y: string;
  color: string;
}) => {
  const style = useMemo(() => ({
    position: 'absolute' as const,
    left: x,
    top: y,
    width: size,
    height: size,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    filter: 'blur(40px)',
    pointerEvents: 'none' as const,
  }), [x, y, size, color]);

  const transition = useMemo(() => orbTransition(delay), [delay]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={orbAnimations}
      transition={transition}
      style={style}
    />
  );
});

FloatingOrb.displayName = 'FloatingOrb';

// Grid pattern background - memoized
const GridPattern = memo(({ isDark }: { isDark: boolean }) => {
  const style = useMemo(() => ({
    position: 'absolute' as const,
    inset: 0,
    backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px),
                      linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px)`,
    backgroundSize: '60px 60px',
    maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 100%)',
  }), [isDark]);

  return <div style={style} />;
});

GridPattern.displayName = 'GridPattern';

// Pulsing rings animation - memoized
const PulsingRings = memo(({ color }: { color: string }) => {
  const rings = useMemo(() => [0, 1, 2].map((i) => ({
    key: i,
    style: {
      position: 'absolute' as const,
      inset: -20 - i * 20,
      borderRadius: '50%',
      border: `1px solid ${color}`,
      pointerEvents: 'none' as const,
    },
    transition: {
      duration: 3,
      delay: i * 1,
      repeat: Infinity,
      ease: 'easeOut' as const,
    },
  })), [color]);

  return (
    <>
      {rings.map((ring) => (
        <motion.div
          key={ring.key}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.4, 0, 0.4],
            scale: [0.8, 1.8, 0.8],
          }}
          transition={ring.transition}
          style={ring.style}
        />
      ))}
    </>
  );
});

PulsingRings.displayName = 'PulsingRings';

// Status icons - memoized
const CreatingIcon = memo(({ color }: { color: string }) => (
  <motion.svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <motion.path
      d="M12 2L2 7l10 5 10-5-10-5z"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8 }}
    />
    <motion.path
      d="M2 17l10 5 10-5"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    />
    <motion.path
      d="M2 12l10 5 10-5"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    />
  </motion.svg>
));

CreatingIcon.displayName = 'CreatingIcon';

const SyncingIcon = memo(({ color }: { color: string }) => (
  <motion.svg
    width="36"
    height="36"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    animate={{ rotate: 360 }}
    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
  >
    <path d="M21 12a9 9 0 11-6.219-8.56" />
    <motion.path d="M21 3v6h-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} />
  </motion.svg>
));

SyncingIcon.displayName = 'SyncingIcon';

const StartingIcon = memo(({ color }: { color: string }) => {
  const containerStyle = useMemo(() => ({ position: 'relative' as const, width: 36, height: 36 }), []);
  const innerStyle = useMemo(() => ({
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }), []);

  return (
    <motion.div style={containerStyle}>
      <motion.svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="12" cy="12" r="10" opacity="0.2" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </motion.svg>
      <motion.div
        style={innerStyle}
        initial={{ scale: 0 }}
        animate={{ scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
          <polygon points="5,3 19,12 5,21" />
        </svg>
      </motion.div>
    </motion.div>
  );
});

StartingIcon.displayName = 'StartingIcon';

const IdleIcon = memo(({ color }: { color: string }) => (
  <motion.svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <motion.circle
      cx="12"
      cy="12"
      r="10"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1 }}
    />
    <motion.path
      d="M12 6v6l4 2"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    />
  </motion.svg>
));

IdleIcon.displayName = 'IdleIcon';

const STATUS_CONFIG = {
  idle: {
    icon: IdleIcon,
    title: 'Initializing preview...',
    subtitle: 'Preparing to start the preview',
    accentColor: 'rgba(139, 92, 246, 0.5)',
    progress: 10,
  },
  creating: {
    icon: CreatingIcon,
    title: 'Creating workspace...',
    subtitle: 'Setting up your development environment',
    accentColor: 'rgba(99, 102, 241, 0.5)',
    progress: 25,
  },
  syncing: {
    icon: SyncingIcon,
    title: 'Syncing files...',
    subtitle: 'Uploading your project files',
    accentColor: 'rgba(236, 72, 153, 0.5)',
    progress: 50,
  },
  starting: {
    icon: StartingIcon,
    title: 'Starting dev server...',
    subtitle: 'Running bun install and bun dev',
    accentColor: 'rgba(34, 197, 94, 0.5)',
    progress: 75,
  },
  reconnecting: {
    icon: SyncingIcon,
    title: 'Restoring preview...',
    subtitle: 'Reconnecting to your development environment',
    accentColor: 'rgba(99, 102, 241, 0.5)',
    progress: 50,
  },
} as const;

// Progress dots component - memoized
const ProgressDots = memo(({ status, isDark }: { status: string; isDark: boolean }) => {
  const steps = useMemo(() => ['creating', 'syncing', 'starting', 'ready'], []);
  const currentIndex = steps.indexOf(status === 'idle' ? 'creating' : status === 'reconnecting' ? 'syncing' : status);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      style={{ display: 'flex', gap: '8px', marginTop: '32px' }}
    >
      {steps.map((s, i) => {
        const isActive = i <= currentIndex;
        const isCurrent = s === status || (status === 'idle' && s === 'creating');

        return (
          <motion.div
            key={s}
            animate={{
              scale: isCurrent ? [1, 1.3, 1] : 1,
              backgroundColor: isActive
                ? isDark
                  ? '#C1C8FF'
                  : 'rgba(99, 102, 241, 0.8)'
                : isDark
                  ? 'rgba(255,255,255,0.15)'
                  : 'rgba(0,0,0,0.1)',
            }}
            transition={
              isCurrent
                ? {
                    scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
                    backgroundColor: { duration: 0.3 },
                  }
                : { duration: 0.3 }
            }
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
            }}
          />
        );
      })}
    </motion.div>
  );
});

ProgressDots.displayName = 'ProgressDots';

export const DaytonaPreview = memo(({ state, onRefresh, onRetry }: DaytonaPreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);
  const { status, previewUrl, displayUrl, error } = state;

  // The URL to show in the address bar (friendly URL)
  const shownUrl = displayUrl || previewUrl;

  // Memoize common styles to prevent re-renders
  const containerStyle = useMemo(() => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.bgGradient,
    position: 'relative' as const,
    overflow: 'hidden',
  }), [colors.bgGradient]);

  const iconContainerStyle = useMemo(() => ({
    width: '100px',
    height: '100px',
    borderRadius: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isDark
      ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 100%)',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
    boxShadow: isDark
      ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
      : '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
    marginBottom: '28px',
    position: 'relative' as const,
  }), [isDark]);

  const titleStyle = useMemo(() => ({
    fontSize: '18px',
    fontWeight: 600,
    color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
    marginBottom: '10px',
    textAlign: 'center' as const,
    letterSpacing: '-0.02em',
  }), [isDark]);

  const subtitleStyle = useMemo(() => ({
    fontSize: '14px',
    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    textAlign: 'center' as const,
    maxWidth: '280px',
    lineHeight: 1.5,
  }), [isDark]);

  const iconColor = useMemo(() => isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)', [isDark]);
  const ringsColor = useMemo(() => isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.12)', [isDark]);

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

  // Loading state
  if (status !== 'ready' && status !== 'error') {
    const config = STATUS_CONFIG[status];
    const IconComponent = config.icon;

    return (
      <div style={containerStyle}>
        {/* Animated background elements */}
        <GridPattern isDark={isDark} />
        <FloatingOrb delay={0} size={300} x="10%" y="20%" color={config.accentColor} />
        <FloatingOrb
          delay={2}
          size={200}
          x="70%"
          y="60%"
          color={isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}
        />
        <FloatingOrb
          delay={4}
          size={150}
          x="80%"
          y="15%"
          color={isDark ? 'rgba(236, 72, 153, 0.2)' : 'rgba(236, 72, 153, 0.15)'}
        />

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Icon container with rings */}
          <motion.div
            key={status}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
            style={iconContainerStyle}
          >
            <PulsingRings color={ringsColor} />
            <IconComponent color={iconColor} />
          </motion.div>

          {/* Title */}
          <motion.h3
            key={`title-${status}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={titleStyle}
          >
            {config.title}
          </motion.h3>

          {/* Subtitle */}
          <motion.p
            key={`subtitle-${status}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={subtitleStyle}
          >
            {config.subtitle}
          </motion.p>

          {/* Progress indicator */}
          <ProgressDots status={status} isDark={isDark} />

          {/* Retry button - appears after delay if stuck in idle/creating */}
          {onRetry && (status === 'idle' || status === 'creating') && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 10 }}
              onClick={onRetry}
              style={{
                marginTop: '20px',
                padding: '8px 24px',
                borderRadius: '8px',
                border: 'none',
                background: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                color: isDark ? '#a78bfa' : '#6366f1',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Retry Preview
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    const errorIconContainerStyle = {
      ...iconContainerStyle,
      background: isDark
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)'
        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
      border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.2)',
    };

    const errorSubtitleStyle = {
      ...subtitleStyle,
      maxWidth: '380px',
      lineHeight: 1.6,
      marginBottom: '24px',
    };

    return (
      <div style={containerStyle}>
        {/* Animated background elements */}
        <GridPattern isDark={isDark} />
        <FloatingOrb delay={0} size={300} x="10%" y="20%" color="rgba(239, 68, 68, 0.3)" />
        <FloatingOrb
          delay={2}
          size={200}
          x="70%"
          y="60%"
          color={isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'}
        />

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Icon container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
            style={errorIconContainerStyle}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isDark ? 'rgba(239, 68, 68, 0.8)' : 'rgba(220, 38, 38, 0.8)'}
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="7" x2="12" y2="13" />
              <circle cx="12" cy="16" r="0.75" fill={isDark ? 'rgba(239, 68, 68, 0.8)' : 'rgba(220, 38, 38, 0.8)'} />
            </svg>
          </motion.div>

          {/* Title */}
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={titleStyle}
          >
            Preview Failed
          </motion.h3>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={errorSubtitleStyle}
          >
            {(() => {
              const codeStyle = {
                background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
              };
              const blockCodeStyle = {
                display: 'block' as const,
                marginTop: '8px',
                background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
              };

              if (error?.includes('API key not configured')) {
                return (
                  <>
                    Daytona sandbox is not configured. Add your API key to <code style={codeStyle}>.env</code> file:
                    <br />
                    <code style={blockCodeStyle}>DAYTONA_API_KEY=your_key</code>
                  </>
                );
              }

              if (error?.includes('HTML instead of JSON') || error?.includes('DAYTONA_API_URL')) {
                return (
                  <>
                    The Daytona API URL appears to be incorrect. Check your <code style={codeStyle}>.env</code> file:
                    <br />
                    <code style={blockCodeStyle}>DAYTONA_API_URL=https://app.daytona.io/api</code>
                  </>
                );
              }

              if (error?.includes('timeout') || error?.includes('Timeout') || error?.includes('taking too long')) {
                return 'The preview server is taking too long to start. This could mean the project has build errors or is missing dependencies. Click "Try Again" to restart.';
              }

              if (error?.includes('build errors') || error?.includes('missing dependencies')) {
                return 'The preview server couldn\'t start. Check that your project has a valid package.json with a "dev" script.';
              }

              if (error?.includes('No files')) {
                return 'No files found in the project. Make sure your project has been created.';
              }

              if (error?.includes('502') || error?.includes('refused') || error?.includes('ECONNREFUSED')) {
                return 'The preview server isn\'t responding. The workspace may have stopped due to inactivity. Click "Try Again" to restart it.';
              }

              return error || 'Something went wrong starting the preview. Click "Try Again" to retry.';
            })()}
          </motion.p>

          {/* Retry button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry || onRefresh}
            style={{
              padding: '10px 24px',
              background: isDark
                ? 'linear-gradient(135deg, #C1C8FF 0%, #4D5DD9 100%)'
                : 'linear-gradient(135deg, #4D5DD9 0%, #6366f1 100%)',
              color: isDark ? '#0a0a0f' : '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: isDark ? '0 2px 8px rgba(193, 200, 255, 0.35)' : '0 2px 8px rgba(77, 93, 217, 0.25)',
            }}
          >
            {error?.includes('API key not configured') ? 'Refresh Page' : 'Try Again'}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Ready state - show iframe
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: colors.bgTertiary }}
    >
      {/* Address bar */}
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
          onClick={handleRefresh}
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
          onClick={handleOpenInNewTab}
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

      {/* Preview iframe or fallback */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {iframeBlocked ? (

          // Fallback when iframe is blocked by X-Frame-Options
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
                Your app is running but can't be displayed in an iframe due to security restrictions. Click below to
                open it in a new tab.
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenInNewTab}
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

DaytonaPreview.displayName = 'DaytonaPreview';
