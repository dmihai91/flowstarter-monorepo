/**
 * Team Login - Clerk Authentication
 * 
 * Uses Clerk for authentication, restricted to team email domains.
 * Styled to match the main platform login.
 */

import { SignIn, useUser } from '@clerk/remix';
import { useNavigate } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { useEffect, useState } from 'react';
import { setTeamSession, clearTeamSession } from '~/lib/team-auth';

export const meta: MetaFunction = () => {
  return [
    { title: 'Team Login - Flowstarter Editor' },
    { name: 'robots', content: 'noindex' },
  ];
};

// Team email domains allowed to access
const TEAM_EMAIL_DOMAINS = ['flowstarter.app'];

export default function TeamLogin() {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Detect theme
  useEffect(() => {
    const stored = localStorage.getItem('flowstarter_theme');
    if (stored === 'light') {
      setIsDark(false);
    } else if (stored === 'dark') {
      setIsDark(true);
    } else {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);
  
  // Check if signed in user is team member
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress;
      const domain = email?.split('@')[1]?.toLowerCase();
      const isTeam = domain && TEAM_EMAIL_DOMAINS.includes(domain);
      
      if (isTeam && email) {
        // Set team session for capabilities
        setTeamSession(user.id, {
          email,
          name: user.fullName || user.firstName || undefined,
        });
        navigate('/');
      } else {
        clearTeamSession();
        setAccessDenied(true);
      }
    }
  }, [isLoaded, isSignedIn, user, navigate]);
  
  // Access denied view
  if (accessDenied) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900' 
          : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'
      }`}>
        <div className="w-full max-w-md p-8 text-center">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Access Denied
          </h1>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Only team members with @{TEAM_EMAIL_DOMAINS.join(' or @')} emails can access the editor.
          </p>
          <button
            onClick={() => window.location.href = 'https://flowstarter.dev'}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
          >
            Go to Flowstarter
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen flex items-center justify-center ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900' 
        : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'
    }`}>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl ${
          isDark ? 'bg-purple-500/10' : 'bg-purple-400/20'
        }`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl ${
          isDark ? 'bg-blue-500/10' : 'bg-blue-400/20'
        }`} />
      </div>
      
      <div className="relative w-full max-w-lg px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Team Access
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Sign in to access the Flowstarter Editor
          </p>
        </div>
        
        {/* Clerk SignIn Component */}
        <div className={`rounded-2xl p-6 backdrop-blur-xl ${
          isDark 
            ? 'bg-white/5 border border-white/10' 
            : 'bg-white/80 border border-gray-200 shadow-xl'
        }`}>
          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-transparent shadow-none p-0',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: `w-full h-12 rounded-xl font-medium border transition-all ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`,
                socialButtonsBlockButtonText: 'font-medium',
                dividerLine: isDark ? 'bg-white/10' : 'bg-gray-200',
                dividerText: isDark ? 'text-gray-500' : 'text-gray-400',
                formFieldLabel: isDark ? 'text-gray-300' : 'text-gray-600',
                formFieldInput: `h-12 rounded-xl ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`,
                formButtonPrimary: 'h-12 rounded-xl bg-purple-600 hover:bg-purple-700 font-medium',
                footerActionLink: 'text-purple-500 hover:text-purple-400',
                identityPreviewText: isDark ? 'text-white' : 'text-gray-900',
                identityPreviewEditButton: 'text-purple-500',
                formFieldAction: 'text-purple-500 hover:text-purple-400',
                footer: 'hidden',
              },
              layout: {
                socialButtonsPlacement: 'top',
                showOptionalFields: false,
              },
            }}
            routing="path"
            path="/team/login"
            signUpUrl="/team/login"
            forceRedirectUrl="/"
          />
        </div>
        
        {/* Footer */}
        <p className={`text-center mt-6 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Team access only • @{TEAM_EMAIL_DOMAINS.join(', @')} emails
        </p>
      </div>
    </div>
  );
}
