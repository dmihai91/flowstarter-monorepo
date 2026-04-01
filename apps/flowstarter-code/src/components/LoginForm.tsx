'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Eye, EyeOff, Shield, ArrowRight, AlertCircle } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [isSSOLoading, setIsSSOLoading] = useState(false);
  const [error, setError]             = useState('');

  const busy = isLoading || isSSOLoading;

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = () => {
    setIsSSOLoading(true);
    signIn('authentik', { callbackUrl: '/' });
  };

  return (
    <div className="w-full">
      {/* ── SSO — primary CTA ─────────────────────────────────── */}
      <button
        type="button"
        onClick={handleSSOLogin}
        disabled={busy}
        data-testid="sso-button"
        className="w-full h-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2.5 mb-5 disabled:cursor-not-allowed"
        style={{
          background: 'rgba(77,93,217,0.10)',
          border: '1px solid rgba(77,93,217,0.25)',
          color: 'var(--ui-text-primary)',
          opacity: busy && !isSSOLoading ? 0.55 : 1,
        }}
        onMouseEnter={e => {
          if (!busy) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(77,93,217,0.18)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(77,93,217,0.10)';
        }}
      >
        {isSSOLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Redirecting to SSO…
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 text-[var(--violet)]" aria-hidden />
            Continue with Flowstarter SSO
          </>
        )}
      </button>

      {/* ── Divider ─────────────────────────────────────────────── */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full" style={{ borderTop: '1px solid var(--ui-border-base)' }} />
        </div>
        <div className="relative flex justify-center text-xs">
          <span
            className="px-3 font-medium"
            style={{ background: 'transparent', color: 'var(--ui-text-tertiary)' }}
          >
            or sign in with email
          </span>
        </div>
      </div>

      {/* ── Credentials form ─────────────────────────────────────── */}
      <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium"
            style={{ color: 'var(--ui-text-secondary)' }}
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@flowstarter.app"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={busy}
            className="fs-input"
            required
            autoFocus
            autoComplete="email"
            data-testid="email-input"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium"
              style={{ color: 'var(--ui-text-secondary)' }}
            >
              Password
            </label>
            <button
              type="button"
              className="text-xs font-medium transition-colors"
              style={{ color: 'var(--violet)' }}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={busy}
              className="fs-input pr-11"
              required
              autoComplete="current-password"
              data-testid="password-input"
            />
            {password && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--ui-text-tertiary)' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm"
            style={{
              background: 'rgba(239,68,68,0.09)',
              border: '1px solid rgba(239,68,68,0.22)',
              color: '#ef4444',
            }}
            role="alert"
            data-testid="error-message"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={busy || !email || !password}
          className="group w-full h-11 rounded-xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          style={{
            backgroundImage: 'linear-gradient(135deg, #4D5DD9 0%, #8B5CF6 100%)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 4px 16px rgba(77,93,217,0.30)',
            opacity: busy || !email || !password ? 0.60 : 1,
            cursor: busy || !email || !password ? 'not-allowed' : 'pointer',
          }}
          data-testid="submit-button"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
