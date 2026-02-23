/**
 * Team Login - Shared Clerk Session
 * 
 * Uses shared Clerk cookies between main platform and editor.
 * Checks session via API call to main platform.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { setTeamSession, isTeamAuthenticated, clearTeamSession, TEAM_EMAIL_DOMAINS } from '~/lib/team-auth';

export const meta: MetaFunction = () => {
  return [
    { title: 'Team Login - Flowstarter' },
    { name: 'robots', content: 'noindex' },
  ];
};

// Platform URLs based on environment
function getPlatformUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3000';
  
  const hostname = window.location.hostname;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // Development (editor.flowstarter.dev -> flowstarter.dev)
  if (hostname.endsWith('.flowstarter.dev')) {
    return 'https://flowstarter.dev';
  }
  
  // Production (editor.flowstarter.app -> flowstarter.app)
  if (hostname.endsWith('.flowstarter.app')) {
    return 'https://flowstarter.app';
  }
  
  // Fallback
  return 'http://localhost:3000';
}

export default function TeamLogin() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [status, setStatus] = useState<'checking' | 'idle' | 'denied' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  
  const platformUrl = getPlatformUrl();
  
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
  
  // Check for existing Clerk session via shared cookies
  useEffect(() => {
    // Already authenticated locally
    if (isTeamAuthenticated()) {
      navigate('/');
      return;
    }
    
    // Check session on main platform
    checkSession();
  }, []);
  
  async function checkSession() {
    try {
      const response = await fetch(`${platformUrl}/api/auth/session`, {
        credentials: 'include', // Include cookies for cross-origin
      });
      
      if (!response.ok) {
        setStatus('idle');
        return;
      }
      
      const data = await response.json();
      
      if (data.authenticated && data.isTeam) {
        // User is authenticated and is a team member
        setTeamSession(data.userId, { 
          email: data.email, 
          name: data.name 
        });
        navigate('/');
      } else if (data.authenticated && !data.isTeam) {
        // Authenticated but not a team member
        setStatus('denied');
        setError(`Access denied. Only ${TEAM_EMAIL_DOMAINS.join(', ')} emails allowed.`);
      } else {
        // Not authenticated - show login button
        setStatus('idle');
      }
    } catch (err) {
      console.error('Session check failed:', err);
      setStatus('idle'); // Show login button on error
    }
  }
  
  const handleLogin = () => {
    // Redirect to main platform login, then back here
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${platformUrl}/login?redirect_url=${returnUrl}`;
  };
  
  // Loading state
  if (status === 'checking') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Checking session...</p>
        </div>
      </div>
    );
  }
  
  // Access denied
  if (status === 'denied') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-purple-100/30 to-gray-100'
      }`}>
        <div className="w-full max-w-sm p-6 text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Access Denied</h1>
          <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{error}</p>
          <button 
            onClick={() => { clearTeamSession(); window.location.href = platformUrl; }} 
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Go to Flowstarter
          </button>
        </div>
      </div>
    );
  }
  
  // Login prompt
  return (
    <div className={`min-h-screen flex items-center justify-center ${
      isDark ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-purple-100/30 to-gray-100'
    }`}>
      <div className="w-full max-w-sm p-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔧</div>
          <h1 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Team Login</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Internal access only</p>
        </div>
        
        <div className={`rounded-xl p-6 border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}>
          <p className={`mb-6 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Sign in with your Flowstarter account.
          </p>
          
          <button onClick={handleLogin} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign in via Flowstarter
          </button>
          
          <p className={`mt-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Team domains: {TEAM_EMAIL_DOMAINS.join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
}
