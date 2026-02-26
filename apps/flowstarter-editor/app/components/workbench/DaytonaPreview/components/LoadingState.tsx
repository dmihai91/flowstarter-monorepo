import { memo } from 'react';
import { motion } from 'framer-motion';
import { STATUS_CONFIG } from '../constants';
import { FloatingOrb } from './FloatingOrb';
import { GridPattern } from './GridPattern';
import { PulsingRings } from './PulsingRings';
import { ProgressDots } from './ProgressDots';
import type { PreviewStatus } from '../types';

interface LoadingStateProps {
  status: Exclude<PreviewStatus, 'ready' | 'error'>;
  isDark: boolean;
  containerStyle: React.CSSProperties;
  iconContainerStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  subtitleStyle: React.CSSProperties;
  iconColor: string;
  ringsColor: string;
  onRetry?: () => void;
}

export const LoadingState = memo(
  ({
    status,
    isDark,
    containerStyle,
    iconContainerStyle,
    titleStyle,
    subtitleStyle,
    iconColor,
    ringsColor,
    onRetry,
  }: LoadingStateProps) => {
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
  },
);

LoadingState.displayName = 'LoadingState';
