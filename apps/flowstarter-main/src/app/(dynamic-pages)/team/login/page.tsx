'use client';

import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function TeamLoginPage() {
  const { signIn, setActive } = useSignIn();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/team/dashboard');
      } else {
        setError('Sign in incomplete. Please try again.');
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string }> };
      setError(clerkError.errors?.[0]?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Team Login"
      subtitle="Sign in to manage client projects and configure services."
    >
      <div className="w-full max-w-[520px] mx-auto">
        {/* Card container - matches client login */}
        <div className="bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-white/10 p-8 shadow-sm">
          {/* Card header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Sign in to your account
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
              Team access only. Contact admin for credentials.
            </p>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-600 dark:text-white/60">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@flowstarter.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-lg bg-white/80 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 dark:bg-[var(--surface-2)]/80 backdrop-blur-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-gray-600 dark:text-white/60">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-lg bg-white/80 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 dark:bg-[var(--surface-2)]/80 pr-12 backdrop-blur-sm"
                  required
                />
                {password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/70 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full h-12 rounded-lg font-semibold mt-2 bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}
