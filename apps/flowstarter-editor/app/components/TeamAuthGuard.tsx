/**
 * Auth Guard for Editor
 * 
 * Shows a login prompt for unauthenticated users instead of forcing redirect.
 * This avoids redirect loops with Clerk satellite configuration.
 */

import { useUser } from '@clerk/remix';
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <path d="M8 26 Q14 18, 20 22 Q26 26, 32 18" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            <path d="M8 20 Q14 12, 20 16 Q26 20, 32 12" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.6"/>
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">
          Welcome to Flowstarter
        </h1>
        <p className="text-zinc-400 mb-8">
          Sign in to access the AI website builder and manage your projects.
        </p>
        <a
          href={`${mainUrl}/login?redirect_url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-zinc-900 font-medium hover:bg-zinc-100 transition-colors"
        >
          Sign in to continue
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
        <p className="mt-6 text-sm text-zinc-500">
          Don't have an account?{' '}
          <a href={`${mainUrl}/login`} className="text-purple-400 hover:text-purple-300">
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
