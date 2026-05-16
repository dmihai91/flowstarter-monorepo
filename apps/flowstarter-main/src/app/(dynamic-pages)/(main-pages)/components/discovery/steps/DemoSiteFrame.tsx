import { useMemo } from 'react';
import {
  type DemoSectionId,
  type DemoSite,
  previewTheme,
} from '../discovery.logic';

/**
 * Renders a DemoSite as a real multi-section page inside browser chrome.
 * Surfaces/typography come from the tone (always tasteful); the accent is
 * the editable colour. Sections honour `order` and `hidden`.
 */
export function DemoSiteFrame({ site }: { site: DemoSite }) {
  const theme = useMemo(() => previewTheme(site.tone), [site.tone]);
  const accent = site.accent || theme.accent;
  const hidden = new Set(site.hidden ?? []);
  const order = (site.order ?? []).filter((id) => !hidden.has(id));

  const domain =
    site.brandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 20) || 'yoursite';

  const Section = ({ id }: { id: DemoSectionId }) => {
    switch (id) {
      case 'hero':
        return (
          <div className="px-8 py-14 text-center">
            {site.hero.eyebrow && (
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: accent }}
              >
                {site.hero.eyebrow}
              </span>
            )}
            <h1
              className="mx-auto mt-3 max-w-[20ch] text-3xl font-bold leading-[1.1]"
              style={{ textWrap: 'balance' }}
            >
              {site.hero.headline}
            </h1>
            <p className="mx-auto mt-4 max-w-[44ch] text-sm opacity-70">
              {site.hero.subhead}
            </p>
            <span
              className="mt-6 inline-block text-[13px] font-semibold text-white"
              style={{
                background: accent,
                borderRadius: theme.radius,
                padding: '11px 26px',
              }}
            >
              {site.hero.cta}
            </span>
          </div>
        );
      case 'valueProps':
        return (
          <div
            className="grid grid-cols-3 gap-4 px-8 py-10"
            style={{ borderTop: `1px solid ${accent}1f` }}
          >
            {site.valueProps.slice(0, 3).map((v, i) => (
              <div key={i} className="text-center">
                <div
                  className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: accent }}
                >
                  {i + 1}
                </div>
                <p className="text-[13px] font-semibold">{v.title}</p>
                <p className="mt-1 text-[11px] leading-snug opacity-60">
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        );
      case 'services':
        return (
          <div className="px-8 py-12" style={{ background: theme.panel }}>
            <h2 className="text-center text-xl font-bold">
              {site.services.sectionTitle}
            </h2>
            <div className="mt-7 grid grid-cols-2 gap-4">
              {site.services.items.slice(0, 6).map((s, i) => (
                <div
                  key={i}
                  className="p-4"
                  style={{
                    background: theme.bg,
                    borderRadius: theme.radius,
                    border: `1px solid ${accent}1f`,
                  }}
                >
                  <span
                    className="block h-1.5 w-8 rounded-full"
                    style={{ background: accent }}
                  />
                  <p className="mt-3 text-[13px] font-semibold">{s.title}</p>
                  <p className="mt-1 text-[11px] leading-snug opacity-60">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="px-8 py-12 text-center">
            <h2 className="text-xl font-bold">{site.about.sectionTitle}</h2>
            <p className="mx-auto mt-3 max-w-[54ch] text-[13px] leading-relaxed opacity-70">
              {site.about.paragraph}
            </p>
          </div>
        );
      case 'testimonial':
        return (
          <div
            className="px-8 py-12 text-center"
            style={{ background: theme.panel }}
          >
            <p
              className="mx-auto max-w-[46ch] text-base font-medium italic"
              style={{ color: accent }}
            >
              &ldquo;{site.testimonial.quote}&rdquo;
            </p>
            <p className="mt-3 text-[11px] opacity-50">
              {site.testimonial.author}
            </p>
          </div>
        );
      case 'cta':
        return (
          <div
            className="px-8 py-14 text-center text-white"
            style={{ background: accent }}
          >
            <h2 className="mx-auto max-w-[24ch] text-2xl font-bold leading-tight">
              {site.cta.headline}
            </h2>
            <p className="mx-auto mt-2 max-w-[40ch] text-sm opacity-90">
              {site.cta.subhead}
            </p>
            <span
              className="mt-5 inline-block bg-white text-[13px] font-semibold"
              style={{
                color: accent,
                borderRadius: theme.radius,
                padding: '11px 26px',
              }}
            >
              {site.cta.button}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--fs-rule)] shadow-2xl shadow-black/15">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3 truncate rounded bg-black/5 px-2 py-0.5 text-[11px] text-[var(--fs-ink-faint)] dark:bg-white/10">
          {domain}.com
        </span>
      </div>

      {/* Scrollable rendered page */}
      <div
        className="max-h-[58vh] overflow-y-auto"
        style={{
          background: theme.bg,
          color: theme.ink,
          fontFamily: theme.font,
        }}
      >
        <div
          className="flex items-center justify-between px-8 py-4"
          style={{ borderBottom: `1px solid ${accent}1f` }}
        >
          <span className="text-sm font-bold tracking-tight">
            {site.brandName}
          </span>
          <span className="flex items-center gap-4 text-[11px] opacity-70">
            {site.nav.slice(0, 4).map((n) => (
              <span key={n}>{n}</span>
            ))}
            <span
              className="text-white"
              style={{
                background: accent,
                borderRadius: theme.radius,
                padding: '5px 12px',
              }}
            >
              {site.hero.cta}
            </span>
          </span>
        </div>

        {order.map((id) => (
          <Section key={id} id={id} />
        ))}

        <div className="px-8 py-6 text-center text-[10px] opacity-40">
          © {new Date().getFullYear()} {site.brandName}
        </div>
      </div>
    </div>
  );
}
