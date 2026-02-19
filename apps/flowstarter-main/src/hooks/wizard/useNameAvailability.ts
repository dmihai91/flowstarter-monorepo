import { NameValidator } from '@/lib/utils';
import { useWizardStore } from '@/store/wizard-store';
import { useEffect, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';

export interface ProjectNameAvailability {
  isAvailable: boolean;
  isChecking: boolean;
  suggestedDomain: string | null;
  suggestions: string[];
  error?: string;
}

export function useNameAvailability(name: string, canCheck: boolean) {
  const [state, setState] = useState<ProjectNameAvailability>({
    isAvailable: true,
    isChecking: false,
    suggestedDomain: null,
    suggestions: [],
  });
  const [debounced] = useDebounceValue((name || '').trim(), 600);

  useEffect(() => {
    if (!canCheck) {
      setState((s) => ({ ...s, isChecking: false }));
      const setHostedAvailability =
        useWizardStore.getState().setHostedAvailability;
      const current = useWizardStore.getState().hostedAvailability;
      setHostedAvailability({
        ...current,
        checking: false,
      });
      return;
    }
    const setHostedAvailability =
      useWizardStore.getState().setHostedAvailability;
    const current = useWizardStore.getState().hostedAvailability;
    const normalized = NameValidator.normalize(debounced);
    const result = NameValidator.isValid(normalized);

    // Mirror local name rules: require min length and valid format before checking
    if (!normalized || normalized.length < 3 || !result.valid) {
      setState((s) => ({ ...s, isChecking: false }));
      setHostedAvailability({
        ...current,
        checking: false,
        lastCheckedName: normalized,
      });
      return;
    }
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, isChecking: true }));
      setHostedAvailability({
        ...current,
        checking: true,
        lastCheckedName: normalized,
      });
      try {
        const res = await fetch('/api/projects/check-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectName: normalized }),
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (cancelled) return;
        const local = {
          isAvailable: data.isAvailable,
          isChecking: false,
          suggestedDomain: data.suggestedDomain,
          suggestions: data.suggestions || [],
          error: data.isAvailable
            ? undefined
            : 'This project name is already taken',
        } as ProjectNameAvailability;
        setState(local);
        setHostedAvailability({
          suggestedDomain: local.suggestedDomain,
          isAvailable: local.isAvailable,
          checking: false,
          lastCheckedName: normalized,
          error: local.error,
        });
      } catch {
        if (cancelled) return;
        setState({
          isAvailable: true,
          isChecking: false,
          suggestedDomain: null,
          suggestions: [],
          error: 'Could not verify name availability (connection error)',
        });
        setHostedAvailability({
          suggestedDomain: null,
          isAvailable: null,
          checking: false,
          lastCheckedName: normalized,
          error: 'Could not verify name availability (connection error)',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced, canCheck]);

  return state;
}
