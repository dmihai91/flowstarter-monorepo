'use client';

import { useEffect, useState } from 'react';

export interface DomainAvailabilityState {
  isChecking: boolean;
  isAvailable: boolean | null;
  domain: string;
  error?: string;
}

export function useDomainAvailability(currentDomain: string) {
  const [state, setState] = useState<DomainAvailabilityState>({
    isChecking: false,
    isAvailable: null,
    domain: '',
  });

  // Reset when domain is cleared
  useEffect(() => {
    if (!currentDomain) {
      setState({ isChecking: false, isAvailable: null, domain: '' });
    }
  }, [currentDomain]);

  const checkDomainAvailability = async (domain: string) => {
    if (!domain || !domain.trim()) {
      setState({ isChecking: false, isAvailable: null, domain: '' });
      return;
    }

    setState({ isChecking: true, isAvailable: null, domain: domain.trim() });

    try {
      const response = await fetch('/api/domains/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });

      if (!response.ok) throw new Error('Failed to check domain availability');

      const result = await response.json();
      setState({
        isChecking: false,
        isAvailable: Boolean(result.isAvailable),
        domain: domain.trim(),
        error: result.error,
      });
    } catch (error) {
      setState({
        isChecking: false,
        isAvailable: true, // optimistic fallback
        domain: domain.trim(),
        error: 'Could not verify domain availability',
      });
    }
  };

  return { domainAvailability: state, checkDomainAvailability };
}
