import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTwoFactorAuth } from '../useTwoFactorAuth';

// ── Helpers ─────────────────────────────────────────────────────────────────

function createMockUser(
  overrides: Partial<ReturnType<typeof baseMockUser>> = {}
) {
  return { ...baseMockUser(), ...overrides };
}

function baseMockUser() {
  return {
    twoFactorEnabled: false,
    primaryEmailAddress: { emailAddress: 'test@example.com' },
    publicMetadata: {},
    createTOTP: vi
      .fn()
      .mockResolvedValue({ uri: 'otpauth://totp/test', secret: 'ABCD1234' }),
    verifyTOTP: vi.fn().mockResolvedValue({}),
    disableTOTP: vi.fn().mockResolvedValue({}),
  };
}

function createMockSignIn() {
  return { create: vi.fn().mockResolvedValue({}) };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('useTwoFactorAuth', () => {
  let mockUser: ReturnType<typeof createMockUser>;
  let mockSignIn: ReturnType<typeof createMockSignIn>;

  beforeEach(() => {
    mockUser = createMockUser();
    mockSignIn = createMockSignIn();
    vi.restoreAllMocks();
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  // ── Initial state ───────────────────────────────────────────────────────

  it('returns correct initial state', () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    const { state } = result.current;
    expect(state.totpEnabled).toBe(false);
    expect(state.isSettingUp).toBe(false);
    expect(state.qrCodeUrl).toBeNull();
    expect(state.secret).toBeNull();
    expect(state.verificationCode).toBe('');
    expect(state.isVerifying).toBe(false);
    expect(state.copied).toBe(false);
    expect(state.showDisableConfirm).toBe(false);
    expect(state.disableCode).toBe('');
    expect(state.isDisabling).toBe(false);
    expect(state.needsReverification).toBe(false);
    expect(state.reverifyPassword).toBe('');
    expect(state.reverifyError).toBeNull();
    expect(state.reverifyLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  // ── checkTotpStatus ─────────────────────────────────────────────────────

  it('checkTotpStatus sets totpEnabled from user.twoFactorEnabled', () => {
    mockUser.twoFactorEnabled = true;
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    act(() => result.current.checkTotpStatus());
    expect(result.current.state.totpEnabled).toBe(true);
  });

  it('checkTotpStatus does nothing when user is null', () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: null, signIn: mockSignIn })
    );
    act(() => result.current.checkTotpStatus());
    expect(result.current.state.totpEnabled).toBe(false);
  });

  // ── SET_TOTP_STATUS via dispatch ────────────────────────────────────────

  it('SET_TOTP_STATUS sets totpEnabled', () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    act(() =>
      result.current.dispatch({ type: 'SET_TOTP_STATUS', enabled: true })
    );
    expect(result.current.state.totpEnabled).toBe(true);
  });

  // ── startSetup ──────────────────────────────────────────────────────────

  it('startSetup calls user.createTOTP and stores QR data', async () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    await act(async () => {
      await result.current.startSetup();
    });
    expect(mockUser.createTOTP).toHaveBeenCalled();
    expect(result.current.state.qrCodeUrl).toBe('otpauth://totp/test');
    expect(result.current.state.secret).toBe('ABCD1234');
    expect(result.current.state.error).toBeNull();
  });

  it('startSetup sets isSettingUp then stores QR ready', async () => {
    // Use a deferred promise to check intermediate state
    let resolveTOTP!: (v: { uri: string; secret: string }) => void;
    mockUser.createTOTP = vi.fn(
      () =>
        new Promise((r) => {
          resolveTOTP = r;
        })
    );

    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );

    // Start but don't await yet
    let setupPromise: Promise<void>;
    act(() => {
      setupPromise = result.current.startSetup();
    });
    expect(result.current.state.isSettingUp).toBe(true);
    expect(result.current.state.error).toBeNull();

    // Resolve and let it finish
    await act(async () => {
      resolveTOTP({ uri: 'otpauth://totp/x', secret: 'SEC' });
      await setupPromise!;
    });
    expect(result.current.state.qrCodeUrl).toBe('otpauth://totp/x');
    expect(result.current.state.secret).toBe('SEC');
  });

  it('startSetup does nothing when user is null', async () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: null, signIn: mockSignIn })
    );
    await act(async () => {
      await result.current.startSetup();
    });
    expect(result.current.state.isSettingUp).toBe(false);
  });

  it('startSetup handles reverification error', async () => {
    mockUser.createTOTP = vi.fn().mockRejectedValue({
      errors: [{ code: 'session_step_up_required', message: '' }],
    });
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    await act(async () => {
      await result.current.startSetup();
    });
    expect(result.current.state.needsReverification).toBe(true);
    expect(result.current.state.isSettingUp).toBe(false);
  });

  it('startSetup handles feature-not-enabled error', async () => {
    mockUser.createTOTP = vi.fn().mockRejectedValue({
      errors: [
        { code: 'feature_not_enabled_for_environment', message: 'not enabled' },
      ],
    });
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    await act(async () => {
      await result.current.startSetup();
    });
    expect(result.current.state.error).toContain(
      'not enabled for this account'
    );
    expect(result.current.state.isSettingUp).toBe(false);
  });

  it('startSetup handles generic error', async () => {
    mockUser.createTOTP = vi.fn().mockRejectedValue(new Error('network fail'));
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    await act(async () => {
      await result.current.startSetup();
    });
    expect(result.current.state.error).toContain(
      'Failed to start authenticator setup'
    );
    expect(result.current.state.isSettingUp).toBe(false);
  });

  // ── CANCEL_SETUP ────────────────────────────────────────────────────────

  it('cancelSetup resets setup state', async () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    await act(async () => {
      await result.current.startSetup();
    });
    expect(result.current.state.qrCodeUrl).not.toBeNull();
    act(() => result.current.cancelSetup());
    expect(result.current.state.isSettingUp).toBe(false);
    expect(result.current.state.qrCodeUrl).toBeNull();
    expect(result.current.state.secret).toBeNull();
    expect(result.current.state.verificationCode).toBe('');
    expect(result.current.state.error).toBeNull();
  });

  // ── SET_VERIFICATION_CODE ───────────────────────────────────────────────

  it('SET_VERIFICATION_CODE updates verificationCode', () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    act(() =>
      result.current.dispatch({ type: 'SET_VERIFICATION_CODE', code: '123456' })
    );
    expect(result.current.state.verificationCode).toBe('123456');
  });

  // ── verifyAndEnable ─────────────────────────────────────────────────────

  it('verifyAndEnable calls user.verifyTOTP with the code', async () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    act(() =>
      result.current.dispatch({ type: 'SET_VERIFICATION_CODE', code: '123456' })
    );
    await act(async () => {
      await result.current.verifyAndEnable();
    });
    expect(mockUser.verifyTOTP).toHaveBeenCalledWith({ code: '123456' });
    expect(result.current.state.totpEnabled).toBe(true);
    expect(result.current.state.isVerifying).toBe(false);
    expect(result.current.state.isSettingUp).toBe(false);
    expect(result.current.state.qrCodeUrl).toBeNull();
    expect(result.current.state.secret).toBeNull();
    expect(result.current.state.verificationCode).toBe('');
  });

  it('verifyAndEnable does nothing without verification code', async () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    await act(async () => {
      await result.current.verifyAndEnable();
    });
    expect(mockUser.verifyTOTP).not.toHaveBeenCalled();
  });

  it('verifyAndEnable handles error', async () => {
    mockUser.verifyTOTP = vi.fn().mockRejectedValue(new Error('bad code'));
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    act(() =>
      result.current.dispatch({ type: 'SET_VERIFICATION_CODE', code: '000000' })
    );
    await act(async () => {
      await result.current.verifyAndEnable();
    });
    expect(result.current.state.error).toContain('Invalid code');
    expect(result.current.state.isVerifying).toBe(false);
  });

  // ── VERIFY_START / VERIFY_SUCCESS / VERIFY_ERROR via dispatch ───────────

  it('VERIFY_START sets isVerifying and clears error', () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    // Set an error first
    act(() =>
      result.current.dispatch({ type: 'VERIFY_ERROR', error: 'old error' })
    );
    expect(result.current.state.error).toBe('old error');
    act(() => result.current.dispatch({ type: 'VERIFY_START' }));
    expect(result.current.state.isVerifying).toBe(true);
    expect(result.current.state.error).toBeNull();
  });

  // ── Disable flow ────────────────────────────────────────────────────────

  it('showDisableConfirm / cancelDisable toggle state', () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    act(() => result.current.showDisableConfirm());
    expect(result.current.state.showDisableConfirm).toBe(true);
    act(() => result.current.cancelDisable());
    expect(result.current.state.showDisableConfirm).toBe(false);
    expect(result.current.state.disableCode).toBe('');
    expect(result.current.state.error).toBeNull();
  });

  it('SET_DISABLE_CODE updates disableCode', () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    act(() =>
      result.current.dispatch({ type: 'SET_DISABLE_CODE', code: '654321' })
    );
    expect(result.current.state.disableCode).toBe('654321');
  });

  it('disable calls user.disableTOTP and resets state', async () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    act(() =>
      result.current.dispatch({ type: 'SET_DISABLE_CODE', code: '654321' })
    );
    await act(async () => {
      await result.current.disable();
    });
    expect(mockUser.disableTOTP).toHaveBeenCalled();
    expect(result.current.state.totpEnabled).toBe(false);
    expect(result.current.state.isDisabling).toBe(false);
    expect(result.current.state.showDisableConfirm).toBe(false);
    expect(result.current.state.disableCode).toBe('');
  });

  it('disable does nothing without disableCode', async () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    await act(async () => {
      await result.current.disable();
    });
    expect(mockUser.disableTOTP).not.toHaveBeenCalled();
  });

  it('disable handles error', async () => {
    mockUser.disableTOTP = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    act(() =>
      result.current.dispatch({ type: 'SET_DISABLE_CODE', code: '654321' })
    );
    await act(async () => {
      await result.current.disable();
    });
    expect(result.current.state.error).toContain('Invalid code');
    expect(result.current.state.isDisabling).toBe(false);
  });

  // ── DISABLE_START / DISABLE_SUCCESS / DISABLE_ERROR via dispatch ────────

  it('DISABLE_START sets isDisabling and clears error', () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    act(() => result.current.dispatch({ type: 'DISABLE_ERROR', error: 'err' }));
    act(() => result.current.dispatch({ type: 'DISABLE_START' }));
    expect(result.current.state.isDisabling).toBe(true);
    expect(result.current.state.error).toBeNull();
  });

  // ── Reverification ──────────────────────────────────────────────────────

  it('handleReverify calls signIn.create and then startSetup on success', async () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    act(() =>
      result.current.dispatch({
        type: 'SET_REVERIFY_PASSWORD',
        password: 'mypass',
      })
    );
    await act(async () => {
      await result.current.handleReverify();
    });
    expect(mockSignIn.create).toHaveBeenCalledWith({
      strategy: 'password',
      password: 'mypass',
      identifier: 'test@example.com',
    });
    expect(result.current.state.needsReverification).toBe(false);
    expect(result.current.state.reverifyPassword).toBe('');
    expect(result.current.state.reverifyLoading).toBe(false);
    // Should have also called startSetup
    expect(mockUser.createTOTP).toHaveBeenCalled();
  });

  it('handleReverify does nothing when signIn is undefined', async () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: undefined })
    );
    act(() =>
      result.current.dispatch({
        type: 'SET_REVERIFY_PASSWORD',
        password: 'mypass',
      })
    );
    await act(async () => {
      await result.current.handleReverify();
    });
    expect(result.current.state.reverifyLoading).toBe(false);
  });

  it('handleReverify handles incorrect password', async () => {
    mockSignIn.create = vi.fn().mockRejectedValue(new Error('bad pw'));
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    act(() =>
      result.current.dispatch({
        type: 'SET_REVERIFY_PASSWORD',
        password: 'wrong',
      })
    );
    await act(async () => {
      await result.current.handleReverify();
    });
    expect(result.current.state.reverifyError).toContain('Incorrect password');
    expect(result.current.state.reverifyLoading).toBe(false);
  });

  it('REVERIFY state transitions via dispatch', () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    // REVERIFY_START
    act(() => result.current.dispatch({ type: 'REVERIFY_START' }));
    expect(result.current.state.reverifyLoading).toBe(true);
    expect(result.current.state.reverifyError).toBeNull();

    // REVERIFY_ERROR
    act(() =>
      result.current.dispatch({ type: 'REVERIFY_ERROR', error: 'wrong' })
    );
    expect(result.current.state.reverifyLoading).toBe(false);
    expect(result.current.state.reverifyError).toBe('wrong');

    // REVERIFY_SUCCESS
    act(() =>
      result.current.dispatch({ type: 'SET_REVERIFY_PASSWORD', password: 'p' })
    );
    act(() => result.current.dispatch({ type: 'REVERIFY_START' }));
    act(() => result.current.dispatch({ type: 'REVERIFY_SUCCESS' }));
    expect(result.current.state.needsReverification).toBe(false);
    expect(result.current.state.reverifyPassword).toBe('');
    expect(result.current.state.reverifyLoading).toBe(false);
  });

  it('cancelReverify resets needsReverification', () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    act(() => result.current.dispatch({ type: 'SETUP_NEEDS_REVERIFY' }));
    expect(result.current.state.needsReverification).toBe(true);
    act(() => result.current.cancelReverify());
    expect(result.current.state.needsReverification).toBe(false);
  });

  // ── copySecret ──────────────────────────────────────────────────────────

  it('copySecret writes secret to clipboard and toggles copied', async () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    // Need a secret first
    await act(async () => {
      await result.current.startSetup();
    });
    expect(result.current.state.secret).toBe('ABCD1234');

    act(() => result.current.copySecret());
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABCD1234');
    expect(result.current.state.copied).toBe(true);
  });

  it('copySecret does nothing when secret is null', () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    act(() => result.current.copySecret());
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    expect(result.current.state.copied).toBe(false);
  });

  // ── COPY_SECRET / COPY_RESET ────────────────────────────────────────────

  it('COPY_SECRET and COPY_RESET toggle copied', () => {
    const { result } = renderHook(() =>
      useTwoFactorAuth({ user: mockUser, signIn: mockSignIn })
    );
    act(() => result.current.dispatch({ type: 'COPY_SECRET' }));
    expect(result.current.state.copied).toBe(true);
    act(() => result.current.dispatch({ type: 'COPY_RESET' }));
    expect(result.current.state.copied).toBe(false);
  });
});
