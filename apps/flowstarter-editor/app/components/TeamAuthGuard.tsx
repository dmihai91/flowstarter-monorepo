/**
 * Auth Guard for Editor
 * 
 * Ensures users are authenticated via Clerk (shared with main platform).
 * Redirects to main platform login if not authenticated.
 * 
 * Uses Clerk's satellite app configuration for cross-subdomain session sharing.
 * When user logs in on flowstarter.dev, they're automatically authenticated
 * on editor.flowstarter.dev via shared cookies.
 */

import { useUser } from '@clerk/remix';
import { useEffect, useState } from 'react';
import { initializeFromClerkUser } from '~/lib/team-auth';
import { LoadingScreen } from '~/components/LoadingScreen';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireTeam?: boolean; // If true, only team members can access
}

/**
 * Get the main platform URL based on current hostname
 */
function getMainPlatformUrl(): string {
  if (typeof window === 'undefined') return 'https://flowstarter.dev';
  const hostname = window.location.hostname;
  
  if (hostname.includes('flowstarter.app')) {
    return 'https://flowstarter.app';
  }
  if (hostname.includes('flowstarter.dev')) {
    return 'https://flowstarter.dev';
  }
  // Local development
  return 'http://localhost:3000';
}

export function AuthGuard({ children, fallback, requireTeam = false }: AuthGuardProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isReady, setIsReady] = useState(false);
  const [userMode, setUserMode] = useState<'guest' | 'team' | 'client'>('guest');
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  
  useEffect(() => {
    if (!isLoaded) return;
    
    // Wait a bit for satellite session sync before redirecting
    // This prevents redirect loops when returning from login
    const checkAuth = async () => {
      // Give Clerk satellite mode time to sync session
      if (!hasCheckedAuth) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setHasCheckedAuth(true);
      }
      
      if (!isSignedIn) {
        // Check if we just came back from login (have a clerk token in URL)
        const urlParams = new URLSearchParams(window.location.search);
        const hasClerkParams = urlParams.has('__clerk_status') || urlParams.has('__clerk_created_session');
        
        if (hasClerkParams) {
          // Just returned from login, wait for session to sync
          console.log('[AuthGuard] Waiting for session sync after login...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Force page reload to pick up the new session
          window.location.reload();
          return;
        }
        
        // Redirect to main platform login with return URL
        const returnUrl = window.location.origin + window.location.pathname;
        const mainPlatformUrl = getMainPlatformUrl();
        console.log('[AuthGuard] Not signed in, redirecting to login');
        window.location.href = `${mainPlatformUrl}/login?redirect_url=${encodeURIComponent(returnUrl)}`;
        return;
      }
      
      // Initialize user mode from Clerk user
      if (user) {
        const mode = initializeFromClerkUser(user);
        setUserMode(mode);
        
        // If team access is required but user is not team, show access denied
        if (requireTeam && mode !== 'team') {
          return;
        }
      }
      
      setIsReady(true);
    };
    
    checkAuth();
  }, [isLoaded, isSignedIn, user, requireTeam, hasCheckedAuth]);
  
  // Loading state
  if (!isLoaded || (!isReady && isSignedIn === undefined)) {
    return fallback || <LoadingScreen message="Authenticating..." />;
  }
  
  // Access denied for non-team users when team access is required
  if (requireTeam && userMode !== 'team' && isSignedIn) {
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
          <a 
            href={getMainPlatformUrl()}
            className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

// Keep old export for backwards compatibility
export const TeamAuthGuard = AuthGuard;
