import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type DiscoveryData,
  previewCtaLabel,
  previewTheme,
} from '../discovery.logic';

/**
 * "Taste of what you'd get" demo.
 *
 * On entering the step we ask /api/discovery/preview to generate real
 * first-pass copy via the same system-prompt LLM pipeline the team uses
 * (wired locally — no Docker/sandbox yet). While it generates, and if it
 * fails or is unconfigured, we fall back to a deterministic stylised mock
 * derived from the wizard answers so the prospect always sees something.
 * It is explicitly an impression, not the hand-built final site.
 */

/** Mirror of the server SiteCopy shape (server-only module can't be imported here). */
interface GeneratedCopy {
  hero: { headline: string; subhead: string; primaryCta: string };
  services: {
    sectionTitle: string;
    items: Array<{ title: string; description: string }>;
  };
  about: { sectionTitle: string; paragraph: string };
  finalCta: { headline: string; subhead: string; button: string };
}

export function PreviewStep({
  data,
  t,
}: {
  data: DiscoveryData;
  t: (key: string) => string;
}) {
  const theme = useMemo(() => previewTheme(data.brandTone), [data.brandTone]);
  const fallbackCta = previewCtaLabel(data.goal);

  const name =
    data.businessName.trim() ||
    data.fullName.trim() ||
    t('landing.discovery.preview.fallbackName');
  const industry = data.industry.trim();
  const fallbackTagline =
    data.description.trim().split(/[.!?]/)[0]?.trim() ||
    t('landing.discovery.preview.fallbackTagline');
  const audience = data.targetAudience.trim();
  const sells =
    data.commerceMode === 'physical' ||
    data.commerceMode === 'digital' ||
    data.commerceMode === 'mixed';

  const [generated, setGenerated] = useState<GeneratedCopy | null>(null);
  const [loading, setLoading] = useState(true);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/discovery/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: data.businessName,
            fullName: data.fullName,
            description: data.description,
            industry: data.industry,
            targetAudience: data.targetAudience,
            goal: data.goal,
            brandTone: data.brandTone,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          copy?: GeneratedCopy;
          skip?: boolean;
        };
        if (!cancelled && res.ok && json.copy) setGenerated(json.copy);
      } catch {
        // Fail open — deterministic mock below.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    data.businessName,
    data.fullName,
    data.description,
    data.industry,
    data.targetAudience,
    data.goal,
    data.brandTone,
  ]);

  const headline = generated?.hero.headline ?? fallbackTagline;
  const subhead = generated?.hero.subhead ?? '';
  const ctaLabel = generated?.hero.primaryCta ?? fallbackCta;
  const services = generated?.services.items?.slice(0, 3) ?? [];

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h3 className="text-lg font-bold text-[var(--fs-ink)]">
          {t('landing.discovery.steps.preview.title')}
        </h3>
        <p className="text-sm text-[var(--fs-ink-faint)]">
          {loading
            ? t('landing.discovery.preview.generating')
            : t('landing.discovery.steps.preview.subtitle')}
        </p>
      </header>

      {/* Browser frame */}
      <div
        className={[
          'overflow-hidden rounded-xl border border-[var(--fs-rule)] shadow-lg shadow-black/10 transition-opacity duration-300',
          loading ? 'opacity-60' : 'opacity-100',
        ].join(' ')}
      >
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
                {ctaLabel}
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
              className="mx-auto mt-2 max-w-[24ch] text-[19px] font-bold leading-tight"
              style={{ textWrap: 'balance' }}
            >
              {headline}
            </h4>
            {(subhead || audience) && (
              <p className="mx-auto mt-2 max-w-[34ch] text-[11px] opacity-60">
                {subhead ||
                  `${t(
                    'landing.discovery.preview.audiencePrefix'
                  )} ${audience}`}
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
              {ctaLabel}
            </span>
          </div>

          {/* Services / sections */}
          <div className="grid grid-cols-3 gap-2.5 px-6 pb-7">
            {[0, 1, 2].map((i) => {
              const svc = services[i];
              return (
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
                  {svc ? (
                    <>
                      <span className="mt-2 block text-[10px] font-semibold leading-tight">
                        {svc.title}
                      </span>
                      <span className="mt-1 block text-[9px] leading-snug opacity-60">
                        {svc.description}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="mt-2 block h-1 w-full rounded-full bg-current opacity-10" />
                      <span className="mt-1.5 block h-1 w-4/5 rounded-full bg-current opacity-10" />
                      <span className="mt-1.5 block h-1 w-3/5 rounded-full bg-current opacity-10" />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* About band — only when the generator returned real copy */}
          {generated?.about?.paragraph && (
            <div
              className="px-6 pb-7"
              style={{ borderTop: `1px solid ${theme.accentSoft}` }}
            >
              <div className="pt-6 text-center">
                <span
                  className="text-[9px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: theme.accent }}
                >
                  {generated.about.sectionTitle}
                </span>
                <p className="mx-auto mt-2 max-w-[44ch] text-[11px] leading-relaxed opacity-70">
                  {generated.about.paragraph}
                </p>
              </div>
            </div>
          )}

          {/* Final CTA band */}
          {generated?.finalCta?.headline && (
            <div
              className="px-6 py-7 text-center"
              style={{ background: theme.accentSoft }}
            >
              <p className="mx-auto max-w-[24ch] text-[14px] font-bold leading-tight">
                {generated.finalCta.headline}
              </p>
              {generated.finalCta.subhead && (
                <p className="mx-auto mt-1.5 max-w-[34ch] text-[10px] opacity-60">
                  {generated.finalCta.subhead}
                </p>
              )}
              <span
                className="mt-3 inline-block text-[11px] font-semibold"
                style={{
                  background: theme.accent,
                  color: '#fff',
                  borderRadius: theme.radius,
                  padding: '7px 16px',
                }}
              >
                {generated.finalCta.button}
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="text-[12px] leading-snug text-[var(--fs-ink-faint)]">
        {t('landing.discovery.preview.disclaimer')}
      </p>
    </div>
  );
}
