/**
 * Team Login - Simple Internal Auth
 * 
 * Uses simple email/password authentication for team access.
 * Light/dark mode aware, matches editor design.
 * 
 * TODO: Integrate with Clerk for SSO with main platform
 */

import { useState, useEffect } from 'react';
import { useNavigate, useFetcher } from '@remix-run/react';
import type { MetaFunction, ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { setTeamSession, isTeamAuthenticated } from '~/lib/team-auth';

export const meta: MetaFunction = () => {
  return [
    { title: 'Team Login - Flowstarter' },
    { name: 'robots', content: 'noindex' },
  ];
};

// Server-side credential check
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
  const fetcher = useFetcher<typeof action>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDark, setIsDark] = useState(true);
  
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
  
  // Redirect if already logged in
  useEffect(() => {
    if (isTeamAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);
  
  // Handle action response
  useEffect(() => {
    if (fetcher.data?.success && fetcher.data?.token && fetcher.data?.user) {
      setTeamSession(fetcher.data.token, fetcher.data.user);
      navigate('/');
    }
  }, [fetcher.data, navigate]);
  
  const isLoading = fetcher.state === 'submitting';
  const error = fetcher.data && !fetcher.data.success ? fetcher.data.error : null;
  
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
      </div>
    </div>
  );
}
