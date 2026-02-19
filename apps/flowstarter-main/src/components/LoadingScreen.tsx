'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useEffect, useMemo } from 'react';

interface LoadingScreenProps {
  message?: string;
}

/**
 * Hides the page scroll by setting overflow to hidden and removing scrollbar gutter
 */
function hideScroll(): void {
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  // Completely hide scrollbar and remove reserved space
  document.documentElement.style.setProperty(
    'scrollbar-width',
    'none',
    'important'
  );
  document.body.style.setProperty('scrollbar-width', 'none', 'important');
  // Remove scrollbar gutter completely
  document.documentElement.style.setProperty(
    'scrollbar-gutter',
    'auto',
    'important'
  );
  document.body.style.setProperty('scrollbar-gutter', 'auto', 'important');
  // For Webkit browsers (Chrome, Safari, Edge)
  const style = document.createElement('style');
  style.id = 'loading-screen-scrollbar-hide';
  style.textContent = `
    html::-webkit-scrollbar,
    body::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Restores the page scroll to its original state
 * Forces restoration to known correct CSS values to ensure scroll works
 */
function restoreScroll(): void {
  // Force remove any inline overflow styles to let CSS take over
  document.body.style.removeProperty('overflow');
  document.documentElement.style.removeProperty('overflow');

  // Restore scrollbar visibility and gutter
  document.documentElement.style.removeProperty('scrollbar-width');
  document.body.style.removeProperty('scrollbar-width');
  document.documentElement.style.scrollbarGutter = 'stable';
  document.body.style.removeProperty('scrollbar-gutter');

  // Remove the injected webkit scrollbar styles
  const style = document.getElementById('loading-screen-scrollbar-hide');
  if (style) {
    style.remove();
  }
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  const { resolvedTheme } = useTheme();
  const isDark = useMemo(() => resolvedTheme === 'dark', [resolvedTheme]);
  const { t } = useTranslations();

  // Hide scroll on mount, restore on unmount
  useEffect(() => {
    hideScroll();

    // Restore scroll when component unmounts
    return () => {
      let restored = false;

      const doRestore = () => {
        if (!restored) {
          restored = true;
          restoreScroll();
        }
      };

      // Use double RAF pattern to ensure restoration happens after all DOM updates
      // This ensures the cleanup runs after React finishes batching updates
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          doRestore();
        });
      });

      // Also use a timeout as a fallback to guarantee restoration
      // in case RAF doesn't fire (e.g., if tab is backgrounded)
      setTimeout(() => {
        doRestore();
      }, 50);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center w-full"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Background gradient - same as dashboard for consistency */}
      <div className="absolute inset-0 bg-white dark:bg-[hsl(240,8%,17%)]">
        {/* Top-left gradient - Pink - Enhanced with more color stops for smoother transitions */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 120% 70% at 0% 0%, var(--dashboard-gradient-top-1) 0%, color-mix(in srgb, var(--dashboard-gradient-top-1) 95%, transparent) 4%, color-mix(in srgb, var(--dashboard-gradient-top-1) 88%, transparent) 8%, color-mix(in srgb, var(--dashboard-gradient-top-1) 82%, transparent) 12%, color-mix(in srgb, var(--dashboard-gradient-top-1) 75%, transparent) 18%, color-mix(in srgb, var(--dashboard-gradient-top-1) 68%, transparent) 24%, color-mix(in srgb, var(--dashboard-gradient-top-1) 60%, transparent) 30%, color-mix(in srgb, var(--dashboard-gradient-top-1) 52%, transparent) 36%, color-mix(in srgb, var(--dashboard-gradient-top-1) 45%, transparent) 42%, color-mix(in srgb, var(--dashboard-gradient-top-1) 38%, transparent) 48%, color-mix(in srgb, var(--dashboard-gradient-top-1) 32%, transparent) 53%, color-mix(in srgb, var(--dashboard-gradient-top-1) 28%, transparent) 58%, color-mix(in srgb, var(--dashboard-gradient-top-1) 22%, transparent) 62%, color-mix(in srgb, var(--dashboard-gradient-top-1) 16%, transparent) 66%, color-mix(in srgb, var(--dashboard-gradient-top-1) 12%, transparent) 69%, color-mix(in srgb, var(--dashboard-gradient-top-1) 8%, transparent) 71%, color-mix(in srgb, var(--dashboard-gradient-top-1) 4%, transparent) 73%, transparent 75%)`,
              mixBlendMode: 'normal',
            }}
          />
          {/* Noise overlay for this gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter1'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0.5 1 0.5 0 0.5 1 0.5'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter1)'/%3E%3C/svg%3E\")",
              backgroundSize: '150px 150px',
              mixBlendMode: 'overlay',
              opacity: isDark ? 0.15 : 0.03,
            }}
          />
        </div>
        {/* Top-right gradient - Purple - Enhanced with more color stops */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 100% 65% at 100% 0%, var(--dashboard-gradient-top-2) 0%, color-mix(in srgb, var(--dashboard-gradient-top-2) 95%, transparent) 4%, color-mix(in srgb, var(--dashboard-gradient-top-2) 88%, transparent) 8%, color-mix(in srgb, var(--dashboard-gradient-top-2) 82%, transparent) 12%, color-mix(in srgb, var(--dashboard-gradient-top-2) 75%, transparent) 18%, color-mix(in srgb, var(--dashboard-gradient-top-2) 68%, transparent) 24%, color-mix(in srgb, var(--dashboard-gradient-top-2) 60%, transparent) 30%, color-mix(in srgb, var(--dashboard-gradient-top-2) 52%, transparent) 36%, color-mix(in srgb, var(--dashboard-gradient-top-2) 45%, transparent) 42%, color-mix(in srgb, var(--dashboard-gradient-top-2) 38%, transparent) 48%, color-mix(in srgb, var(--dashboard-gradient-top-2) 32%, transparent) 53%, color-mix(in srgb, var(--dashboard-gradient-top-2) 28%, transparent) 58%, color-mix(in srgb, var(--dashboard-gradient-top-2) 22%, transparent) 62%, color-mix(in srgb, var(--dashboard-gradient-top-2) 16%, transparent) 66%, color-mix(in srgb, var(--dashboard-gradient-top-2) 12%, transparent) 69%, color-mix(in srgb, var(--dashboard-gradient-top-2) 8%, transparent) 71%, color-mix(in srgb, var(--dashboard-gradient-top-2) 4%, transparent) 73%, transparent 75%)`,
              mixBlendMode: 'normal',
            }}
          />
          {/* Noise overlay for this gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.3' numOctaves='5' stitchTiles='stitch' seed='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0.5 1 0.5 0 0.5 1 0.5'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter2)'/%3E%3C/svg%3E\")",
              backgroundSize: '150px 150px',
              mixBlendMode: 'overlay',
              opacity: isDark ? 0.15 : 0.03,
            }}
          />
        </div>
        {/* Bottom gradient - Yellow - Enhanced with more color stops */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 90% 55% at 50% 100%, var(--dashboard-gradient-bottom) 0%, color-mix(in srgb, var(--dashboard-gradient-bottom) 95%, transparent) 4%, color-mix(in srgb, var(--dashboard-gradient-bottom) 88%, transparent) 8%, color-mix(in srgb, var(--dashboard-gradient-bottom) 82%, transparent) 12%, color-mix(in srgb, var(--dashboard-gradient-bottom) 75%, transparent) 18%, color-mix(in srgb, var(--dashboard-gradient-bottom) 68%, transparent) 24%, color-mix(in srgb, var(--dashboard-gradient-bottom) 60%, transparent) 30%, color-mix(in srgb, var(--dashboard-gradient-bottom) 52%, transparent) 36%, color-mix(in srgb, var(--dashboard-gradient-bottom) 45%, transparent) 42%, color-mix(in srgb, var(--dashboard-gradient-bottom) 38%, transparent) 48%, color-mix(in srgb, var(--dashboard-gradient-bottom) 32%, transparent) 53%, color-mix(in srgb, var(--dashboard-gradient-bottom) 28%, transparent) 58%, color-mix(in srgb, var(--dashboard-gradient-bottom) 22%, transparent) 62%, color-mix(in srgb, var(--dashboard-gradient-bottom) 16%, transparent) 66%, color-mix(in srgb, var(--dashboard-gradient-bottom) 12%, transparent) 69%, color-mix(in srgb, var(--dashboard-gradient-bottom) 8%, transparent) 71%, color-mix(in srgb, var(--dashboard-gradient-bottom) 4%, transparent) 73%, transparent 75%)`,
              mixBlendMode: 'normal',
            }}
          />
          {/* Noise overlay for this gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter3'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='5' stitchTiles='stitch' seed='3'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0.5 1 0.5 0 0.5 1 0.5'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter3)'/%3E%3C/svg%3E\")",
              backgroundSize: '150px 150px',
              mixBlendMode: 'overlay',
              opacity: isDark ? 0.15 : 0.03,
            }}
          />
        </div>
        {/* Global noise texture layer - stronger for better banding reduction */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilterGlobal'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='6' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0.5 1 0.5 0 0.5 1 0.5'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilterGlobal)'/%3E%3C/svg%3E\")",
            backgroundSize: '120px 120px',
            mixBlendMode: 'overlay',
            opacity: isDark ? 0.18 : 0.04,
          }}
        />
        {/* High-frequency dithering layer for fine banding reduction */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='ditherFine'%3E%3CfeTurbulence type='turbulence' baseFrequency='3.5' numOctaves='4' seed='5'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0.33 0.66 1 0.33 0.66 1 0'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23ditherFine)'/%3E%3C/svg%3E\")",
            backgroundSize: '100px 100px',
            mixBlendMode: 'soft-light',
            opacity: isDark ? 0.12 : 0.025,
          }}
        />
        {/* Additional coarse grain layer for maximum banding reduction */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grainCoarse'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch' seed='7'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grainCoarse)'/%3E%3C/svg%3E\")",
            backgroundSize: '80px 80px',
            mixBlendMode: 'multiply',
            opacity: isDark ? 0.08 : 0.015,
          }}
        />
        {/* Extra dark mode specific noise layer for maximum banding reduction */}
        {isDark && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseDarkMode'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.0' numOctaves='5' stitchTiles='stitch' seed='11'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0.25 0.5 0.75 1 0.5 0.25 0.75'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseDarkMode)'/%3E%3C/svg%3E\")",
              backgroundSize: '90px 90px',
              mixBlendMode: 'screen',
              opacity: 0.1,
            }}
          />
        )}
      </div>

      {/* Semi-transparent overlay with backdrop blur */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{
          backgroundColor: isDark
            ? 'rgba(0, 0, 0, 0.4)'
            : 'rgba(255, 255, 255, 0.3)',
        }}
      />

      {/* Glassmorphism card with enhanced glass effect */}
      <div
        className="relative w-[min(90vw,420px)] rounded-xl border-2 backdrop-blur-2xl p-10 sm:p-12 animate-fade-in"
        style={{
          backgroundColor: isDark
            ? 'color-mix(in srgb, var(--surface-2) 65%, transparent)'
            : 'color-mix(in srgb, var(--surface-2) 80%, transparent)',
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Subtle inner glow with anti-banding */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.07) 10%, rgba(139, 92, 246, 0.06) 20%, rgba(131, 75, 241, 0.05) 25%, rgba(124, 58, 237, 0.04) 30%, rgba(117, 49, 226, 0.0325) 37%, rgba(109, 40, 217, 0.025) 45%, rgba(100, 37, 201, 0.02) 52%, rgba(91, 33, 182, 0.015) 60%, rgba(83, 31, 165, 0.01) 67%, transparent 75%)'
              : 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.054) 10%, rgba(139, 92, 246, 0.048) 20%, rgba(131, 75, 241, 0.042) 25%, rgba(124, 58, 237, 0.036) 30%, rgba(117, 49, 226, 0.03) 37%, rgba(109, 40, 217, 0.024) 45%, rgba(100, 37, 201, 0.018) 52%, rgba(91, 33, 182, 0.012) 60%, rgba(83, 31, 165, 0.006) 67%, transparent 75%)',
            mixBlendMode: 'normal',
          }}
        />

        {/* Content */}
        <div className="relative">
          {/* Brand header with refined spacing */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="relative h-8 w-8 animate-pulse-subtle">
              <Image
                src="/logos/flowstarter-mark.svg"
                alt="Flowstarter"
                fill
                sizes="32px"
                priority
              />
            </div>
            <div
              className={`text-base font-semibold tracking-tight ${
                isDark ? 'text-white/95' : 'text-gray-900'
              }`}
            >
              {t('app.name')}
            </div>
          </div>

          {/* Elegant spinner */}
          <div className="flex flex-col items-center gap-6">
            {/* Refined triple-ring spinner with glow */}
            <div className="relative w-28 h-28">
              {/* Glow effect behind spinner with anti-banding */}
              <div
                className="absolute inset-[-8px] rounded-full opacity-40 blur-xl animate-pulse-glow"
                style={{
                  background:
                    'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0.36) 10%, rgba(139, 92, 246, 0.32) 20%, rgba(131, 75, 241, 0.28) 25%, rgba(124, 58, 237, 0.24) 30%, rgba(117, 49, 226, 0.2) 37%, rgba(109, 40, 217, 0.16) 45%, rgba(100, 37, 201, 0.12) 52%, rgba(91, 33, 182, 0.08) 60%, rgba(83, 31, 165, 0.06) 67%, rgba(76, 29, 149, 0.04) 75%, rgba(67, 18, 124, 0.02) 82%, transparent 90%)',
                  mixBlendMode: 'normal',
                }}
              />

              {/* Outer ring - purple */}
              <div
                className="absolute inset-0 rounded-full border-[4px] border-transparent animate-spin-elegant"
                style={{
                  animationDuration: '1.2s',
                  borderTopColor: 'var(--purple-primary)',
                  borderRightColor: 'rgba(139, 92, 246, 0.25)',
                }}
              />

              {/* Middle ring - blue */}
              <div
                className="absolute inset-[12px] rounded-full border-[4px] border-transparent animate-spin-elegant-reverse"
                style={{
                  animationDuration: '1.6s',
                  borderRightColor: 'var(--secondary-primary)',
                  borderBottomColor: 'rgba(59, 130, 246, 0.25)',
                }}
              />

              {/* Inner ring - accent */}
              <div
                className="absolute inset-[24px] rounded-full border-[3px] border-transparent animate-spin-elegant"
                style={{
                  animationDuration: '2s',
                  borderBottomColor: 'var(--accent-primary)',
                  borderLeftColor: 'rgba(168, 85, 247, 0.25)',
                }}
              />

              {/* Center pulse dot with smooth gradient */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-5 h-5 rounded-full animate-pulse-glow"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--purple-primary) 0%, color-mix(in srgb, var(--purple-primary) 70%, var(--accent-primary) 30%) 25%, color-mix(in srgb, var(--purple-primary) 40%, var(--accent-primary) 60%) 50%, color-mix(in srgb, var(--purple-primary) 20%, var(--accent-primary) 80%) 75%, var(--accent-primary) 100%)',
                  }}
                />
              </div>
            </div>

            {/* Message with refined typography */}
            <div className="text-center space-y-2">
              <span
                className={cn(
                  'block text-lg font-semibold tracking-tight',
                  isDark ? 'text-white/95' : 'text-gray-900'
                )}
              >
                {message}
              </span>
              <span
                className={`block text-sm font-normal ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {t('app.gettingReady')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
