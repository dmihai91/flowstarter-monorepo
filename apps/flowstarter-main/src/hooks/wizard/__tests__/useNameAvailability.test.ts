import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useNameAvailability } from '../useNameAvailability';
import { useWizardStore } from '@/store/wizard-store';
import { act } from '@testing-library/react';

// Mock fetch
global.fetch = vi.fn();

describe('useNameAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset wizard store
    const { result } = renderHook(() => useWizardStore());
    act(() => {
      result.current.reset();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should start with default state', () => {
      const { result } = renderHook(() => useNameAvailability('', false));

      expect(result.current.isAvailable).toBe(true);
      expect(result.current.isChecking).toBe(false);
      expect(result.current.suggestedDomain).toBeNull();
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('validation rules', () => {
    it('should not check availability when canCheck is false', async () => {
      const { result } = renderHook(() =>
        useNameAvailability('test-project', false)
      );

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should not check availability for empty name', async () => {
      const { result } = renderHook(() => useNameAvailability('', true));

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should not check availability for names shorter than 3 characters', async () => {
      const { result } = renderHook(() => useNameAvailability('ab', true));

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should check availability for valid names', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isAvailable: true,
          suggestedDomain: 'test-project.flowstarter.app',
          suggestions: [],
        }),
      });

      const { result } = renderHook(() =>
        useNameAvailability('test-project', true)
      );

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/projects/check-name',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  describe('debouncing', () => {
    it('should debounce name changes', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          isAvailable: true,
          suggestedDomain: 'final.flowstarter.app',
          suggestions: [],
        }),
      });

      const { result, rerender } = renderHook(
        ({ name }) => useNameAvailability(name, true),
        { initialProps: { name: 'test' } }
      );

      // Change name multiple times rapidly
      rerender({ name: 'test1' });
      rerender({ name: 'test12' });
      rerender({ name: 'test123' });

      // Wait for debounce
      await waitFor(
        () => {
          expect(result.current.isChecking).toBe(false);
        },
        { timeout: 1000 }
      );

      // Should only have made one API call after debounce
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('API responses', () => {
    it('should handle available name response', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isAvailable: true,
          suggestedDomain: 'available-name.flowstarter.app',
          suggestions: [],
        }),
      });

      const { result } = renderHook(() =>
        useNameAvailability('available-name', true)
      );

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(true);
        expect(result.current.suggestedDomain).toBe(
          'available-name.flowstarter.app'
        );
        expect(result.current.error).toBeUndefined();
      });
    });

    it('should handle unavailable name response', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isAvailable: false,
          suggestedDomain: null,
          suggestions: ['taken-name-1', 'taken-name-2'],
        }),
      });

      const { result } = renderHook(() =>
        useNameAvailability('taken-name', true)
      );

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false);
        expect(result.current.error).toBe('This project name is already taken');
        expect(result.current.suggestions).toEqual([
          'taken-name-1',
          'taken-name-2',
        ]);
      });
    });

    it('should handle API error', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() =>
        useNameAvailability('error-name', true)
      );

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
        expect(result.current.error).toBe(
          'Could not verify name availability (connection error)'
        );
        expect(result.current.isAvailable).toBe(true); // Default to available on error
      });
    });

    it('should handle non-ok response', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() =>
        useNameAvailability('server-error', true)
      );

      await waitFor(() => {
        expect(result.current.error).toBe(
          'Could not verify name availability (connection error)'
        );
        expect(result.current.isAvailable).toBe(true);
      });
    });
  });

  describe('wizard store integration', () => {
    it('should update wizard store hosted availability', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isAvailable: true,
          suggestedDomain: 'store-test.flowstarter.app',
          suggestions: [],
        }),
      });

      renderHook(() => useNameAvailability('store-test', true));
      const { result: storeResult } = renderHook(() => useWizardStore());

      await waitFor(() => {
        expect(storeResult.current.hostedAvailability.checking).toBe(false);
      });

      expect(storeResult.current.hostedAvailability.suggestedDomain).toBe(
        'store-test.flowstarter.app'
      );
      expect(storeResult.current.hostedAvailability.isAvailable).toBe(true);
      expect(storeResult.current.hostedAvailability.checking).toBe(false);
    });

    it('should update wizard store when check is disabled', async () => {
      renderHook(() => useNameAvailability('test', false));
      const { result: storeResult } = renderHook(() => useWizardStore());

      await waitFor(() => {
        expect(storeResult.current.hostedAvailability.checking).toBe(false);
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should track last checked name in store', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isAvailable: true,
          suggestedDomain: 'tracked.flowstarter.app',
          suggestions: [],
        }),
      });

      renderHook(() => useNameAvailability('tracked', true));
      const { result: storeResult } = renderHook(() => useWizardStore());

      await waitFor(() => {
        expect(storeResult.current.hostedAvailability.checking).toBe(false);
      });

      expect(storeResult.current.hostedAvailability.lastCheckedName).toBe(
        'tracked'
      );
    });
  });

  describe('name normalization', () => {
    it('should normalize and check uppercase names', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isAvailable: true,
          suggestedDomain: 'uppercase.flowstarter.app',
          suggestions: [],
        }),
      });

      const { result } = renderHook(() =>
        useNameAvailability('UPPERCASE', true)
      );

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      // Check that fetch was called (normalization happens in NameValidator)
      expect(fetch).toHaveBeenCalled();
    });

    it('should normalize names with spaces', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isAvailable: true,
          suggestedDomain: 'with-spaces.flowstarter.app',
          suggestions: [],
        }),
      });

      const { result } = renderHook(() =>
        useNameAvailability('with spaces', true)
      );

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('loading states', () => {
    it('should set isChecking while request is pending', async () => {
      let resolvePromise: ((value: unknown) => void) | undefined;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(promise);

      const { result } = renderHook(() =>
        useNameAvailability('loading-test', true)
      );

      await waitFor(() => {
        expect(result.current.isChecking).toBe(true);
      });

      // Resolve the promise
      resolvePromise?.({
        ok: true,
        json: async () => ({
          isAvailable: true,
          suggestedDomain: 'loading-test.flowstarter.app',
          suggestions: [],
        }),
      });

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });
    });

    it('should clear isChecking on error', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Test error')
      );

      const { result } = renderHook(() =>
        useNameAvailability('error-test', true)
      );

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });
    });
  });

  describe('request cancellation', () => {
    it('should handle component unmount during pending request', async () => {
      let resolvePromise: ((value: unknown) => void) | undefined;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(promise);

      const { result, unmount } = renderHook(() =>
        useNameAvailability('cancel-test', true)
      );

      await waitFor(() => {
        expect(result.current.isChecking).toBe(true);
      });

      // Unmount before resolving
      unmount();

      // Resolve after unmount - should not cause errors
      resolvePromise?.({
        ok: true,
        json: async () => ({
          isAvailable: true,
          suggestedDomain: 'cancel-test.flowstarter.app',
          suggestions: [],
        }),
      });
    });
  });

  describe('edge cases', () => {
    it('should handle malformed JSON response', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { result } = renderHook(() =>
        useNameAvailability('malformed', true)
      );

      await waitFor(() => {
        expect(result.current.error).toBe(
          'Could not verify name availability (connection error)'
        );
      });
    });

    it('should handle missing suggestions in response', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isAvailable: false,
          suggestedDomain: null,
          // suggestions is missing
        }),
      });

      const { result } = renderHook(() =>
        useNameAvailability('no-suggestions', true)
      );

      await waitFor(() => {
        expect(result.current.suggestions).toEqual([]);
      });
    });

    it('should trim whitespace from names', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isAvailable: true,
          suggestedDomain: 'trimmed.flowstarter.app',
          suggestions: [],
        }),
      });

      const { result } = renderHook(() =>
        useNameAvailability('  trimmed  ', true)
      );

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      expect(fetch).toHaveBeenCalled();
    });
  });
});
