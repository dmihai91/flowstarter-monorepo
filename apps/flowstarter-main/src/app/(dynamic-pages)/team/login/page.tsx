'use client';

import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

type FlowStep = 'credentials' | 'totp' | 'email_code';

export default function TeamLoginPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<FlowStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !email || !password) return;
    
    setIsLoading(true);
    setError('');

    try {
      // Sign in with email and password directly
      const result = await signIn.create({
        identifier: email,
        password,
      });

      console.log('Sign in result:', result.status, result);

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/team/dashboard');
      } else if (result.status === 'needs_second_factor') {
        // Check what second factor is needed
        const supportedFactors = result.supportedSecondFactors;
        console.log('Second factors required:', supportedFactors);
        
        const totpFactor = supportedFactors?.find(f => f.strategy === 'totp');
        
        if (totpFactor) {
          setStep('totp');
        } else if (supportedFactors && supportedFactors.length > 0) {
          setError(`Second factor required: ${supportedFactors.map(f => f.strategy).join(', ')}`);
        } else {
          setError('Two-factor authentication required. Please contact admin.');
        }
      } else if (result.status === 'needs_first_factor') {
        // Password might not be set - check what's available
        const supportedFactors = result.supportedFirstFactors;
        console.log('First factors:', supportedFactors);
        setError('Password sign-in not available for this account');
      } else {
        setError(`Sign in incomplete: ${result.status}`);
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string; code?: string }> };
      const errorMessage = clerkError.errors?.[0]?.message || 'Invalid credentials';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !code) return;
    
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'totp',
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/team/dashboard');
      } else {
        setError('Verification failed');
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string }> };
      setError(clerkError.errors?.[0]?.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setError('');
    setCode('');
    setStep('credentials');
  };

  if (!mounted || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c]" suppressHydrationWarning>
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
        <div className="bg-white/95 dark:bg-[var(--surface-2)]/90 backdrop-blur-2xl backdrop-saturate-150 rounded-2xl border border-gray-200/50 dark:border-white/10 p-8 shadow-lg dark:shadow-2xl">
          
          {/* Credentials Step - Email + Password together */}
          {step === 'credentials' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Sign in to your account
                </h2>
                <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
                  Team access only. Contact admin for credentials.
                </p>
              </div>

              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
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
                    className="h-12 rounded-lg bg-white/80 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 dark:bg-[var(--surface-2)]/80"
                    required
                    autoFocus
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
                      className="h-12 rounded-lg bg-white/80 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 dark:bg-[var(--surface-2)]/80 pr-12"
                      required
                    />
                    {password && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/70 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                  className="w-full h-12 rounded-lg font-semibold bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-md transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

            </>
          )}

          {/* TOTP Step */}
          {step === 'totp' && (
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

              <form onSubmit={handleTotpSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm text-gray-600 dark:text-white/60">
                    Authentication code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="h-14 rounded-lg bg-white/80 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-gray-300 dark:placeholder:text-white/20 dark:bg-[var(--surface-2)]/80"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center">{error}</div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  className="w-full h-12 rounded-lg font-semibold bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-md transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>

                <button
                  type="button"
                  onClick={goBack}
                  className="w-full text-sm text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70 transition-colors"
                >
                  ← Back
                </button>
              </form>
            </>
          )}

          {/* Email Code Step - kept for future use */}
        </div>
      </div>
    </AuthLayout>
  );
}
