import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PROGRESS_STEPS } from '../constants';

interface ProgressDotsProps {
  status: string;
  isDark: boolean;
}

export const ProgressDots = memo(({ status, isDark }: ProgressDotsProps) => {
  const steps = useMemo(() => PROGRESS_STEPS, []);
  const currentIndex = steps.indexOf(
    (status === 'idle' ? 'creating' : status === 'reconnecting' ? 'syncing' : status) as (typeof PROGRESS_STEPS)[number],
  );

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
