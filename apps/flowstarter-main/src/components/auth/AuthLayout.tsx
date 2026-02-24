'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { TranslationKeys, useTranslations } from '@/lib/i18n';

interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  marketingKeys?: Array<TranslationKeys>;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  marketingKeys,
}: AuthLayoutProps) {
  useTheme();
  const { t } = useTranslations();
  // Only show marketing items if explicitly provided
  const items = marketingKeys || [];

  // Dashboard gradient variables (matching PageContainer)
  const gradientTop1 = 'var(--dashboard-gradient-top-1)';
  const gradientTop2 = 'var(--dashboard-gradient-top-2)';
  const gradientBottom = 'var(--dashboard-gradient-bottom)';

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center">
      {/* Dashboard gradient background - matching PageContainer */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-white dark:bg-[hsl(240,8%,17%)]">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 120% 70% at 0% 0%, ${gradientTop1} 0%, color-mix(in srgb, ${gradientTop1} 92%, transparent) 8%, color-mix(in srgb, ${gradientTop1} 82%, transparent) 18%, color-mix(in srgb, ${gradientTop1} 70%, transparent) 28%, color-mix(in srgb, ${gradientTop1} 55%, transparent) 40%, color-mix(in srgb, ${gradientTop1} 40%, transparent) 50%, color-mix(in srgb, ${gradientTop1} 25%, transparent) 60%, color-mix(in srgb, ${gradientTop1} 12%, transparent) 70%, color-mix(in srgb, ${gradientTop1} 5%, transparent) 78%, transparent 85%)`,
            filter: 'blur(70px)',
            mixBlendMode: 'normal',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 100% 65% at 100% 0%, ${gradientTop2} 0%, color-mix(in srgb, ${gradientTop2} 92%, transparent) 8%, color-mix(in srgb, ${gradientTop2} 82%, transparent) 18%, color-mix(in srgb, ${gradientTop2} 70%, transparent) 28%, color-mix(in srgb, ${gradientTop2} 55%, transparent) 40%, color-mix(in srgb, ${gradientTop2} 40%, transparent) 50%, color-mix(in srgb, ${gradientTop2} 25%, transparent) 60%, color-mix(in srgb, ${gradientTop2} 12%, transparent) 70%, color-mix(in srgb, ${gradientTop2} 5%, transparent) 78%, transparent 85%)`,
            filter: 'blur(70px)',
            mixBlendMode: 'normal',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 90% 55% at 50% 100%, ${gradientBottom} 0%, color-mix(in srgb, ${gradientBottom} 92%, transparent) 8%, color-mix(in srgb, ${gradientBottom} 82%, transparent) 18%, color-mix(in srgb, ${gradientBottom} 70%, transparent) 28%, color-mix(in srgb, ${gradientBottom} 55%, transparent) 40%, color-mix(in srgb, ${gradientBottom} 40%, transparent) 50%, color-mix(in srgb, ${gradientBottom} 25%, transparent) 60%, color-mix(in srgb, ${gradientBottom} 12%, transparent) 68%, color-mix(in srgb, ${gradientBottom} 5%, transparent) 76%, transparent 82%)`,
            filter: 'blur(70px)',
            mixBlendMode: 'normal',
          }}
        />
        {/* Enhanced noise texture to reduce banding */}
        <div
          className="absolute inset-0 pointer-events-none dark:opacity-[0.06] opacity-[0.025]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            backgroundSize: '180px 180px',
            mixBlendMode: 'overlay',
          }}
        />
        {/* Additional dithering layer for dark mode */}
        <div
          className="absolute inset-0 pointer-events-none dark:opacity-[0.04] opacity-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='dither'%3E%3CfeTurbulence type='turbulence' baseFrequency='2.2' numOctaves='3' seed='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23dither)'/%3E%3C/svg%3E\")",
            backgroundSize: '128px 128px',
            mixBlendMode: 'soft-light',
          }}
        />
      </div>
      <div className="relative z-10 w-full px-3 sm:px-4 md:px-6 lg:px-16 min-h-screen flex items-center mt-0">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2 items-center w-full py-6 sm:py-8 md:py-8 lg:py-10">
          <div className="hidden lg:flex flex-col justify-center">
            <div className="space-y-6">
              {title ? (
                <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
              ) : null}
              {subtitle ? (
                <p className="text-muted-foreground text-lg leading-relaxed max-w-prose">
                  {subtitle}
                </p>
              ) : null}

              {items.length > 0 && (
                <ul className="mt-6 grid grid-cols-1 gap-4 text-sm text-muted-foreground">
                  {items.map((key) => (
                    <li key={key} className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-primary" />
                      {t(key)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mx-auto w-full flex flex-col items-center justify-center mt-4 sm:mt-6 md:mt-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
