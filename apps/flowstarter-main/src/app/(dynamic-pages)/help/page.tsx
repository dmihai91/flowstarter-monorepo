'use client';

import Footer from '@/components/Footer';
import { SupportHeader } from '@/components/SupportHeader';
import { HelpContent } from '@/components/HelpContent';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0c]">
      <SupportHeader />
      <main className="relative z-10">
        <HelpContent showHero showCta />
      </main>
      <Footer />
    </div>
  );
}
