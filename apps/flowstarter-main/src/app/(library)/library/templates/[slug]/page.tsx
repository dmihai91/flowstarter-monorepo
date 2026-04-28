import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Mast, Footnote } from '../../_components/Mast';
import {
  TEMPLATES,
  getTemplate,
  getTemplateSlugs,
} from '../../_data/templates';
import { getLibraryPathPrefix, libHref } from '../../_lib/href';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getTemplateSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const t = getTemplate(slug);
  if (!t) return {};
  return {
    title: t.title,
    description: t.kicker,
    openGraph: {
      title: t.title,
      description: t.kicker,
      images: t.thumbnail ? [`/showcase/${t.thumbnail}.png`] : undefined,
    },
  };
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) notFound();

  const pathPrefix = await getLibraryPathPrefix();
  const indexInList = TEMPLATES.findIndex((t) => t.slug === slug);
  const next = TEMPLATES[(indexInList + 1) % TEMPLATES.length];
  const prev =
    TEMPLATES[(indexInList - 1 + TEMPLATES.length) % TEMPLATES.length];

  return (
    <>
      <Mast
        pathPrefix={pathPrefix}
        issueLabel={`Entry ${String(indexInList + 1).padStart(2, '0')} · ${
          template.year
        }`}
      />

      {/* ── BREADCRUMB ROW ──────────────────────────────────────────────── */}
      <section
        className="frame frame--wide"
        style={{ paddingBlock: '1.25rem 0' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '1.5rem',
          }}
        >
          <Link
            href={libHref(pathPrefix, '/')}
            className="meta link"
            style={{ textDecorationColor: 'transparent' }}
          >
            ← the shelf
          </Link>
          <div className="meta">
            {template.category}
            <span
              style={{ margin: '0 0.7em', color: 'var(--color-rule-strong)' }}
            >
              ·
            </span>
            {template.year}
          </div>
        </div>
      </section>

      {/* ── TITLE BLOCK ─────────────────────────────────────────────────── */}
      <section
        className="frame frame--book"
        style={{ paddingBlock: 'clamp(2.5rem, 6vw, 5rem) 0' }}
      >
        <h1 className="display reveal" style={{ maxWidth: '18ch' }}>
          {template.title}
        </h1>
        <p
          className="lede reveal"
          data-delay="1"
          style={{
            marginTop: 'clamp(1.25rem, 2.5vw, 2rem)',
            fontSize: '1.125rem',
          }}
        >
          {template.kicker}
        </p>
      </section>

      {/* ── HERO IMAGE ──────────────────────────────────────────────────── */}
      <section
        className="frame frame--wide"
        style={{ paddingBlock: 'clamp(3rem, 6vw, 5rem) 0' }}
      >
        <div
          className="reveal"
          data-delay="2"
          style={{
            position: 'relative',
            background: 'var(--color-paper-2)',
            border: '1px solid var(--color-rule)',
            aspectRatio: template.thumbnail ? 'auto' : '16 / 10',
            overflow: 'hidden',
          }}
        >
          {template.thumbnail ? (
            <Image
              src={`/showcase/${template.thumbnail}.png`}
              alt={`${template.title} preview`}
              width={2400}
              height={1500}
              quality={92}
              priority
              sizes="(min-width: 1480px) 1400px, 100vw"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          ) : template.placeholder ? (
            <div
              className="item-frame--type"
              style={{ position: 'absolute', inset: 0, paddingBlock: '4rem' }}
            >
              <div>
                <div
                  className="typeplate"
                  style={{ fontSize: 'clamp(2rem, 6vw, 4rem)' }}
                >
                  <em>{template.placeholder.line}</em>
                </div>
                <div className="typeplate-meta">{template.placeholder.sub}</div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── LIVE INTERACTIVE PREVIEW ────────────────────────────────────── */}
      {template.previewPath ? (
        <section
          className="frame frame--wide"
          style={{ paddingBlock: 'clamp(4rem, 8vw, 6rem) 0' }}
          aria-labelledby="live-preview-heading"
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: '1.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <h2 id="live-preview-heading" className="meta-strong">
              <span className="num">02</span>
              <span
                style={{ margin: '0 0.7em', color: 'var(--color-rule-strong)' }}
              >
                ·
              </span>
              Live preview
            </h2>
            <Link
              href={template.previewPath}
              target="_blank"
              rel="noreferrer"
              className="meta link"
            >
              Open in new tab ↗
            </Link>
          </div>
          <div
            className="reveal"
            data-delay="1"
            style={{
              position: 'relative',
              border: '1px solid var(--color-ink)',
              background: 'var(--color-paper)',
              overflow: 'hidden',
            }}
          >
            <iframe
              src={template.previewPath}
              title={`${template.title} — live preview`}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              style={{
                display: 'block',
                width: '100%',
                height: 'min(78vh, 1100px)',
                minHeight: '720px',
                border: 0,
                background: '#f9f7f1',
              }}
            />
          </div>
          <p
            className="meta"
            style={{
              marginTop: '1rem',
              color: 'var(--color-ink-faint)',
              fontStyle: 'italic',
            }}
          >
            Interactive — scroll, click pages, see the design system at work.
            The same code ships when we build a custom site for you.
          </p>
        </section>
      ) : null}

      {/* ── BODY + META SIDEBAR ─────────────────────────────────────────── */}
      <section
        className="frame frame--book"
        style={{ paddingBlock: 'clamp(4rem, 8vw, 6rem) 0' }}
      >
        <div className="detail-grid">
          {/* Body column */}
          <div>
            <p
              className="display display--small reveal"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(1.5rem, 3.4vw, 2.2rem)',
                lineHeight: 1.25,
                marginBottom: '2rem',
                color: 'var(--color-ink)',
              }}
            >
              {firstSentence(template.blurb)}
            </p>
            <div
              className="body reveal"
              data-delay="1"
              style={{
                fontSize: '1rem',
                lineHeight: 1.7,
                color: 'var(--color-ink-soft)',
              }}
            >
              {paragraphs(restAfterFirstSentence(template.blurb)).map(
                (p, i) => (
                  <p key={i} style={{ margin: i === 0 ? 0 : '1.25rem 0 0' }}>
                    {p}
                  </p>
                )
              )}
            </div>

            <div
              className="reveal"
              data-delay="2"
              style={{
                marginTop: 'clamp(2.5rem, 5vw, 3.5rem)',
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--color-rule)',
              }}
            >
              {template.liveUrl ? (
                <Link
                  href={template.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="cta-block"
                >
                  View live
                </Link>
              ) : (
                <span
                  className="meta-strong"
                  style={{
                    padding: '0.85rem 1.4rem',
                    border: '1px solid var(--color-rule-strong)',
                    color: 'var(--color-ink-soft)',
                  }}
                >
                  Available on request
                </span>
              )}
              <Link
                href="https://flowstarter.net#pricing"
                className="action"
                style={{ borderColor: 'var(--color-ink)' }}
              >
                Want a site like this? Book a call
              </Link>
            </div>
          </div>

          {/* Meta sidebar */}
          <aside className="reveal" data-delay="2">
            <dl className="detail-meta">
              <div>
                <dt>Category</dt>
                <dd>{template.category}</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>{template.year}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span
                    className={`status status--${
                      template.status === 'live' ? 'live' : 'soon'
                    }`}
                  >
                    {template.status === 'live'
                      ? 'live'
                      : template.status === 'private'
                      ? 'private'
                      : 'in development'}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Built with</dt>
                <dd>{template.built.join(' · ')}</dd>
              </div>
              {template.repoUrl ? (
                <div>
                  <dt>Source</dt>
                  <dd>
                    <Link
                      href={template.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="link"
                    >
                      {template.repoUrl.replace('https://github.com/', '')}
                    </Link>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Tags</dt>
                <dd>
                  <span style={{ color: 'var(--color-ink-faint)' }}>
                    {template.tags.join(', ')}
                  </span>
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {/* ── PREV / NEXT ─────────────────────────────────────────────────── */}
      <nav
        className="frame frame--wide"
        style={{ paddingBlock: 'clamp(5rem, 10vw, 8rem) 0' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--color-ink)',
          }}
        >
          <Link
            href={libHref(pathPrefix, `/templates/${prev.slug}`)}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <span className="meta">← previous</span>
            <span
              className="display display--small"
              style={{ fontSize: '1.25rem' }}
            >
              {prev.title}
            </span>
          </Link>
          <Link
            href={libHref(pathPrefix, `/templates/${next.slug}`)}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              alignItems: 'flex-end',
              textAlign: 'right',
            }}
          >
            <span className="meta">next →</span>
            <span
              className="display display--small"
              style={{ fontSize: '1.25rem' }}
            >
              {next.title}
            </span>
          </Link>
        </div>
      </nav>

      <Footnote />
    </>
  );
}

function firstSentence(text: string): string {
  const m = text.match(/^[^.!?]+[.!?]/);
  return m ? m[0] : text;
}

function restAfterFirstSentence(text: string): string {
  const m = text.match(/^[^.!?]+[.!?]/);
  if (!m) return '';
  return text.slice(m[0].length).trim();
}

function paragraphs(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}
