'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from '@/lib/i18n';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export function AnimatedHowItWorksVisual() {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const steps = [
    {
      label: t('landing.howItWorks.animated.step1'),
      colorLight: '#4d5dd9', // details step - blue
      colorDark: '#c1c8ff',
    },
    {
      label: t('landing.howItWorks.animated.step2'),
      colorLight: '#d478d8', // template step - purple/pink
      colorDark: '#d478d8',
    },
    {
      label: t('landing.howItWorks.animated.step3'),
      colorLight: '#d4c96e', // design step - yellow
      colorDark: '#FFFAB8',
    },
    {
      label: t('landing.howItWorks.animated.step4'),
      colorLight: '#6bc96a', // review step - green
      colorDark: '#C8FFC7',
    },
  ];

  const isDark = theme === 'dark';

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8 bg-linear-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50">
      <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-md">
        {steps.map((step, idx) => {
          const isActive = idx === activeStep;
          const isCompleted = idx < activeStep;
          const stepColor = isDark ? step.colorDark : step.colorLight;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg backdrop-blur-xl border-2 transition-all duration-500 shadow-lg ${
                isActive
                  ? 'bg-[rgba(243,243,243,0.60)] dark:bg-[rgba(58,58,74,0.60)]'
                  : 'bg-[rgba(243,243,243,0.30)] dark:bg-[rgba(58,58,74,0.30)]'
              }`}
              style={{
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                borderColor: isActive ? stepColor : 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-500"
                style={{
                  backgroundColor:
                    isActive || isCompleted
                      ? stepColor
                      : isDark
                      ? 'rgba(58, 58, 74, 0.50)'
                      : 'rgba(243, 243, 243, 0.50)',
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : isActive ? (
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
                ) : (
                  <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <span
                className={`text-sm sm:text-base font-medium transition-all duration-500 ${
                  isActive
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
