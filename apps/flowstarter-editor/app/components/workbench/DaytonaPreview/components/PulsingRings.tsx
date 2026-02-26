import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

interface PulsingRingsProps {
  color: string;
}

export const PulsingRings = memo(({ color }: PulsingRingsProps) => {
  const rings = useMemo(
    () =>
      [0, 1, 2].map((i) => ({
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
      })),
    [color],
  );

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
