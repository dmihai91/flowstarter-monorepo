import React from 'react';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { motion } from 'framer-motion';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import type { OnboardingStep } from '~/components/editor/editor-chat/types';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface EmptyStateProps {
  type: 'preview' | 'editor';
  step?: OnboardingStep;
}

// Animated background orbs
const FloatingOrb = ({
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
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{
      opacity: [0.3, 0.6, 0.3],
      scale: [0.8, 1.1, 0.8],
      x: [0, 20, 0],
      y: [0, -15, 0],
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: 'blur(40px)',
      pointerEvents: 'none',
    }}
  />
);

// Animated grid pattern
const GridPattern = ({ isDark }: { isDark: boolean }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px),
                        linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px)`,
      backgroundSize: '60px 60px',
      maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 100%)',
    }}
  />
);

// Pulsing ring animation
const PulsingRings = ({ color }: { color: string }) => (
  <>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: [0.4, 0, 0.4],
          scale: [0.8, 1.8, 0.8],
        }}
        transition={{
          duration: 3,
          delay: i * 1,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        style={{
          position: 'absolute',
          inset: -20 - i * 20,
          borderRadius: '50%',
          border: `1px solid ${color}`,
          pointerEvents: 'none',
        }}
      />
    ))}
  </>
);

// Step-specific icons with animations
const TemplateIcon = ({ color }: { color: string }) => (
  <motion.svg
    width="36"
    height="36"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <motion.rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    />
    <motion.line
      x1="3"
      y1="9"
      x2="21"
      y2="9"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    />
    <motion.line
      x1="9"
      y1="21"
      x2="9"
      y2="9"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.7 }}
    />
  </motion.svg>
);

const PaletteIcon = ({ color }: { color: string }) => (
  <motion.svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <motion.path
      d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.688H16c3.312 0 6-2.688 6-6 0-5.523-4.477-10-10-10z"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    />
    {[
      [6.5, 11.5],
      [10, 7.5],
      [14, 7.5],
      [17.5, 11.5],
    ].map(([cx, cy], i) => (
      <motion.circle
        key={i}
        cx={cx}
        cy={cy}
        r="1.5"
        fill={color}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.8 + i * 0.1 }}
      />
    ))}
  </motion.svg>
);

const FontIcon = ({ color }: { color: string }) => (
  <motion.svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <motion.text
      x="6"
      y="17"
      fontSize="14"
      fontWeight="bold"
      fontFamily="serif"
      fill={color}
      stroke="none"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      Aa
    </motion.text>
    <motion.line
      x1="4"
      y1="20"
      x2="20"
      y2="20"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    />
  </motion.svg>
);

const GeneratingIcon = ({ color }: { color: string }) => (
  <motion.div style={{ position: 'relative', width: 36, height: 36 }}>
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
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      initial={{ scale: 0 }}
      animate={{ scale: [0.8, 1.2, 0.8] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
        <path d="M12 3L14.5 8.5L21 9.27L16.5 13.97L17.5 21L12 17.77L6.5 21L7.5 13.97L3 9.27L9.5 8.5L12 3Z" />
      </svg>
    </motion.div>
  </motion.div>
);

const WelcomeIcon = ({ color }: { color: string }) => (
  <motion.svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <motion.path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1 }}
    />
    {[7, 11, 15].map((x, i) => (
      <motion.circle
        key={i}
        cx={x}
        cy="10"
        r="1"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0.8, 1] }}
        transition={{ duration: 0.5, delay: 0.8 + i * 0.15 }}
      />
    ))}
  </motion.svg>
);

const EditorIcon = ({ color }: { color: string }) => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <polyline points="16,18 22,12 16,6" />
    <polyline points="8,6 2,12 8,18" />
  </svg>
);

const IntegrationsIcon = ({ color }: { color: string }) => (
  <motion.svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    {/* Lightning bolt for integrations/connections */}
    <motion.path
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    />
  </motion.svg>
);

// Step configuration
const getStepConfig = (step: OnboardingStep | undefined, type: 'preview' | 'editor') => {
  if (type === 'editor') {
    return {
      icon: EditorIcon,
      title: t(EDITOR_LABEL_KEYS.EMPTY_CODE_EDITOR),
      subtitle: t(EDITOR_LABEL_KEYS.EMPTY_CODE_SUBTITLE),
      accentColor: 'rgba(6, 182, 212, 0.3)',
    };
  }

  switch (step) {
    case 'welcome':
    case 'describe':
      return {
        icon: WelcomeIcon,
        title: t(EDITOR_LABEL_KEYS.EMPTY_DESCRIBE_TITLE),
        subtitle: t(EDITOR_LABEL_KEYS.EMPTY_DESCRIBE_SUBTITLE),
        accentColor: 'rgba(77, 93, 217, 0.3)',
      };
    case 'name':
      return {
        icon: WelcomeIcon,
        title: t(EDITOR_LABEL_KEYS.EMPTY_NAME_TITLE),
        subtitle: t(EDITOR_LABEL_KEYS.EMPTY_NAME_SUBTITLE),
        accentColor: 'rgba(77, 93, 217, 0.3)',
      };
    case 'business-uvp':
    case 'business-audience':
    case 'business-goals':
    case 'business-tone':
    case 'business-selling':
    case 'business-pricing':
    case 'business-summary':
      return {
        icon: WelcomeIcon,
        title: t(EDITOR_LABEL_KEYS.EMPTY_BUSINESS_TITLE),
        subtitle: t(EDITOR_LABEL_KEYS.EMPTY_BUSINESS_SUBTITLE),
        accentColor: 'rgba(77, 93, 217, 0.3)',
      };
    case 'template':
      return {
        icon: TemplateIcon,
        title: t(EDITOR_LABEL_KEYS.EMPTY_TEMPLATE_TITLE),
        subtitle: t(EDITOR_LABEL_KEYS.EMPTY_TEMPLATE_SUBTITLE),
        accentColor: 'rgba(6, 182, 212, 0.3)',
      };
    case 'personalization':
      return {
        icon: PaletteIcon,
        title: t(EDITOR_LABEL_KEYS.EMPTY_PERSONALIZE_TITLE),
        subtitle: t(EDITOR_LABEL_KEYS.EMPTY_PERSONALIZE_SUBTITLE),
        accentColor: 'rgba(236, 72, 153, 0.5)',
      };
    case 'integrations':
      return {
        icon: IntegrationsIcon,
        title: 'Connect Your Services',
        subtitle: 'Add booking and newsletter integrations to enhance your site',
        accentColor: 'rgba(14, 165, 233, 0.5)',
      };
    case 'creating':
      return {
        icon: GeneratingIcon,
        title: t(EDITOR_LABEL_KEYS.EMPTY_CREATING_TITLE),
        subtitle: t(EDITOR_LABEL_KEYS.EMPTY_CREATING_SUBTITLE),
        accentColor: 'rgba(34, 197, 94, 0.5)',
      };
    case 'ready':
      return {
        icon: GeneratingIcon,
        title: t(EDITOR_LABEL_KEYS.EMPTY_READY_TITLE),
        subtitle: t(EDITOR_LABEL_KEYS.EMPTY_READY_SUBTITLE),
        accentColor: 'rgba(34, 197, 94, 0.5)',
      };
    default:
      return {
        icon: WelcomeIcon,
        title: t(EDITOR_LABEL_KEYS.EMPTY_DESCRIBE_TITLE),
        subtitle: t(EDITOR_LABEL_KEYS.EMPTY_DESCRIBE_SUBTITLE),
        accentColor: 'rgba(77, 93, 217, 0.3)',
      };
  }
};

export function EmptyState({ type, step }: EmptyStateProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);
  const config = getStepConfig(step, type);
  const IconComponent = config.icon;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <FlowBackground variant="editor" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />


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
          key={step} // Re-animate on step change
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
          style={{
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
            position: 'relative',
          }}
        >
          <PulsingRings color={isDark ? 'rgba(77, 93, 217, 0.08)' : 'rgba(6, 182, 212, 0.06)'} />
          <IconComponent color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'} />
        </motion.div>

        {/* Title */}
        <motion.h3
          key={`title-${step}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
            marginBottom: '10px',
            textAlign: 'center',
            letterSpacing: '-0.02em',
          }}
        >
          {config.title}
        </motion.h3>

        {/* Subtitle */}
        <motion.p
          key={`subtitle-${step}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{
            fontSize: '14px',
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            textAlign: 'center',
            maxWidth: '280px',
            lineHeight: 1.5,
          }}
        >
          {config.subtitle}
        </motion.p>

        {/* Step indicator dots */}
        {type === 'preview' && step && step !== 'ready' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '32px',
            }}
          >
            {['describe', 'name', 'business-summary', 'template', 'personalization', 'integrations'].map((s, i) => {
              const steps = ['describe', 'name', 'business-summary', 'template', 'personalization', 'integrations'];
              // Map business-* steps to business-summary, welcome to describe, and creating to integrations (last step before build)
              const mappedStep = step === 'welcome' ? 'describe' : step?.startsWith('business-') ? 'business-summary' : step === 'creating' ? 'integrations' : step;
              const currentIndex = steps.indexOf(mappedStep || 'describe');
              const isActive = i <= currentIndex;
              const isCurrent = s === mappedStep;

              return (
                <motion.div
                  key={s}
                  animate={{
                    scale: isCurrent ? 1.2 : 1,
                    backgroundColor: isActive
                      ? isDark
                        ? 'rgba(77, 93, 217, 0.7)'
                        : 'rgba(77, 93, 217, 0.6)'
                      : isDark
                        ? 'rgba(255,255,255,0.15)'
                        : 'rgba(0,0,0,0.1)',
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                  }}
                />
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

