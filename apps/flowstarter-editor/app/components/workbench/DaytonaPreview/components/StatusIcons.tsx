import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

export const CreatingIcon = memo(({ color }: { color: string }) => (
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

export const SyncingIcon = memo(({ color }: { color: string }) => (
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

export const StartingIcon = memo(({ color }: { color: string }) => {
  const containerStyle = useMemo(() => ({ position: 'relative' as const, width: 36, height: 36 }), []);
  const innerStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    [],
  );

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

export const IdleIcon = memo(({ color }: { color: string }) => (
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
