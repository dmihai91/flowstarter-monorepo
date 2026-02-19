import { motion, AnimatePresence } from 'framer-motion';
import { BuildTimeline, createBuildSteps } from './BuildTimeline';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface CreatingIndicatorProps {
  isCreating: boolean;
  isDark: boolean;
  currentStep?: string;
  progress?: number; // 0-100
  buildPhase?: string; // 'generating' | 'deploying' | 'complete' | 'error'
}

export function CreatingIndicator({
  isCreating,
  isDark,
  currentStep,
  progress,
  buildPhase = 'generating',
}: CreatingIndicatorProps) {
  if (!isCreating) {
    return null;
  }

  const progressPercent = progress !== undefined ? Math.round(progress) : 0;
  const buildSteps = createBuildSteps(buildPhase, currentStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="ml-10 py-4"
    >
      {/* Overall progress bar */}
      <div className="mb-4">
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{
            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            width: '280px',
          }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isDark
                ? 'linear-gradient(90deg, #C1C8FF 0%, #A78BFA 100%)'
                : 'linear-gradient(90deg, #4D5DD9 0%, #7C3AED 100%)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between items-center mt-1" style={{ width: '280px' }}>
          <span className="text-xs font-medium" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
            {progressPercent}
            {t(EDITOR_LABEL_KEYS.PROGRESS_COMPLETE)}
          </span>
        </div>
      </div>

      {/* Vertical timeline of steps */}
      <BuildTimeline steps={buildSteps} isDark={isDark} isVisible={buildSteps.length > 0} />
    </motion.div>
  );
}
