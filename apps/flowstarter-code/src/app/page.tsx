import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

export default async function Home() {
  const session = await auth();

  // Not authenticated → send to login
  if (!session?.user) redirect('/login');

  // T3 Chat URL — configurable via env, defaults to local dev port
  const t3ChatUrl = process.env.T3_CHAT_URL ?? 'http://localhost:3000';

  return <AppShell user={session.user} t3ChatUrl={t3ChatUrl} />;
}
