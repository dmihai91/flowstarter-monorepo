'use client';

import dynamic from 'next/dynamic';

export const PreQualModal = dynamic(
  () => import('./PreQualModal').then((m) => m.PreQualModal),
  { ssr: false }
);
