'use client';

import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

export default function TeamLoginPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 2FA state
  const [needs2FA, setNeeds2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

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
      } else if (result.status === 'needs_second_factor') {
        setNeeds2FA(true);
      } else if (result.status === 'needs_first_factor') {
        setError('Please verify your email first.');
      } else {
        console.log('Sign in status:', result.status, result);
        setError(`Sign in incomplete (${result.status}). Please try again.`);
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string }> };
      setError(clerkError.errors?.[0]?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'totp',
        code: totpCode,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/team/dashboard');
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string }> };
      setError(clerkError.errors?.[0]?.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state until client is mounted and Clerk is ready
  if (!mounted || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c]" suppressHydrationWarning>
        <style jsx global>{`
          body { background: #FAFAFA; }
          @media (prefers-color-scheme: dark) { body { background: #0a0a0c; } }
          .dark body { background: #0a0a0c; }
        `}</style>
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
      </div>
    );
  }

  return (
    <AuthLayout
      title="Team Login"
      subtitle="Sign in to manage client projects and configure services."
      showTeamBadge={true}
      hideFooterStats={true}
    >
      <div className="w-full max-w-[520px] mx-auto">
        {/* Card container */}
        <div className="bg-white/95 dark:bg-[var(--surface-2)]/90 backdrop-blur-2xl backdrop-saturate-150 rounded-2xl border border-gray-200/50 dark:border-white/10 p-8 shadow-lg dark:shadow-2xl">
          
          {/* 2FA Form */}
          {needs2FA ? (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-[var(--purple)]/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6 text-[var(--purple)]" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Two-factor authentication
                </h2>
                <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
                  Enter the code from your authenticator app
                </p>
              </div>

              <form onSubmit={handle2FASubmit} className="flex flex-col space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="totp" className="text-sm text-gray-600 dark:text-white/60">
                    Authentication code
                  </Label>
                  <Input
                    id="totp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="h-14 rounded-lg bg-white/80 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-gray-300 dark:placeholder:text-white/20 dark:bg-[var(--surface-2)]/80 backdrop-blur-sm"
                    autoFocus
                    required
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center">{error}</div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || totpCode.length !== 6}
                  className="w-full h-12 rounded-lg font-semibold mt-2 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setNeeds2FA(false);
                    setTotpCode('');
                    setError('');
                  }}
                  className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70 transition-colors"
                >
                  ← Back to login
                </button>
              </form>
            </>
          ) : (
            <>
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
                  className="w-full h-12 rounded-lg font-semibold mt-2 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
