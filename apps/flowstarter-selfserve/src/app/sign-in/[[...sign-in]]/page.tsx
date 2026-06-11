'use client';

// Custom login — ported from the design bundle's landing/login.html and
// driven headless via Clerk's useSignIn (same approach as flowstarter-main's
// custom form). Email+password first; an email-code step covers passwordless
// login, "forgot password" recovery and the instance's device verification.
import React, { Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { useSignIn } from '@clerk/nextjs/legacy';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { Logo, ThemeToggle, Dots } from '@/components/ui';

type Step = 'credentials' | 'code';

function errMessage(e: unknown): string {
  if (isClerkAPIResponseError(e)) {
    return e.errors[0]?.longMessage ?? e.errors[0]?.message ?? 'Sign-in failed.';
  }
  return e instanceof Error ? e.message : 'Sign-in failed.';
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { isLoaded, signIn, setActive } = useSignIn();
  const redirectUrl = params.get('redirect_url') ?? '/';

  const [step, setStep] = React.useState<Step>('credentials');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const finish = async (createdSessionId: string | null) => {
    if (!createdSessionId || !setActive) return false;
    await setActive({ session: createdSessionId });
    router.push(redirectUrl);
    return true;
  };

  /** Fall back to an emailed code — also covers forgot-password & device checks. */
  const sendCode = async (identifier: string) => {
    if (!signIn) return;
    const attempt = await signIn.create({ identifier });
    const factor = attempt.supportedFirstFactors?.find((f) => f.strategy === 'email_code');
    if (!factor || !('emailAddressId' in factor)) {
      throw new Error('Email code sign-in is not available for this account.');
    }
    await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId });
    setStep('code');
  };

  const submitCredentials = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isLoaded || !signIn || busy) return;
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const attempt = await signIn.create({ identifier: email.trim(), password });
      if (attempt.status === 'complete') {
        await finish(attempt.createdSessionId);
        return;
      }
      // Anything Clerk still wants (device verification, email factor):
      // resolve it with an emailed code.
      await sendCode(email.trim());
    } catch (err) {
      // Password path blocked (e.g. verification requirement) → try the code path.
      try {
        await sendCode(email.trim());
      } catch {
        setError(errMessage(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!signIn || busy || code.trim().length < 4) return;
    setBusy(true);
    setError(null);
    try {
      const attempt = await signIn.attemptFirstFactor({ strategy: 'email_code', code: code.trim() });
      if (attempt.status === 'complete') {
        await finish(attempt.createdSessionId);
        return;
      }
      setError('That code didn’t work — try again.');
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const emailCodeInstead = async () => {
    if (!isLoaded || !signIn || busy) return;
    if (!email.trim()) {
      setError('Enter your email first — we’ll send a sign-in code.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendCode(email.trim());
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (strategy: 'oauth_google' | 'oauth_apple') => {
    if (!signIn) return;
    setError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sign-in/sso-callback',
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
            {step === 'credentials' ? (
              <>
                <h1>Welcome back.</h1>
                <p className="login-sub">Your crew kept working while you were away.</p>
                {error && <div className="login-error">{error}</div>}
                <form onSubmit={(e) => void submitCredentials(e)} noValidate>
                  <div className="login-field">
                    <label className="login-label" htmlFor="email">Email</label>
                    <input
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
                      className="login-input"
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="login-row">
                    <label className="login-check">
                      <input type="checkbox" defaultChecked /> Keep me signed in
                    </label>
                    <button type="button" className="login-forgot" onClick={() => void emailCodeInstead()}>
                      Email me a code instead
                    </button>
                  </div>
                  <button className="btn btn-primary btn-lg login-submit" type="submit" disabled={busy || !isLoaded}>
                    {busy ? <Dots /> : 'Log in'}
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

                {/* Clerk Smart CAPTCHA mount — used when Google/Apple sign-in creates a new account */}
                <div id="clerk-captcha" style={{ marginTop: 12 }} />

                <p className="login-foot">
                  New to Flowstarter? <a href="/#top">Try it free</a> — no account needed.
                </p>
              </>
            ) : (
              <>
                <h1>Check your email.</h1>
                <p className="login-sub">
                  We sent a sign-in code to <strong>{email}</strong>.
                </p>
                {error && <div className="login-error">{error}</div>}
                <form onSubmit={(e) => void submitCode(e)} noValidate>
                  <div className="login-field">
                    <label className="login-label" htmlFor="code">Code</label>
                    <input
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
                    {busy ? <Dots /> : 'Continue'}
                  </button>
                </form>
                <p className="login-foot">
                  <button type="button" className="login-forgot" onClick={() => setStep('credentials')}>
                    ← Use password instead
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
          <div className="eyebrow">While you were away</div>
          <h2>Your crew never stopped.</h2>
          <p>Log back in to see what the agents shipped, approve what’s waiting, and direct what’s next.</p>
          <div className="brand-feed">
            <div className="brand-line">
              <span className="brand-line-avatar" style={{ color: '#2FB87A' }}>D</span>
              <span className="brand-line-body">
                <strong>Dash</strong> keeps your site healthy — SSL, forms and uptime, fixed before anyone notices.
              </span>
            </div>
            <div className="brand-line">
              <span className="brand-line-avatar" style={{ color: '#E89B2F' }}>Q</span>
              <span className="brand-line-body">
                <strong>Quinn</strong> drafts the copy changes you ask for in plain language — waiting for your review.
              </span>
            </div>
            <div className="brand-line">
              <span className="brand-line-avatar" style={{ color: '#3E86E8' }}>V</span>
              <span className="brand-line-body">
                <strong>Vera</strong> watches demand around your business and flags what’s worth acting on.
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
  // OAuth return leg lands inside this catch-all route.
  if (pathname?.includes('sso-callback')) {
    return <AuthenticateWithRedirectCallback />;
  }
  return <LoginInner />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Router />
    </Suspense>
  );
}
