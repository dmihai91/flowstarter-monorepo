import { useTranslations } from '@/lib/i18n';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useIndustries() {
  const { t } = useTranslations();

  const industriesQuery = useQuery<
    { id: string; key: string }[],
    Error,
    { id: string; name: string }[]
  >({
    queryKey: ['industries'],
    queryFn: async () => {
      const response = await fetch('/api/industries');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch industries:', errorText);
        toast.error(t('app.error'), {
          description: t('app.failedToFetchIndustries'),
        });
        throw new Error('Failed to fetch industries');
      }
      const data = await response.json();
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    },
    select: (data) => {
      const translate = (key: string) =>
        (t as unknown as (k: string) => string)(key);
      const sorted = data
        .slice()
        .sort((a, b) => translate(a.key).localeCompare(translate(b.key)));

      // Push "other" to the end by key if present
      const isOther = (key: string) => key.endsWith('other');
      const others = sorted.filter((i) => isOther(i.key));
      const rest = sorted.filter((i) => !isOther(i.key));
      return [...rest, ...others].map(({ id, key }) => ({
        id,
        name: translate(key),
      }));
    },
    // Add retry logic
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    industries: industriesQuery.data ?? [],
    isLoading: industriesQuery.isLoading,
  };
}
