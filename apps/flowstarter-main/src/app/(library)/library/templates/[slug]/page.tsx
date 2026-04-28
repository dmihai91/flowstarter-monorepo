import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Footnote } from '../../_components/Mast';
import { DeferredPreviewFrame } from '../../_components/DeferredPreviewFrame';
import {
  TEMPLATES,
  getTemplate,
  getTemplateSlugs,
} from '../../_data/templates';

export const dynamic = 'force-static';

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

  const indexInList = TEMPLATES.findIndex((t) => t.slug === slug);
  const next = TEMPLATES[(indexInList + 1) % TEMPLATES.length];
  const prev =
    TEMPLATES[(indexInList - 1 + TEMPLATES.length) % TEMPLATES.length];

  return (
    <>
      {/* ── PRODUCT HEADER ──────────────────────────────────────────────── */}
      <section id="editor-showcase" className="frame frame--wide detail-hero">
        <div className="detail-nav-row">
          <Link href="../.." className="meta detail-backlink">
            ← the shelf
          </Link>
          <span className="meta">
            {template.category} · {template.year}
          </span>
        </div>

        <div className="detail-hero-grid">
          <div className="detail-title-stack reveal">
            <p className="meta">
              Entry {String(indexInList + 1).padStart(2, '0')} /{' '}
              {String(TEMPLATES.length).padStart(2, '0')}
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
          <DeferredPreviewFrame
            previewPath={template.previewPath}
            title={template.title}
            thumbnailPath={
              template.thumbnail ? `/showcase/${template.thumbnail}.png` : null
            }
          />
        </section>
      ) : null}

      {/* ── BODY + META SIDEBAR ─────────────────────────────────────────── */}
      <section id="process" className="frame frame--book detail-body-section">
        <div className="detail-grid">
          {/* Body column */}
          <div>
            <p className="display display--small detail-pull reveal">
              {firstSentence(template.blurb)}
            </p>
            <div className="body reveal detail-body-copy" data-delay="1">
              {paragraphs(restAfterFirstSentence(template.blurb)).map(
                (p, i) => (
                  <p
                    key={i}
                    className={i === 0 ? 'detail-paragraph-first' : ''}
                  >
                    {p}
                  </p>
                )
              )}
            </div>

            <div className="reveal detail-body-actions" data-delay="2">
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
                <span className="meta-strong detail-unavailable">
                  Available on request
                </span>
              )}
              <Link href="https://flowstarter.net#pricing" className="action">
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
      <nav id="pricing" className="frame frame--wide detail-pagination-wrap">
        <div className="detail-pagination">
          <Link
            href={`../${prev.slug}`}
            className="detail-pagination-link detail-pagination-link-prev"
          >
            <span className="meta">← previous</span>
            <span className="display display--small detail-pagination-title">
              {prev.title}
            </span>
          </Link>
          <Link
            href={`../${next.slug}`}
            className="detail-pagination-link detail-pagination-link-next"
          >
            <span className="meta">next →</span>
            <span className="display display--small detail-pagination-title">
              {next.title}
            </span>
          </Link>
        </div>
      </nav>

      <div id="faq">
        <Footnote />
      </div>
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
