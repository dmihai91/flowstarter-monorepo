import type {
  CatalogSize,
  CommerceMode,
  DiscoveryData,
} from '../discovery.logic';
import { ChoiceGrid, Field, fieldInputClass } from '../Field';

export function CommerceStep({
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
  const commerceOptions: ReadonlyArray<{
    v: CommerceMode;
    label: string;
    sub: string;
  }> = [
    {
      v: 'none',
      label: t('landing.discovery.options.commerce.none.label'),
      sub: t('landing.discovery.options.commerce.none.sub'),
    },
    {
      v: 'few-services',
      label: t('landing.discovery.options.commerce.few-services.label'),
      sub: t('landing.discovery.options.commerce.few-services.sub'),
    },
    {
      v: 'digital',
      label: t('landing.discovery.options.commerce.digital.label'),
      sub: t('landing.discovery.options.commerce.digital.sub'),
    },
    {
      v: 'physical',
      label: t('landing.discovery.options.commerce.physical.label'),
      sub: t('landing.discovery.options.commerce.physical.sub'),
    },
    {
      v: 'mixed',
      label: t('landing.discovery.options.commerce.mixed.label'),
      sub: t('landing.discovery.options.commerce.mixed.sub'),
    },
  ];

  const catalogOptions: ReadonlyArray<{ v: CatalogSize; label: string }> = [
    { v: '1-5', label: t('landing.discovery.options.catalog.1-5') },
    { v: '6-25', label: t('landing.discovery.options.catalog.6-25') },
    { v: '26-100', label: t('landing.discovery.options.catalog.26-100') },
    { v: '100+', label: t('landing.discovery.options.catalog.100+') },
  ];

  const showsCatalog =
    data.commerceMode === 'digital' ||
    data.commerceMode === 'physical' ||
    data.commerceMode === 'mixed';

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h3 className="text-lg font-bold text-[var(--fs-ink)]">
          {t('landing.discovery.steps.commerce.title')}
        </h3>
        <p className="text-sm text-[var(--fs-ink-faint)]">
          {t('landing.discovery.steps.commerce.subtitle')}
        </p>
      </header>

      <Field label={t('landing.discovery.fields.commerceMode')} required>
        <ChoiceGrid
          value={data.commerceMode}
          onChange={(v) => {
            update('commerceMode', v);
            // Reset catalog if no commerce
            if (v === 'none' || v === 'few-services') {
              update('catalogSize', 'na');
            } else if (data.catalogSize === 'na') {
              update('catalogSize', '1-5');
            }
          }}
          options={commerceOptions}
          columns={2}
        />
      </Field>

      {showsCatalog && (
        <Field label={t('landing.discovery.fields.catalogSize')}>
          <ChoiceGrid
            value={data.catalogSize === 'na' ? '' : data.catalogSize}
            onChange={(v) => update('catalogSize', v)}
            options={catalogOptions}
            columns={4}
          />
        </Field>
      )}

      <Field
        label={t('landing.discovery.fields.customIntegrations')}
        hint={t('landing.discovery.hints.customIntegrations')}
      >
        <textarea
          rows={3}
          value={data.customIntegrations}
          onChange={(e) => update('customIntegrations', e.target.value)}
          placeholder={t('landing.discovery.placeholders.customIntegrations')}
          className={fieldInputClass}
        />
      </Field>
    </div>
  );
}
