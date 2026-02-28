/**
 * Auth Guard for Editor
 * 
 * Shows a login prompt for unauthenticated users instead of forcing redirect.
 * This avoids redirect loops with Clerk satellite configuration.
 */

import { useUser, useSignIn } from '@clerk/remix';
import { useEffect, useRef, useState } from 'react';
import { initializeFromClerkUser } from '~/lib/team-auth';
import { LoadingScreen } from '~/components/LoadingScreen';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireTeam?: boolean;
}

function getMainPlatformUrl(): string {
  if (typeof window === 'undefined') return 'https://flowstarter.dev';
  const hostname = window.location.hostname;
  if (hostname.includes('flowstarter.app')) return 'https://flowstarter.app';
  if (hostname.includes('flowstarter.dev')) return 'https://flowstarter.dev';
  return 'http://localhost:3000';
}

function LoginPrompt() {
  const { signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const mainUrl = getMainPlatformUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !setActive) return;
    setError('');
    setIsLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      } else {
        setError('Sign-in incomplete. Please try again.');
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ message: string }> };
      setError(clerkErr?.errors?.[0]?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px', padding: '40px 36px', backdropFilter: 'blur(24px)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <path d="M8 26 Q14 18, 20 22 Q26 26, 32 18" stroke="#4D5DD9" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              <path d="M8 20 Q14 12, 20 16 Q26 20, 32 12" stroke="#C1C8FF" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.7"/>
            </svg>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.3px' }}>Flowstarter</span>
          </div>
        </div>

        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, textAlign: 'center', marginBottom: '6px' }}>Sign in to your account</h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', textAlign: 'center', marginBottom: '28px' }}>Access your website editor</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email" required placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)} style={inp}
          />
          <input
            type="password" required placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} style={inp}
          />

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 12px', color: '#fca5a5', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={isLoading}
            style={{ padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #4D5DD9 0%, #6366f1 100%)', color: '#fff', fontWeight: 600, fontSize: '14px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, marginTop: '4px' }}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
          Don't have an account?{' '}
          <a href={`${mainUrl}/login`} style={{ color: 'rgba(193,200,255,0.7)', textDecoration: 'none' }}>Get started</a>
        </p>
      </div>
    </div>
  );
}

export function AuthGuard({ children, fallback, requireTeam = false }: AuthGuardProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [userMode, setUserMode] = useState<'guest' | 'team' | 'client'>('guest');
  
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const mode = initializeFromClerkUser(user);
      setUserMode(mode);
    }
  }, [isLoaded, isSignedIn, user]);

  // Still loading Clerk
  if (!isLoaded) {
    return fallback || <LoadingScreen message="Loading..." />;
  }

  // Not signed in - show login prompt (no redirect to avoid loops)
  if (!isSignedIn) {
    return <LoginPrompt />;
  }

  // Team access required but user is not team
  if (requireTeam && userMode !== 'team') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-semibold text-white mb-2">
            Team Access Required
          </h1>
          <p className="text-zinc-400 mb-4">
            This area is restricted to team members only.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export const TeamAuthGuard = AuthGuard;
