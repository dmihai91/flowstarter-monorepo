import { memo } from 'react';
import { motion } from 'framer-motion';
import { FloatingOrb } from './FloatingOrb';
import { GridPattern } from './GridPattern';

interface ErrorStateProps {
  error?: string;
  isDark: boolean;
  containerStyle: React.CSSProperties;
  iconContainerStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  subtitleStyle: React.CSSProperties;
  onRetry?: () => void;
  onRefresh?: () => void;
}

const ErrorMessage = memo(({ error, isDark }: { error?: string; isDark: boolean }) => {
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
    return (
      <>
        The preview server is taking too long to start. This could mean the project has build errors or is missing
        dependencies. Click "Try Again" to restart.
      </>
    );
  }

  if (error?.includes('build errors') || error?.includes('missing dependencies')) {
    return (
      <>
        The preview server couldn't start. Check that your project has a valid package.json with a "dev" script.
      </>
    );
  }

  if (error?.includes('No files')) {
    return <>No files found in the project. Make sure your project has been created.</>;
  }

  if (error?.includes('502') || error?.includes('refused') || error?.includes('ECONNREFUSED')) {
    return (
      <>
        The preview server isn't responding. The workspace may have stopped due to inactivity. Click "Try Again" to
        restart it.
      </>
    );
  }

  return <>{error || 'Something went wrong starting the preview. Click "Try Again" to retry.'}</>;
});

ErrorMessage.displayName = 'ErrorMessage';

export const ErrorState = memo(
  ({
    error,
    isDark,
    containerStyle,
    iconContainerStyle,
    titleStyle,
    subtitleStyle,
    onRetry,
    onRefresh,
  }: ErrorStateProps) => {
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
            <ErrorMessage error={error} isDark={isDark} />
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
  },
);

ErrorState.displayName = 'ErrorState';
