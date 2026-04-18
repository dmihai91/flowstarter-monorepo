'use client';

import dynamic from 'next/dynamic';

const AppShell = dynamic(
  () => import('@/components/AppShell').then(m => m.AppShell),
  { ssr: false },
);

export function AppShellLoader({ flowstarterCodeUrl }: { flowstarterCodeUrl: string }) {
  return <AppShell flowstarterCodeUrl={flowstarterCodeUrl} />;
}
