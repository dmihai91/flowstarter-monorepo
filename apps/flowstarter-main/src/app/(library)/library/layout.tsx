import type { Metadata } from 'next';
import '@/styles/library.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://library.flowstarter.net'),
  title: {
    default:
      'Flowstarter Library — A small, considered shelf of work and starters',
    template: '%s — Flowstarter Library',
  },
  description:
    'A curated shelf of sites we have shipped and starter templates we have hand-built. Restraint over decoration. Craft over volume.',
  openGraph: {
    title: 'Flowstarter Library',
    description:
      'A curated shelf of sites we have shipped and starter templates we have hand-built.',
    type: 'website',
    siteName: 'Flowstarter Library',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flowstarter Library',
    description:
      'A curated shelf of sites we have shipped and starter templates we have hand-built.',
  },
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="library-root">
      <div className="grain" aria-hidden="true" />
      {children}
    </div>
  );
}
