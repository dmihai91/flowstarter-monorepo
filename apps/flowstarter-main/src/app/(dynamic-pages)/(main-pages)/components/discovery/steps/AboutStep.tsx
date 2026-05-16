import type { DiscoveryData } from '../discovery.logic';
import { Field, fieldInputClass } from '../Field';

export function AboutStep({
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
          {t('landing.discovery.steps.about.title')}
        </h3>
        <p className="text-sm text-[var(--fs-ink-faint)]">
          {t('landing.discovery.steps.about.subtitle')}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('landing.discovery.fields.fullName')} required>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            placeholder={t('landing.discovery.placeholders.fullName')}
            autoComplete="name"
            className={fieldInputClass}
          />
        </Field>
        <Field label={t('landing.discovery.fields.email')} required>
          <input
            type="email"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder={t('landing.discovery.placeholders.email')}
            autoComplete="email"
            className={fieldInputClass}
          />
        </Field>
      </div>

      <Field
        label={t('landing.discovery.fields.businessName')}
        hint={t('landing.discovery.hints.businessName')}
      >
        <input
          type="text"
          value={data.businessName}
          onChange={(e) => update('businessName', e.target.value)}
          placeholder={t('landing.discovery.placeholders.businessName')}
          autoComplete="organization"
          className={fieldInputClass}
        />
      </Field>
    </div>
  );
}
