import type { DiscoveryData } from '../discovery.logic';
import { Field, fieldInputClass } from '../Field';

export function BusinessStep({
  data,
  update,
  t,
}: {
  data: DiscoveryData;
  update: <K extends keyof DiscoveryData>(
    key: K,
    value: DiscoveryData[K]
  ) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-lg font-bold text-[var(--fs-ink)]">
          {t('landing.discovery.steps.business.title')}
        </h3>
        <p className="text-sm text-[var(--fs-ink-faint)]">
          {t('landing.discovery.steps.business.subtitle')}
        </p>
      </header>

      <Field
        label={t('landing.discovery.fields.description')}
        required
        hint={t('landing.discovery.hints.description')}
      >
        <textarea
          rows={3}
          value={data.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder={t('landing.discovery.placeholders.description')}
          className={fieldInputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('landing.discovery.fields.industry')}>
          <input
            type="text"
            value={data.industry}
            onChange={(e) => update('industry', e.target.value)}
            placeholder={t('landing.discovery.placeholders.industry')}
            className={fieldInputClass}
          />
        </Field>
        <Field label={t('landing.discovery.fields.targetAudience')}>
          <input
            type="text"
            value={data.targetAudience}
            onChange={(e) => update('targetAudience', e.target.value)}
            placeholder={t('landing.discovery.placeholders.targetAudience')}
            className={fieldInputClass}
          />
        </Field>
      </div>
    </div>
  );
}
