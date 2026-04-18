/**
 * Shared brand gradient overlay used across the platform.
 * Renders a top-center radial wash that works in both light and dark mode.
 * Drop it after <FlowBackground /> in any layout.
 *
 * variant: "dashboard" gets a stronger, more vibrant wash.
 * positioning: "fixed" for layouts, "absolute" for sections (e.g. hero).
 */

interface GradientWashProps {
  /** "fixed" for full-page layouts, "absolute" for contained sections */
  positioning?: 'fixed' | 'absolute';
  variant?: 'default' | 'dashboard' | 'auth';
  className?: string;
}

export function GradientWash({
  positioning = 'fixed',
  variant = 'default',
  className = '',
}: GradientWashProps) {
  const gradients = {
    default: {
      light:
        'radial-gradient(ellipse 90% 45% at 50% -5%, rgba(99,102,241,0.08) 0%, transparent 65%)',
      dark: 'radial-gradient(ellipse 90% 45% at 50% -5%, rgba(78,91,218,0.16) 0%, rgba(78,91,218,0.10) 20%, rgba(78,91,218,0.05) 40%, rgba(78,91,218,0.02) 60%, transparent 80%)',
    },
    dashboard: {
      light:
        'radial-gradient(ellipse 100% 55% at 50% -5%, rgba(78,91,218,0.18) 0%, rgba(78,91,218,0.07) 45%, transparent 70%)',
      dark: 'radial-gradient(ellipse 100% 55% at 50% -5%, rgba(78,91,218,0.28) 0%, rgba(78,91,218,0.10) 45%, transparent 70%)',
    },
    auth: {
      light:
        'radial-gradient(ellipse 110% 50% at 50% -5%, rgba(78,91,218,0.16) 0%, rgba(78,91,218,0.08) 40%, transparent 70%)',
      dark: 'radial-gradient(ellipse 100% 45% at 50% -5%, rgba(109,40,217,0.14) 0%, rgba(79,46,220,0.07) 45%, transparent 70%)',
    },
  };

  const g = gradients[variant ?? 'default'];

  return (
    <>
      {/* Light mode */}
      <div
        className={`pointer-events-none inset-0 z-[1] dark:hidden ${positioning} ${className}`}
        style={{ background: g.light }}
      />
      {/* Dark mode */}
      <div
        className={`pointer-events-none inset-0 z-[1] hidden dark:block ${positioning} ${className}`}
        style={{ background: g.dark }}
      />
    </>
  );
}
