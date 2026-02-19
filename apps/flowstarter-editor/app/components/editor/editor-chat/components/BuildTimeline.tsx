import { motion, AnimatePresence } from 'framer-motion';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

export interface BuildStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error' | 'fixing';
  message?: string;
}

interface BuildTimelineProps {
  steps: BuildStep[];
  isDark: boolean;
  isVisible: boolean;
}

const stepConfig = {
  pending: {
    icon: '○',
    bgLight: 'rgba(0,0,0,0.05)',
    bgDark: 'rgba(255,255,255,0.08)',
    textLight: 'rgba(0,0,0,0.4)',
    textDark: 'rgba(255,255,255,0.4)',
  },
  in_progress: {
    icon: '◉',
    bgLight: 'rgba(77, 93, 217, 0.1)',
    bgDark: 'rgba(193, 200, 255, 0.15)',
    textLight: '#4D5DD9',
    textDark: '#C1C8FF',
  },
  completed: {
    icon: '✓',
    bgLight: 'rgba(34, 197, 94, 0.1)',
    bgDark: 'rgba(74, 222, 128, 0.15)',
    textLight: '#22C55E',
    textDark: '#4ADE80',
  },
  fixing: {
    icon: '🔧',
    bgLight: 'rgba(245, 158, 11, 0.1)',
    bgDark: 'rgba(251, 191, 36, 0.15)',
    textLight: '#F59E0B',
    textDark: '#FBBF24',
  },
  error: {
    icon: '✕',
    bgLight: 'rgba(239, 68, 68, 0.1)',
    bgDark: 'rgba(248, 113, 113, 0.15)',
    textLight: '#EF4444',
    textDark: '#F87171',
  },
};

