/**
 * Editor adapter for the shared `<LoginForm/>` from
 * @flowstarter/flow-design-system.
 *
 * Injects the editor's environment into the SDK-agnostic shared
 * component:
 *   - `useSignIn` from `@clerk/clerk-react` (the editor's SDK)
 *   - a static English string map (the editor has no i18n runtime)
 *   - `getSearchParam` from the current URL
 *   - no `onTransferToken` — the editor has no /api/auth/transfer-token
 *     endpoint, so cross-domain redirects fall back to a plain
 *     window.location navigation inside the shared component.
 *
 * The strings below are copied verbatim from
 * apps/flowstarter-main/src/locales/en.ts for the keys the shared
 * LoginForm + forgot-password + MFA flows reference. Keep in sync if
 * the marketing copy changes.
 */

import { useSignIn } from "@clerk/clerk-react";
import {
  LoginForm,
  type SharedSignInResource,
  type SharedSetActive,
} from "@flowstarter/flow-design-system";

const STRINGS: Record<string, string> = {
  "auth.email": "Email address",
  "auth.email.placeholder": "e.g johnatan@doe.com",
  "auth.password": "Password",
  "auth.password.placeholder": "Enter your password",
  "auth.signIn": "Sign in",
  "auth.signIn.signingIn": "Signing in...",
  "auth.forgotPassword": "Forgot password?",
  "auth.errors.signInInvalid":
    "Incorrect email or password. Try again, or reset your password",
  "auth.errors.somethingWentWrong": "Something went wrong",
  "auth.forgotPassword.title": "Reset your password",
  "auth.forgotPassword.description":
    "Enter your email address and we will send you a password reset code",
  "auth.forgotPassword.enterCode": "Enter reset code",
  "auth.forgotPassword.newPassword": "New password",
  "auth.forgotPassword.confirmPassword": "Confirm password",
  "auth.forgotPassword.sendCode": "Send reset code",
  "auth.forgotPassword.sendingCode": "Sending code...",
  "auth.forgotPassword.resetPassword": "Reset password",
  "auth.forgotPassword.resettingPassword": "Resetting...",
  "auth.forgotPassword.resendCode": "Resend code",
  "auth.forgotPassword.backToSignIn": "Back to sign in",
  "auth.forgotPassword.invalidCode": "Invalid or expired reset code",
  "auth.forgotPassword.passwordsDoNotMatch": "Passwords do not match",
  "auth.mfa.title": "Two-factor authentication",
  "auth.mfa.totpHint":
    "Enter the 6-digit code from your authenticator app",
  "auth.mfa.backupHint": "Enter one of your backup codes",
  "auth.mfa.codeLabel": "Verification code",
  "auth.mfa.codePlaceholder.totp": "123456",
  "auth.mfa.codePlaceholder.backup": "Backup code",
  "auth.mfa.useAuthenticatorApp": "Authenticator app",
  "auth.mfa.useBackupCode": "Backup code",
  "auth.mfa.verify": "Verify",
  "auth.mfa.verifying": "Verifying…",
  "auth.mfa.back": "Back",
  "auth.mfa.invalidCode": "Invalid code. Try again",
  "auth.mfa.unsupportedFactor":
    "This account uses a second step we can’t complete here (for example a text or email code). Use an authenticator app or backup codes in Clerk, or contact an admin",
  "team.login.emailLabel": "Email address",
  "team.login.emailPlaceholder": "you@flowstarter.net",
  "team.login.passwordLabel": "Password",
  "team.login.passwordPlaceholder": "Enter your password",
  "team.login.signIn": "Sign in",
  "team.login.signingIn": "Signing in...",
};

function t(key: string): string {
  return STRINGS[key] ?? key;
}

function getSearchParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

export function EditorLoginForm({
  variant = "client",
}: {
  /** `client` (default) or `team` — the shared LoginForm only
      changes redirect routing + labels between the two. */
  readonly variant?: "client" | "team";
}) {
  const { signIn, setActive, isLoaded } = useSignIn();

  return (
    <LoginForm
      variant={variant}
      // clerk-react's SignInResource is structurally compatible with
      // the shared SharedSignInResource (create / attemptFirstFactor /
      // attemptSecondFactor / supportedSecondFactors). Cast narrows
      // the rich Clerk type to the small surface the shared component
      // actually touches.
      signIn={
        isLoaded
          ? (signIn as unknown as SharedSignInResource)
          : undefined
      }
      setActive={
        setActive
          ? ((params) =>
              setActive(
                params as Parameters<typeof setActive>[0],
              )) as SharedSetActive
          : undefined
      }
      t={t}
      getSearchParam={getSearchParam}
    />
  );
}
