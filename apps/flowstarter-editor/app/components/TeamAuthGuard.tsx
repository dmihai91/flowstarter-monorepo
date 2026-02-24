/**
 * Auth Guard for Editor
 * 
 * Ensures users are authenticated via Clerk (shared with main platform).
 * Redirects to main platform login if not authenticated.
 */

import { useUser } from '@clerk/remix';
import { useEffect, useState } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useUser();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      // Redirect to main platform login
      const returnUrl = typeof window !== 'undefined' ? window.location.href : '';
      window.location.href = `https://flowstarter.dev/login?redirect_url=${encodeURIComponent(returnUrl)}`;
      return;
    }
    
    setIsReady(true);
  }, [isLoaded, isSignedIn]);
  
  // Loading state
  if (!isLoaded || !isReady) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-flowstarter-elements-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-flowstarter-elements-textSecondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

// Keep old export for backwards compatibility
export const TeamAuthGuard = AuthGuard;
