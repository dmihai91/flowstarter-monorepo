import Link from 'next/link';
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

      {/* ── PRODUCT HEADER ──────────────────────────────────────────────── */}
      <section className="frame frame--wide detail-hero">
        <div className="detail-nav-row">
          <Link href={libHref(pathPrefix, '/')} className="meta detail-backlink">
            ← the shelf
          </Link>
          <span className="meta">
            {template.category} · {template.year}
          </span>
        </div>

        <div className="detail-hero-grid">
          <div className="detail-title-stack reveal">
            <p className="meta">
              Entry {String(indexInList + 1).padStart(2, '0')} / {String(TEMPLATES.length).padStart(2, '0')}
            </p>
            <h1 className="display detail-title">{template.title}</h1>
            <p className="lede detail-kicker">{template.kicker}</p>
            <div className="detail-actions">
              {template.previewPath ? (
                <Link
                  href={template.previewPath}
                  target="_blank"
                  rel="noreferrer"
                  className="cta-block"
                >
                  Open full template
                </Link>
              ) : null}
              <Link href="https://flowstarter.net#pricing" className="action">
                Build one like this
              </Link>
            </div>
          </div>

          <aside className="detail-spec-card reveal" data-delay="1">
            <dl>
              <div>
                <dt>Category</dt>
                <dd>{template.category}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  {template.status === 'live'
                    ? 'ready to adapt'
                    : template.status === 'private'
                    ? 'private'
                    : 'in development'}
                </dd>
              </div>
              <div>
                <dt>Built with</dt>
                <dd>{template.built.join(' · ')}</dd>
              </div>
              <div>
                <dt>Tags</dt>
                <dd>{template.tags.join(', ')}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {/* ── LIVE INTERACTIVE PREVIEW ────────────────────────────────────── */}
      {template.previewPath ? (
        <section
          className="frame frame--wide detail-preview-section"
          aria-labelledby="live-preview-heading"
        >
          <div className="preview-toolbar">
            <h2 id="live-preview-heading">Live template</h2>
            <span className="preview-url">/preview/{template.slug}/</span>
            <Link
              href={template.previewPath}
              target="_blank"
              rel="noreferrer"
              className="preview-open"
            >
              Open full screen ↗
            </Link>
          </div>
          <div className="preview-shell reveal" data-delay="2">
            <iframe
              src={template.previewPath}
              title={`${template.title} — live preview`}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              className="preview-frame"
            />
          </div>
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
