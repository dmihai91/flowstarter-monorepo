import { FormTagsInput } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';
import type { ProjectConfig } from '@/types/project-config';
import type { FormikProps } from 'formik';
import { useMemo } from 'react';

interface FormValues {
  businessGoals: string;
}

interface BusinessGoalsFieldProps {
  formik: FormikProps<FormValues>;
  projectConfig: ProjectConfig;
  onProjectConfigChange: (config: ProjectConfig) => void;
  goalOptions: string[];
  templateId: string;
}

export function BusinessGoalsField({
  formik,
  projectConfig,
  onProjectConfigChange,
  goalOptions,
}: BusinessGoalsFieldProps) {
  const { t } = useI18n();

  // Keep in sync with TagsInput splitting: semicolons or newlines (handled inside component)

  // Basic sanitizer to avoid placeholder-like goals and noisy phrasing
  const placeholderPattern =
    /(\bX{2,}\b|\bN\/A\b|\bTBD\b|(^|\s)0{3,}(?=\s|$))/i;
  const shortenGoal = (text: string): string => {
    let s = text.trim();
    // Drop trailing method/qualification clauses to keep it concise
    s = s.replace(/\s+(by|using|through|via)\b.*$/i, '');
    // If still long, stop at first ' within XYZ ' boundary
    const withinIdx = s.toLowerCase().indexOf(' within ');
    if (withinIdx > -1 && s.length > 90) s = s.slice(0, withinIdx + 15).trim();
    // Hard cap length
    const MAX = 90;
    if (s.length > MAX)
      s = s
        .slice(0, MAX)
        .replace(/[,;:]?\s+\S*$/, '')
        .trim();
    return s;
  };
  const compactLargeNumbers = (text: string): string => {
    // Matches optional $ then large numbers with or without commas (e.g., 50000, 50,000, 2500000)
    const numberRegex = /(\$)?(\d{1,3}(?:,\d{3})+|\d{4,})(?:\.(\d+))?/g;
    return text.replace(
      numberRegex,
      (_m, currency: string, intPart: string, dec: string | undefined) => {
        const raw = intPart.replace(/,/g, '');
        const val = parseFloat(raw + (dec ? `.${dec}` : ''));
        if (!isFinite(val)) return _m as string;
        const abs = Math.abs(val);
        let out: string;
        if (abs >= 1_000_000_000) {
          const v = val / 1_000_000_000;
          out = `${parseFloat(v.toFixed(v % 1 === 0 ? 0 : 1))}B`;
        } else if (abs >= 1_000_000) {
          const v = val / 1_000_000;
          out = `${parseFloat(v.toFixed(v % 1 === 0 ? 0 : 1))}M`;
        } else if (abs >= 1_000) {
          const v = val / 1_000;
          out = `${parseFloat(v.toFixed(v % 1 === 0 ? 0 : 1))}k`;
        } else {
          return (currency || '') + intPart + (dec ? `.${dec}` : '');
        }
        return (currency || '') + out;
      }
    );
  };
  const normalizeGoal = (input: string): string => {
    let g = (input || '').trim();
    if (!g || placeholderPattern.test(g)) return '';
    g = g.replace(/\s+on the [a-z\s]+ platform/gi, '');
    g = compactLargeNumbers(g);
    g = g.replace(/\s+/g, ' ').trim();
    g = shortenGoal(g);
    return g;
  };

  const industry = (
    projectConfig.designConfig?.businessInfo?.industry || ''
  ).toLowerCase();
  const smartPresetSuggestions = useMemo(() => {
    const base: string[] = [
      t('goals.preset.mau', { count: '50k', months: '12' }),
      t('goals.preset.mrr', { amount: '$25k', months: '12' }),
      t('goals.preset.convRate', { percent: '5', months: '6' }),
      t('goals.preset.churn', { percent: '3', months: '9' }),
      t('goals.preset.nps', { score: '50', months: '6' }),
      t('goals.preset.payingCustomers', { count: '1,000', months: '12' }),
      t('goals.preset.content', { count: '100', months: '6' }),
      t('goals.preset.b2bDeals', { count: '50', months: '12' }),
    ];

    const tailored: string[] = [];
    if (industry.includes('saas')) {
      tailored.push(t('goals.preset.trials', { count: '2k', months: '6' }));
      tailored.push(
        t('goals.preset.trialToPaid', { percent: '20', months: '6' })
      );
    }
    if (industry.includes('ecommerce') || industry.includes('retail')) {
      tailored.push(t('goals.preset.gmv', { amount: '$100k', months: '12' }));
      tailored.push(
        t('goals.preset.repeatPurchase', { percent: '25', months: '9' })
      );
      tailored.push(
        t('goals.preset.cartAbandonment', { percent: '60', months: '6' })
      );
      tailored.push(
        t('goals.preset.emailList', { count: '25,000', months: '12' })
      );
    }
    if (industry.includes('services')) {
      tailored.push(
        t('goals.preset.appointments', { count: '300', months: '9' })
      );
      tailored.push(
        t('goals.preset.reviews', { rating: '4.8', count: '300', months: '12' })
      );
      tailored.push(t('goals.preset.leads', { count: '120', months: '6' }));
      tailored.push(
        t('goals.preset.monthlyRevenue', { amount: '$40,000', months: '12' })
      );
    }

    return [...tailored, ...base];
  }, [industry, t]);

  const combinedSuggestions = useMemo(() => {
    // Merge, normalize, dedupe; TagsInput will filter by typed query
    const merged = [...(goalOptions || []), ...smartPresetSuggestions]
      .map((s) => normalizeGoal(s))
      .filter(Boolean);
    return Array.from(new Set(merged));
  }, [goalOptions, smartPresetSuggestions]);

  return (
    <div className="mt-[20px] space-y-[8px]">
      <div className="flex items-center justify-between">
        <Label
          htmlFor="businessGoals"
          className="text-md font-medium leading-normal text-gray-900 dark:text-white"
        >
          {t('basic.goals.label')}{' '}
          <span className="text-base font-normal leading-normal text-gray-500 dark:text-[#bfbfc8] ml-2">
            {t('basic.goals.hint')}
          </span>
        </Label>
      </div>
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <FormTagsInput
            id="businessGoals"
            aria-required="true"
            value={formik.values.businessGoals}
            enableCommaSeparator
            onChange={(val) => {
              // enforce <= 5 words per tag and normalize semicolon/newline separators
              const normalized = (val || '')
                .split(/(?:;\s*|\n+)/)
                .map((t) => t.trim())
                .filter(Boolean)
                .map((t) => t.split(/\s+/).slice(0, 5).join(' '))
                .join('\n');
              formik.setFieldValue('businessGoals', normalized);
              onProjectConfigChange({
                ...projectConfig,
                businessGoals: normalized,
              });
            }}
            onBlur={() => {
              formik.setFieldTouched('businessGoals', true);
            }}
            placeholder={t('basic.goals.placeholder')}
            suggestions={combinedSuggestions}
            minCharsForSuggestions={1}
            error={
              typeof formik.errors.businessGoals === 'string'
                ? formik.errors.businessGoals
                : null
            }
            showError={Boolean(formik.touched.businessGoals)}
          />
        </div>
      </div>
    </div>
  );
}
