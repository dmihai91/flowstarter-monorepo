'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from '@/lib/i18n';
import { useEffect, useMemo, useState } from 'react';

export function FeaturesSection() {
  const { t } = useTranslations();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    // Check immediately
    checkMobile();
    // Also check after a short delay to ensure window is fully initialized
    const timeoutId = setTimeout(checkMobile, 100);
    window.addEventListener('resize', checkMobile);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Determine which dashboard preview image to use based on device and theme
  const dashboardPreviewSrc = useMemo(() => {
    if (!mounted) {
      // During SSR or before mount, return light desktop version
      return '/assets/landing-page/dashboard-preview-light.png';
    }

    if (isMobile) {
      // Mobile variant - use theme-aware image (same pattern as desktop)
      return resolvedTheme === 'dark'
        ? '/assets/landing-page/dashoard-preview-mobile-dark.png'
        : '/assets/landing-page/dashboard-preview-mobile.png';
    } else {
      // Desktop variant - use theme-aware image
      return resolvedTheme === 'dark'
        ? '/assets/landing-page/dashboard-preview-dark.png'
        : '/assets/landing-page/dashboard-preview-light.png';
    }
  }, [mounted, isMobile, resolvedTheme]);

  const features = [
    {
      title: t('landing.features.businessReady.title'),
      description: t('landing.features.businessReady.description'),
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" x2="20" y1="19" y2="19" />
        </svg>
      ),
    },
    {
      title: t('landing.features.modernSolutions.title'),
      description: t('landing.features.modernSolutions.description'),
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
          <rect height="7" rx="2" ry="2" width="18" x="3" y="2" />
          <line x1="7" x2="7" y1="11" y2="15" />
          <line x1="11" x2="11" y1="11" y2="15" />
          <line x1="7" x2="7" y1="2" y2="6" />
        </svg>
      ),
    },
    {
      title: t('landing.features.professionalDesign.title'),
      description: t('landing.features.professionalDesign.description'),
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect height="14" rx="2" ry="2" width="14" x="8" y="8" />
          <line x1="4" x2="8" y1="16" y2="16" />
          <line x1="4" x2="8" y1="20" y2="20" />
          <line x1="16" x2="16" y1="4" y2="8" />
          <line x1="20" x2="20" y1="4" y2="8" />
        </svg>
      ),
    },
    {
      title: t('landing.features.secureReliable.title'),
      description: t('landing.features.secureReliable.description'),
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      title: t('landing.features.easyIntegration.title'),
      description: t('landing.features.easyIntegration.description'),
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="19" x2="5" y1="12" y2="12" />
        </svg>
      ),
    },
    {
      title: t('landing.features.quickLaunch.title'),
      description: t('landing.features.quickLaunch.description'),
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
    },
  ];

  return (
    <section
      id="features"
      className="full-width-section feature-section py-12 md:py-20 lg:py-28 relative"
    >
      {/* Distinct glassmorphism background for Features section */}
      <div className="absolute inset-0 backdrop-blur-xl bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)]" />
      <div className="absolute inset-0 border-t border-b border-white/40 dark:border-white/10" />
      {/* Subtle gradient overlay for distinction */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--purple)]/5 via-blue-500/3 to-transparent pointer-events-none" />
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--purple)]/40/10 to-blue-400/10 dark:from-[var(--purple)]/5 dark:to-blue-600/5 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/10 to-[var(--purple)]/10 dark:from-blue-600/5 dark:to-[var(--purple)]/5 blur-3xl animate-pulse"
          style={{ animationDelay: '1s', animationDuration: '4s' }}
        />
      </div>
      <div className="full-width-content relative z-10">
        <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 text-center w-full">
          <div className="space-y-3 sm:space-y-4 max-w-[850px] mx-auto px-4 sm:px-0">
            <h2 className="text-2xl font-medium tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
              {t('landing.features.sectionTitle')}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground md:text-lg lg:text-xl">
              {t('landing.features.sectionSubtitle')}
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="w-full max-w-5xl mt-6 sm:mt-8 md:mt-12 mb-6 sm:mb-8">
            <div className="relative w-full overflow-hidden rounded-[12px] sm:rounded-[16px] border-0 sm:border border-white dark:border-white/40 backdrop-blur-xl transition-all duration-300 shadow-2xl bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)]">
              <div
                className="relative w-full overflow-hidden flex items-center justify-center"
                style={{
                  aspectRatio: isMobile ? 'auto' : '16/9',
                  minHeight: isMobile ? 'auto' : '250px',
                  maxHeight: isMobile ? 'none' : '550px',
                }}
              >
                {mounted ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`dashboard-preview-${
                      isMobile ? 'mobile' : 'desktop'
                    }-${resolvedTheme}`}
                    src={dashboardPreviewSrc}
                    alt={t('landing.hero.dashboardPreviewAlt')}
                    className={`w-full ${
                      isMobile
                        ? 'h-auto object-contain rounded-[12px]'
                        : 'h-full object-cover object-top'
                    }`}
                    style={
                      isMobile
                        ? {
                            transform: 'scale(1.025)',
                            objectPosition: 'center center',
                          }
                        : { objectPosition: '0% -1px' }
                    }
                    onError={(e) => {
                      console.error(
                        'Failed to load dashboard preview:',
                        dashboardPreviewSrc
                      );
                      // Fallback logic: try mobile light, then desktop light
                      if (
                        e.currentTarget.src.includes('mobile-dark') &&
                        e.currentTarget.src !==
                          '/assets/landing-page/dashboard-preview-mobile.png'
                      ) {
                        // Try mobile light variant
                        e.currentTarget.src =
                          '/assets/landing-page/dashboard-preview-mobile.png';
                      } else if (
                        e.currentTarget.src !==
                        '/assets/landing-page/dashboard-preview-light.png'
                      ) {
                        // Fallback to desktop light version
                        e.currentTarget.src =
                          '/assets/landing-page/dashboard-preview-light.png';
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-[var(--purple)] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-6 sm:pt-8 w-full max-w-7xl">
            {features.map((feature, idx) => (
              <div
                key={feature.title}
                className="group flex flex-col items-center space-y-2 rounded-[12px] sm:rounded-[16px] p-5 sm:p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-1 active:scale-[0.98] backdrop-blur-xl border border-white dark:border-white/40 hover:border-[var(--purple)]/40/50 dark:hover:border-[var(--purple)]/40/30 feature-card cursor-pointer bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)] shadow-lg hover:shadow-xl"
                style={{
                  animationDelay: `${idx * 0.1}s`,
                }}
              >
                <div
                  className="rounded-full p-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                  style={{
                    backgroundColor: 'var(--surface-1)',
                  }}
                >
                  <div
                    className="transition-transform duration-300 group-hover:scale-110"
                    style={{ color: 'var(--purple)' }}
                  >
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-medium transition-colors group-hover:text-[var(--purple)] dark:group-hover:text-[var(--purple)]/40">
                  {feature.title}
                </h3>
                <p className="text-center text-sm sm:text-base text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
