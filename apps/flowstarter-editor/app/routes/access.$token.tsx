/**
 * Magic Link Access Route
 * 
 * Handles magic link URLs sent to clients.
 * Flow: Client clicks link → Validates → Creates session → Redirects to project
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@remix-run/react';
import { useMutation, useQuery } from 'convex/react';
import { ClientOnly } from 'remix-utils/client-only';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';

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
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
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
        maxWidth: '400px',
        padding: '32px',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>😕</div>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 600, 
          marginBottom: '12px',
        }}>
          Access Link Invalid
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: 'rgba(255,255,255,0.7)',
          marginBottom: '24px',
          lineHeight: 1.6,
        }}>
          {message}
        </p>
        <p style={{ 
          fontSize: '14px', 
          color: 'rgba(255,255,255,0.5)',
        }}>
          Please contact your Flowstarter team for a new access link.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginTop: '24px',
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
        )}
      </div>
    </div>
  );
}

function MagicLinkAccessContent() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'validating' | 'using' | 'error'>('validating');
  const [error, setError] = useState<string | null>(null);
  
  // Validate the token first
  const validation = useQuery(
    api.magicLinks.validate,
    token ? { token } : 'skip'
  );
  
  // Mutation to use the link
  const useMagicLink = useMutation(api.magicLinks.use);
  
  useEffect(() => {
    async function processLink() {
      if (!token) {
        setError('No access token provided');
        setStatus('error');
        return;
      }
      
      // Wait for validation
      if (validation === undefined) return;
      
      if (!validation.valid) {
        setError(validation.error || 'Invalid access link');
        setStatus('error');
        return;
      }
      
      // Validation passed, now use the link to create session
      setStatus('using');
      
      try {
        const result = await useMagicLink({
          token,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        });
        
        if (!result.success) {
          setError(result.error || 'Failed to create session');
          setStatus('error');
          return;
        }
        
        // Store session token in localStorage
        if (typeof window !== 'undefined' && result.sessionToken) {
          localStorage.setItem('flowstarter_session', result.sessionToken);
          localStorage.setItem('flowstarter_access_level', result.accessLevel || 'customize');
        }
        
        // Redirect to project
        navigate(result.redirectTo || '/');
        
      } catch (err) {
        console.error('Magic link error:', err);
        setError('Something went wrong. Please try again.');
        setStatus('error');
      }
    }
    
    processLink();
  }, [token, validation, useMagicLink, navigate]);
  
  if (status === 'error' && error) {
    return <ErrorState message={error} />;
  }
  
  if (status === 'validating') {
    return <LoadingState message="Verifying access link..." />;
  }
  
  if (status === 'using') {
    return <LoadingState message="Setting up your access..." />;
  }
  
  // Show validation info while processing
  if (validation?.valid) {
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
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>
            Welcome, {validation.client.name}!
          </p>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
            Taking you to {validation.project.name}...
          </p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }
  
  return <LoadingState message="Processing..." />;
}
