/**
 * Team Login - Simple Internal Auth
 * 
 * Just for Darius & Dorin. No Clerk, no OAuth.
 * Simple email/password stored in env vars.
 */

import { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import type { MetaFunction, ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

export const meta: MetaFunction = () => {
  return [
    { title: 'Team Login - Flowstarter' },
    { name: 'robots', content: 'noindex' },
  ];
};

// Server-side credential check
export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email')?.toString().toLowerCase();
  const password = formData.get('password')?.toString();
  
  if (!email || !password) {
    return json({ error: 'Email and password required' }, { status: 400 });
  }
  
  // Get team credentials from env
  // Format: TEAM_CREDENTIALS=email1:pass1,email2:pass2
  const teamCredentials = (context.cloudflare?.env as any)?.TEAM_CREDENTIALS 
    || process.env.TEAM_CREDENTIALS 
    || '';
  
  const credentials = teamCredentials.split(',').map((c: string) => {
    const [e, p] = c.split(':');
    return { email: e?.toLowerCase().trim(), password: p?.trim() };
  });
  
  const match = credentials.find(
    (c: { email: string; password: string }) => c.email === email && c.password === password
  );
  
  if (!match) {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  // Create a simple session token
  const sessionToken = btoa(`${email}:${Date.now()}:${Math.random().toString(36)}`);
  
  return json({ 
    success: true, 
    token: sessionToken,
    user: { email, name: email.split('@')[0] },
  });
}

export default function TeamLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const res = await fetch('/team/login', {
        method: 'POST',
        body: new FormData(e.target as HTMLFormElement),
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }
      
      // Store team session
      localStorage.setItem('flowstarter_team_token', data.token);
      localStorage.setItem('flowstarter_team_user', JSON.stringify(data.user));
      localStorage.setItem('flowstarter_mode', 'team');
      
      // Redirect to team dashboard
      navigate('/team');
      
    } catch (err) {
      setError('Something went wrong');
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
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔧</div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 600, 
            color: 'white',
            marginBottom: '8px',
          }}>
            Team Login
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            Internal access only
          </p>
        </div>
        
        {/* Form */}
        <form 
          onSubmit={handleSubmit}
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '28px',
          }}
        >
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#fca5a5',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)',
            }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '15px',
              }}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)',
            }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '15px',
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isLoading ? 'wait' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
