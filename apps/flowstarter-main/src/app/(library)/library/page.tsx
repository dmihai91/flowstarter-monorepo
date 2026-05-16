import Link from 'next/link';
import { Footnote } from './_components/Mast';
import { GalleryItem } from './_components/GalleryItem';
import { BookingTrigger } from './_components/BookingTrigger';
import { TEMPLATES } from './_data/templates';

export const dynamic = 'force-static';

export default async function GalleryPage() {
  const total = TEMPLATES.length;
  const liveCount = TEMPLATES.filter((t) => t.status === 'live').length;
  const inDev = total - liveCount;

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section id="editor-showcase" className="frame frame--wide gallery-hero">
        <div className="gallery-hero-label">
          <span className="meta">A working library</span>
        </div>

        <h1 className="display reveal">
          A small, considered shelf
          <br />
          of work and <em>starters.</em>
        </h1>

        <div className="gallery-hero-copy">
          <p className="lede reveal" data-delay="1">
            Hand-crafted sites and starter templates for service professionals.
            Each one is the product of a real conversation with a real person —
            no template-spam, no AI slurry, no &ldquo;premium&rdquo; gradient
            stand-ins for taste. Some of these are live for clients today.
            Others are starters that will become live for you.
          </p>
        </div>

        <div className="gallery-stats reveal" data-delay="2">
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
          <Stat number="—" label="limited spots each month, by design" />
        </div>
      </section>

      {/* ── GALLERY ──────────────────────────────────────────────────────── */}
      <section id="process" className="frame frame--wide gallery-shelf">
        <div className="gallery-shelf-head">
          <h2 className="display display--small gallery-shelf-title">
            The shelf
          </h2>
          <p className="meta">{String(total).padStart(2, '0')} entries</p>
        </div>

        <ul className="gallery-grid">
          {TEMPLATES.map((template, index) => (
            <li key={template.slug} className="gallery-grid-item">
              <GalleryItem template={template} index={index} total={total} />
            </li>
          ))}
        </ul>
      </section>

      {/* ── COLOPHON / CALL ──────────────────────────────────────────────── */}
      <section id="pricing" className="frame frame--book gallery-cta-section">
        <div className="gallery-cta-card">
          <p className="meta">A note to whoever is reading</p>
          <h3 className="display display--mid">
            We take a limited number of new clients each month.{' '}
            <em>By design.</em>
          </h3>
          <p className="lede gallery-cta-copy">
            If something here looks like the kind of site you want to send
            people to, the conversation starts on a discovery call. We&rsquo;ll
            tell you honestly whether we can help. Either way, you walk away
            with a clearer brief.
          </p>

          <div className="gallery-cta-actions">
            <BookingTrigger className="cta-block">
              Get my custom plan
            </BookingTrigger>
            <Link href="/" className="action">
              Read the case for craft
            </Link>
          </div>
        </div>
      </section>

      <div id="faq">
        <Footnote />
      </div>
    </>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="gallery-stat">
      <span className="meta-strong gallery-stat-number">{number}</span>
      <span className="meta gallery-stat-label">{label}</span>
    </div>
  );
}
