/**
 * Team Login - Clerk Authentication (with fallback)
 * 
 * Uses Clerk for secure authentication when configured.
 * Falls back to simple email/password when Clerk isn't set up.
 * Only team members (verified by email domain) can access.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useFetcher, useLoaderData } from '@remix-run/react';
import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { setTeamSession, clearTeamSession, isTeamEmail, TEAM_EMAIL_DOMAINS } from '~/lib/team-auth';
import { getClerkEnv } from '~/lib/clerk.server';

// Conditionally import Clerk components
let SignIn: any = null;
let useUser: any = () => ({ user: null, isLoaded: true });
let useAuth: any = () => ({ isSignedIn: false, isLoaded: true });

try {
  const clerk = require('@clerk/remix');
  SignIn = clerk.SignIn;
  useUser = clerk.useUser;
  useAuth = clerk.useAuth;
} catch {
  // Clerk not available
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Team Login - Flowstarter' },
    { name: 'robots', content: 'noindex' },
  ];
};

// Check if Clerk is configured and if user is authenticated
export async function loader({ request, context }: LoaderFunctionArgs) {
  const clerkEnv = getClerkEnv(context as any);
  const clerkEnabled = !!(clerkEnv.publishableKey && clerkEnv.secretKey);
  
  if (clerkEnabled) {
    try {
      const { getAuth } = await import('@clerk/remix/ssr.server');
      const { userId, sessionClaims } = await getAuth({ request, context } as any);
      
      if (userId) {
        const email = sessionClaims?.email as string | undefined;
        const domain = email?.split('@')[1]?.toLowerCase();
        const isTeam = domain && TEAM_EMAIL_DOMAINS.includes(domain);
        
        if (isTeam) {
          return redirect('/');
        }
      }
      
      return json({ clerkEnabled: true, authenticated: !!userId });
    } catch (error) {
      console.warn('Clerk auth check failed:', error);
    }
  }
  
  return json({ clerkEnabled: false, authenticated: false });
}

// Fallback action for simple email/password login
export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email')?.toString().toLowerCase();
  const password = formData.get('password')?.toString();
  
  if (!email || !password) {
    return json({ error: 'Email and password required' }, { status: 400 });
  }
  
  // Get team credentials from env
  const teamCredentials = (context.cloudflare?.env as any)?.TEAM_CREDENTIALS 
    || process.env.TEAM_CREDENTIALS 
    || '';
  
  const credentials = teamCredentials.split(',').map((c: string) => {
    const [e, p] = c.split(':');
    return { email: e?.toLowerCase().trim(), password: p?.trim() };
  });
  
  const match = credentials.find(
    (c: { email: string; password: string }) => c.email === email && c.password === password
  );
  
  if (!match) {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  const sessionToken = btoa(`${email}:${Date.now()}:${Math.random().toString(36)}`);
  
  return json({ 
    success: true, 
    token: sessionToken,
    user: { email, name: email.split('@')[0] },
  });
}

export default function TeamLogin() {
  const navigate = useNavigate();
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDark, setIsDark] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  
  const clerkEnabled = loaderData?.clerkEnabled && SignIn;
  
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
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem('flowstarter_theme');
      if (!stored || stored === 'system') {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  // Handle Clerk post-login: check if team member
  useEffect(() => {
    if (!clerkEnabled || !userLoaded || !authLoaded) return;
    
    if (isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress;
      
      if (isTeamEmail(email)) {
        setTeamSession(
          user.id,
          { email: email || '', name: user.fullName || user.firstName || 'Team Member' }
        );
        navigate('/');
      } else {
        setAccessDenied(true);
        clearTeamSession();
      }
    }
  }, [clerkEnabled, userLoaded, authLoaded, isSignedIn, user, navigate]);
  
  // Handle fallback login response
  useEffect(() => {
    if (fetcher.data?.success && fetcher.data?.token && fetcher.data?.user) {
      setTeamSession(fetcher.data.token, fetcher.data.user);
      navigate('/');
    }
  }, [fetcher.data, navigate]);
  
  const isLoading = fetcher.state === 'submitting';
  const error = fetcher.data && !fetcher.data.success ? fetcher.data.error : null;
  
  // Access denied screen
  if (accessDenied) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900' 
          : 'bg-gradient-to-br from-gray-50 via-purple-100/30 to-gray-100'
      }`}>
        <div className="w-full max-w-sm p-6 text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Access Denied
          </h1>
          <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            This area is restricted to Flowstarter team members.
          </p>
          <p className={`text-xs mb-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Team domains: {TEAM_EMAIL_DOMAINS.join(', ')}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-purple-100/30 to-gray-100'
    }`}>
      <div className="w-full max-w-sm p-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔧</div>
          <h1 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Team Login
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Internal access only
          </p>
        </div>
        
        {clerkEnabled ? (
          /* Clerk SignIn when configured */
          <div className={`rounded-xl overflow-hidden ${isDark ? 'clerk-dark' : 'clerk-light'}`}>
            <SignIn 
              routing="hash"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: `${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border shadow-lg`,
                  headerTitle: isDark ? 'text-white' : 'text-gray-900',
                  headerSubtitle: isDark ? 'text-gray-400' : 'text-gray-500',
                  socialButtonsBlockButton: isDark 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
                  formFieldLabel: isDark ? 'text-gray-300' : 'text-gray-600',
                  formFieldInput: isDark 
                    ? 'bg-black/30 border-white/15 text-white' 
                    : 'bg-gray-50 border-gray-200 text-gray-900',
                  formButtonPrimary: 'bg-purple-600 hover:bg-purple-700',
                  footerActionLink: 'text-purple-500 hover:text-purple-400',
                },
                variables: {
                  colorPrimary: '#9333ea',
                  colorBackground: isDark ? 'rgba(0,0,0,0.3)' : '#ffffff',
                  colorText: isDark ? '#ffffff' : '#1f2937',
                  colorTextSecondary: isDark ? '#9ca3af' : '#6b7280',
                },
              }}
            />
          </div>
        ) : (
          /* Fallback simple login form */
          <fetcher.Form method="post" className={`rounded-xl p-6 border ${
            isDark 
              ? 'bg-white/5 border-white/10' 
              : 'bg-white border-gray-200 shadow-lg'
          }`}>
            {error && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                isDark 
                  ? 'bg-red-500/20 border border-red-500/40 text-red-300' 
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Email
              </label>
              <input
                name="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  isDark 
                    ? 'bg-black/30 border border-white/15 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            
            <div className="mb-6">
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Password
              </label>
              <input
                name="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  isDark 
                    ? 'bg-black/30 border border-white/15 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </fetcher.Form>
        )}
      </div>
    </div>
  );
}
