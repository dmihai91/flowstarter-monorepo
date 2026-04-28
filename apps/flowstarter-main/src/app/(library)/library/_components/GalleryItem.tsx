import Link from 'next/link';
import Image from 'next/image';
import type { TemplateEntry } from '../_data/templates';
import { libHref } from '../_lib/href';

interface GalleryItemProps {
  template: TemplateEntry;
  index: number;
  /** Total count for the running counter, e.g. "01 / 06". */
  total: number;
  /** Path prefix injected by the layout. `''` on subdomain, `/library` on main. */
  pathPrefix: string;
}

export function GalleryItem({
  template,
  index,
  total,
  pathPrefix,
}: GalleryItemProps) {
  const ord = String(index + 1).padStart(2, '0');
  const tot = String(total).padStart(2, '0');

  return (
    <Link
      href={libHref(pathPrefix, `/templates/${template.slug}`)}
      className="item reveal"
      data-delay={Math.min(index, 6)}
      aria-label={`${template.title} — ${template.kicker}`}
    >
      <div className="item-frame">
        {template.thumbnail ? (
          <Image
            src={`/showcase/${template.thumbnail}.png`}
            alt={`${template.title} preview`}
            width={1200}
            height={750}
            quality={90}
            priority={index < 2}
            sizes="(min-width: 1100px) 540px, (min-width: 700px) 50vw, 100vw"
          />
        ) : template.placeholder ? (
          <TypePlaceholder
            line={template.placeholder.line}
            sub={template.placeholder.sub}
          />
        ) : null}
      </div>

      <div className="item-caption">
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          <span className="meta">
            {ord} <span style={{ color: 'var(--color-rule-strong)' }}>/</span>{' '}
            {tot}
          </span>
          <h2 className="item-title">{template.title}</h2>
          <p
            className="body"
            style={{
              fontSize: '0.875rem',
              maxWidth: '40ch',
              color: 'var(--color-ink-soft)',
              marginTop: '0.15rem',
            }}
          >
            {template.kicker}
          </p>
        </div>

        <div
          className="item-meta"
          style={{ flexDirection: 'column', alignItems: 'flex-end' }}
        >
          <span className="meta">{template.category}</span>
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
        </div>
      </div>
    </Link>
  );
}

function TypePlaceholder({ line, sub }: { line: string; sub: string }) {
  return (
    <div
      className="item-frame--type"
      style={{ position: 'absolute', inset: 0 }}
    >
      <div>
        <div className="typeplate">
          <em>{line}</em>
        </div>
        <div className="typeplate-meta">{sub}</div>
      </div>
    </div>
  );
}
