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
  useEffect(() => {
    const mainUrl = getMainPlatformUrl();
    const redirectUrl = encodeURIComponent(window.location.href);
    window.location.replace(`${mainUrl}/login?redirect_url=${redirectUrl}`);
  }, []);

  // Show nothing while redirecting
  return null;
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
