import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { env } from '@/env';

export default async function Home() {
  const session = await auth();

  if (!session?.userId) {
    redirect('/login');
  }

  return <AppShell flowstarterCodeUrl={env.FLOWSTARTER_CODE_URL ?? '/t3'} />;
}
