import { useEffect, useState } from 'react';

export function useSuggestions() {
  const [audienceOptions, setAudienceOptions] = useState<string[]>([]);
  const [goalOptions, setGoalOptions] = useState<string[]>([]);
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch('/api/suggestions');
        if (!res.ok) return;
        const data = await res.json();
        setAudienceOptions(Array.isArray(data.audience) ? data.audience : []);
        setGoalOptions(Array.isArray(data.goals) ? data.goals : []);
      } catch {
        // no-op
      }
    };
    fetchSuggestions();
  }, []);
  return { audienceOptions, goalOptions } as const;
}
