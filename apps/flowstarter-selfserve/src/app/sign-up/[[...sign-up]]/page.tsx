'use client';

// Custom sign-up — same split design as the custom login (landing/login.html),
// driven headless via Clerk's useSignUp: name + email + password → emailed
// code → session. Replaces the prebuilt Clerk widget (which rendered
// dark-on-dark and carried stale copy).
import React, { Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { useSignUp } from '@clerk/nextjs/legacy';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { Logo, ThemeToggle, Dots } from '@/components/ui';

function errMessage(e: unknown): string {
  if (isClerkAPIResponseError(e)) {
    return e.errors[0]?.longMessage ?? e.errors[0]?.message ?? 'Sign-up failed.';
  }
  return e instanceof Error ? e.message : 'Sign-up failed.';
}

function SignUpInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { isLoaded, signUp, setActive } = useSignUp();
  const redirectUrl = params.get('redirect_url') ?? '/';

  const [step, setStep] = React.useState<'details' | 'code'>('details');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submitDetails = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isLoaded || !signUp || busy) return;
    if (!firstName.trim() || !email.trim() || !password) {
      setError('Name, email and a password — that’s all we need.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim() || firstName.trim(),
        emailAddress: email.trim(),
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('code');
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!signUp || !setActive || busy || code.trim().length < 4) return;
    setBusy(true);
    setError(null);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (attempt.status === 'complete' && attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId });
        router.push(redirectUrl);
        return;
      }
      setError('That code didn’t work — try again.');
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (strategy: 'oauth_google' | 'oauth_apple') => {
    if (!signUp) return;
    setError(null);
    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sign-up/sso-callback',
        redirectUrlComplete: redirectUrl,
      });
    } catch (err) {
      setError(errMessage(err));
    }
  };

  return (
    <div className="landing login-shell">
      {/* form pane */}
      <div className="login-pane">
        <div className="login-head">
          <Logo size={19} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle />
            <a className="login-back" href="/">
              ← Back home
            </a>
          </div>
        </div>

        <div className="login-main">
          <div className="login-card">
            {step === 'details' ? (
              <>
                <h1>Let’s get you building.</h1>
                <p className="login-sub">Free account — your draft is saved and the agent is ready.</p>
                {error && <div className="login-error">{error}</div>}
                <form onSubmit={(e) => void submitDetails(e)} noValidate>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="login-field">
                      <label className="login-label" htmlFor="firstName">First name</label>
                      <input
                        suppressHydrationWarning
                        className="login-input"
                        id="firstName"
                        autoComplete="given-name"
                        placeholder="Alex"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="login-field">
                      <label className="login-label" htmlFor="lastName">Last name</label>
                      <input
                        suppressHydrationWarning
                        className="login-input"
                        id="lastName"
                        autoComplete="family-name"
                        placeholder="Rivera"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="login-field">
                    <label className="login-label" htmlFor="email">Email</label>
                    <input
                      suppressHydrationWarning
                      className="login-input"
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@yourbusiness.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="login-field">
                    <label className="login-label" htmlFor="password">Password</label>
                    <input
                      suppressHydrationWarning
                      className="login-input"
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="8+ characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {/* Clerk Smart CAPTCHA mounts here in custom flows (bot sign-up protection) */}
                  <div id="clerk-captcha" style={{ margin: '4px 0 10px' }} />
                  <button className="btn btn-primary btn-lg login-submit" type="submit" disabled={busy || !isLoaded} style={{ marginTop: 6 }}>
                    {busy ? <Dots /> : 'Create my account'}
                  </button>
                </form>

                <div className="login-divider">or continue with</div>
                <div className="login-socials">
                  <button className="login-social" type="button" onClick={() => void oauth('oauth_google')}>
                    <svg width="17" height="17" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.4h6c-.3 1.4-1 2.5-2.2 3.3v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.2z" />
                      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.6l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9C3.9 20.5 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.8 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V6.9H2.1C1.4 8.4 1 10.2 1 12s.4 3.6 1.1 5.1l3.7-2.9z" />
                      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.5 2.1 15 1 12 1 7.7 1 3.9 3.5 2.1 6.9l3.7 2.9c.9-2.6 3.3-4.4 6.2-4.4z" />
                    </svg>
                    Google
                  </button>
                  <button className="login-social" type="button" onClick={() => void oauth('oauth_apple')}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.9-1.6 0-3.1 1-4 2.4-1.7 2.9-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.6-1-2.6-3.7zM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.8-1.4z" />
                    </svg>
                    Apple
                  </button>
                </div>

                <p className="login-foot">
                  Already have an account? <a href="/sign-in">Sign in</a>
                </p>
              </>
            ) : (
              <>
                <h1>Check your email.</h1>
                <p className="login-sub">
                  We sent a verification code to <strong>{email}</strong>.
                </p>
                {error && <div className="login-error">{error}</div>}
                <form onSubmit={(e) => void submitCode(e)} noValidate>
                  <div className="login-field">
                    <label className="login-label" htmlFor="code">Code</label>
                    <input
                      suppressHydrationWarning
                      className="login-input"
                      id="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      autoFocus
                    />
                  </div>
                  <button className="btn btn-primary btn-lg login-submit" type="submit" disabled={busy}>
                    {busy ? <Dots /> : 'Verify & continue'}
                  </button>
                </form>
                <p className="login-foot">
                  <button type="button" className="login-forgot" onClick={() => setStep('details')}>
                    ← Edit my details
                  </button>
                </p>
              </>
            )}
          </div>
        </div>

        <p className="login-legal">By continuing you agree to our Terms & Privacy Policy.</p>
      </div>

      {/* brand pane */}
      <div className="brand-pane">
        <div>
          <div className="eyebrow">Flowstarter</div>
          <h2>Your draft is waiting.</h2>
          <p>One free account unlocks the real thing — an agent that rebuilds your page on command.</p>
          <div className="brand-feed">
            <div className="brand-line">
              <span className="brand-line-avatar" style={{ color: '#3D4FF0' }}>✓</span>
              <span className="brand-line-body">
                <strong>Free</strong> — just an email. Your draft is saved to your account.
              </span>
            </div>
            <div className="brand-line">
              <span className="brand-line-avatar" style={{ color: '#3D4FF0' }}>10</span>
              <span className="brand-line-body">
                <strong>10 prompts with a real agent</strong> — it rebuilds your page after every message.
              </span>
            </div>
            <div className="brand-line">
              <span className="brand-line-avatar" style={{ color: '#3D4FF0' }}>€</span>
              <span className="brand-line-body">
                <strong>Nothing is charged</strong> until you start the build — and you see everything first.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Router() {
  const pathname = usePathname();
  if (pathname?.includes('sso-callback')) {
    return <AuthenticateWithRedirectCallback />;
  }
  return <SignUpInner />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Router />
    </Suspense>
  );
}
