import Link from 'next/link';
import { Mast, Footnote } from './_components/Mast';
import { GalleryItem } from './_components/GalleryItem';
import { TEMPLATES } from './_data/templates';

export const dynamic = 'force-static';

export default async function GalleryPage() {
  const total = TEMPLATES.length;
  const liveCount = TEMPLATES.filter((t) => t.status === 'live').length;
  const inDev = total - liveCount;

  return (
    <>
      <Mast
        homeHref="."
        issueLabel="Issue 01 · 2026"
      />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="frame frame--wide"
        style={{ paddingBlock: 'clamp(4rem, 10vw, 8rem) 0' }}
      >
        <div style={{ maxWidth: '20ch', marginBottom: '2.5rem' }}>
          <span className="meta">A working library</span>
        </div>

        <h1 className="display reveal">
          A small, considered shelf
          <br />
          of work and <em>starters.</em>
        </h1>

        <div
          style={{
            marginTop: 'clamp(2.5rem, 5vw, 3.5rem)',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: '2rem',
          }}
        >
          <p className="lede reveal" data-delay="1">
            Hand-built sites and starter templates for service professionals.
            Each one is the product of a real conversation with a real person —
            no template-spam, no AI slurry, no &ldquo;premium&rdquo; gradient
            stand-ins for taste. Some of these are live for clients today.
            Others are starters that will become live for you.
          </p>
        </div>

        <div
          className="reveal"
          data-delay="2"
          style={{
            marginTop: 'clamp(3rem, 6vw, 4rem)',
            display: 'flex',
            gap: '2.5rem',
            flexWrap: 'wrap',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--color-rule)',
          }}
        >
          <Stat
            number={String(total).padStart(2, '0')}
            label="entries on the shelf"
          />
          <Stat
            number={String(liveCount).padStart(2, '0')}
            label="live for clients"
          />
          <Stat
            number={String(inDev).padStart(2, '0')}
            label="starters in build"
          />
          <Stat number="08" label="new clients per month, by design" />
        </div>
      </section>

      {/* ── GALLERY ──────────────────────────────────────────────────────── */}
      <section
        className="frame frame--wide"
        style={{ paddingBlock: 'clamp(5rem, 10vw, 8rem) 0' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--color-ink)',
          }}
        >
          <h2
            className="display display--small"
            style={{
              fontSize: '1.0625rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
          >
            The shelf
          </h2>
          <p className="meta">{String(total).padStart(2, '0')} entries</p>
        </div>

        <ul
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
            gap: 'clamp(2.5rem, 5vw, 4.5rem) clamp(1.5rem, 3vw, 3rem)',
            listStyle: 'none',
            padding: 0,
            marginTop: 'clamp(2.5rem, 5vw, 4rem)',
          }}
        >
          {TEMPLATES.map((template, index) => (
            <li key={template.slug} style={{ minWidth: 0 }}>
              <GalleryItem template={template} index={index} total={total} />
            </li>
          ))}
        </ul>
      </section>

      {/* ── COLOPHON / CALL ──────────────────────────────────────────────── */}
      <section
        className="frame frame--book"
        style={{ paddingBlock: 'clamp(6rem, 12vw, 10rem) 0' }}
      >
        <div
          style={{
            paddingTop: '2rem',
            borderTop: '1px solid var(--color-ink)',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: '2rem',
          }}
        >
          <p className="meta">A note to whoever is reading</p>
          <h3 className="display display--mid">
            We take eight new clients a month. <em>By design.</em>
          </h3>
          <p className="lede" style={{ maxWidth: '54ch' }}>
            If something here looks like the kind of site you want to send
            people to, the conversation starts on a discovery call. We&rsquo;ll
            tell you honestly whether we can help. Either way, you walk away
            with a clearer brief.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link href="https://flowstarter.net#pricing" className="cta-block">
              Book a discovery call
            </Link>
            <Link href="https://flowstarter.net" className="action">
              Read the case for craft
            </Link>
          </div>
        </div>
      </section>

      <Footnote />
    </>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.6rem',
        minWidth: 0,
      }}
    >
      <span
        className="meta-strong"
        style={{ fontSize: '1.4rem', lineHeight: 1, color: 'var(--color-ink)' }}
      >
        {number}
      </span>
      <span className="meta" style={{ maxWidth: '24ch' }}>
        {label}
      </span>
    </div>
  );
}
