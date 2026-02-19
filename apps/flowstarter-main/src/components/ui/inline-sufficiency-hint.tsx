import { useTranslations } from '@/lib/i18n';

interface SufficiencyData {
  isSufficient: boolean;
  missingInfo?: string[];
  followUpQuestions?: string[];
}

interface InlineSufficiencyHintProps {
  result: SufficiencyData | null;
}

export function InlineSufficiencyHint({ result }: InlineSufficiencyHintProps) {
  const { t } = useTranslations();

  if (!result || result.isSufficient) return null;

  const items = Array.isArray(result.missingInfo)
    ? result.missingInfo.slice(0, 3)
    : [];

  return (
    <div className="mt-2 rounded-xl border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-4">
      <div className="text-sm text-amber-800 dark:text-amber-200">
        <div className="font-semibold mb-1">
          {t('ai.moreDetailNeededDescription')}
        </div>
        {items.length > 0 && (
          <ul className="list-disc pl-5 space-y-1">
            {items.map((m, i) => (
              <li
                key={i}
                className="text-amber-700 dark:text-amber-300 text-xs"
              >
                {m}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default InlineSufficiencyHint;
