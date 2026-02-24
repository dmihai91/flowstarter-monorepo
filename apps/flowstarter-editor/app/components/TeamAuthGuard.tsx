/**
 * Team Auth Guard
 * 
 * Wraps content and ensures only team members can access.
 * Redirects to team login if not authenticated or not a team member.
 */

import { useUser, useAuth } from '@clerk/remix';
import { useNavigate } from '@remix-run/react';
import { useEffect, useState } from 'react';

const TEAM_EMAIL_DOMAINS = ['flowstarter.app'];

interface TeamAuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function TeamAuthGuard({ children, fallback }: TeamAuthGuardProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      navigate('/team/login');
      return;
    }
    
    const email = user?.primaryEmailAddress?.emailAddress;
    const domain = email?.split('@')[1]?.toLowerCase();
    const isTeam = domain && TEAM_EMAIL_DOMAINS.includes(domain);
    
    if (!isTeam) {
      // Sign out and redirect to login with error
      signOut().then(() => {
        navigate('/team/login?error=access_denied');
      });
      return;
    }
    
    setIsAuthorized(true);
  }, [isLoaded, isSignedIn, user, navigate, signOut]);
  
  // Loading state
  if (!isLoaded || isAuthorized === null) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthorized) {
    return null;
  }
  
  return <>{children}</>;
}
