/**
 * Internal Entry Point - Team Auth Gate
 * 
 * Authenticates team members, sets team mode flag, then redirects
 * to the main editor. The editor checks for team mode to enable
 * extra features (magic links, publish, etc.)
 */

import { useEffect, useState } from 'react';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';

// Team member emails
const TEAM_EMAILS = [
  'darius@flowstarter.com',
  'dorin@flowstarter.com',
  'dmihai91@gmail.com',
];

const MAIN_PLATFORM_URL = process.env.MAIN_PLATFORM_URL || 'http://localhost:3000';

export async function loader({ request }: LoaderFunctionArgs) {
  const isInternalEnabled = process.env.INTERNAL_MODE === 'true';
  
  if (!isInternalEnabled) {
    throw redirect('/');
  }
  
  return json({ 
    teamEmails: TEAM_EMAILS,
    mainPlatformUrl: MAIN_PLATFORM_URL,
  });
}

export default function InternalEntry() {
  return (
    <ClientOnly fallback={<LoadingScreen />}>
      {() => <InternalEntryContent />}
    </ClientOnly>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0f',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #7c3aed',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function InternalEntryContent() {
  const { teamEmails, mainPlatformUrl } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'checking' | 'authenticated' | 'login'>('checking');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function authenticate() {
      // Check existing team session
      const storedUser = localStorage.getItem('flowstarter_team_user');
      const expiry = localStorage.getItem('flowstarter_team_session_expiry');
      
      if (storedUser && expiry && parseInt(expiry) > Date.now()) {
        const user = JSON.parse(storedUser);
        if (teamEmails.includes(user.email)) {
          // Valid session - set team mode and redirect to editor
          localStorage.setItem('flowstarter_mode', 'team');
          window.location.href = '/new';
          return;
        }
      }
      
      // Check for handoff token
      const handoffToken = searchParams.get('handoff');
      if (handoffToken) {
        try {
          const res = await fetch(`${mainPlatformUrl}/api/editor/handoff?token=${handoffToken}`);
          if (res.ok) {
            const data = await res.json();
            
            if (data.user?.email && teamEmails.includes(data.user.email)) {
              // Store team session
              localStorage.setItem('flowstarter_team_user', JSON.stringify({
                id: data.userId,
                email: data.user.email,
                name: data.user.name || data.user.email.split('@')[0],
              }));
              localStorage.setItem('flowstarter_team_session_expiry', String(Date.now() + 24 * 60 * 60 * 1000));
              localStorage.setItem('flowstarter_mode', 'team');
              
              // Redirect to editor (or specific project if in handoff)
              const targetUrl = data.project?.id 
                ? `/project/${data.project.id}`
                : '/new';
              window.location.href = targetUrl;
              return;
            } else {
              setError('Access denied. Team members only.');
              setStatus('login');
              return;
            }
          }
        } catch (err) {
          console.error('Handoff validation failed:', err);
        }
      }
      
      // No valid session
      setStatus('login');
    }
    
    authenticate();
  }, [teamEmails, mainPlatformUrl, searchParams]);
  
  const handleLogin = () => {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${mainPlatformUrl}/login?next=/dashboard&editor_return=${returnUrl}`;
  };
  
  if (status === 'checking') {
    return <LoadingScreen />;
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0f',
      color: 'white',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '24px' }}>
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239,68,68,0.2)',
            border: '1px solid rgba(239,68,68,0.5)',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#fca5a5',
          }}>
            {error}
          </div>
        )}
        
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>Team Access</h1>
        <p style={{ marginBottom: '24px', color: 'rgba(255,255,255,0.7)' }}>
          Sign in with your Flowstarter account to access team features.
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
        <p style={{ 
          marginTop: '24px', 
          fontSize: '13px', 
          color: 'rgba(255,255,255,0.4)' 
        }}>
          Team members only
        </p>
      </div>
    </div>
  );
}
