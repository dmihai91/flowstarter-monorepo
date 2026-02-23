/**
 * Team Login - Simple Internal Auth
 * 
 * Uses existing editor design system.
 * Redirects to main editor with team mode enabled.
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="w-full max-w-sm p-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔧</div>
          <h1 className="text-2xl font-semibold text-white mb-2">Team Login</h1>
          <p className="text-gray-400 text-sm">Internal access only</p>
        </div>
        
        <fetcher.Form method="post" className="bg-white/5 border border-white/10 rounded-xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">Email</label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/30 border border-white/15 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-2">Password</label>
            <input
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/30 border border-white/15 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
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
