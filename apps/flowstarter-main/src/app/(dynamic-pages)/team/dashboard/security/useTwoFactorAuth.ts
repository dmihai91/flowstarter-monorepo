'use client';

import { useCallback, useReducer } from 'react';
// Use a structural type to avoid version mismatches between @clerk/shared packages
interface ClerkUserLike {
  twoFactorEnabled: boolean;
  primaryEmailAddress?: { emailAddress: string } | null;
  publicMetadata: Record<string, unknown>;
  createTOTP: () => Promise<{ uri?: string; secret?: string }>;
  verifyTOTP: (params: { code: string }) => Promise<unknown>;
  disableTOTP: () => Promise<unknown>;
}

// ── State ────────────────────────────────────────────────────────────────────

interface TwoFactorState {
  totpEnabled: boolean;
  // Setup
  isSettingUp: boolean;
  qrCodeUrl: string | null;
  secret: string | null;
  verificationCode: string;
  isVerifying: boolean;
  copied: boolean;
  // Disable
  showDisableConfirm: boolean;
  disableCode: string;
  isDisabling: boolean;
  // Reverification
  needsReverification: boolean;
  reverifyPassword: string;
  reverifyError: string | null;
  reverifyLoading: boolean;
  // Shared
  error: string | null;
}

const initialState: TwoFactorState = {
  totpEnabled: false,
  isSettingUp: false,
  qrCodeUrl: null,
  secret: null,
  verificationCode: '',
  isVerifying: false,
  copied: false,
  showDisableConfirm: false,
  disableCode: '',
  isDisabling: false,
  needsReverification: false,
  reverifyPassword: '',
  reverifyError: null,
  reverifyLoading: false,
  error: null,
};

// ── Actions ──────────────────────────────────────────────────────────────────

type TwoFactorAction =
  | { type: 'SET_TOTP_STATUS'; enabled: boolean }
  | { type: 'START_SETUP' }
  | { type: 'SETUP_QR_READY'; qrCodeUrl: string; secret: string }
  | { type: 'SETUP_NEEDS_REVERIFY' }
  | { type: 'SETUP_ERROR'; error: string }
  | { type: 'CANCEL_SETUP' }
  | { type: 'SET_VERIFICATION_CODE'; code: string }
  | { type: 'VERIFY_START' }
  | { type: 'VERIFY_SUCCESS' }
  | { type: 'VERIFY_ERROR'; error: string }
  | { type: 'COPY_SECRET' }
  | { type: 'COPY_RESET' }
  | { type: 'SHOW_DISABLE_CONFIRM' }
  | { type: 'CANCEL_DISABLE' }
  | { type: 'SET_DISABLE_CODE'; code: string }
  | { type: 'DISABLE_START' }
  | { type: 'DISABLE_SUCCESS' }
  | { type: 'DISABLE_ERROR'; error: string }
  | { type: 'SET_REVERIFY_PASSWORD'; password: string }
  | { type: 'REVERIFY_START' }
  | { type: 'REVERIFY_SUCCESS' }
  | { type: 'REVERIFY_ERROR'; error: string }
  | { type: 'CANCEL_REVERIFY' };

