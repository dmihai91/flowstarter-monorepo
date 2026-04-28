import Link from 'next/link';
import { Mast, Footnote } from '../../_components/Mast';
import { getLibraryPathPrefix, libHref } from '../../_lib/href';

export default async function NotFound() {
  const pathPrefix = await getLibraryPathPrefix();
  return (
    <>
      <Mast pathPrefix={pathPrefix} />
      <section
        className="frame frame--book"
        style={{ paddingBlock: 'clamp(5rem, 12vw, 8rem) 0', textAlign: 'left' }}
      >
        <span className="meta">404 · not on the shelf</span>
        <h1 className="display" style={{ marginTop: '1.5rem' }}>
          That entry doesn&rsquo;t exist <em>here.</em>
        </h1>
        <p className="lede" style={{ marginTop: '1.5rem' }}>
          It may have been renamed, retired, or never existed in the first
          place. The full shelf is one click away.
        </p>
        <div style={{ marginTop: '2.5rem' }}>
          <Link href={libHref(pathPrefix, '/')} className="cta-block">
            Back to the library
          </Link>
        </div>
      </section>
      <Footnote />
    </>
  );
}
