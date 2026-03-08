/**
 * Magic Link Completion Route
 * 
 * Called after client signs up/logs in via Clerk.
 * Links their Clerk account to the client record and redirects to project.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from '@remix-run/react';
import { useMutation, useQuery } from 'convex/react';
import { ClientOnly } from 'remix-utils/client-only';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';

// Main platform URL
const MAIN_PLATFORM_URL = typeof window !== 'undefined' 
  ? (window as any).__ENV__?.MAIN_PLATFORM_URL || (process.env.NODE_ENV === 'production' ? 'https://flowstarter.app' : 'https://flowstarter.dev')
  : 'https://flowstarter.dev';

export default function MagicLinkComplete() {
  return (
    <ClientOnly fallback={<LoadingState />}>
      {() => <MagicLinkCompleteContent />}
    </ClientOnly>
  );
}

function LoadingState() {
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
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #7c3aed',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 24px',
        }} />
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)' }}>
          Setting up your account...
        </p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}

function MagicLinkCompleteContent() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  // Get Clerk user info from handoff
  const handoffToken = searchParams.get('handoff');
  
  // Mutation to complete the access
  const completeAccess = useMutation(api.magicLinks.completeClientAccess);
  
  useEffect(() => {
    async function complete() {
      if (!token) {
        setError('Missing access token');
        return;
      }
      
      try {
        // Get Clerk user info from main platform
        let clerkUserId: string | null = null;
        let signupMethod: 'google' | 'apple' | 'email' = 'email';
        
        if (handoffToken) {
          const res = await fetch(`${MAIN_PLATFORM_URL}/api/editor/handoff?token=${handoffToken}`);
          if (res.ok) {
            const data = await res.json() as { userId?: string; user?: { signupMethod?: 'google' | 'apple' | 'email' } };
            clerkUserId = data.userId || null;
            // Detect signup method from Clerk metadata if available
            signupMethod = data.user?.signupMethod || 'google';
          }
        }
        
        if (!clerkUserId) {
          // Try to get from session/cookie
          // The main platform should have set this
          setError('Please complete the signup process');
          return;
        }
        
        // Complete the access - links Clerk user to client
        const result = await completeAccess({
          token,
          clerkUserId,
          signupMethod,
        });
        
        if (!result.success) {
          setError(result.error || 'Failed to complete setup');
          return;
        }
        
        // Store client mode
        localStorage.setItem('flowstarter_mode', 'client');
        localStorage.setItem('flowstarter_client_id', result.clientId!);
        localStorage.setItem('flowstarter_project_id', result.projectId!);
        
        // Redirect to client editor
        navigate(`/client/project/${result.projectUrlId}`);
        
      } catch (err) {
        console.error('Complete access error:', err);
        setError('Something went wrong. Please try again.');
      }
    }
    
    complete();
  }, [token, handoffToken, completeAccess, navigate]);
  
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
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '32px' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>😕</div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>
            Setup Failed
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
            {error}
          </p>
          <button
            onClick={() => navigate(`/access/${token}`)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return <LoadingState />;
}
