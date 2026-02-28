/**
 * Auth Guard for Editor
 *
 * Unauthenticated users see a login screen that mirrors the main platform's
 * AuthLayout — same header, same glass card, same footer, two sign-in options.
 */

import { useUser } from '@clerk/remix';
import { useEffect, useState } from 'react';
import { FlowBackground, Logo, Footer } from '@flowstarter/flow-design-system';
import { initializeFromClerkUser } from '~/lib/team-auth';
import { LoadingScreen } from '~/components/LoadingScreen';
import { getMainPlatformUrl, getMainPlatformHomepage, getCalendlyUrl } from '~/lib/config/domains';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireTeam?: boolean;
}

function LoginPrompt() {
  const mainUrl = getMainPlatformUrl(typeof window !== 'undefined' ? window.location.href : '');
  const redirectUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';

  useEffect(() => {
    document.cookie = 'theme=dark; path=/; max-age=31536000';
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('flowstarter_theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const btn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: '12px 20px', borderRadius: '10px',
    fontSize: '15px', fontWeight: 600, textDecoration: 'none',
    cursor: 'pointer', boxSizing: 'border-box', transition: 'opacity 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', background: '#0a0a0f', color: '#fff', fontFamily: 'system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>
      {/* Background */}
      <FlowBackground style={{ position: 'fixed', inset: 0, zIndex: 0 }} variant="dashboard" />

      {/* Header — mirrors main platform */}
      <header style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <a href={mainUrl} style={{ textDecoration: 'none' }}>
          <Logo size="md" theme="dark" />
        </a>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', position: 'relative', zIndex: 1 }}>

        {/* Title above card */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '10px', lineHeight: 1.2 }}>
            <span style={{ color: '#fff' }}>Editor </span>
            <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #4D5DD9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Login</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px' }}>
            Sign in to manage and edit your website.
          </p>
        </div>

        {/* Glass card */}
        <div style={{ width: '100%', maxWidth: '440px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, textAlign: 'center', marginBottom: '6px' }}>
            Sign in to your account
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'center', marginBottom: '24px' }}>
            New client?{' '}
            <a href={getCalendlyUrl()} target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'none' }}>
              Book a discovery call
            </a>
            {' '}to get started.
          </p>

          {/* Login with Flowstarter */}
          <a
            href={`${mainUrl}/login?redirect_url=${redirectUrl}`}
            style={{ ...btn, background: 'linear-gradient(135deg, #4D5DD9 0%, #6366f1 100%)', color: '#fff', boxShadow: '0 4px 14px rgba(77,93,217,0.4)', marginBottom: '12px' }}
          >
            Login with Flowstarter
          </a>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0 12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Team login */}
          <a
            href={`${mainUrl}/team/login?redirect_url=${redirectUrl}`}
            style={{ ...btn, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}
          >
            Team login
          </a>
        </div>
      </main>

      {/* Footer */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Footer baseUrl={mainUrl} renderLink={(href, children, props) => <a href={href} {...props}>{children}</a>} />
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

  if (!isLoaded) return fallback || <LoadingScreen message="Loading..." />;
  if (!isSignedIn) return <LoginPrompt />;

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
