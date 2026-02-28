import { useUser } from '@clerk/remix';
import { useEffect, useState } from 'react';
import { FlowBackground, Logo, Footer, ThemeToggle } from '@flowstarter/flow-design-system';
import { useStore } from '@nanostores/react';
import { themeStore, setTheme } from '~/lib/stores/theme';
import { initializeFromClerkUser } from '~/lib/team-auth';
import { LoadingScreen } from '~/components/LoadingScreen';
import { getMainPlatformUrl, getCalendlyUrl } from '~/lib/config/domains';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireTeam?: boolean;
}

function LoginPrompt() {
  const mainUrl = getMainPlatformUrl();
  const redirectUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
  const currentTheme = useStore(themeStore);
  // Derive isDark synchronously so colors are always correct on first render
  const isDark = currentTheme === 'dark' ||
    (currentTheme === 'system' && typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const bg       = isDark ? '#0a0a0f'                    : '#f4f4f8';
  const cardBg   = isDark ? 'rgba(255,255,255,0.05)'     : 'rgba(255,255,255,0.85)';
  const cardBord = isDark ? 'rgba(255,255,255,0.1)'      : 'rgba(0,0,0,0.08)';
  const titleCol = isDark ? '#fff'                       : '#0f0f14';
  const subtCol  = isDark ? 'rgba(255,255,255,0.5)'      : 'rgba(0,0,0,0.5)';
  const cardH2   = isDark ? '#fff'                       : '#0f0f14';
  const noteCol  = isDark ? 'rgba(255,255,255,0.4)'      : 'rgba(0,0,0,0.45)';
  const divBg    = isDark ? 'rgba(255,255,255,0.1)'      : 'rgba(0,0,0,0.1)';
  const divTxt   = isDark ? 'rgba(255,255,255,0.3)'      : 'rgba(0,0,0,0.35)';
  const teamBg   = isDark ? 'rgba(255,255,255,0.07)'     : 'rgba(0,0,0,0.06)';
  const teamBord = isDark ? 'rgba(255,255,255,0.12)'     : 'rgba(0,0,0,0.12)';
  const teamCol  = isDark ? 'rgba(255,255,255,0.75)'     : 'rgba(0,0,0,0.7)';
  const hdrBord  = isDark ? 'rgba(255,255,255,0.07)'     : 'rgba(0,0,0,0.08)';

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', background: bg, color: titleCol, fontFamily: 'system-ui, sans-serif', position: 'relative', overflow: 'hidden', transition: 'background 0.3s' }}>
      <FlowBackground style={{ position: 'fixed', inset: 0, zIndex: 0 }} variant="dashboard" />

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: `1px solid ${hdrBord}` }}>
        <a href={mainUrl} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', ['--text-primary' as string]: isDark ? '#ffffff' : '#09090b' }}>
          <Logo size="md" />
        </a>
        <ThemeToggle theme={currentTheme} onThemeChange={setTheme} />
      </header>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', position: 'relative', zIndex: 1 }}>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '10px', lineHeight: 1.2, color: titleCol }}>
            <span>Flowstarter </span>
            <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #4D5DD9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Editor</span>
          </h1>
          <p style={{ color: subtCol, fontSize: '15px' }}>Sign in to manage and edit your website.</p>
        </div>

        {/* Glass card */}
        <div style={{ width: '100%', maxWidth: '440px', background: cardBg, border: `1px solid ${cardBord}`, borderRadius: '16px', padding: '32px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', transition: 'background 0.3s, border-color 0.3s' }}>
          <h2 style={{ color: cardH2, fontSize: '18px', fontWeight: 600, textAlign: 'center', marginBottom: '6px' }}>Sign in to continue</h2>
          <p style={{ color: noteCol, fontSize: '13px', textAlign: 'center', marginBottom: '24px' }}>
            New client?{' '}
            <a href={getCalendlyUrl()} target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'none' }}>Book a discovery call</a>
            {' '}to get started.
          </p>

          <a href={`${mainUrl}/login?redirect_url=${redirectUrl}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #4D5DD9 0%, #6366f1 100%)', color: '#fff', fontWeight: 600, fontSize: '15px', textDecoration: 'none', boxShadow: '0 4px 14px rgba(77,93,217,0.4)', marginBottom: '12px', boxSizing: 'border-box' }}>
            Login with Flowstarter
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0 12px' }}>
            <div style={{ flex: 1, height: '1px', background: divBg }} />
            <span style={{ color: divTxt, fontSize: '12px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: divBg }} />
          </div>

          <a href={`${mainUrl}/team/login?redirect_url=${redirectUrl}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px 20px', borderRadius: '10px', background: teamBg, border: `1px solid ${teamBord}`, color: teamCol, fontWeight: 500, fontSize: '15px', textDecoration: 'none', boxSizing: 'border-box' }}>
            Team login
          </a>
        </div>
      </main>

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
      setUserMode(initializeFromClerkUser(user));
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
