/**
 * Team Login - Redirects to main platform login
 */

import { useUser } from '@clerk/remix';
import { useNavigate } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { useEffect } from 'react';
import { setTeamSession, clearTeamSession, TEAM_EMAIL_DOMAINS } from '~/lib/team-auth';

export const meta: MetaFunction = () => {
  return [
    { title: 'Team Login - Flowstarter Editor' },
    { name: 'robots', content: 'noindex' },
  ];
};

export default function TeamLogin() {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoaded) return;
    
    if (isSignedIn && user) {
      // Check if team member
      const email = user.primaryEmailAddress?.emailAddress;
      const domain = email?.split('@')[1]?.toLowerCase();
      const isTeam = domain && TEAM_EMAIL_DOMAINS.includes(domain);
      
      if (isTeam && email) {
        setTeamSession(user.id, {
          email,
          name: user.fullName || user.firstName || undefined,
        });
        navigate('/');
      } else {
        clearTeamSession();
        // Show access denied
        window.location.href = 'https://flowstarter.app';
      }
    } else {
      // Not signed in - redirect to main platform login
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `https://flowstarter.dev/login?redirect_url=${returnUrl}`;
    }
  }, [isLoaded, isSignedIn, user, navigate]);
  
  // Loading state while checking/redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Redirecting to login...</p>
      </div>
    </div>
  );
}
