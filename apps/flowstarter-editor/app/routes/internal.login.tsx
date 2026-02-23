/**
 * Internal Team Login
 * 
 * Simple email/password login for team members.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { useMutation, useQuery } from 'convex/react';
import type { MetaFunction } from '@remix-run/cloudflare';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../convex/_generated/api';

export const meta: MetaFunction = () => {
  return [
    { title: 'Team Login - Flowstarter' },
    { name: 'robots', content: 'noindex' },
  ];
};

export default function InternalLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useMutation(api.teamAuth.login);
  
  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('flowstarter_team_session');
    if (token) {
      navigate('/internal/new');
    }
  }, [navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await login({ email, password });
      
      if (!result.success) {
        setError(result.error || 'Login failed');
        setIsLoading(false);
        return;
      }
      
      // Store session
      localStorage.setItem('flowstarter_team_session', result.token!);
      localStorage.setItem('flowstarter_team_user', JSON.stringify(result.user));
      
      // Redirect to internal dashboard
      navigate('/internal/new');
      
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0f',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
      }}>
        {/* Logo/Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            color: 'white',
            marginBottom: '8px',
          }}>
            🚀 Flowstarter
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.6)',
            fontSize: '14px',
          }}>
            Team Login
          </p>
        </div>
        
        {/* Login Form */}
        <form 
          onSubmit={handleSubmit}
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '32px',
          }}
        >
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.5)',
              borderRadius: '8px',
              marginBottom: '24px',
              color: '#fca5a5',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}
          
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="darius@flowstarter.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
              }}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label 
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px 16px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isLoading ? 'wait' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        {/* Footer */}
        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.4)',
        }}>
          Internal team access only
        </p>
      </div>
    </div>
  );
}
