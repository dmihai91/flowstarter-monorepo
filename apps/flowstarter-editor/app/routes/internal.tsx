/**
 * Internal Layout - Team Only Access
 * 
 * This layout wraps all /internal/* routes and restricts access
 * to team members only (Darius, Dorin).
 */

import { useState, useEffect } from 'react';
import { Outlet, useLoaderData, useNavigate, useLocation } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { useQuery } from 'convex/react';
import { ClientOnly } from 'remix-utils/client-only';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';

// Team member emails - only these users can access internal routes
const TEAM_EMAILS = [
  'darius@flowstarter.com',
  'dorin@flowstarter.com',
  'dmihai91@gmail.com', // Darius personal
];

export async function loader({ request }: LoaderFunctionArgs) {
  // Check if internal mode is enabled
  const isInternalEnabled = process.env.INTERNAL_MODE === 'true';
  
  if (!isInternalEnabled) {
    throw redirect('/');
  }
  
  return json({ 
    mode: 'internal',
    teamEmails: TEAM_EMAILS,
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

function InternalLayoutContent() {
  const { mode } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Get session token from localStorage
  useEffect(() => {
    const token = localStorage.getItem('flowstarter_team_session');
    const storedUser = localStorage.getItem('flowstarter_team_user');
    
    if (token) {
      setSessionToken(token);
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  }, []);
  
  // Validate session with Convex
  const sessionValidation = useQuery(
    api.teamAuth.validateSession,
    sessionToken ? { token: sessionToken } : 'skip'
  );
  
  // Handle auth redirect
  useEffect(() => {
    // Skip auth check for login page
    if (location.pathname === '/internal/login') {
      return;
    }
    
    // No token, redirect to login
    if (sessionToken === null && typeof window !== 'undefined') {
      const token = localStorage.getItem('flowstarter_team_session');
      if (!token) {
        navigate('/internal/login');
      }
    }
    
    // Token invalid/expired
    if (sessionValidation && !sessionValidation.valid) {
      localStorage.removeItem('flowstarter_team_session');
      localStorage.removeItem('flowstarter_team_user');
      navigate('/internal/login');
    }
  }, [sessionToken, sessionValidation, navigate, location.pathname]);
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('flowstarter_team_session');
    localStorage.removeItem('flowstarter_team_user');
    navigate('/internal/login');
  };
  
  // Show login page without layout
  if (location.pathname === '/internal/login') {
    return <Outlet />;
  }
  
  // Still checking auth
  if (!sessionValidation && sessionToken) {
    return <LoadingFallback />;
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
          {user && (
            <span style={{ opacity: 0.8 }}>
              {user.name || user.email}
            </span>
          )}
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
