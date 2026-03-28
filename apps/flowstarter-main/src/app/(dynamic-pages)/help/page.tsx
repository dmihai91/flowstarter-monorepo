'use client';

import { HelpContent } from '@/components/HelpContent';
import { PublicPageLayout } from '@/components/PublicPageLayout';

export default function HelpPage() {
  return (
    <PublicPageLayout>
      <main className="relative z-10 pt-16">
        <HelpContent showHero showCta />
      </main>
    </PublicPageLayout>
  );
}
