/**
 * Internal Layout - Team Only Access
 * 
 * Uses the main platform's Clerk auth via handoff tokens.
 * Team members are identified by email allowlist.
 */

import { useState, useEffect } from 'react';
import { Outlet, useLoaderData, useNavigate, useLocation } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';

// Team member emails - only these users can access internal routes
const TEAM_EMAILS = [
  'darius@flowstarter.com',
  'dorin@flowstarter.com',
  'dmihai91@gmail.com', // Darius personal
];

// Main platform URL for auth
const MAIN_PLATFORM_URL = process.env.MAIN_PLATFORM_URL || 'http://localhost:3000';

export async function loader({ request }: LoaderFunctionArgs) {
  // Check if internal mode is enabled
  const isInternalEnabled = process.env.INTERNAL_MODE === 'true';
  
  if (!isInternalEnabled) {
    throw redirect('/');
  }
  
  return json({ 
    mode: 'internal',
    teamEmails: TEAM_EMAILS,
    mainPlatformUrl: MAIN_PLATFORM_URL,
  });
}

export default function InternalLayout() {
  return (
    <ClientOnly fallback={<LoadingFallback />}>
      {() => <InternalLayoutContent />}
    </ClientOnly>
  );
}

function LoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0f',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '2px solid #7c3aed',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

interface TeamUser {
  id: string;
  email: string;
  name: string;
}

function InternalLayoutContent() {
  const { mainPlatformUrl, teamEmails } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<TeamUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check auth on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        // Check for existing session
        const storedUser = localStorage.getItem('flowstarter_team_user');
        const sessionExpiry = localStorage.getItem('flowstarter_team_session_expiry');
        
        if (storedUser && sessionExpiry) {
          const expiry = parseInt(sessionExpiry, 10);
          if (expiry > Date.now()) {
            const parsed = JSON.parse(storedUser);
            // Verify email is in team list
            if (teamEmails.includes(parsed.email)) {
              setUser(parsed);
              setIsLoading(false);
              return;
            }
          }
        }
        
        // Check URL for handoff token from main platform
        const params = new URLSearchParams(window.location.search);
        const handoffToken = params.get('handoff');
        
        if (handoffToken) {
          // Validate handoff token with main platform
          const response = await fetch(`${mainPlatformUrl}/api/editor/handoff?token=${handoffToken}`);
          
          if (response.ok) {
            const data = await response.json();
            
            // Check if user email is in team list
            if (data.user?.email && teamEmails.includes(data.user.email)) {
              const teamUser: TeamUser = {
                id: data.userId,
                email: data.user.email,
                name: data.user.name || data.user.email.split('@')[0],
              };
              
              // Store session (24 hour expiry)
              localStorage.setItem('flowstarter_team_user', JSON.stringify(teamUser));
              localStorage.setItem('flowstarter_team_session_expiry', String(Date.now() + 24 * 60 * 60 * 1000));
              
              setUser(teamUser);
              
              // Clean up URL
              params.delete('handoff');
              const newUrl = params.toString() 
                ? `${location.pathname}?${params.toString()}`
                : location.pathname;
              window.history.replaceState({}, '', newUrl);
              
              setIsLoading(false);
              return;
            } else {
              setError('Access denied. Team members only.');
              setIsLoading(false);
              return;
            }
          }
        }
        
        // No valid session, redirect to main platform login
        setIsLoading(false);
        
      } catch (err) {
        console.error('Auth check failed:', err);
        setError('Authentication failed');
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, [mainPlatformUrl, teamEmails, location.pathname]);
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('flowstarter_team_user');
    localStorage.removeItem('flowstarter_team_session_expiry');
    setUser(null);
  };
  
  // Handle login redirect
  const handleLogin = () => {
    // Redirect to main platform login with return URL
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${mainPlatformUrl}/login?next=/dashboard&editor_return=${returnUrl}`;
  };
  
  if (isLoading) {
    return <LoadingFallback />;
  }
  
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0f',
        color: 'white',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
          <h1 style={{ marginBottom: '8px' }}>{error}</h1>
          <button
            onClick={handleLogin}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              backgroundColor: '#7c3aed',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Try Different Account
          </button>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0f',
        color: 'white',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
          <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>Internal Access</h1>
          <p style={{ marginBottom: '24px', color: 'rgba(255,255,255,0.7)' }}>
            Sign in with your Flowstarter team account to access the internal editor.
          </p>
          <button
            onClick={handleLogin}
            style={{
              padding: '14px 32px',
              backgroundColor: '#7c3aed',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign In with Flowstarter
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="internal-layout">
      {/* Internal mode banner */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '40px',
          backgroundColor: '#7c3aed',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          fontSize: '13px',
          fontWeight: 500,
          zIndex: 9999,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>🔧</span>
          <span>Internal Mode</span>
          <span style={{ opacity: 0.6 }}>|</span>
          <a 
            href="/internal/new" 
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              opacity: location.pathname.includes('/new') ? 1 : 0.7,
            }}
          >
            New Project
          </a>
          <a 
            href="/internal/clients" 
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              opacity: location.pathname.includes('/clients') ? 1 : 0.7,
            }}
          >
            Clients
          </a>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ opacity: 0.8 }}>
            {user.name || user.email}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '4px 12px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Content with padding for banner */}
      <div style={{ paddingTop: '40px', height: '100vh' }}>
        <Outlet />
      </div>
    </div>
  );
}
