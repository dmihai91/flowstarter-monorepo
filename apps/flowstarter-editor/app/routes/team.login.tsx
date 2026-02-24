/**
 * Team Login - Simple email/password only
 */

import { useSignIn, useUser } from '@clerk/remix';
import { useNavigate } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { useEffect, useState } from 'react';
import { setTeamSession, clearTeamSession, TEAM_EMAIL_DOMAINS } from '~/lib/team-auth';

export const meta: MetaFunction = () => {
  return [
    { title: 'Team Login - Flowstarter' },
    { name: 'robots', content: 'noindex' },
  ];
};

export default function TeamLogin() {
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Check if already signed in
  useEffect(() => {
    if (userLoaded && isSignedIn && user) {
      const userEmail = user.primaryEmailAddress?.emailAddress;
      const domain = userEmail?.split('@')[1]?.toLowerCase();
      const isTeam = domain && TEAM_EMAIL_DOMAINS.includes(domain);
      
      if (isTeam && userEmail) {
        setTeamSession(user.id, { email: userEmail, name: user.fullName || undefined });
        navigate('/');
      } else {
        clearTeamSession();
        setError('Access denied. Team members only.');
      }
    }
  }, [userLoaded, isSignedIn, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xl font-semibold text-gray-900">
            <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3L4 14h7v7l9-11h-7V3z" />
            </svg>
            Flowstarter
          </div>
        </div>
        
        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-xl font-semibold text-gray-900 text-center mb-6">
            Team Login
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@flowstarter.app"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full h-10 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-4">
          Team access only
        </p>
      </div>
    </div>
  );
}
