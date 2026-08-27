import { useState } from 'react';

import type { DiscoveryData } from '../discovery.logic';
import { Field, fieldInputClass } from '../Field';

const INDUSTRIES = [
  'Coaching',
  'Consulting',
  'Therapy & wellness',
  'Photography',
  'Creative & design',
  'Fashion & style',
  'Fitness & training',
  'Beauty & salon',
  'Hospitality & food',
  'Retail & products',
  'Online store / ecommerce',
  'Professional services',
] as const;

const OTHER = '__other__';

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
  const isPreset = (INDUSTRIES as readonly string[]).includes(data.industry);
  const [otherMode, setOtherMode] = useState(data.industry !== '' && !isPreset);
  const selectValue = otherMode ? OTHER : isPreset ? data.industry : '';

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

      <Field label={t('landing.discovery.fields.industry')}>
        <select
          value={selectValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v === OTHER) {
              setOtherMode(true);
              update('industry', '');
            } else {
              setOtherMode(false);
              update('industry', v);
            }
          }}
          className={fieldInputClass}
        >
          <option value="">
            {t('landing.discovery.placeholders.industry')}
          </option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
          <option value={OTHER}>{t('landing.discovery.industryOther')}</option>
        </select>
        {otherMode && (
          <input
            type="text"
            value={data.industry}
            onChange={(e) => update('industry', e.target.value)}
            placeholder={t('landing.discovery.placeholders.industryOther')}
            className={`${fieldInputClass} mt-2`}
            autoFocus
          />
        )}
      </Field>

      <Field label={t('landing.discovery.fields.targetAudience')}>
        <textarea
          rows={3}
          value={data.targetAudience}
          onChange={(e) => update('targetAudience', e.target.value)}
          placeholder={t('landing.discovery.placeholders.targetAudience')}
          className={fieldInputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t('landing.discovery.fields.instagramUrl')}
          hint={t('landing.discovery.hints.socialProfiles')}
        >
          <input
            type="url"
            value={data.instagramUrl}
            onChange={(e) => update('instagramUrl', e.target.value)}
            placeholder="https://instagram.com/yourbusiness"
            className={fieldInputClass}
            autoComplete="url"
          />
        </Field>
        <Field label={t('landing.discovery.fields.linkedinUrl')}>
          <input
            type="url"
            value={data.linkedinUrl}
            onChange={(e) => update('linkedinUrl', e.target.value)}
            placeholder="https://linkedin.com/company/yourbusiness"
            className={fieldInputClass}
            autoComplete="url"
          />
        </Field>
      </div>
    </div>
  );
}
