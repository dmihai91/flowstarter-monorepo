'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { ClerkProvider } from '@clerk/nextjs';
import { experimental__simple as simple } from '@clerk/themes';
import { useEffect, useState } from 'react';

import '@/styles/auth-forms.css';

// This is a client component wrapper that handles theme switching for Clerk
export function ClerkThemeWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDarkMode = resolvedTheme === 'dark';

  // Create theme object using Clerk's recommended approach
  const appearance = {
    // Use simple as the base theme
    baseTheme: simple,

    // Override only what's needed
    variables: {
      // Primary colors - use design system primary token
      colorPrimary: 'var(--primary)',

      // Text and background
      colorText: isDarkMode ? '#ffffff' : '#000000',
      colorTextSecondary: isDarkMode ? '#a3a3a3' : '#333333',
      colorBackground: isDarkMode ? '#121212' : '#ffffff',

      // Input fields
      colorInputBackground: isDarkMode ? '#1e1e1e' : '#ffffff',
      colorInputText: isDarkMode ? '#ffffff' : '#000000',

      // Border radius to match your design system
      borderRadius: '0.625rem',

      // Additional dark mode specific variables
      colorAlphaShade: isDarkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.1)',
      colorSuccess: isDarkMode ? '#4ade80' : '#22c55e',
      colorError: isDarkMode ? '#f87171' : '#ef4444',
      colorWarning: isDarkMode ? '#fbbf24' : '#f59e0b',
    },

    // Minimal element overrides
    elements: {
      formButtonPrimary: {
        backgroundColor: 'var(--primary)',
        color: '#ffffff',
        '&:hover': {
          backgroundColor: 'var(--purple-primary-dark)',
          boxShadow:
            '0 6px 12px -6px rgba(0,0,0,0.15), 0 3px 6px -4px rgba(0,0,0,0.12)',
        },
        borderRadius: '12px',
        minHeight: '48px',
        padding: '12px 16px',
        fontSize: '0.975rem',
        lineHeight: '1.2',
      },
      footerActionLink: {
        color: 'var(--primary)',
        '&:hover': {
          textDecoration: 'underline',
        },
      },
      card: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        boxShadow: 'none',
        width: '100%',
        maxWidth: '640px',
        margin: '0 auto',
      },
      navbar: {
        backgroundColor: isDarkMode ? '#121212' : '#ffffff',
        borderColor: 'transparent',
        boxShadow: 'none',
      },
      userButtonPopoverCard: {
        backgroundColor: isDarkMode ? '#161616' : '#ffffff',
        borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        borderWidth: '1px',
        boxShadow:
          '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
      },
      formField: {
        backgroundColor: 'transparent',
        borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
        borderWidth: '1px',
        boxShadow: 'none',
        borderRadius: '12px',
      },
      formFieldInput: {
        backgroundColor: isDarkMode ? '#151515' : '#ffffff',
        borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
        borderWidth: '1px',
        color: isDarkMode ? '#ffffff' : '#000000',
        boxShadow: 'none',
        borderRadius: '12px',
        minHeight: '48px',
        padding: '12px 14px',
        fontSize: '1rem',
      },
      formFieldLabel: {
        color: isDarkMode ? '#e5e5e5' : '#111827',
        fontWeight: '500',
        fontSize: '0.95rem',
      },
      formHeaderTitle: {
        fontSize: '2rem',
        lineHeight: '1.2',
      },
      formHeaderSubtitle: {
        fontSize: '1rem',
      },
      dividerLine: {
        borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      },
      socialButtonsBlockButton: {
        backgroundColor: isDarkMode ? '#0f0f11' : '#ffffff',
        color: isDarkMode ? '#ffffff' : '#111827',
        borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
        borderWidth: '1px',
        minHeight: '48px',
        borderRadius: '12px',
        fontSize: '0.95rem',
        '&:hover': {
          backgroundColor: isDarkMode ? '#151517' : '#f8f9fb',
        },
      },
      socialButtonsBlockButtonText: {
        fontSize: '0.95rem',
      },
      socialButtonsIconButton: {
        backgroundColor: isDarkMode ? '#0f0f11' : '#ffffff',
        color: isDarkMode ? '#ffffff' : '#111827',
        borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
        borderWidth: '1px',
        minHeight: '48px',
        borderRadius: '12px',
        '&:hover': {
          backgroundColor: isDarkMode ? '#151517' : '#f8f9fb',
        },
      },
    },
  };

  // Only render the ClerkProvider after mounting to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  // Determine shared cookie domain for cross-subdomain session sharing
  // This allows the editor (editor.flowstarter.dev) to share the same Clerk session
  const getSharedCookieDomain = (): string | undefined => {
    if (typeof window === 'undefined') return undefined;
    const hostname = window.location.hostname;
    
    // Production: flowstarter.app and subdomains
    if (hostname.includes('flowstarter.app')) {
      return '.flowstarter.app';
    }
    
    // Development/Staging: flowstarter.dev and subdomains
    if (hostname.includes('flowstarter.dev')) {
      return '.flowstarter.dev';
    }
    
    // Local development - no shared domain needed
    return undefined;
  };

  const sharedCookieDomain = getSharedCookieDomain();

  return (
    <ClerkProvider
      appearance={appearance}
      // Share session across subdomains (e.g., flowstarter.dev, editor.flowstarter.dev)
      // This is the PRIMARY app - it does NOT use isSatellite
      domain={sharedCookieDomain}
      signInUrl="/login"
      signUpUrl="/login"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      {children}
    </ClerkProvider>
  );
}