export function BuildTimeline({ steps, isDark, isVisible }: BuildTimelineProps) {
  if (!isVisible || steps.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="ml-10 py-4"
    >
      <div className="relative">
        {/* Vertical line connecting steps */}
        <div
          className="absolute left-3 top-6 bottom-6 w-0.5"
          style={{
            background: isDark
              ? 'linear-gradient(180deg, rgba(193, 200, 255, 0.3) 0%, rgba(193, 200, 255, 0.1) 100%)'
              : 'linear-gradient(180deg, rgba(77, 93, 217, 0.3) 0%, rgba(77, 93, 217, 0.1) 100%)',
          }}
        />

        {/* Steps */}
        <div className="space-y-3">
          <AnimatePresence mode="sync">
            {steps.map((step, index) => {
              const config = stepConfig[step.status];
              const isActive = step.status === 'in_progress' || step.status === 'fixing';

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  {/* Step indicator */}
                  <div className="relative z-10">
                    <motion.div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{
                        background: isDark ? config.bgDark : config.bgLight,
                        color: isDark ? config.textDark : config.textLight,
                        boxShadow: isActive
                          ? `0 0 0 3px ${isDark ? 'rgba(193, 200, 255, 0.2)' : 'rgba(77, 93, 217, 0.15)'}`
                          : 'none',
                      }}
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={isActive ? { repeat: Infinity, duration: 1.5 } : {}}
                    >
                      {isActive ? (
                        <motion.div
                          className="w-3 h-3 rounded-full"
                          style={{ background: isDark ? config.textDark : config.textLight }}
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        />
                      ) : (
                        config.icon
                      )}
                    </motion.div>
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium"
                        style={{
                          color:
                            step.status === 'pending'
                              ? isDark
                                ? 'rgba(255,255,255,0.5)'
                                : 'rgba(0,0,0,0.5)'
                              : isDark
                                ? 'rgba(255,255,255,0.9)'
                                : 'rgba(0,0,0,0.9)',
                        }}
                      >
                        {step.label}
                      </span>

                      {/* Spinner for active step */}
                      {isActive && (
                        <motion.div
                          className="w-3 h-3 rounded-full border-2"
                          style={{
                            borderColor: isDark ? 'rgba(193, 200, 255, 0.3)' : 'rgba(77, 93, 217, 0.2)',
                            borderTopColor: isDark ? '#C1C8FF' : '#4D5DD9',
                          }}
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                        />
                      )}
                    </div>

                    {/* Progress message for active step */}
                    {step.message && isActive && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-xs mt-1 truncate"
                        style={{
                          color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                          maxWidth: '240px',
                        }}
                      >
                        {step.message}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Helper to create build steps based on the current phase
 */
export function createBuildSteps(phase: string, currentMessage?: string): BuildStep[] {
  const phases: Record<string, { steps: BuildStep[] }> = {
    idle: { steps: [] },
    generating: {
      steps: [
        { id: 'env', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_PREPARING), status: 'completed' },
        {
          id: 'ai',
          label: t(EDITOR_LABEL_KEYS.BUILD_STEP_AI_CUSTOMIZING),
          status: 'in_progress',
          message: currentMessage,
        },
        { id: 'files', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_CREATING_FILES), status: 'pending' },
        { id: 'preview', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_STARTING_PREVIEW), status: 'pending' },
      ],
    },
    deploying: {
      steps: [
        { id: 'env', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_PREPARING), status: 'completed' },
        { id: 'ai', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_AI_CUSTOMIZING), status: 'completed' },
        { id: 'files', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_CREATING_FILES), status: 'completed' },
        { id: 'deploy', label: 'Deploying to cloud sandbox', status: 'in_progress', message: currentMessage },
      ],
    },
    'deploying-upload': {
      steps: [
        { id: 'env', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_PREPARING), status: 'completed' },
        { id: 'ai', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_AI_CUSTOMIZING), status: 'completed' },
        { id: 'files', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_CREATING_FILES), status: 'completed' },
        { id: 'sandbox', label: 'Cloud sandbox ready', status: 'completed' },
        { id: 'upload', label: 'Uploading files', status: 'in_progress', message: currentMessage },
      ],
    },
    'deploying-install': {
      steps: [
        { id: 'env', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_PREPARING), status: 'completed' },
        { id: 'ai', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_AI_CUSTOMIZING), status: 'completed' },
        { id: 'files', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_CREATING_FILES), status: 'completed' },
        { id: 'sandbox', label: 'Cloud sandbox ready', status: 'completed' },
        { id: 'upload', label: 'Files uploaded', status: 'completed' },
        { id: 'install', label: 'Installing dependencies', status: 'in_progress', message: currentMessage },
      ],
    },
    'deploying-server': {
      steps: [
        { id: 'env', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_PREPARING), status: 'completed' },
        { id: 'ai', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_AI_CUSTOMIZING), status: 'completed' },
        { id: 'files', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_CREATING_FILES), status: 'completed' },
        { id: 'sandbox', label: 'Cloud sandbox ready', status: 'completed' },
        { id: 'upload', label: 'Files uploaded', status: 'completed' },
        { id: 'install', label: 'Dependencies installed', status: 'completed' },
        { id: 'server', label: 'Starting dev server', status: 'in_progress', message: currentMessage },
      ],
    },
    'deploying-waiting': {
      steps: [
        { id: 'env', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_PREPARING), status: 'completed' },
        { id: 'ai', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_AI_CUSTOMIZING), status: 'completed' },
        { id: 'files', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_CREATING_FILES), status: 'completed' },
        { id: 'sandbox', label: 'Cloud sandbox ready', status: 'completed' },
        { id: 'upload', label: 'Files uploaded', status: 'completed' },
        { id: 'install', label: 'Dependencies installed', status: 'completed' },
        { id: 'server', label: 'Dev server started', status: 'completed' },
        { id: 'wait', label: 'Waiting for server to respond', status: 'in_progress', message: currentMessage },
      ],
    },
    fixing: {
      steps: [
        { id: 'env', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_PREPARING), status: 'completed' },
        { id: 'ai', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_AI_CUSTOMIZING), status: 'completed' },
        { id: 'files', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_CREATING_FILES), status: 'completed' },
        { id: 'fix', label: 'Auto-fixing build errors', status: 'fixing', message: currentMessage },
        { id: 'preview', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_STARTING_PREVIEW), status: 'pending' },
      ],
    },
    'fixing-retry': {
      steps: [
        { id: 'env', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_PREPARING), status: 'completed' },
        { id: 'ai', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_AI_CUSTOMIZING), status: 'completed' },
        { id: 'files', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_CREATING_FILES), status: 'completed' },
        { id: 'fix', label: 'Auto-fixed build errors', status: 'completed' },
        { id: 'preview', label: 'Retrying preview', status: 'in_progress', message: currentMessage },
      ],
    },
    complete: {
      steps: [
        { id: 'env', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_PREPARING), status: 'completed' },
        { id: 'ai', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_AI_CUSTOMIZING), status: 'completed' },
        { id: 'files', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_CREATING_FILES), status: 'completed' },
        { id: 'preview', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_PREVIEW_READY), status: 'completed' },
      ],
    },
    'complete-healed': {
      steps: [
        { id: 'env', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_PREPARING), status: 'completed' },
        { id: 'ai', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_AI_CUSTOMIZING), status: 'completed' },
        { id: 'files', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_CREATING_FILES), status: 'completed' },
        { id: 'fix', label: 'Auto-fixed build errors', status: 'completed', message: currentMessage },
        { id: 'preview', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_PREVIEW_READY), status: 'completed' },
      ],
    },
    error: {
      steps: [
        { id: 'env', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_PREPARING), status: 'completed' },
        { id: 'ai', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_AI_CUSTOMIZING), status: 'error', message: currentMessage },
        { id: 'files', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_CREATING_FILES), status: 'pending' },
        { id: 'preview', label: t(EDITOR_LABEL_KEYS.BUILD_STEP_STARTING_PREVIEW), status: 'pending' },
      ],
    },
  };

  return phases[phase]?.steps || [];
}
