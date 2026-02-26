import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { orbAnimations, orbTransition } from '../constants';

interface FloatingOrbProps {
  delay: number;
  size: number;
  x: string;
  y: string;
  color: string;
}

export const FloatingOrb = memo(({ delay, size, x, y, color }: FloatingOrbProps) => {
  const style = useMemo(
    () => ({
      position: 'absolute' as const,
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: 'blur(40px)',
      pointerEvents: 'none' as const,
    }),
    [x, y, size, color],
  );

  const transition = useMemo(() => orbTransition(delay), [delay]);

  return <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={orbAnimations} transition={transition} style={style} />;
});

FloatingOrb.displayName = 'FloatingOrb';
