import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { env } from '@/env';

export default async function Home() {
  const session = await auth();

  // Not authenticated → send to login
  if (!session?.user) redirect('/login');

  return <AppShell user={session.user} t3ChatUrl={env.T3_CHAT_URL} />;
}
