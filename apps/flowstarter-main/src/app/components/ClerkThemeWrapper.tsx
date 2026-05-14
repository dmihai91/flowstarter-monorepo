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

  const appearance = {
    baseTheme: getFlowstarterClerkBaseTheme(),
    layout: flowstarterClerkAppearanceLayoutHideDevWarnings,

    variables: buildFlowstarterClerkVariables({
      isDark: isDarkMode,
      resolveVar,
    }),

    elements: {
      // Primary action button — full CTA treatment
      formButtonPrimary: {
        background: isDarkMode
          ? 'linear-gradient(135deg, hsl(233,65%,44%) 0%, hsl(233,70%,58%) 50%, hsl(233,65%,44%) 100%)'
          : 'linear-gradient(135deg, #0f1a3d 0%, #1e2d6b 50%, #0f1a3d 100%)',
        color: isDarkMode ? '#ffffff' : '#fbf7ef',
        boxShadow: isDarkMode
          ? 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.3), 0 8px 24px rgba(78,94,218,0.45)'
          : '0 1px 0 rgba(255,255,255,0.08) inset, 0 -1px 0 rgba(0,0,0,0.40) inset, 0 10px 28px rgba(78,94,218,0.28)',
        borderRadius: '12px',
        minHeight: '52px',
        padding: '12px 1.65rem',
        fontSize: '1.05rem',
        fontWeight: '600',
        lineHeight: '1.2',
        transition: 'transform 240ms cubic-bezier(0.19,1,0.22,1)',
        '&:hover': {
          transform: 'translateY(-1px)',
          backgroundPosition: '100% 0%',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      },

      // Transparent card shell (we supply our own AuthFormCard wrapper)
      card: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        boxShadow: 'none',
        width: '100%',
        maxWidth: '640px',
        margin: '0 auto',
      },

      // Navbar (user profile pages)
      navbar: {
        backgroundColor: isDarkMode ? '#040308' : '#fbf7ef',
        borderColor: 'transparent',
        boxShadow: 'none',
      },

      // Form field wrapper
      formField: {
        backgroundColor: 'transparent',
        borderColor: isDarkMode
          ? 'rgba(244,238,228,0.12)'
          : 'rgba(18,10,34,0.10)',
        borderWidth: '1px',
        boxShadow: 'none',
        borderRadius: '12px',
      },

      // Input fields
      formFieldInput: {
        backgroundColor: isDarkMode ? '#0a0714' : '#ffffff',
        borderColor: isDarkMode
          ? 'rgba(244,238,228,0.12)'
          : 'rgba(18,10,34,0.10)',
        borderWidth: '1px',
        color: isDarkMode ? '#f4eee4' : '#120a22',
        boxShadow: 'none',
        borderRadius: '12px',
        minHeight: '48px',
        padding: '12px 14px',
        fontSize: '1rem',
        '&:focus': {
          borderColor: isDarkMode ? 'hsl(233,70%,74%)' : 'hsl(233,65%,50%)',
          boxShadow: isDarkMode
            ? '0 0 0 2px rgba(130,148,255,0.25)'
            : '0 0 0 2px rgba(78,94,218,0.20)',
        },
      },

      // Field labels
      formFieldLabel: {
        color: isDarkMode ? 'rgba(244,238,228,0.58)' : 'rgba(18,10,34,0.62)',
        fontWeight: '500',
        fontSize: '0.9rem',
      },

      // Form header
      formHeaderTitle: {
        fontSize: '2rem',
        lineHeight: '1.2',
        color: isDarkMode ? '#f4eee4' : '#120a22',
      },
      formHeaderSubtitle: {
        fontSize: '1rem',
        color: isDarkMode ? 'rgba(244,238,228,0.58)' : 'rgba(18,10,34,0.62)',
      },

      // Social auth buttons
      socialButtonsBlockButton: {
        backgroundColor: isDarkMode ? '#0a0714' : '#ffffff',
        color: isDarkMode ? '#f4eee4' : '#120a22',
        borderColor: isDarkMode
          ? 'rgba(244,238,228,0.12)'
          : 'rgba(18,10,34,0.10)',
        borderWidth: '1px',
        minHeight: '48px',
        borderRadius: '12px',
        fontSize: '0.95rem',
        fontWeight: '500',
        '&:hover': {
          backgroundColor: isDarkMode ? '#100e1c' : '#f3ecdb',
        },
      },
      socialButtonsBlockButtonText: {
        fontSize: '0.95rem',
        fontWeight: '500',
      },
      socialButtonsIconButton: {
        backgroundColor: isDarkMode ? '#0a0714' : '#ffffff',
        color: isDarkMode ? '#f4eee4' : '#120a22',
        borderColor: isDarkMode
          ? 'rgba(244,238,228,0.12)'
          : 'rgba(18,10,34,0.10)',
        borderWidth: '1px',
        minHeight: '48px',
        borderRadius: '12px',
        '&:hover': {
          backgroundColor: isDarkMode ? '#100e1c' : '#f3ecdb',
        },
      },

      ...flowstarterUserButton,
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
