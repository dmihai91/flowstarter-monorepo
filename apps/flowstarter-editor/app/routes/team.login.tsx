/**
 * Team Login
 */

import { useSignIn, useUser } from '@clerk/remix';
import { useNavigate } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { useEffect, useState } from 'react';
import { setTeamSession, clearTeamSession, TEAM_EMAIL_DOMAINS } from '~/lib/team-auth';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/Card';

export const meta: MetaFunction = () => {
  return [
    { title: 'Team Login - Flowstarter' },
    { name: 'robots', content: 'noindex' },
  ];
};

export default function TeamLogin() {
  const { signIn, setActive } = useSignIn();
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (userLoaded && isSignedIn && user) {
      const userEmail = user.primaryEmailAddress?.emailAddress;
      const domain = userEmail?.split('@')[1]?.toLowerCase();
      const isTeam = domain && TEAM_EMAIL_DOMAINS.includes(domain);
      
      if (isTeam && userEmail) {
        setTeamSession(user.id, { email: userEmail, name: user.fullName || undefined });
        navigate('/');
      } else {
        clearTeamSession();
        setError('Access denied. Team members only.');
      }
    }
  }, [userLoaded, isSignedIn, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !email || !password) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-flowstarter-elements-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="i-flowstarter:logo-text?mask text-flowstarter-elements-textPrimary w-32 h-8 mx-auto" />
        </div>
        
        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Team Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@flowstarter.app"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-flowstarter-elements-textSecondary mt-4">
          Team access only
        </p>
      </div>
    </div>
  );
}
