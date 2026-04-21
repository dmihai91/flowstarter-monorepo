'use client';

import { SiteHeader } from '@/components/SiteHeader';

export function LandingHeader({ onOpenModal }: { onOpenModal?: () => void }) {
  return <SiteHeader mode="landing" onOpenModal={onOpenModal} />;
}
