/**
 * Auth Guard for Editor
 *
 * Unauthenticated users see a two-option screen:
 *   1. "Login with Flowstarter" → redirects to main platform login (for clients)
 *   2. "Team login" → redirects to /team/login on the main platform (for team members)
 */

import { useUser } from '@clerk/remix';
import { useEffect, useRef, useState } from 'react';
import { FlowBackground, Logo } from '@flowstarter/flow-design-system';
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
  const mainUrl = getMainPlatformUrl();
  const redirectUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';

  // Force dark theme
  useEffect(() => {
    document.cookie = 'theme=dark; path=/; max-age=31536000';
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('flowstarter_theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', overflow: 'hidden' }}>
      <FlowBackground style={{ position: 'fixed', inset: 0, zIndex: 0 }} variant="landing" />
      <div style={{ position: 'fixed', top: '-15%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', background: 'radial-gradient(ellipse, rgba(77,93,217,0.18) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '90%', maxWidth: '420px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px', padding: '44px 40px', backdropFilter: 'blur(24px)', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)' }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <Logo size="md" theme="dark" />
        </div>

        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.3px' }}>
          Welcome to Flowstarter Editor
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
          Sign in to manage and edit your website.
        </p>

        {/* Client login */}
        <a
          href={`${mainUrl}/login?redirect_url=${redirectUrl}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #4D5DD9 0%, #6366f1 100%)', color: '#fff', fontWeight: 600, fontSize: '15px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(77,93,217,0.35)', marginBottom: '12px', boxSizing: 'border-box' }}
        >
          Login with Flowstarter
        </a>

        {/* Team login */}
        <a
          href={`${mainUrl}/team/login?redirect_url=${redirectUrl}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: '15px', textDecoration: 'none', boxSizing: 'border-box' }}
        >
          Team login
        </a>
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

  if (!isLoaded) {
    return fallback || <LoadingScreen message="Loading..." />;
  }

  if (!isSignedIn) {
    return <LoginPrompt />;
  }

  if (requireTeam && userMode !== 'team') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔒</div>
          <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Team Access Required</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>This area is restricted to Flowstarter team members.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export const TeamAuthGuard = AuthGuard;
