import type { Metadata } from 'next';
import '@/styles/library.css';
import { SiteHeader } from '@/components/SiteHeader';
import { BookingModalProvider } from '@/app/(dynamic-pages)/(main-pages)/components/BookingModalProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://library.flowstarter.net'),
  title: {
    default:
      'Flowstarter Library — A small, considered shelf of work and starters',
    template: '%s — Flowstarter Library',
  },
  description:
    'A curated shelf of sites we have shipped and starter templates we have hand-crafted. Restraint over decoration. Craft over volume.',
  openGraph: {
    title: 'Flowstarter Library',
    description:
      'A curated shelf of sites we have shipped and starter templates we have hand-crafted.',
    type: 'website',
    siteName: 'Flowstarter Library',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flowstarter Library',
    description:
      'A curated shelf of sites we have shipped and starter templates we have hand-crafted.',
  },
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="library-root">
      <SiteHeader mode="landing" />
      <BookingModalProvider />
      <div className="grain" aria-hidden="true" />
      <div className="library-content">{children}</div>
    </div>
  );
}
