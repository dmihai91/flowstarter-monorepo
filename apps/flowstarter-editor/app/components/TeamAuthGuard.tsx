/**
 * Auth Guard for Editor
 * 
 * Shows a login prompt for unauthenticated users instead of forcing redirect.
 * This avoids redirect loops with Clerk satellite configuration.
 */

import { useUser } from '@clerk/remix';
import { FlowBackground, Logo } from '@flowstarter/flow-design-system';
import { useEffect, useRef, useState } from 'react';
import { initializeFromClerkUser } from '~/lib/team-auth';
import { LoadingScreen } from '~/components/LoadingScreen';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireTeam?: boolean;
}

function getMainPlatformUrl(): string {
  if (typeof window === 'undefined') return 'https://flowstarter.dev';
  const hostname = window.location.hostname;
  if (hostname.includes('flowstarter.app')) return 'https://flowstarter.app';
  if (hostname.includes('flowstarter.dev')) return 'https://flowstarter.dev';
  return 'http://localhost:3000';
}

function LoginPrompt() {
  const mainUrl = getMainPlatformUrl();
  const redirectUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', overflow: 'hidden' }}>
      {/* Animated flow lines background */}
      <FlowBackground style={{ position: 'fixed', inset: 0, zIndex: 0 }} variant="landing" />

      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: '-15%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', background: 'radial-gradient(ellipse, rgba(77,93,217,0.15) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Glass card */}
      <div style={{ position: 'relative', zIndex: 1, width: '90%', maxWidth: '420px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px', padding: '44px 40px', backdropFilter: 'blur(24px)', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)' }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <Logo size="md" />
        </div>

        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.3px' }}>
          Welcome to Flowstarter
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
          Sign in to access your website editor and manage your projects.
        </p>

        {/* Primary CTA */}
        <a
          href={`${mainUrl}/login?redirect_url=${encodeURIComponent(redirectUrl)}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #4D5DD9 0%, #6366f1 100%)', color: '#fff', fontWeight: 600, fontSize: '15px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(77,93,217,0.35)', marginBottom: '16px' }}
        >
          Sign in to continue
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>

        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
          Don't have an account?{' '}
          <a href={`${mainUrl}/login`} style={{ color: 'rgba(193,200,255,0.7)', textDecoration: 'none' }}>
            Get started for free
          </a>
        </p>
      </div>
    </div>
  );
}

export function AuthGuard({ children, fallback, requireTeam = false }: AuthGuardProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [userMode, setUserMode] = useState<'guest' | 'team' | 'client'>('guest');
  
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const mode = initializeFromClerkUser(user);
      setUserMode(mode);
    }
  }, [isLoaded, isSignedIn, user]);

  // Still loading Clerk
  if (!isLoaded) {
    return fallback || <LoadingScreen message="Loading..." />;
  }

  // Not signed in - show login prompt (no redirect to avoid loops)
  if (!isSignedIn) {
    return <LoginPrompt />;
  }

  // Team access required but user is not team
  if (requireTeam && userMode !== 'team') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-semibold text-white mb-2">
            Team Access Required
          </h1>
          <p className="text-zinc-400 mb-4">
            This area is restricted to team members only.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export const TeamAuthGuard = AuthGuard;
