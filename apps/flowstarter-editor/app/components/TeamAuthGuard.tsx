/**
 * Auth Guard for Editor
 * 
 * For satellite apps, Clerk handles the redirect automatically via
 * CLERK_SIGN_IN_URL environment variable. This guard just shows
 * loading state and waits for authentication.
 */

import { useUser, RedirectToSignIn } from '@clerk/remix';
import { useEffect, useState } from 'react';
import { initializeFromClerkUser } from '~/lib/team-auth';
import { LoadingScreen } from '~/components/LoadingScreen';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireTeam?: boolean;
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

  // Not signed in - let Clerk handle the redirect
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  // Team access required but user is not team
  if (requireTeam && userMode !== 'team') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-flowstarter-elements-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-semibold text-flowstarter-elements-textPrimary mb-2">
            Team Access Required
          </h1>
          <p className="text-flowstarter-elements-textSecondary mb-4">
            This area is restricted to team members only.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export const TeamAuthGuard = AuthGuard;
