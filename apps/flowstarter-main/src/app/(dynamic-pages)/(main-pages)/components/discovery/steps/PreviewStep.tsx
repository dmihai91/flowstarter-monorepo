import { useMemo } from 'react';
import {
  type DiscoveryData,
  previewCtaLabel,
  previewTheme,
} from '../discovery.logic';

/**
 * Inline "taste of what you'd get" demo. Renders a mini one-page site mock
 * entirely client-side from the data the wizard already collected — no
 * sandbox, no backend, instant for every prospect. It is intentionally a
 * stylised impression, not the real build (the real site is hand-made on the
 * call), so it sets expectations without overpromising.
 */
export function PreviewStep({
  data,
  t,
}: {
  data: DiscoveryData;
  t: (key: string) => string;
}) {
  const theme = useMemo(() => previewTheme(data.brandTone), [data.brandTone]);
  const cta = previewCtaLabel(data.goal);

  const name =
    data.businessName.trim() ||
    data.fullName.trim() ||
    t('landing.discovery.preview.fallbackName');
  const industry = data.industry.trim();
  const tagline =
    data.description.trim().split(/[.!?]/)[0]?.trim() ||
    t('landing.discovery.preview.fallbackTagline');
  const audience = data.targetAudience.trim();

  const sells =
    data.commerceMode === 'physical' ||
    data.commerceMode === 'digital' ||
    data.commerceMode === 'mixed';

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h3 className="text-lg font-bold text-[var(--fs-ink)]">
          {t('landing.discovery.steps.preview.title')}
        </h3>
        <p className="text-sm text-[var(--fs-ink-faint)]">
          {t('landing.discovery.steps.preview.subtitle')}
        </p>
      </header>

      {/* Browser frame */}
      <div className="overflow-hidden rounded-xl border border-[var(--fs-rule)] shadow-lg shadow-black/10">
        <div className="flex items-center gap-1.5 border-b border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)] px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-3 truncate rounded bg-black/5 px-2 py-0.5 text-[11px] text-[var(--fs-ink-faint)] dark:bg-white/10">
            {name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '')
              .slice(0, 18) || 'yoursite'}
            .com
          </span>
        </div>

        {/* Mock site body */}
        <div
          style={{
            background: theme.bg,
            color: theme.ink,
            fontFamily: theme.font,
          }}
        >
          {/* Nav */}
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${theme.accentSoft}` }}
          >
            <span className="text-[13px] font-bold tracking-tight">{name}</span>
            <span className="flex items-center gap-3 text-[10px] opacity-70">
              <span>Home</span>
              {sells ? <span>Shop</span> : <span>Services</span>}
              <span>About</span>
              <span
                style={{
                  background: theme.accent,
                  color: '#fff',
                  borderRadius: theme.radius,
                  padding: '4px 9px',
                }}
              >
                {cta}
              </span>
            </span>
          </div>

          {/* Hero */}
          <div className="px-6 py-9 text-center">
            {industry && (
              <span
                className="inline-block text-[9px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: theme.accent }}
              >
                {industry}
              </span>
            )}
            <h4
              className="mx-auto mt-2 max-w-[22ch] text-[19px] font-bold leading-tight"
              style={{ textWrap: 'balance' }}
            >
              {tagline}
            </h4>
            {audience && (
              <p className="mx-auto mt-2 max-w-[30ch] text-[11px] opacity-60">
                {t('landing.discovery.preview.audiencePrefix')} {audience}
              </p>
            )}
            <span
              className="mt-4 inline-block text-[11px] font-semibold"
              style={{
                background: theme.accent,
                color: '#fff',
                borderRadius: theme.radius,
                padding: '8px 18px',
              }}
            >
              {cta}
            </span>
          </div>

          {/* Section strip */}
          <div className="grid grid-cols-3 gap-2.5 px-6 pb-7">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  background: theme.panel,
                  borderRadius: theme.radius,
                  border: `1px solid ${theme.accentSoft}`,
                }}
                className="p-3"
              >
                <span
                  className="block h-1.5 w-7 rounded-full"
                  style={{ background: theme.accent, opacity: 0.85 }}
                />
                <span className="mt-2 block h-1 w-full rounded-full bg-current opacity-10" />
                <span className="mt-1.5 block h-1 w-4/5 rounded-full bg-current opacity-10" />
                <span className="mt-1.5 block h-1 w-3/5 rounded-full bg-current opacity-10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[12px] leading-snug text-[var(--fs-ink-faint)]">
        {t('landing.discovery.preview.disclaimer')}
      </p>
    </div>
  );
}
