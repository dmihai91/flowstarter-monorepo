/**
 * Magic Link Access Route
 * 
 * Flow:
 * 1. Client clicks magic link
 * 2. Validates token
 * 3. If client hasn't signed up → Show signup options (Google/Apple)
 * 4. After signup → Link Clerk user to client record
 * 5. Redirect to project
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@remix-run/react';
import { useMutation, useQuery } from 'convex/react';
import { ClientOnly } from 'remix-utils/client-only';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';

// Main platform URL for Clerk auth
const MAIN_PLATFORM_URL = typeof window !== 'undefined' 
  ? (window as any).__ENV__?.MAIN_PLATFORM_URL || (process.env.NODE_ENV === 'production' ? 'https://flowstarter.app' : 'https://flowstarter.dev')
  : 'https://flowstarter.dev';

export default function MagicLinkAccess() {
  return (
    <ClientOnly fallback={<LoadingState message="Verifying access link..." />}>
      {() => <MagicLinkAccessContent />}
    </ClientOnly>
  );
}

function LoadingState({ message }: { message: string }) {
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
          {message}
        </p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
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
          Access Link Invalid
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
          {message}
        </p>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
          Please contact your Flowstarter team for a new access link.
        </p>
      </div>
    </div>
  );
}

function MagicLinkAccessContent() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'validating' | 'signup' | 'linking' | 'error'>('validating');
  const [error, setError] = useState<string | null>(null);
  const [validationData, setValidationData] = useState<any>(null);
  
  // Validate the token
  const validation = useQuery(
    api.magicLinks.validate,
    token ? { token } : 'skip'
  );
  
  // Mutation to link Clerk user to client and complete access
  const completeAccess = useMutation(api.magicLinks.completeClientAccess);
  
  useEffect(() => {
    if (!token) {
      setError('No access token provided');
      setStatus('error');
      return;
    }
    
    if (validation === undefined) return;
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid access link');
      setStatus('error');
      return;
    }
    
    setValidationData(validation);
    
    // Check if client already has a Clerk account linked
    if (validation.client.hasClerkAccount) {
      // Client already signed up - redirect to main platform to login
      // They'll be redirected back with auth
      const returnUrl = encodeURIComponent(`${window.location.origin}/access/${token}/complete`);
      window.location.href = `${MAIN_PLATFORM_URL}/login?next=${returnUrl}`;
    } else {
      // First time - show signup options
      setStatus('signup');
    }
  }, [token, validation]);
  
  // Handle signup with provider
  const handleSignup = (provider: 'google' | 'apple') => {
    // Store token for after signup
    localStorage.setItem('flowstarter_pending_magic_link', token!);
    
    // Redirect to main platform signup with provider and return URL
    const returnUrl = encodeURIComponent(`${window.location.origin}/access/${token}/complete`);
    window.location.href = `${MAIN_PLATFORM_URL}/sign-up?provider=${provider}&next=${returnUrl}`;
  };
  
  if (status === 'error' && error) {
    return <ErrorState message={error} />;
  }
  
  if (status === 'validating') {
    return <LoadingState message="Verifying access link..." />;
  }
  
  if (status === 'linking') {
    return <LoadingState message="Setting up your account..." />;
  }
  
  // Signup screen
  if (status === 'signup' && validationData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0f',
        color: 'white',
      }}>
        <div style={{ 
          textAlign: 'center', 
          maxWidth: '420px', 
          padding: '32px',
        }}>
          {/* Welcome */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
            <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>
              Welcome, {validationData.client.name}!
            </h1>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)' }}>
              Your website <strong>{validationData.project.name}</strong> is ready for you.
            </p>
          </div>
          
          {/* Signup prompt */}
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px',
          }}>
            <p style={{ 
              fontSize: '15px', 
              color: 'rgba(255,255,255,0.8)', 
              marginBottom: '24px' 
            }}>
              Create your account to access and customize your site
            </p>
            
            {/* Google */}
            <button
              onClick={() => handleSignup('google')}
              style={{
                width: '100%',
                padding: '14px 20px',
                backgroundColor: 'white',
                color: '#1f2937',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '12px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            
            {/* Apple */}
            <button
              onClick={() => handleSignup('apple')}
              style={{
                width: '100%',
                padding: '14px 20px',
                backgroundColor: '#000',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Continue with Apple
            </button>
          </div>
          
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            By signing up, you agree to our Terms of Service
          </p>
        </div>
      </div>
    );
  }
  
  return <LoadingState message="Processing..." />;
}
