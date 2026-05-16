import type {
  DiscoveryData,
  GoalId,
  PageCount,
  TimelineId,
  ToneId,
} from '../discovery.logic';
import { ChoiceGrid, Field } from '../Field';

export function GoalsStep({
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
  const goalOptions: ReadonlyArray<{ v: GoalId; label: string; sub: string }> =
    [
      {
        v: 'leads',
        label: t('landing.discovery.options.goal.leads.label'),
        sub: t('landing.discovery.options.goal.leads.sub'),
      },
      {
        v: 'sales',
        label: t('landing.discovery.options.goal.sales.label'),
        sub: t('landing.discovery.options.goal.sales.sub'),
      },
      {
        v: 'bookings',
        label: t('landing.discovery.options.goal.bookings.label'),
        sub: t('landing.discovery.options.goal.bookings.sub'),
      },
      {
        v: 'portfolio',
        label: t('landing.discovery.options.goal.portfolio.label'),
        sub: t('landing.discovery.options.goal.portfolio.sub'),
      },
    ];

  const toneOptions: ReadonlyArray<{ v: ToneId; label: string }> = [
    {
      v: 'professional',
      label: t('landing.discovery.options.tone.professional'),
    },
    { v: 'bold', label: t('landing.discovery.options.tone.bold') },
    { v: 'friendly', label: t('landing.discovery.options.tone.friendly') },
    { v: 'minimal', label: t('landing.discovery.options.tone.minimal') },
  ];

  const pageOptions: ReadonlyArray<{
    v: PageCount;
    label: string;
    sub?: string;
  }> = [
    {
      v: 'lt-5',
      label: t('landing.discovery.options.pages.lt-5.label'),
      sub: t('landing.discovery.options.pages.lt-5.sub'),
    },
    {
      v: '5-7',
      label: t('landing.discovery.options.pages.5-7.label'),
      sub: t('landing.discovery.options.pages.5-7.sub'),
    },
    {
      v: '8-15',
      label: t('landing.discovery.options.pages.8-15.label'),
      sub: t('landing.discovery.options.pages.8-15.sub'),
    },
    {
      v: '15+',
      label: t('landing.discovery.options.pages.15+.label'),
      sub: t('landing.discovery.options.pages.15+.sub'),
    },
  ];

  const timelineOptions: ReadonlyArray<{ v: TimelineId; label: string }> = [
    { v: 'asap', label: t('landing.discovery.options.timeline.asap') },
    { v: '4-weeks', label: t('landing.discovery.options.timeline.4-weeks') },
    {
      v: '1-3-months',
      label: t('landing.discovery.options.timeline.1-3-months'),
    },
    { v: 'flexible', label: t('landing.discovery.options.timeline.flexible') },
  ];

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h3 className="text-lg font-bold text-[var(--fs-ink)]">
          {t('landing.discovery.steps.goals.title')}
        </h3>
        <p className="text-sm text-[var(--fs-ink-faint)]">
          {t('landing.discovery.steps.goals.subtitle')}
        </p>
      </header>

      <Field label={t('landing.discovery.fields.goal')} required>
        <ChoiceGrid
          value={data.goal}
          onChange={(v) => update('goal', v)}
          options={goalOptions}
          columns={2}
        />
      </Field>

      <Field label={t('landing.discovery.fields.brandTone')}>
        <ChoiceGrid
          value={data.brandTone}
          onChange={(v) => update('brandTone', v)}
          options={toneOptions}
          columns={4}
        />
      </Field>

      <Field
        label={t('landing.discovery.fields.pageCount')}
        hint={t('landing.discovery.hints.pageCount')}
      >
        <ChoiceGrid
          value={data.pageCount}
          onChange={(v) => update('pageCount', v)}
          options={pageOptions}
          columns={4}
        />
      </Field>

      <Field label={t('landing.discovery.fields.timeline')}>
        <ChoiceGrid
          value={data.timeline}
          onChange={(v) => update('timeline', v)}
          options={timelineOptions}
          columns={4}
        />
      </Field>
    </div>
  );
}
