'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { ClerkProvider } from '@clerk/nextjs';
import { ui } from '@clerk/ui';
import {
  buildFlowstarterClerkUserButtonElements,
  buildFlowstarterClerkVariables,
  flowstarterClerkAppearanceLayoutHideDevWarnings,
  getFlowstarterClerkBaseTheme,
} from '@flowstarter/flow-design-system/clerk';
import {
  getAllowedRedirectOrigins,
  getSharedCookieDomain,
} from '@flowstarter/platform-config';
import { useEffect, useState, type ComponentProps } from 'react';

import '@/styles/auth-forms.css';

/**
 * ClerkThemeWrapper
 * All color values reference --fs-* design tokens.
 * No hardcoded hex — theme responds automatically when CSS vars change.
 */
export function ClerkThemeWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDarkMode = resolvedTheme === 'dark';

  // Helper: resolve a CSS var to its computed value at mount time.
  // Used for Clerk variables that don't accept CSS var() strings.
  // During SSR / before mount, returns the fallback so we never block
  // the render tree waiting for `getComputedStyle`.
  const resolveVar = (varName: string, fallback: string): string => {
    if (!isMounted) return fallback;
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim() || fallback
    );
  };

  const flowstarterUserButton = buildFlowstarterClerkUserButtonElements({
    isDark: isDarkMode,
    resolveVar,
  });

  // Product tokens the Clerk surfaces borrow so sign-in matches the landing
  // and discovery wizard rather than reading as stock Clerk.
  const ink = resolveVar('--fs-ink', isDarkMode ? '#f4eee4' : '#120a22');
  const inkDim = resolveVar(
    '--fs-ink-dim',
    isDarkMode ? 'rgba(244,238,228,0.72)' : 'rgba(18,10,34,0.62)'
  );
  const inkFaint = resolveVar(
    '--fs-ink-faint',
    isDarkMode ? 'rgba(244,238,228,0.50)' : 'rgba(18,10,34,0.36)'
  );
  const rule = resolveVar(
    '--fs-rule',
    isDarkMode ? 'rgba(244,238,228,0.12)' : 'rgba(18,10,34,0.10)'
  );
  const surface = resolveVar(
    '--fs-bg-elevated',
    isDarkMode ? '#100e1c' : '#ffffff'
  );
  const accent = resolveVar(
    '--purple-primary',
    isDarkMode ? 'hsl(233,70%,74%)' : 'hsl(233,65%,50%)'
  );
  const accentRing = resolveVar(
    '--fs-accent-ring',
    isDarkMode ? 'rgba(130,148,255,0.25)' : 'rgba(78,94,218,0.20)'
  );

  // The landing CTA gradient (`CTAButton` variant="primary") — the one primary
  // button treatment in the product.
  const btnFrom = resolveVar('--landing-btn-from', 'hsl(233,65%,50%)');
  const btnVia = resolveVar('--landing-btn-via', 'hsl(262,60%,55%)');
  const btnHoverFrom = resolveVar('--landing-btn-hover-from', btnVia);
  const btnHoverVia = resolveVar('--landing-btn-hover-via', btnFrom);

  const appearance = {
    baseTheme: getFlowstarterClerkBaseTheme(),
    layout: flowstarterClerkAppearanceLayoutHideDevWarnings,

    variables: buildFlowstarterClerkVariables({
      isDark: isDarkMode,
      resolveVar,
    }),

    elements: {
      // Primary action button — the landing CTA gradient, so the sign-in
      // primary is the same button the visitor already clicked on the way here.
      formButtonPrimary: {
        background: `linear-gradient(135deg, ${btnFrom}, ${btnVia})`,
        color: '#ffffff',
        border: 'none',
        boxShadow: isDarkMode
          ? 'inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 24px rgba(78,94,218,0.35)'
          : 'inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 28px rgba(78,94,218,0.22)',
        borderRadius: '12px',
        minHeight: '48px',
        padding: '12px 1.5rem',
        fontSize: '1rem',
        fontWeight: '600',
        letterSpacing: '-0.005em',
        lineHeight: '1.2',
        textTransform: 'none',
        transition:
          'transform 200ms cubic-bezier(0.19,1,0.22,1), box-shadow 200ms ease, background 200ms ease',
        '&:hover': {
          background: `linear-gradient(135deg, ${btnHoverFrom}, ${btnHoverVia})`,
          transform: 'translateY(-1px)',
          boxShadow: isDarkMode
            ? 'inset 0 1px 0 rgba(255,255,255,0.20), 0 12px 32px rgba(78,94,218,0.45)'
            : 'inset 0 1px 0 rgba(255,255,255,0.26), 0 14px 34px rgba(78,94,218,0.30)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      },

      // Social sign-in is removed for now: Apple and Google are not supported
      // yet (removed at Darius's request). The providers stay enabled in the
      // Clerk dashboard — that config lives outside this repo — so the buttons
      // and their "or" divider are suppressed here instead. Email + password is
      // the single sign-in method.
      socialButtonsRoot: {
        display: 'none',
      },
      socialButtons: {
        display: 'none',
      },
      dividerRow: {
        display: 'none',
      },

      // Transparent inner card — the shell is `cardBox` (glass on a page,
      // opaque inside a modal; see auth-forms.css).
      card: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        boxShadow: 'none',
        width: '100%',
        maxWidth: '640px',
        margin: '0 auto',
        padding: '1.75rem 1.5rem',
      },

      // Dialog shell — matches the discovery wizard's dialog: 20px radius,
      // hairline edge, soft lift over a dimmed backdrop.
      cardBox: {
        borderRadius: '20px',
        borderColor: resolveVar(
          '--fs-glass-edge',
          isDarkMode ? 'rgba(148,163,184,0.30)' : 'rgba(15,23,42,0.11)'
        ),
      },

      header: {
        gap: '0.35rem',
      },

      // Navbar (user profile pages)
      navbar: {
        backgroundColor: isDarkMode ? '#040308' : '#fbf7ef',
        borderColor: 'transparent',
        boxShadow: 'none',
      },

      // Form field wrapper — the input carries the border, not the wrapper.
      formField: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: '0',
        boxShadow: 'none',
      },

      // Input fields — the discovery wizard's `Field` recipe.
      formFieldInput: {
        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#ffffff',
        borderColor: rule,
        borderWidth: '1px',
        color: ink,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        borderRadius: '10px',
        minHeight: '44px',
        padding: '10px 14px',
        fontSize: '0.95rem',
        transition: 'box-shadow 150ms ease, border-color 150ms ease',
        '&:hover': {
          borderColor: accentRing,
        },
        '&:focus': {
          borderColor: accent,
          boxShadow: `0 0 0 4px ${accentRing}`,
        },
      },

      // Field labels — quiet ink, same weight as the wizard's field labels.
      formFieldLabel: {
        color: inkDim,
        fontWeight: '500',
        fontSize: '0.875rem',
        letterSpacing: '-0.005em',
      },

      // Card + form headings
      headerTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
        letterSpacing: '-0.02em',
        lineHeight: '1.2',
        color: ink,
      },
      headerSubtitle: {
        fontSize: '0.9375rem',
        lineHeight: '1.45',
        color: inkDim,
      },
      formHeaderTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
        letterSpacing: '-0.02em',
        lineHeight: '1.2',
        color: ink,
      },
      formHeaderSubtitle: {
        fontSize: '0.9375rem',
        color: inkDim,
      },

      // Footer strip — a barely-there tray. `--fs-bg-raised` is a warm cream
      // that reads as a different material against the card, so this is a
      // neutral wash of the card's own ink instead.
      footer: {
        background: isDarkMode
          ? 'rgba(255,255,255,0.03)'
          : 'rgba(18,10,34,0.025)',
        borderTop: `1px solid ${rule}`,
      },
      footerActionText: {
        color: inkFaint,
        fontSize: '0.875rem',
      },

      modalCloseButton: {
        color: inkFaint,
        '&:hover': { color: ink },
      },

      // Social auth buttons — hidden above, kept on the product's secondary
      // button recipe so re-enabling a provider needs no restyling.
      socialButtonsBlockButton: {
        backgroundColor: surface,
        color: ink,
        borderColor: rule,
        borderWidth: '1px',
        minHeight: '44px',
        borderRadius: '10px',
        fontSize: '0.9375rem',
        fontWeight: '500',
        '&:hover': {
          borderColor: accentRing,
        },
      },
      socialButtonsBlockButtonText: {
        fontSize: '0.9375rem',
        fontWeight: '500',
      },
      socialButtonsIconButton: {
        backgroundColor: surface,
        color: ink,
        borderColor: rule,
        borderWidth: '1px',
        minHeight: '44px',
        borderRadius: '10px',
        '&:hover': {
          borderColor: accentRing,
        },
      },

      ...flowstarterUserButton,

      // After the spread: the design-system default is `bg-black/30`; the
      // discovery wizard dims to `bg-black/60`, so the sign-in dialog reads
      // with the same depth as every other dialog in the product.
      modalBackdrop: 'bg-black/60 backdrop-blur-sm',
    },
  };

  const sharedCookieDomain =
    typeof window !== 'undefined'
      ? getSharedCookieDomain(window.location.hostname)
      : undefined;

  const clerkProviderProps = {
    appearance,
    domain: sharedCookieDomain,
    signInUrl: '/login',
    signUpUrl: '/login',
    signInFallbackRedirectUrl: '/admin/dashboard',
    signUpFallbackRedirectUrl: '/admin/dashboard',
    allowedRedirectOrigins: getAllowedRedirectOrigins(
      typeof window !== 'undefined' ? window.location.hostname : undefined
    ),
  } as unknown as ComponentProps<typeof ClerkProvider>;

  return (
    <ClerkProvider
      {...clerkProviderProps}
      ui={ui as Parameters<typeof ClerkProvider>[0]['ui']}
    >
      {children}
    </ClerkProvider>
  );
}
