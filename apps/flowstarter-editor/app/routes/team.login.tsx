/**
 * Team Login - Custom Clerk SignIn
 * 
 * Matches the main platform's login page design exactly.
 * Uses Clerk hooks for authentication.
 */

import { useSignIn, useUser } from '@clerk/remix';
import { useNavigate } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { useEffect, useState } from 'react';
import { setTeamSession, clearTeamSession, TEAM_EMAIL_DOMAINS } from '~/lib/team-auth';

export const meta: MetaFunction = () => {
  return [
    { title: 'Team Login - Flowstarter Editor' },
    { name: 'robots', content: 'noindex' },
  ];
};

export default function TeamLogin() {
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Check if already signed in
  useEffect(() => {
    if (userLoaded && isSignedIn && user) {
      const userEmail = user.primaryEmailAddress?.emailAddress;
      const domain = userEmail?.split('@')[1]?.toLowerCase();
      const isTeam = domain && TEAM_EMAIL_DOMAINS.includes(domain);
      
      if (isTeam && userEmail) {
        setTeamSession(user.id, {
          email: userEmail,
          name: user.fullName || user.firstName || undefined,
        });
        navigate('/');
      } else {
        clearTeamSession();
        setAccessDenied(true);
      }
    }
  }, [userLoaded, isSignedIn, user, navigate]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !email || !password) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // The useEffect will handle redirect after user state updates
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  // Access denied view
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="w-full max-w-md p-8 text-center">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-2xl font-bold mb-3 text-gray-900">Access Denied</h1>
          <p className="mb-6 text-gray-600">
            Only team members with @{TEAM_EMAIL_DOMAINS.join(' or @')} emails can access the editor.
          </p>
          <button
            onClick={() => window.location.href = 'https://flowstarter.app'}
            className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors"
          >
            Go to Flowstarter
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-100/50 via-white to-blue-100/50">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3L4 14h7v7l9-11h-7V3z" />
          </svg>
          <span className="font-semibold text-gray-900">Flowstarter</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left side - Welcome text */}
          <div className="flex-1 max-w-lg text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Welcome to Flowstarter
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your smart assistant is ready to help you grow your online presence with powerful tools and insights.
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Manage your digital presence from one dashboard
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Beautiful, responsive experiences by default
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Your information is kept private and secure
              </li>
            </ul>
          </div>

          {/* Right side - Login form */}
          <div className="w-full max-w-md">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-6 sm:p-8">
              {/* Tabs */}
              <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
                <button className="flex-1 py-2 px-4 text-sm font-semibold rounded-lg text-gray-500">
                  Create your account
                </button>
                <button className="flex-1 py-2 px-4 text-sm font-semibold rounded-lg bg-white text-gray-900 shadow-sm">
                  Login
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g johnatan@doe.com"
                    className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white/80 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full h-12 px-4 pr-12 rounded-lg border border-gray-200 bg-white/80 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      required
                    />
                    {password && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex justify-end mt-1">
                    <button type="button" className="text-sm text-gray-500 hover:text-gray-700">
                      Forgot password?
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full h-12 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              {/* Team access notice */}
              <p className="text-center text-xs text-gray-400 mt-4">
                Team access only • @{TEAM_EMAIL_DOMAINS.join(', @')} emails
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-4 text-center text-sm text-gray-500">
        © 2026 Flowstarter, Inc. All rights reserved.
      </footer>
    </div>
  );
}
