'use client';

import { useState, useCallback } from 'react';
import { useApiMutation } from './useApiMutation';

/**
 * Hook for waitlist signup.
 * Single responsibility: email submission to waitlist.
 */
export function useWaitlist(onSuccess?: () => void) {
  const [email, setEmail] = useState('');

  const { mutate, isPending, error, data } = useApiMutation<{ email: string }>(
    '/api/waitlist',
    'POST',
    { onSuccess: () => { setEmail(''); onSuccess?.(); } }
  );

  const submit = useCallback(async () => {
    if (!email.trim()) return null;
    return mutate({ email: email.trim() });
  }, [mutate, email]);

  return { email, setEmail, submit, isPending, error, isSuccess: !!data };
}