function reducer(
  state: TwoFactorState,
  action: TwoFactorAction
): TwoFactorState {
  switch (action.type) {
    case 'SET_TOTP_STATUS':
      return { ...state, totpEnabled: action.enabled };
    case 'START_SETUP':
      return { ...state, isSettingUp: true, error: null };
    case 'SETUP_QR_READY':
      return { ...state, qrCodeUrl: action.qrCodeUrl, secret: action.secret };
    case 'SETUP_NEEDS_REVERIFY':
      return { ...state, needsReverification: true, isSettingUp: false };
    case 'SETUP_ERROR':
      return { ...state, error: action.error, isSettingUp: false };
    case 'CANCEL_SETUP':
      return {
        ...state,
        isSettingUp: false,
        qrCodeUrl: null,
        secret: null,
        verificationCode: '',
        error: null,
      };
    case 'SET_VERIFICATION_CODE':
      return { ...state, verificationCode: action.code };
    case 'VERIFY_START':
      return { ...state, isVerifying: true, error: null };
    case 'VERIFY_SUCCESS':
      return {
        ...state,
        totpEnabled: true,
        isVerifying: false,
        isSettingUp: false,
        qrCodeUrl: null,
        secret: null,
        verificationCode: '',
      };
    case 'VERIFY_ERROR':
      return { ...state, isVerifying: false, error: action.error };
    case 'COPY_SECRET':
      return { ...state, copied: true };
    case 'COPY_RESET':
      return { ...state, copied: false };
    case 'SHOW_DISABLE_CONFIRM':
      return { ...state, showDisableConfirm: true };
    case 'CANCEL_DISABLE':
      return {
        ...state,
        showDisableConfirm: false,
        disableCode: '',
        error: null,
      };
    case 'SET_DISABLE_CODE':
      return { ...state, disableCode: action.code };
    case 'DISABLE_START':
      return { ...state, isDisabling: true, error: null };
    case 'DISABLE_SUCCESS':
      return {
        ...state,
        totpEnabled: false,
        isDisabling: false,
        showDisableConfirm: false,
        disableCode: '',
      };
    case 'DISABLE_ERROR':
      return { ...state, isDisabling: false, error: action.error };
    case 'SET_REVERIFY_PASSWORD':
      return { ...state, reverifyPassword: action.password };
    case 'REVERIFY_START':
      return { ...state, reverifyLoading: true, reverifyError: null };
    case 'REVERIFY_SUCCESS':
      return {
        ...state,
        needsReverification: false,
        reverifyPassword: '',
        reverifyLoading: false,
      };
    case 'REVERIFY_ERROR':
      return { ...state, reverifyLoading: false, reverifyError: action.error };
    case 'CANCEL_REVERIFY':
      return { ...state, needsReverification: false };
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseTwoFactorAuthOptions {
  user: ClerkUserLike | null | undefined;
  signIn:
    | { create: (params: Record<string, string>) => Promise<unknown> }
    | undefined;
}

export function useTwoFactorAuth({ user, signIn }: UseTwoFactorAuthOptions) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const checkTotpStatus = useCallback(() => {
    if (user)
      dispatch({ type: 'SET_TOTP_STATUS', enabled: user.twoFactorEnabled });
  }, [user]);

  const startSetup = useCallback(async () => {
    if (!user) return;
    dispatch({ type: 'START_SETUP' });
    try {
      const totp = await user.createTOTP();
      dispatch({
        type: 'SETUP_QR_READY',
        qrCodeUrl: totp.uri ?? '',
        secret: totp.secret ?? '',
      });
    } catch (error: unknown) {
      const clerkError = error as {
        errors?: Array<{ code?: string; message?: string }>;
      };
      const code = clerkError?.errors?.[0]?.code ?? '';
      const msg = String(clerkError?.errors?.[0]?.message ?? error);
      if (
        code === 'session_step_up_required' ||
        code === 'requires_recent_sign_in' ||
        msg.includes('additional verification')
      ) {
        dispatch({ type: 'SETUP_NEEDS_REVERIFY' });
      } else if (
        msg.includes('not enabled') ||
        code === 'feature_not_enabled_for_environment'
      ) {
        dispatch({
          type: 'SETUP_ERROR',
          error:
            'Two-factor authentication is not enabled for this account. Contact your administrator.',
        });
      } else {
        console.error('Error starting TOTP setup:', error);
        dispatch({
          type: 'SETUP_ERROR',
          error: 'Failed to start authenticator setup. Please try again.',
        });
      }
    }
  }, [user]);

  const handleReverify = useCallback(async () => {
    if (!signIn || !user) return;
    dispatch({ type: 'REVERIFY_START' });
    try {
      await signIn.create({
        strategy: 'password',
        password: state.reverifyPassword,
        identifier: user.primaryEmailAddress?.emailAddress ?? '',
      });
      dispatch({ type: 'REVERIFY_SUCCESS' });
      await startSetup();
    } catch {
      dispatch({
        type: 'REVERIFY_ERROR',
        error: 'Incorrect password. Please try again.',
      });
    }
  }, [signIn, user, state.reverifyPassword, startSetup]);

  const verifyAndEnable = useCallback(async () => {
    if (!user || !state.verificationCode) return;
    dispatch({ type: 'VERIFY_START' });
    try {
      await user.verifyTOTP({ code: state.verificationCode });
      dispatch({ type: 'VERIFY_SUCCESS' });
    } catch (error) {
      console.error('Error verifying TOTP:', error);
      dispatch({
        type: 'VERIFY_ERROR',
        error: 'Invalid code. Please check and try again.',
      });
    }
  }, [user, state.verificationCode]);

  const disable = useCallback(async () => {
    if (!user || !state.disableCode) return;
    dispatch({ type: 'DISABLE_START' });
    try {
      await user.disableTOTP();
      dispatch({ type: 'DISABLE_SUCCESS' });
    } catch (error) {
      console.error('Error disabling TOTP:', error);
      dispatch({
        type: 'DISABLE_ERROR',
        error: 'Invalid code. Please try again.',
      });
    }
  }, [user, state.disableCode]);

  const copySecret = useCallback(() => {
    if (state.secret) {
      navigator.clipboard.writeText(state.secret);
      dispatch({ type: 'COPY_SECRET' });
      setTimeout(() => dispatch({ type: 'COPY_RESET' }), 2000);
    }
  }, [state.secret]);

  return {
    state,
    dispatch,
    checkTotpStatus,
    startSetup,
    handleReverify,
    verifyAndEnable,
    disable,
    copySecret,
    cancelSetup: () => dispatch({ type: 'CANCEL_SETUP' }),
    showDisableConfirm: () => dispatch({ type: 'SHOW_DISABLE_CONFIRM' }),
    cancelDisable: () => dispatch({ type: 'CANCEL_DISABLE' }),
    cancelReverify: () => dispatch({ type: 'CANCEL_REVERIFY' }),
  };
}
